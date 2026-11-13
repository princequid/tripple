import 'server-only';
import { AppError } from '@/server/errors';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { normaliseSearchTerm, toFtsQuery } from '@/lib/search-term';
import { tagSlug } from '@/lib/slug';
import type { Viewer } from '@/modules/auth/types';
import * as shots from '@/modules/shots/service';
import * as likes from '@/modules/likes/service';
import type { Page, PersonRef, ShotCard } from '@/modules/shots/types';
import type { PersonSummary } from '@/modules/follows/types';
import * as repo from './repository';

/** Search and tags (BR-38…BR-41, FR-32). */

export const RELEVANCE_WEIGHT = 0.7; // BR-39 initial blend (D-07); changing it needs a DECISION_LOG entry
const MAX_RESULTS = 200;
const PAGE = 24;

export const normaliseTerm = normaliseSearchTerm;

/** Ranked IDs: relevance (bm25, normalised) blended with normalised popularity. Ties by id desc. */
export function rank(rows: repo.MatchRow[]): number[] {
  if (rows.length === 0) return [];
  const rel = rows.map((r) => -r.rank); // bm25: more negative = better
  const maxRel = Math.max(...rel, Number.EPSILON);
  const maxPop = Math.max(...rows.map((r) => r.popularity), 0);
  return rows
    .map((r, i) => ({
      id: r.id,
      score: RELEVANCE_WEIGHT * (rel[i]! / maxRel) + (1 - RELEVANCE_WEIGHT) * (maxPop > 0 ? r.popularity / maxPop : 0),
    }))
    .sort((a, b) => b.score - a.score || b.id - a.id)
    .map((r) => r.id);
}

async function rankedIds(term: string): Promise<number[]> {
  const fts = toFtsQuery(term);
  if (!fts) return [];
  return rank(await repo.match(fts, Date.now(), MAX_RESULTS));
}

/** BR-38/BR-39. An empty term after normalisation gives an empty page (empty state). */
export async function searchShots(rawTerm: string, cursor: string | null | undefined, viewer: Viewer): Promise<Page<ShotCard> & { term: string }> {
  const term = normaliseSearchTerm(rawTerm);
  if (!term) return { term, items: [], nextCursor: null };
  const feedKey = `search:${term}`;
  const after = decodeCursor(cursor, feedKey);
  const offset = after && typeof after[0] === 'number' ? after[0] : 0;
  const ids = await rankedIds(term);
  const slice = ids.slice(offset, offset + PAGE);
  const items = await shots.cardsInOrder(slice, viewer, likes.lookupFor(viewer));
  const next = offset + PAGE;
  return { term, items, nextCursor: next < ids.length ? encodeCursor(feedKey, [next]) : null };
}

/** BR-39 "Related": up to 8 tags most frequent in the top 50 results, excluding the term itself. */
export async function relatedTags(rawTerm: string) {
  const term = normaliseSearchTerm(rawTerm);
  if (!term) return [];
  const top = (await rankedIds(term)).slice(0, 50);
  const self = tagSlug(term);
  const rows = await repo.tagsAmong(top, 9);
  return rows.filter((t) => t.slug !== self).slice(0, 8).map(({ name, slug }) => ({ name, slug }));
}

/** BR-41 `/tags`: the 50 tags with the most eligible shots, then an A–Z index (digits under `#`). */
export async function tagIndex() {
  const all = await repo.eligibleTagCounts(Date.now());
  const top = all.slice(0, 50).map((t) => ({ name: t.name, slug: t.slug, count: Number(t.n) }));
  const groups = new Map<string, { name: string; slug: string }[]>();
  for (const t of [...all].sort((a, b) => a.name.localeCompare(b.name))) {
    const first = t.name.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push({ name: t.name, slug: t.slug });
  }
  const letters = [...groups.keys()].sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)));
  return { top, index: letters.map((letter) => ({ letter, tags: groups.get(letter)! })) };
}

/** BR-41 `/tags/:tag`: 404 unless the tag has at least one eligible shot. */
export async function tagPage(slug: string, opts: { sort?: string | null; cursor?: string | null }, viewer: Viewer) {
  const tag = await repo.findBySlug(slug);
  if (!tag) throw new AppError('NOT_FOUND');
  const now = Date.now();
  const count = await shots.countEligible({ now, tagId: tag.id });
  if (count === 0) throw new AppError('NOT_FOUND');
  const order: shots.CardOrder = opts.sort === 'recent' ? 'recent' : 'popular';
  const page = await shots.listCards({
    filter: { now, tagId: tag.id },
    order,
    feedKey: `tag:${tag.id}:${order}`,
    cursor: opts.cursor,
    viewer,
    likedLookup: likes.lookupFor(viewer),
  });
  return { tag: { name: tag.name, slug: tag.slug }, count, ...page };
}

export const reconcileTagCounts = () => repo.reconcileTagCounts();

// ---------------------------------------------------------------------------------------------------------
// R2: header search types and autocomplete (D-08, FR-35)
// ---------------------------------------------------------------------------------------------------------

/** Designer search term: same normalisation as shot search (BR-38), at least 1 character. */
export async function searchDesigners(
  rawTerm: string,
  cursor: string | null | undefined,
  viewer: Viewer,
  followingAmong: (ids: number[]) => Promise<Set<number>>,
): Promise<Page<PersonSummary> & { term: string }> {
  const term = normaliseSearchTerm(rawTerm);
  if (!term) return { term, items: [], nextCursor: null };
  const key = `designers:${term}`;
  const rows = await repo.designers(term, decodeCursor(cursor, key), PAGE + 1);
  const page = rows.slice(0, PAGE);
  const mine = await followingAmong(page.map((r) => Number(r.id)));
  const last = page[page.length - 1];
  return {
    term,
    items: page.map((r) => ({
      id: Number(r.id),
      username: r.username,
      displayName: r.displayName,
      avatarKey: r.avatarKey,
      isTeam: r.kind === 'team',
      isFeaturedStudio: Boolean(r.featured),
      headline: r.headline,
      location: r.location,
      followersCount: Number(r.followers),
      isFollowing: viewer.kind !== 'member' || viewer.profileId === Number(r.id) ? null : mine.has(Number(r.id)),
      isOwn: viewer.kind === 'member' && viewer.profileId === Number(r.id),
    })),
    nextCursor: rows.length > PAGE && last ? encodeCursor(key, [Number(last.r), Number(last.followers), Number(last.shots), Number(last.id)]) : null,
  };
}

export type Suggestion = { kind: 'tag' | 'designer'; label: string; href: string; avatar?: PersonRef };

/** FR-35: from 2 characters, at most 8 suggestions (tags first by popularity, then designers). */
export async function suggest(rawTerm: string): Promise<Suggestion[]> {
  const term = normaliseSearchTerm(rawTerm);
  if (term.length < 2) return [];
  const { tags, people } = await repo.suggest(term, 8);
  const out: Suggestion[] = [
    ...tags.slice(0, 4).map((t) => ({ kind: 'tag' as const, label: t.name, href: `/tags/${t.slug}` })),
    ...people.map((p) => ({
      kind: 'designer' as const,
      label: p.displayName,
      href: `/${p.username}`,
      avatar: { id: Number(p.id), username: p.username, displayName: p.displayName, avatarKey: p.avatarKey, isTeam: p.kind === 'team', isFeaturedStudio: Boolean(p.featured) },
    })),
  ];
  const tagsLeft = tags.slice(4).map((t) => ({ kind: 'tag' as const, label: t.name, href: `/tags/${t.slug}` }));
  return [...out, ...tagsLeft].slice(0, 8);
}
