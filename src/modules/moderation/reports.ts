import 'server-only';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { requireMember, requireStaff, revokeAllSessions } from '@/modules/auth/service';
import type { Viewer } from '@/modules/auth/types';
import * as users from '@/modules/users/service';
import * as shots from '@/modules/shots/service';
import * as comments from '@/modules/comments/service';
import * as collections from '@/modules/collections/service';
import * as jobs from '@/modules/jobs/service';
import type { Page, PersonRef } from '@/modules/shots/types';
import * as repo from './repository';
import type { TargetType } from './repository';

/**
 * Reports and the staff review queue (BR-68, BR-69, P09-30, P10-27). Members report a shot, comment, profile,
 * collection or job once per target; staff see one queue row per target (oldest first) and decide: hide the
 * content, suspend its owner, or dismiss. Every staff action writes the append-only audit log.
 */
export const TARGET_TYPES = ['shot', 'comment', 'profile', 'collection', 'job'] as const;
export const REASONS = ['spam', 'harassment', 'ip', 'explicit', 'other'] as const;

export type ReportRow = {
  id: number;
  targetType: TargetType;
  targetId: number;
  targetLabel: string;
  targetHref: string;
  ownerUsername: string | null;
  reason: (typeof REASONS)[number];
  note: string | null;
  reporter: PersonRef;
  reportsCount: number;
  createdAt: string;
  status: 'open' | 'hidden' | 'suspended' | 'dismissed';
};

type Target = { ownerId: number | null; ownerUsername: string | null; label: string; href: string; hideable: boolean };

/** Resolves a target that still exists (deleted or purged → null). */
async function resolve(type: TargetType, id: number): Promise<Target | null> {
  if (type === 'shot') {
    const s = await shots.findBasic(id);
    if (!s || s.deletedAt) return null;
    const owner = await users.findById(s.authorId);
    return { ownerId: s.authorId, ownerUsername: owner?.username ?? null, label: s.title, href: `/shots/${s.id}-${s.slug}`, hideable: true };
  }
  if (type === 'comment') {
    const c = await comments.findTarget(id);
    if (!c || c.deletedAt) return null;
    return { ownerId: c.authorId, ownerUsername: c.authorUsername, label: c.body.slice(0, 80), href: `/shots/${c.shotId}#comment-${c.id}`, hideable: true };
  }
  if (type === 'profile') {
    const p = await users.findById(id);
    if (!p) return null;
    return { ownerId: p.id, ownerUsername: p.username, label: `@${p.username}`, href: `/${p.username}`, hideable: false };
  }
  if (type === 'collection') {
    const c = await collections.findTarget(id);
    if (!c || c.ownerDeletedAt) return null;
    return { ownerId: c.ownerId, ownerUsername: c.ownerUsername, label: c.name, href: `/${c.ownerUsername}/collections/${c.id}`, hideable: true };
  }
  const j = await jobs.findTarget(id);
  if (!j || j.deletedAt) return null;
  const owner = await users.findById(j.posterId);
  return { ownerId: j.posterId, ownerUsername: owner?.username ?? null, label: j.title, href: `/jobs/${j.id}-${j.slug}`, hideable: true };
}

export const reportInput = z
  .object({
    targetType: z.enum(TARGET_TYPES),
    targetId: z.coerce.number().int().positive(),
    reason: z.enum(REASONS),
    note: z.string().trim().max(500, 'Use at most 500 characters.').nullish().transform((s) => (s ? s : null)),
  })
  .refine((v) => v.reason !== 'other' || v.note, { message: 'Tell us what is wrong.', path: ['note'] });

/** BR-69 report: once per target per reporter (repeat → `already-reported`, nothing created); not your own content. */
export async function report(viewer: Viewer, input: unknown): Promise<{ status: 'created' | 'already-reported' }> {
  const m = requireMember(viewer);
  const v = validate(reportInput, input);
  const t = await resolve(v.targetType, v.targetId);
  if (!t) throw new AppError('NOT_FOUND');
  if (t.ownerId === m.profileId) throw new AppError('FORBIDDEN', 'You cannot report your own content.');
  await limit('RL-REPORT', `p:${m.profileId}`);
  const created = await repo.insertReport({ reporterId: m.profileId, targetType: v.targetType, targetId: String(v.targetId), reason: v.reason, note: v.note }, Date.now());
  return { status: created ? 'created' : 'already-reported' };
}

export const queueQuery = z.object({ status: z.enum(['open', 'hidden', 'suspended', 'dismissed']).default('open'), cursor: z.string().max(512).optional() });

