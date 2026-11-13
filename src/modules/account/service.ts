import 'server-only';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { log } from '@/server/log';
import * as auth from '@/modules/auth/service';
import type { Viewer } from '@/modules/auth/types';
import * as users from '@/modules/users/service';
import * as media from '@/modules/media/service';
import * as shots from '@/modules/shots/service';
import * as likes from '@/modules/likes/service';
import * as follows from '@/modules/follows/service';
import * as collections from '@/modules/collections/service';
import * as comments from '@/modules/comments/service';

/**
 * Account and settings orchestration (A-07, FR-18, FR-19, FR-59; BR-22…BR-24). Lives in its own module
 * because account deletion touches likes, follows, collections and comments, which all depend on `users`.
 */
export type AccountSettings = { username: string; email: string; usernameChangedAt: string | null; canChangeUsernameAt: string | null };

const refreshSearch = (profileId: number) => (displayName: string, username: string) => shots.refreshSearchAuthor(profileId, displayName, username);

export async function profileSettings(viewer: Viewer) {
  const m = auth.requireMember(viewer);
  return users.settingsOf(m.profileId);
}

/** PATCH profile (FR-59). RL-ACCOUNT. Avatar must be the member's own ready avatar upload. */
export async function updateProfileSettings(viewer: Viewer, input: unknown) {
  const m = auth.requireMember(viewer);
  await limit('RL-ACCOUNT', `u:${m.userId}`);
  return users.applySettings(m.profileId, input, (id) => media.requireOwnedReady(id, m.profileId, ['avatar'], 'avatarMediaId'), refreshSearch(m.profileId));
}

/** FR-18 optional onboarding step (after the username): headline, location, intents, skills, avatar. */
export async function onboardingDetails(viewer: Viewer, input: unknown) {
  const m = auth.requireMember(viewer);
  await limit('RL-ACCOUNT', `u:${m.userId}`);
  const v = users.parseOnboardingDetails(input);
  if (v.avatarMediaId) await media.requireOwnedReady(v.avatarMediaId, m.profileId, ['avatar'], 'avatarMediaId');
  return users.applyOnboardingDetails(m.profileId, v);
}

/** FR-19: the member's own account data. The sign-in email is returned to its owner only (BR-78). */
export async function accountSettings(viewer: Viewer): Promise<AccountSettings> {
  const m = auth.requireMember(viewer);
  const [u, p] = await Promise.all([auth.findUser(m.userId), users.findByUsername(m.username)]);
  const changedAt = p?.usernameChangedAt ?? null;
  return {
    username: m.username,
    email: u?.email ?? '',
    usernameChangedAt: changedAt ? changedAt.toISOString() : null,
    canChangeUsernameAt: users.nextUsernameChangeAt(changedAt)?.toISOString() ?? null,
  };
}

/** BR-23 username change (RL-ACCOUNT). */
export async function changeUsername(viewer: Viewer, input: unknown) {
  const m = auth.requireMember(viewer);
  const v = validate(z.object({ username: z.string().max(60) }), input);
  await limit('RL-ACCOUNT', `u:${m.userId}`);
  return users.changeUsername(m.profileId, v.username, refreshSearch(m.profileId));
}

// ---- Sessions (FR-19) ----
export async function sessions(viewer: Viewer, headers: Headers) {
  const m = auth.requireMember(viewer);
  return auth.listSessions(m.userId, await auth.currentSessionId(headers));
}

export async function revokeSession(viewer: Viewer, headers: Headers, id: string) {
  const m = auth.requireMember(viewer);
  await auth.revokeSession(m.userId, id, await auth.currentSessionId(headers));
  return { revoked: 1 };
}

export async function revokeOtherSessions(viewer: Viewer, headers: Headers) {
  const m = auth.requireMember(viewer);
  const current = await auth.currentSessionId(headers);
  if (!current) throw new AppError('UNAUTHENTICATED');
  return { revoked: await auth.revokeOtherSessions(m.userId, current) };
}

