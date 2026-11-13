import 'server-only';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { AppError } from '@/server/errors';
import { shotPath } from '@/lib/slug';
import type { Viewer } from '@/modules/auth/types';
import { isStaff } from '@/modules/auth/types';
import * as repo from './repository';
import type { CardFilter, CardOrder, CardRow } from './repository';
import type { ShotCard, ShotDetail, Page, PersonRef, ContentBlockDto } from './types';

export type { CardOrder, CardFilter };

function person(
  id: number,
  username: string,
  displayName: string,
  avatarKey: string | null,
  isTeam: boolean,
  featured: boolean,
): PersonRef {
  return { id, username, displayName, avatarKey, isTeam, isFeaturedStudio: featured };
}

export function toCard(r: CardRow, viewer: Viewer, liked: Set<number> | null): ShotCard {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    cover: r.coverKey
      ? { key: r.coverKey, width: r.coverWidth ?? 0, height: r.coverHeight ?? 0, dominantColor: r.coverColor, alt: r.title }
      : null,
    author: person(r.authorId, r.authorUsername, r.authorName, r.authorAvatarKey, r.authorKind === 'team', r.authorFeatured),
    team:
      r.teamId && r.teamUsername && r.teamName
        ? person(r.teamId, r.teamUsername, r.teamName, r.teamAvatarKey, true, Boolean(r.teamFeatured))
        : null,
    likesCount: r.likesCount,
    viewsCount: r.viewsCount,
    publishedAt: (r.publishedAt ?? new Date(0)).toISOString(),
    isLiked: viewer.kind === 'member' ? (liked?.has(r.id) ?? false) : null,
    isOwn: viewer.kind === 'member' && viewer.profileId === r.authorId,
  };
}

/**
 * Lists eligible shot cards with keyset pagination (BR-35). `feedKey` binds the cursor to the query.
 * `likedLookup` is provided by the likes service so this module does not read the likes table.
 */
export async function listCards(opts: {
  filter: CardFilter;
  order: CardOrder;
  feedKey: string;
  cursor?: string | null;
  limit?: number;
  viewer: Viewer;
  likedLookup?: (ids: number[]) => Promise<Set<number>>;
}): Promise<Page<ShotCard>> {
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 48);
  const after = decodeCursor(opts.cursor, opts.feedKey);
  const rows = await repo.listCards(opts.filter, opts.order, after, limit + 1);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const liked = opts.likedLookup && opts.viewer.kind === 'member' ? await opts.likedLookup(page.map((r) => r.id)) : null;
  const last = page[page.length - 1];
  return {
    items: page.map((r) => toCard(r, opts.viewer, liked)),
    nextCursor: hasMore && last ? encodeCursor(opts.feedKey, repo.cursorTuple(last, opts.order)) : null,
  };
}

/** Cards for a list of IDs, in the given order, eligible only (search results, BR-39). */
export async function cardsInOrder(
  ids: number[],
  viewer: Viewer,
  likedLookup?: (ids: number[]) => Promise<Set<number>>,
): Promise<ShotCard[]> {
  const rows = await repo.cardsByIds(ids, Date.now());
  const byId = new Map(rows.map((r) => [r.id, r]));
  const liked = likedLookup && viewer.kind === 'member' ? await likedLookup(ids) : null;
  return ids.flatMap((id) => {
    const r = byId.get(id);
    return r ? [toCard(r, viewer, liked)] : [];
  });
}

export const countEligible = (f: CardFilter) => repo.countEligible(f);

/**
 * Shot detail (FR-37, BR-37, BR-42, BR-68). Ineligible → NOT_FOUND, except that moderators and admins can
 * open hidden shots. The caller compares `canonicalPath` with the request path and redirects (308).
 */
