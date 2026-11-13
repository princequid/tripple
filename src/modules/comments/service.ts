import 'server-only';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { requireMember } from '@/modules/auth/service';
import { isStaff, type Viewer } from '@/modules/auth/types';
import * as shots from '@/modules/shots/service';
import * as users from '@/modules/users/service';
import * as repo from './repository';
import type { CommentDto, CommentThreadPage } from './types';

/**
 * Comments (S-04, FR-49, FR-50; BR-48…BR-52). Plain text, one reply level, author edit within 15 minutes,
 * delete by the author or the shot's managers (author, team owner/admin), per-shot disabling.
 * Comments by suspended or deleted accounts are not shown (BR-25 applied to comments).
 */
export const EDIT_WINDOW_MS = 15 * 60_000;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** BR-48: trim, strip control characters, normalise line endings, at most 2 consecutive blank lines. */
export function normaliseBody(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

const bodySchema = z
  .string()
  .max(10_000, 'Use at most 2,000 characters.')
  .transform(normaliseBody)
  .pipe(z.string().min(1, 'Write a comment first.').max(2000, 'Use at most 2,000 characters.'));

export const createInput = z.object({ body: bodySchema, parentId: z.number().int().positive().nullish() });
export const editInput = z.object({ body: bodySchema });

function toDto(r: repo.CommentRow, viewer: Viewer, liked: Set<number>, canModerate: boolean, now: number, replies: CommentDto[] = []): CommentDto {
  const own = viewer.kind === 'member' && viewer.profileId === r.authorId;
  const deleted = r.deletedAt !== null;
  return {
    id: r.id,
    shotId: r.shotId,
    parentId: r.parentId,
    author: {
      id: r.authorId,
      username: r.authorUsername,
      displayName: r.authorName,
      avatarKey: r.authorAvatarKey,
      isTeam: r.authorKind === 'team',
      isFeaturedStudio: r.authorFeatured,
    },
    body: deleted ? '' : r.body,
    createdAt: new Date(r.createdAt).toISOString(),
    editedAt: r.editedAt ? new Date(r.editedAt).toISOString() : null,
    deleted,
    hidden: r.hiddenAt !== null,
    likesCount: deleted ? 0 : r.likesCount,
    isLiked: viewer.kind === 'member' && !deleted ? liked.has(r.id) : null,
    canEdit: own && !deleted && now - r.createdAt <= EDIT_WINDOW_MS,
    canDelete: !deleted && (own || canModerate),
    replies,
  };
}

/** Visible to this viewer? Deleted placeholders are shown only as thread structure (handled by caller). */
const shown = (r: repo.CommentRow, staff: boolean) => !r.authorGone && (r.hiddenAt === null || staff);

async function canModerate(viewer: Viewer, shot: { authorId: number; teamId: number | null }) {
  if (viewer.kind !== 'member') return false;
  return users.canManageShot(viewer.profileId, shot);
}

/**
 * Thread for a shot (FR-49): top-level comments oldest first, 24 per page, each with all its replies
 * oldest first. A deleted top-level comment appears as a placeholder only while it has visible replies.
 */
export async function thread(shotId: number, viewer: Viewer, q: { cursor?: string | null; limit?: number }): Promise<CommentThreadPage> {
  const shot = await shots.requireEligible(shotId);
  const staff = isStaff(viewer);
  const moderate = await canModerate(viewer, shot);
  const size = Math.min(Math.max(q.limit ?? 24, 1), 48);
  const key = `comments:${shotId}`;
  const now = Date.now();
  const tops = await repo.topLevel(shotId, decodeCursor(q.cursor, key), size + 1);
  const page = tops.slice(0, size);
  const replies = await repo.repliesOf(page.map((t) => t.id));
  const visibleReplies = replies.filter((r) => r.deletedAt === null && shown(r, staff));
  const liked = viewer.kind === 'member' ? await repo.likedAmong(viewer.profileId, [...page.map((p) => p.id), ...visibleReplies.map((r) => r.id)]) : new Set<number>();
  const byParent = new Map<number, CommentDto[]>();
  for (const r of visibleReplies) {
    const list = byParent.get(r.parentId!) ?? [];
    list.push(toDto(r, viewer, liked, moderate, now));
    byParent.set(r.parentId!, list);
  }
  const comments = page.flatMap((t) => {
    const kids = byParent.get(t.id) ?? [];
    if (t.deletedAt !== null || !shown(t, staff)) {
      // Placeholder only when replies remain (BR-50); a hidden/gone parent is shown as removed too.
      return kids.length ? [{ ...toDto(t, viewer, liked, moderate, now, kids), deleted: true, body: '', canDelete: false, canEdit: false, isLiked: null, likesCount: 0 }] : [];
    }
    return [toDto(t, viewer, liked, moderate, now, kids)];
  });
  const last = page[page.length - 1];
  return {
    comments,
    total: await repo.visibleCount(shotId),
    disabled: shot.commentsDisabled,
    canModerate: moderate,
    nextCursor: tops.length > size && last ? encodeCursor(key, [last.createdAt, last.id]) : null,
  };
}

/** FR-49 post a comment or reply. Disabled → 403 COMMENTS_DISABLED (BR-51). RL-COMMENT. */
export async function create(viewer: Viewer, shotId: number, input: z.input<typeof createInput>): Promise<CommentDto> {
  const member = requireMember(viewer);
  const v = validate(createInput, input);
  const shot = await shots.requireEligible(shotId);
  if (shot.commentsDisabled) throw new AppError('COMMENTS_DISABLED', 'Comments are turned off for this shot.');
  await limit('RL-COMMENT', `p:${member.profileId}`);
  let parentId: number | null = null;
  let body = v.body;
  if (v.parentId) {
    const parent = await repo.findById(v.parentId);
    if (!parent || parent.shotId !== shotId || parent.hiddenAt || parent.authorGone) throw new AppError('NOT_FOUND', 'That comment no longer exists.');
    if (parent.parentId !== null) {
      // BR-49: a reply to a reply goes under the top-level comment, prefixed with the replied-to @username.
      parentId = parent.parentId;
      const mention = `@${parent.authorUsername} `;
      if (!body.startsWith(mention.trim())) body = `${mention}${body}`.slice(0, 2000);
    } else {
      if (parent.deletedAt) throw new AppError('NOT_FOUND', 'That comment no longer exists.');
      parentId = parent.id;
    }
  }
  const now = Date.now();
  const id = await repo.insert(shotId, member.profileId, parentId, body, now);
  const row = (await repo.findById(id))!;
  return toDto(row, viewer, new Set(), await canModerate(viewer, shot), now);
}

async function ownComment(viewer: Viewer, id: number) {
  const member = requireMember(viewer);
  const c = await repo.findById(id);
  if (!c || c.deletedAt || c.authorGone || (c.hiddenAt && !isStaff(viewer))) throw new AppError('NOT_FOUND');
  const shot = await shots.requireEligible(c.shotId);
  return { member, c, shot };
}

/** BR-50: the author may edit within 15 minutes; the comment then shows "edited". */
export async function edit(viewer: Viewer, id: number, input: z.input<typeof editInput>): Promise<CommentDto> {
  const { member, c, shot } = await ownComment(viewer, id);
  const v = validate(editInput, input);
  if (c.authorId !== member.profileId) throw new AppError('FORBIDDEN', 'You can only edit your own comments.');
  const now = Date.now();
  if (now - c.createdAt > EDIT_WINDOW_MS) throw new AppError('FORBIDDEN', 'Comments can be edited for 15 minutes after posting.');
  await limit('RL-COMMENT', `p:${member.profileId}`);
  await repo.updateBody(id, v.body, now);
  const liked = await repo.likedAmong(member.profileId, [id]);
  return toDto((await repo.findById(id))!, viewer, liked, await canModerate(viewer, shot), now);
}

/** BR-50: delete by the author, the shot's author or the team owner/admin (and staff). */
export async function remove(viewer: Viewer, id: number): Promise<{ deleted: true; placeholder: boolean }> {
  const { member, c, shot } = await ownComment(viewer, id);
  const allowed = c.authorId === member.profileId || isStaff(viewer) || (await users.canManageShot(member.profileId, shot));
  if (!allowed) throw new AppError('FORBIDDEN', 'You cannot delete this comment.');
  await limit('RL-COMMENT', `p:${member.profileId}`);
  const placeholder = c.parentId === null && (await repo.hasReplies(c.id));
  await repo.remove(c, placeholder, Date.now());
  return { deleted: true, placeholder };
}

/** BR-52: like a comment once; not your own. Set semantics. */
export async function setLike(viewer: Viewer, id: number, on: boolean): Promise<{ liked: boolean; likesCount: number }> {
  const { member, c } = await ownComment(viewer, id);
  if (c.authorId === member.profileId) throw new AppError('CANNOT_LIKE_OWN', 'You cannot like your own comment.');
  await limit('RL-COMMENT', `p:${member.profileId}`);
  return { liked: on, likesCount: await repo.setLike(member.profileId, id, on, Date.now()) };
}

/** BR-51 / BR-60: the shot's author or team owner/admin turns comments off or on. */
export async function setDisabled(viewer: Viewer, shotId: number, disabled: boolean): Promise<{ commentsDisabled: boolean }> {
  const member = requireMember(viewer);
  const shot = await shots.requireEligible(shotId);
  if (!(await users.canManageShot(member.profileId, shot))) throw new AppError('FORBIDDEN', 'Only the shot owner can change this.');
  await limit('RL-CONTENT', `p:${member.profileId}`);
  await shots.setCommentsDisabled(shotId, disabled);
  return { commentsDisabled: disabled };
}

export const findTarget = (id: number) => repo.findById(id);
export const setHidden = (id: number, hidden: boolean) => repo.setHidden(id, hidden, Date.now());
export const removeAllBy = (profileId: number) => repo.removeAllBy(profileId, Date.now());
export const reconcile = () => repo.reconcile();
export const nonAuthorCounts = (ids: number[]) => repo.nonAuthorCounts(ids);
export const removeAllOnShot = (shotId: number) => repo.removeAllOnShot(shotId);