// ---- Email change (FR-19: code sent to the new address) ----
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const emailSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().max(254, 'Enter a valid email address.').regex(EMAIL_RE, 'Enter a valid email address.'));
const emailId = (userId: string, email: string) => `step-up:email-change:${userId}:${email}`;

export async function requestEmailChange(viewer: Viewer, input: unknown) {
  const m = auth.requireMember(viewer);
  const { email } = validate(z.object({ email: emailSchema }), input);
  const u = await auth.findUser(m.userId);
  if (u?.email === email) throw new AppError('VALIDATION', 'This is already your email address.', { fields: { email: 'This is already your email address.' } });
  // Same response whether or not the address is in use (no account enumeration, BR-06); checked at confirm.
  return auth.sendStepUpCode(emailId(m.userId, email), email, 'email-change');
}

export async function confirmEmailChange(viewer: Viewer, input: unknown) {
  const m = auth.requireMember(viewer);
  const v = validate(z.object({ email: emailSchema, code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.') }), input);
  await auth.verifyStepUpCode(emailId(m.userId, v.email), v.code);
  if (await auth.emailInUse(v.email, m.userId)) throw new AppError('CONFLICT', 'This email address cannot be used.', { fields: { email: 'This email address cannot be used.' } });
  try {
    await auth.setEmail(m.userId, v.email);
  } catch (e) {
    const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? '')}` : '';
    if (/UNIQUE constraint failed: user\.email/i.test(msg)) throw new AppError('CONFLICT', 'This email address cannot be used.');
    throw e;
  }
  return { email: v.email };
}

// ---- Account deletion (BR-24: self-service in R2, confirmed by a fresh code) ----
const deletionId = (userId: string) => `step-up:account-deletion:${userId}`;

async function assertNoOwnedTeams(profileId: number) {
  const owned = await users.ownedTeams(profileId);
  if (owned.length) {
    throw new AppError('FORBIDDEN', `Transfer ownership of or delete your teams first: ${owned.map((t) => `@${t.username}`).join(', ')}.`);
  }
}

export async function requestDeletion(viewer: Viewer) {
  const m = auth.requireMember(viewer);
  await assertNoOwnedTeams(m.profileId);
  const u = await auth.findUser(m.userId);
  if (!u) throw new AppError('UNAUTHENTICATED');
  return auth.sendStepUpCode(deletionId(m.userId), u.email, 'account-deletion');
}

/**
 * Confirms deletion: soft delete at once (profile 404, sessions revoked, shots out of feeds by eligibility),
 * the account's likes, follows, collections/saves and comments removed with counter updates; personal data
 * purged after 30 days by the daily job (`purgeDeletedAccounts`).
 */
export async function confirmDeletion(viewer: Viewer, input: unknown) {
  const m = auth.requireMember(viewer);
  const v = validate(z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.') }), input);
  await auth.verifyStepUpCode(deletionId(m.userId), v.code);
  await assertNoOwnedTeams(m.profileId);
  await deleteAccountNow(m.profileId, m.userId);
  return { deleted: true as const, purgeAfterDays: 30 };
}

/** Shared by self-service deletion and the operator script (BR-24 "on request"). */
export async function deleteAccountNow(profileId: number, userId: string | null) {
  await users.softDelete(profileId);
  if (userId) await auth.revokeAllSessions(userId);
  await likes.removeAllBy(profileId);
  await follows.removeAllFor(profileId);
  await collections.removeAllFor(profileId);
  await comments.removeAllBy(profileId);
  log.info('account.deleted', { profileId });
}

/** BR-24: personal data of accounts deleted more than 30 days ago is purged (profile row + credentials). */
export async function purgeDeletedAccounts(now = Date.now(), deleteObjects: (profileId: number) => Promise<unknown> = async () => 0) {
  const due = await users.deletedBefore(now - 30 * 86_400_000, 100);
  for (const p of due) {
    await deleteObjects(p.id);
    await users.hardDelete(p.id);
    if (p.userId) await auth.deleteUser(p.userId);
  }
  return due.length;
}
