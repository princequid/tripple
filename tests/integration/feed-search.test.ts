import { beforeAll, describe, expect, it } from 'vitest';
import type { Db } from '@/server/db/client';
import * as feed from '@/modules/feed/service';
import * as search from '@/modules/search/service';
import * as shots from '@/modules/shots/service';
import * as likes from '@/modules/likes/service';
import { setupTestDb, makeProfile, makeShot, visitor, errorCode } from '../helpers/db';

let db: Db;
const ids: Record<string, number> = {};
let ann: Awaited<ReturnType<typeof makeProfile>>;
let bob: Awaited<ReturnType<typeof makeProfile>>;

beforeAll(async () => {
  db = await setupTestDb();
  ann = await makeProfile(db, { username: 'ann', displayName: 'Ann Lee' });
  bob = await makeProfile(db, { username: 'bob', displayName: 'Bob Ray' });
  const suspended = await makeProfile(db, { username: 'sus' });
  const mk = async (k: string, o: Parameters<typeof makeShot>[1]) => (ids[k] = (await makeShot(db, o)).id);
  await mk('bank', { authorId: ann.profileId, title: 'Banking dashboard', description: 'finance app', tags: ['dashboard', 'fintech'], ageHours: 5, likes: 10, popularity: 5, categoryId: 1 });
  await mk('travel', { authorId: ann.profileId, title: 'Travel app', description: 'a dashboard for trips', tags: ['mobile'], ageHours: 30, likes: 3, popularity: 9, categoryId: 6 });
  await mk('crypto', { authorId: bob.profileId, title: 'Crypto wallet', tags: ['fintech', 'dashboard'], ageHours: 24 * 10, likes: 50, popularity: 1, categoryId: 1 });
  await mk('landing', { authorId: bob.profileId, title: 'Landing page', tags: ['web'], ageHours: 2, likes: 0, popularity: 2, categoryId: 2 });
  await mk('hidden', { authorId: bob.profileId, title: 'Hidden dashboard', tags: ['dashboard'], hidden: true, popularity: 100 });
  await mk('draft', { authorId: bob.profileId, title: 'Draft dashboard', status: 'draft' });
  await mk('susp', { authorId: suspended.profileId, title: 'Suspended dashboard', tags: ['dashboard'], popularity: 99 });
  const { sql } = await import('drizzle-orm');
  await db.run(sql`UPDATE profiles SET suspended_at = ${Date.now()} WHERE id = ${suspended.profileId}`);
  for (let i = 0; i < 30; i++) await mk(`bulk${i}`, { authorId: bob.profileId, title: `Bulk ${i}`, ageHours: 100 + i, categoryId: 8 });
});

const titles = (items: { title: string }[]) => items.map((i) => i.title);

describe('feeds (D-01, BR-32…BR-37)', () => {
  it('popular orders by popularity score and excludes hidden, draft and suspended authors', async () => {
    const page = await feed.list({ sort: 'popular' }, visitor);
    expect(titles(page.items).slice(0, 4)).toEqual(['Travel app', 'Banking dashboard', 'Landing page', 'Crypto wallet']);
    expect(titles(page.items)).not.toContain('Hidden dashboard');
    expect(titles(page.items)).not.toContain('Suspended dashboard');
    expect(titles(page.items)).not.toContain('Draft dashboard');
  });

  it('recent orders by published_at desc', async () => {
    const page = await feed.list({ sort: 'recent', limit: 3 }, visitor);
    expect(titles(page.items)).toEqual(['Landing page', 'Banking dashboard', 'Travel app']);
  });

  it('timeframes rank by likes within the window (BR-34)', async () => {
    expect(titles((await feed.list({ sort: 'popular', timeframe: 'week' }, visitor)).items).slice(0, 3)).toEqual(['Banking dashboard', 'Travel app', 'Landing page']);
    expect(titles((await feed.list({ sort: 'popular', timeframe: 'ever' }, visitor)).items)[0]).toBe('Crypto wallet');
  });

  it('category filter and unknown category → NOT_FOUND (BR-36)', async () => {
    expect(titles((await feed.list({ category: 'web-design' }, visitor)).items)).toEqual(['Landing page']);
    expect(await errorCode(() => feed.list({ category: 'nope' }, visitor))).toBe('NOT_FOUND');
  });

  it('cursor pagination walks every eligible shot exactly once (BR-35)', async () => {
    const seen: number[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const p: Awaited<ReturnType<typeof feed.list>> = await feed.list({ sort: 'popular', cursor, limit: 7 }, visitor);
      seen.push(...p.items.map((i) => i.id));
      cursor = p.nextCursor;
      pages++;
    } while (cursor && pages < 20);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.length).toBe(34); // 4 named + 30 bulk
  });

  it('a cursor from another feed is rejected (INVALID_CURSOR)', async () => {
    const p = await feed.list({ sort: 'recent', limit: 2 }, visitor);
    expect(await errorCode(() => feed.list({ sort: 'popular', cursor: p.nextCursor }, visitor))).toBe('INVALID_CURSOR');
  });

  it('cards carry isLiked for members and null for visitors', async () => {
    await likes.setLike(bob.viewer, ids.bank!, true);
    const forBob = await feed.list({ sort: 'recent', limit: 5 }, bob.viewer);
    expect(forBob.items.find((c) => c.id === ids.bank)!.isLiked).toBe(true);
    expect(forBob.items.find((c) => c.id === ids.landing)!.isOwn).toBe(true);
    expect((await feed.list({ sort: 'recent', limit: 5 }, visitor)).items[0]!.isLiked).toBeNull();
  });
});

