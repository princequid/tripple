import 'server-only';
import { AppError } from '@/server/errors';
import { categoryBySlug, TIMEFRAME_DAYS, TIMEFRAMES, type FeedSort, type Timeframe } from '@/lib/catalog';
import type { Viewer } from '@/modules/auth/types';
import * as shots from '@/modules/shots/service';
import * as likes from '@/modules/likes/service';
import type { Page, ShotCard, ShotDetail } from '@/modules/shots/types';
import * as repo from './repository';

/** Feeds (BR-32…BR-35, BR-43). All lists go through shots.listCards, which applies BR-37 eligibility. */

export type FeedQuery = {
  sort?: string | null;
  category?: string | null;
  timeframe?: string | null;
  cursor?: string | null;
  limit?: number;
};

/** Canonical feed parameters. Unknown sort/timeframe fall back to defaults (BR-34); unknown category is 404 (BR-36). */
export function normaliseQuery(q: FeedQuery): { sort: FeedSort; timeframe: Timeframe; category: ReturnType<typeof categoryBySlug> } {
  const sort: FeedSort = q.sort === 'recent' ? 'recent' : 'popular';
  const tf = TIMEFRAMES.find((t) => t.value === q.timeframe)?.value ?? 'now';
  let category: ReturnType<typeof categoryBySlug> = null;
  if (q.category) {
    category = categoryBySlug(q.category);
    if (!category) throw new AppError('NOT_FOUND');
  }
  // BR-34: timeframe applies to Popular only.
  return { sort, timeframe: sort === 'recent' ? 'now' : tf, category };
}

export async function list(q: FeedQuery, viewer: Viewer): Promise<Page<ShotCard>> {
  const { sort, timeframe, category } = normaliseQuery(q);
  const now = Date.now();
  const filter: shots.CardFilter = { now, categoryId: category?.id };
  let order: shots.CardOrder;
  if (sort === 'recent') order = 'recent';
  else if (timeframe === 'now') order = 'popular';
  else {
    order = 'likes';
    if (timeframe !== 'ever') filter.publishedSince = now - TIMEFRAME_DAYS[timeframe] * 86_400_000;
  }
  return shots.listCards({
    filter,
    order,
    feedKey: `feed:${sort}:${timeframe}:${category?.slug ?? 'all'}`,
    cursor: q.cursor,
    limit: q.limit,
    viewer,
    likedLookup: likes.lookupFor(viewer),
  });
}

export const homepage = (viewer: Viewer) => list({}, viewer);

/**
 * Profile Work tab (FR-54, BR-59): eligible shots authored by, or attributed to, the profile. Recent by default
 * (A-13 label), Popular optional. The caller has already checked the profile is visible (users.getPublicProfile).
 */
export async function byProfile(
  profileId: number,
  q: { sort?: string | null; cursor?: string | null; limit?: number },
  viewer: Viewer,
): Promise<Page<ShotCard>> {
  const order: shots.CardOrder = q.sort === 'popular' ? 'popular' : 'recent';
  return shots.listCards({
    filter: { now: Date.now(), profileId },
    order,
    feedKey: `profile:${profileId}:${order}`,
    cursor: q.cursor,
    limit: q.limit,
    viewer,
    likedLookup: likes.lookupFor(viewer),
  });
}

/** BR-43: up to 4 most recent shots by the same author (the team when team-attributed). */
export async function moreBy(shot: ShotDetail, viewer: Viewer): Promise<ShotCard[]> {
  const owner = shot.team ?? shot.author;
  const page = await shots.listCards({
    filter: { now: Date.now(), profileId: owner.id, excludeIds: [shot.id] },
    order: 'recent',
    feedKey: `more:${shot.id}`,
    limit: 4,
    viewer,
    likedLookup: likes.lookupFor(viewer),
  });
  return page.items;
}

/**
 * BR-43: up to 12 shots by shared tags, then same category, then popularity, excluding the current shot and
 * "More by" items; filled with popular shots from the same category when fewer than 12 match.
 */
export async function related(shot: ShotDetail, exclude: number[], viewer: Viewer): Promise<ShotCard[]> {
  const want = 12;
  const categoryId = await repo.categoryIdOf(shot.id);
  if (categoryId === null) return [];
  const lookup = likes.lookupFor(viewer);
  const ids = await repo.relatedCandidates(shot.id, categoryId, exclude, want * 3);
  const matched = (await shots.cardsInOrder(ids, viewer, lookup)).slice(0, want);
  if (matched.length >= want) return matched;
  const fill = await shots.listCards({
    filter: { now: Date.now(), categoryId, excludeIds: [shot.id, ...exclude, ...matched.map((c) => c.id)] },
    order: 'popular',
    feedKey: `related-fill:${shot.id}`,
    limit: want - matched.length,
    viewer,
    likedLookup: lookup,
  });
  return [...matched, ...fill.items];
}

export const recomputePopularity = (now?: number) => shots.recomputePopularity(now);
