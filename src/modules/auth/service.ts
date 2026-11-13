import 'server-only';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { sendOtpEmail } from '@/server/email';
import { check as checkLimit } from '@/server/rate-limit';
import { hashId } from '@/server/log';
import { auth } from '@/server/auth';
import { ensureDbReady } from '@/server/db/client';
import { AppError } from '@/server/errors';
import * as users from '@/modules/users/service';
import * as repo from './repository';
import type { Member, Viewer } from './types';

/**
 * Request identity (USER_ROLES §2, BACKEND_ARCHITECTURE §3.1). Resolved once per request by the entry layer
 * and passed down; services never read cookies themselves.
 * - no valid session: visitor
 * - session, no profile: pending (must finish onboarding, BR-16)
 * - session + profile: member; a suspended or deleted profile is treated as a visitor (BR-25)
 */
export async function getViewer(headers: Headers): Promise<Viewer> {
  await ensureDbReady();
  const s = await auth.api.getSession({ headers });
  if (!s) return { kind: 'visitor' };
  const p = await users.findMemberByUserId(s.user.id);
  if (!p) return { kind: 'pending', userId: s.user.id, name: s.user.name, email: s.user.email };
  if (p.suspendedAt || p.deletedAt) return { kind: 'visitor' };
  return {
    kind: 'member',
    userId: s.user.id,
    profileId: p.id,
    username: p.username,
    displayName: p.displayName,
    avatarKey: p.avatarKey,
    role: p.role,
  };
}

export function requireMember(viewer: Viewer): Member {
  if (viewer.kind === 'visitor') throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
  if (viewer.kind === 'pending') throw new AppError('ONBOARDING_REQUIRED', 'Finish setting up your account first.');
  return viewer;
}

export function requirePending(viewer: Viewer): Extract<Viewer, { kind: 'pending' }> {
  if (viewer.kind === 'visitor') throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
  if (viewer.kind === 'member') throw new AppError('CONFLICT', 'Your account is already set up.');
  return viewer;
}

export function requireStaff(viewer: Viewer): Member {
  const m = requireMember(viewer);
  if (m.role !== 'moderator' && m.role !== 'admin') throw new AppError('FORBIDDEN');
  return m;
}

/** BR-25: suspension signs the account out everywhere. */
export const revokeAllSessions = (userId: string) => repo.deleteSessionsByUser(userId);

export const purgeExpired = (now = Date.now()) => repo.purgeExpired(now);

/** The id of the session making this request (FR-19 "current" marker; revoke-others keeps it). */
export async function currentSessionId(headers: Headers): Promise<string | null> {
  await ensureDbReady();
  const s = await auth.api.getSession({ headers });
  return s?.session.id ?? null;
}

/** Best-effort, privacy-friendly device label from a user agent (no raw UA is returned, BR-79). */
export function deviceLabel(ua: string | null): string {
  if (!ua) return 'Unknown device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  return `${browser} on ${os}`;
}

export type SessionRow = { id: string; device: string; location: string | null; lastActiveAt: string; current: boolean };

/** FR-19 sessions list. `location` is always null: no IP geolocation is stored (BR-30, BR-79). */
export async function listSessions(userId: string, currentId: string | null): Promise<SessionRow[]> {
  const now = Date.now();
  const rows = await repo.listSessions(userId);
  return rows
    .filter((r) => r.expiresAt.getTime() > now)
    .map((r) => ({ id: r.id, device: deviceLabel(r.userAgent), location: null, lastActiveAt: r.updatedAt.toISOString(), current: r.id === currentId }));
}

export async function revokeSession(userId: string, id: string, currentId: string | null): Promise<void> {
  if (id === currentId) throw new AppError('FORBIDDEN', 'Use sign out to end the current session.');
  if ((await repo.deleteSession(userId, id)) === 0) throw new AppError('NOT_FOUND');
}

export const revokeOtherSessions = (userId: string, keepId: string) => repo.deleteOtherSessions(userId, keepId);

/**
 * Step-up codes (FR-19: account deletion and email change are confirmed by a fresh emailed code). Same
 * policy as sign-in codes: 6 digits, hashed, 10 minutes, 5 attempts (BR-01…BR-04), per-email send limits
 * (BR-05/06, RL-AUTH-SEND). Stored in Better Auth's `verification` table under a `step-up:` identifier.
 */
const CODE_TTL = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

export async function sendStepUpCode(identifier: string, to: string, purpose: 'account-deletion' | 'email-change'): Promise<{ sent: true; expiresInSeconds: number }> {
  const r = await checkLimit('RL-AUTH-SEND', hashId(to));
  if (!r.ok) throw new AppError('RATE_LIMITED', `Try again in ${r.retryAfter} seconds.`, { retryAfter: r.retryAfter });
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const now = Date.now();
  await repo.putCode(identifier, sha(`${identifier}:${code}`), now + CODE_TTL, now);
  await sendOtpEmail({ to, code, purpose });
  return { sent: true, expiresInSeconds: CODE_TTL / 1000 };
}

/** Verifies and consumes a step-up code; errors use the sign-in vocabulary (INVALID_OTP, OTP_EXPIRED, TOO_MANY_ATTEMPTS). */
export async function verifyStepUpCode(identifier: string, code: string): Promise<void> {
  const row = await repo.getCode(identifier);
  if (!row) throw new AppError('OTP_EXPIRED', 'This code has expired. Request a new one.');
  if (row.expiresAt.getTime() <= Date.now()) {
    await repo.deleteCode(identifier);
    throw new AppError('OTP_EXPIRED', 'This code has expired. Request a new one.');
  }
  const [hash, attemptsRaw] = row.value.split(':');
  const attempts = Number(attemptsRaw ?? 0);
  const want = Buffer.from(hash ?? '');
  const got = Buffer.from(sha(`${identifier}:${String(code).trim()}`));
  if (want.length === got.length && timingSafeEqual(want, got)) {
    await repo.deleteCode(identifier);
    return;
  }
  const used = attempts + 1;
  if (used >= MAX_ATTEMPTS) {
    await repo.deleteCode(identifier);
    throw new AppError('TOO_MANY_ATTEMPTS', 'Too many wrong codes. Request a new one.');
  }
  await repo.setCodeValue(row.id, `${hash}:${used}`);
  throw new AppError('INVALID_OTP', `That code is not right. ${MAX_ATTEMPTS - used} attempts left.`);
}

export const findUser = (userId: string) => repo.findUser(userId);
export const emailInUse = (email: string, exceptUserId: string) => repo.emailInUse(email, exceptUserId);
export const setEmail = (userId: string, email: string) => repo.setEmail(userId, email, Date.now());
export const deleteUser = (userId: string) => repo.deleteUser(userId);