/** Staff queue (BR-69): oldest first, 24 per page, one row per target. Non-staff → 403. */
export async function queue(viewer: Viewer, raw: unknown): Promise<Page<ReportRow>> {
  requireStaff(viewer);
  const q = validate(queueQuery, raw ?? {});
  const key = `reports:${q.status}`;
  const rows = await repo.queue(q.status, decodeCursor(q.cursor, key), 25);
  const page = rows.slice(0, 24);
  const items: ReportRow[] = [];
  for (const r of page) {
    const t = await resolve(r.targetType, Number(r.targetId));
    items.push({
      id: Number(r.id),
      targetType: r.targetType,
      targetId: Number(r.targetId),
      targetLabel: t?.label ?? '(removed)',
      targetHref: t?.href ?? '',
      ownerUsername: t?.ownerUsername ?? null,
      reason: r.reason as ReportRow['reason'],
      note: r.note,
      reporter: { id: Number(r.reporterId), username: r.reporterUsername, displayName: r.reporterName, avatarKey: r.reporterAvatar, isTeam: false, isFeaturedStudio: false },
      reportsCount: Number(r.reportsCount),
      createdAt: new Date(Number(r.createdAt)).toISOString(),
      status: r.status as ReportRow['status'],
    });
  }
  const last = page[page.length - 1];
  return { items, nextCursor: rows.length > 24 && last ? encodeCursor(key, [Number(last.createdAt), Number(last.id)]) : null };
}

const reason = z.string().trim().min(10, 'Give a reason of at least 10 characters.').max(500);

async function setHidden(type: TargetType, id: number, hidden: boolean): Promise<boolean> {
  if (type === 'shot') return shots.setHidden(id, hidden);
  if (type === 'comment') return comments.setHidden(id, hidden);
  if (type === 'collection') return collections.setHidden(id, hidden);
  if (type === 'job') return jobs.setHidden(id, hidden);
  return false;
}

async function suspendOwner(t: Target, suspended: boolean) {
  if (!t.ownerId) throw new AppError('NOT_FOUND');
  const p = await users.findById(t.ownerId);
  if (!p) throw new AppError('NOT_FOUND');
  if (p.role !== 'member') throw new AppError('FORBIDDEN', 'Staff accounts cannot be suspended here.');
  await users.setSuspended(p.id, suspended);
  if (suspended && p.userId) await revokeAllSessions(p.userId); // BR-25
}

export const actionInput = z.object({
  targetType: z.enum(TARGET_TYPES),
  targetId: z.coerce.number().int().positive(),
  action: z.enum(['hide', 'unhide', 'suspend', 'unsuspend']),
  reason,
});

/**
 * Direct staff action (BR-68): hide/unhide content (shot, comment, collection, job) or suspend/unsuspend the
 * owner of a target (profile or content). Audited; RL-MODERATION.
 */
export async function act(viewer: Viewer, input: unknown) {
  const staff = requireStaff(viewer);
  const v = validate(actionInput, input);
  await limit('RL-MODERATION', `p:${staff.profileId}`);
  const t = await resolve(v.targetType, v.targetId);
  if (!t) throw new AppError('NOT_FOUND');
  const now = Date.now();
  if (v.action === 'hide' || v.action === 'unhide') {
    if (!t.hideable) throw new AppError('VALIDATION', 'Profiles are suspended, not hidden.', { fields: { action: 'Use suspend.' } });
    await setHidden(v.targetType, v.targetId, v.action === 'hide');
    await repo.insertAction({ actorProfileId: staff.profileId, actorLabel: `@${staff.username}`, targetType: v.targetType, targetId: String(v.targetId), action: v.action, reason: v.reason }, now);
  } else {
    await suspendOwner(t, v.action === 'suspend');
    await repo.insertAction({ actorProfileId: staff.profileId, actorLabel: `@${staff.username}`, targetType: 'profile', targetId: String(t.ownerId), action: v.action, reason: v.reason }, now);
  }
  return { targetType: v.targetType, targetId: v.targetId, action: v.action };
}

export const decisionInput = z.object({ action: z.enum(['hide', 'dismiss', 'suspend']), reason });

/** Decide a queue row (P10-27): hide the content, suspend its owner, or dismiss — resolves all open reports on it. */
export async function decide(viewer: Viewer, reportId: number, input: unknown) {
  const staff = requireStaff(viewer);
  const v = validate(decisionInput, input);
  const r = await repo.findReport(reportId);
  if (!r) throw new AppError('NOT_FOUND');
  if (r.status !== 'open') throw new AppError('CONFLICT', 'This report was already handled.');
  if (v.action !== 'dismiss') {
    const action = v.action === 'hide' ? 'hide' : 'suspend';
    await act(viewer, { targetType: r.targetType, targetId: Number(r.targetId), action, reason: v.reason });
  } else {
    await limit('RL-MODERATION', `p:${staff.profileId}`);
  }
  const status = v.action === 'hide' ? 'hidden' : v.action === 'suspend' ? 'suspended' : 'dismissed';
  const resolved = await repo.resolveTarget(r.targetType, r.targetId, status, staff.profileId, Date.now());
  return { status, resolved };
}