describe('shot detail (SD-01, BR-37, BR-42, BR-43)', () => {
  it('returns blocks, tags and canonical path; hidden is 404 for members and visible to staff', async () => {
    const d = await shots.getDetail(ids.bank!, visitor, null);
    expect(d.canonicalPath).toBe(`/shots/${ids.bank}-banking-dashboard`);
    expect(d.tags.map((t) => t.slug)).toEqual(['dashboard', 'fintech']);
    expect(d.blocks).toHaveLength(1);
    expect(await errorCode(() => shots.getDetail(ids.hidden!, ann.viewer, null))).toBe('NOT_FOUND');
    expect(await errorCode(() => shots.getDetail(ids.draft!, visitor, null))).toBe('NOT_FOUND');
    const staff = await makeProfile(db, { role: 'moderator' });
    expect((await shots.getDetail(ids.hidden!, staff.viewer, null)).hidden).toBe(true);
  });

  it('more by (max 4, same author, excludes current) and related (shared tags first)', async () => {
    const d = await shots.getDetail(ids.bank!, visitor, null);
    const more = await feed.moreBy(d, visitor);
    expect(titles(more)).toEqual(['Travel app']);
    const related = await feed.related(d, more.map((m) => m.id), visitor);
    expect(related[0]!.title).toBe('Crypto wallet'); // shares 2 tags
    expect(related.map((r) => r.id)).not.toContain(ids.bank);
    expect(related.length).toBeLessThanOrEqual(12);
  });
});

describe('search and tags (D-06, D-07, BR-38…BR-41)', () => {
  it('matches title, description and tags, eligible only, with prefix on the last token', async () => {
    const r = await search.searchShots('dashb', null, visitor);
    expect(r.term).toBe('dashb');
    expect(new Set(titles(r.items))).toEqual(new Set(['Banking dashboard', 'Crypto wallet', 'Travel app']));
    expect(titles(r.items)[0]).toBe('Banking dashboard'); // title match outranks description-only
  });

  it('author names are searchable and operators are plain text', async () => {
    expect(titles((await search.searchShots('Bob Ray', null, visitor)).items)).toContain('Landing page');
    expect((await search.searchShots('" OR 1=1 --', null, visitor)).items).toBeInstanceOf(Array);
    expect((await search.searchShots('   ', null, visitor)).items).toEqual([]);
  });

  it('related tags exclude the term itself', async () => {
    const rel = await search.relatedTags('dashboard');
    expect(rel.map((t) => t.slug)).toContain('fintech');
    expect(rel.map((t) => t.slug)).not.toContain('dashboard');
  });

  it('tag index counts eligible shots only; empty tag pages are 404', async () => {
    const idx = await search.tagIndex();
    expect(idx.top.find((t) => t.slug === 'dashboard')!.count).toBe(2);
    expect(idx.index.map((g) => g.letter)).toEqual(['D', 'F', 'M', 'W']);
    const page = await search.tagPage('fintech', {}, visitor);
    expect(page.count).toBe(2);
    expect(await errorCode(() => search.tagPage('nothing-here', {}, visitor))).toBe('NOT_FOUND');
  });
});