export async function getDetail(
  id: number,
  viewer: Viewer,
  isLiked: boolean | null,
  extra: { isSaved?: boolean | null; isFollowingOwner?: boolean | null } = {},
): Promise<ShotDetail> {
  const { head, blocks, colors, tags } = await repo.findDetail(id);
  if (!head) throw new AppError('NOT_FOUND');
  const now = Date.now();
  const published = head.status === 'published' && head.publishedAt !== null && head.publishedAt.getTime() <= now;
  const ownerGone = Boolean(head.authorSuspendedAt || head.authorDeletedAt || head.teamSuspendedAt || head.teamDeletedAt);
  const staff = isStaff(viewer);
  if (head.deletedAt || !published) throw new AppError('NOT_FOUND');
  if ((head.hiddenAt || ownerGone) && !staff) throw new AppError('NOT_FOUND');

  const card = toCard(head as CardRow, viewer, isLiked ? new Set([head.id]) : new Set());
  return {
    ...card,
    description: head.description,
    savesCount: head.savesCount,
    commentsCount: head.commentsCount,
    commentsDisabled: head.commentsDisabled,
    isSaved: viewer.kind === 'member' ? (extra.isSaved ?? false) : null,
    isFollowingOwner: extra.isFollowingOwner ?? null,
    category: { slug: head.categorySlug, name: head.categoryName },
    tags,
    palette: colors.map((c) => c.hex),
    hidden: Boolean(head.hiddenAt || ownerGone),
    canonicalPath: shotPath(head.id, head.slug),
    blocks: blocks.flatMap((b): ContentBlockDto[] => {
      if (b.type === 'image' && b.key) {
        return [
          {
            id: b.id,
            type: 'image' as const,
            position: b.position,
            isFullWidth: b.isFullWidth,
            media: {
              key: b.key,
              width: b.width ?? 0,
              height: b.height ?? 0,
              dominantColor: b.color,
              alt: b.alt || `${head.title}, image ${b.position + 1}`,
            },
          },
        ];
      }
      if (b.type === 'text' && b.textBody) return [{ id: b.id, type: 'text' as const, position: b.position, text: b.textBody }];
      return [];
    }),
  };
}

/** Eligible shot with its owners, for mutations (likes, saves, comments). NOT_FOUND when ineligible (BR-46). */
export async function requireEligible(id: number): Promise<{ id: number; authorId: number; teamId: number | null; commentsDisabled: boolean }> {
  const row = await repo.findForMutation(id, Date.now());
  if (!row) throw new AppError('NOT_FOUND');
  return { id: row.id, authorId: row.authorId, teamId: row.teamId, commentsDisabled: row.commentsDisabled };
}

/** BR-51 (written by the comments service after its permission check). */
export const setCommentsDisabled = (id: number, disabled: boolean) => repo.setCommentsDisabled(id, disabled, Date.now());

export const likesCountOf = (id: number) => repo.likesCountOf(id);

export async function setHidden(id: number, hidden: boolean): Promise<boolean> {
  const rows = await repo.setHidden(id, hidden, Date.now());
  return rows.length > 0;
}

export const listIdsByProfile = (profileId: number) => repo.listIdsByProfile(profileId);

/**
 * BR-33 popularity. R2 formula: (L + 2·S + 3·C + 0.02·V + 1) / (H + 2)^1.5, with S = saves and C = comments by
 * people other than the author; H = hours since publication. With S = C = 0 it equals the R1 formula.
 * Recomputed on a schedule (cron), never per request. Weights changes need a DECISION_LOG entry.
 */
export function popularityScore(likes: number, views: number, publishedAt: Date | null, now: number, saves = 0, comments = 0): number {
  const hours = Math.max(0, (now - (publishedAt?.getTime() ?? now)) / 3_600_000);
  return (likes + 2 * saves + 3 * comments + 0.02 * views + 1) / Math.pow(hours + 2, 1.5);
}

export async function recomputePopularity(now = Date.now(), chunk = 500): Promise<number> {
  let afterId = 0;
  let total = 0;
  for (;;) {
    const rows = await repo.popularityInputs(afterId, chunk);
    if (rows.length === 0) break;
    await repo.writePopularity(rows.map((r) => ({ id: r.id, score: popularityScore(r.likes, r.views, r.publishedAt, now, r.saves, Number(r.comments)) })));
    total += rows.length;
    afterId = rows[rows.length - 1]!.id;
  }
  return total;
}

export const reconcileShotsCount = () => repo.reconcileShotsCount();

export const refreshSearchAuthor = (profileId: number, displayName: string, username: string) =>
  repo.refreshSearchAuthor(profileId, `${displayName} ${username}`);

export const detachTeam = (teamId: number) => repo.clearTeam({ teamId }, Date.now());
export const removeTeamAttribution = (shotId: number) => repo.clearTeam({ shotId }, Date.now());

/** FR-44: previous (newer) and next (older) shots by the same owner, skipping ineligible ones. */
export async function neighbours(id: number, viewer: Viewer) {
  const d = await getDetail(id, viewer, null);
  const owner = d.team ?? d.author;
  return repo.neighbours(owner.id, new Date(d.publishedAt), id, Date.now());
}

/** Minimal profile reference (team of a draft) without the visibility rules of users.getPublicProfile. */
export const personById = (id: number) => repo.personById(id);
export const findBasic = (id: number) => repo.findBasic(id);
