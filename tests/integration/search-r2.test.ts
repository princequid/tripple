import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as search from '@/modules/search/service';
import * as follows from '@/modules/follows/service';
import * as shots from '@/modules/shots/service';
import * as platform from '@/modules/platform/service';
import { resetLimitsForTests } from '@/server/rate-limit';
import { setupTestDb, clearContent, makeProfile, makeShot, visitor } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});
beforeEach(async () => {
  await clearContent(db);
  await resetLimitsForTests();
});

describe('designer search and autocomplete (D-08, FR-35)', () => {
  it('matches username or name, prefix first, then followers; hides suspended; shows follow state', async () => {
    const mara = await makeProfile(db, { username: 'mara-ui', displayName: 'Mara Lopes' });
    const tamara = await makeProfile(db, { username: 'tamara', displayName: 'Tamara Okafor' });
    const amar = await makeProfile(db, { username: 'amar-x', displayName: 'Amar Singh' });
    const gone = await makeProfile(db, { username: 'mara-gone', displayName: 'Mara Gone' });
    await db.run(sql`UPDATE profiles SET suspended_at = 1 WHERE id = ${gone.profileId}`);
    await follows.setFollow(amar.viewer, tamara.username, true);
    const r = await search.searchDesigners('Mara', null, amar.viewer, (ids) => follows.followingAmong(amar.viewer, ids));
    expect(r.term).toBe('mara');
    expect(r.items.map((x) => x.username)).toEqual(['mara-ui', 'tamara']); // prefix match first; "amar" does not contain "mara"
    expect(r.items.find((x) => x.username === 'tamara')!.isFollowing).toBe(true);
    expect(r.items[0]).toMatchObject({ isOwn: false, followersCount: 0, isTeam: false });
    expect((await search.searchDesigners('  ', null, visitor, async () => new Set())).items).toEqual([]);
    expect((await search.searchDesigners('100%', null, visitor, async () => new Set())).items).toEqual([]);
    void mara;
  });

  it('suggest from 2 characters, at most 8, tags with eligible shots and designers', async () => {
    const dana = await makeProfile(db, { username: 'dana-d', displayName: 'Dana Design' });
    await makeShot(db, { authorId: dana.profileId, tags: ['dashboard', 'dark mode'] });
    expect(await search.suggest('d')).toEqual([]);
    const s = await search.suggest('Da');
    expect(s.map((x) => [x.kind, x.label])).toEqual([
      ['tag', 'dark mode'],
      ['tag', 'dashboard'],
      ['designer', 'Dana Design'],
    ]);
    expect(s[2]).toMatchObject({ href: '/dana-d', avatar: { username: 'dana-d' } });
    expect((await search.suggest('mode')).map((x) => x.label)).toEqual(['dark mode']); // word prefix
  });
});

describe('R2 popularity (BR-33) and the daily job', () => {
  it('saves and non-author comments raise the score; the author own comments do not', () => {
    const now = Date.now();
    const pub = new Date(now - 10 * 3_600_000);
    const base = shots.popularityScore(5, 100, pub, now);
    expect(shots.popularityScore(5, 100, pub, now, 0, 0)).toBe(base);
    expect(shots.popularityScore(5, 100, pub, now, 1, 0)).toBeGreaterThan(base);
    expect(shots.popularityScore(5, 100, pub, now, 0, 1)).toBeGreaterThan(shots.popularityScore(5, 100, pub, now, 1, 0));
  });

  it('daily runs popularity, cleanup, purge and reconcile without errors', async () => {
    const ann = await makeProfile(db);
    const fan = await makeProfile(db);
    const s1 = await makeShot(db, { authorId: ann.profileId, ageHours: 5 });
    const s2 = await makeShot(db, { authorId: ann.profileId, ageHours: 5 });
    const now = Date.now();
    await db.run(sql`INSERT INTO comments (shot_id, author_id, body, created_at) VALUES (${s1.id}, ${fan.profileId}, 'nice', ${now}), (${s2.id}, ${ann.profileId}, 'mine', ${now})`);
    const r = await platform.daily();
    expect(r.popularity).toBe(2);
    expect(r.reconciled.comments).toBe(2); // comments_count rebuilt from rows
    expect(r.purged).toEqual({ shots: 0, accounts: 0 });
    const rows = await db.all<{ id: number; p: number }>(sql`SELECT id, popularity_score AS p FROM shots ORDER BY id`);
    expect(rows[0]!.p).toBeGreaterThan(rows[1]!.p); // the non-author comment counts, the author's own does not
  });
});
