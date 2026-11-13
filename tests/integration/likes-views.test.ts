import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as likes from '@/modules/likes/service';
import * as views from '@/modules/views/service';
import * as platform from '@/modules/platform/service';
import { resetLimitsForTests } from '@/server/rate-limit';
import { setupTestDb, clearContent, makeProfile, makeShot, visitor, errorCode } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});
beforeEach(async () => {
  await clearContent(db);
  await resetLimitsForTests();
});

const counts = async (shotId: number, authorId: number) => {
  const [r] = await db.all<{ l: number; r: number; rows: number }>(sql`SELECT
    (SELECT likes_count FROM shots WHERE id = ${shotId}) AS l,
    (SELECT likes_received_count FROM profiles WHERE id = ${authorId}) AS r,
    (SELECT COUNT(*) FROM likes WHERE shot_id = ${shotId}) AS rows`);
  return { likes: Number(r!.l), received: Number(r!.r), rows: Number(r!.rows) };
};

describe('likes (S-01, BR-26, BR-46)', () => {
  it('set semantics: repeated like/unlike never drift counters', async () => {
    const author = await makeProfile(db);
    const fan = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    expect(await likes.setLike(fan.viewer, s.id, true)).toEqual({ liked: true, likesCount: 1 });
    expect(await likes.setLike(fan.viewer, s.id, true)).toEqual({ liked: true, likesCount: 1 });
    expect(await counts(s.id, author.profileId)).toEqual({ likes: 1, received: 1, rows: 1 });
    expect(await likes.setLike(fan.viewer, s.id, false)).toEqual({ liked: false, likesCount: 0 });
    expect(await likes.setLike(fan.viewer, s.id, false)).toEqual({ liked: false, likesCount: 0 });
    expect(await counts(s.id, author.profileId)).toEqual({ likes: 0, received: 0, rows: 0 });
  });

  it('concurrent likes by many members count exactly once each (T-23 concurrency)', async () => {
    const author = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const fans = await Promise.all(Array.from({ length: 8 }, () => makeProfile(db)));
    await Promise.all(fans.flatMap((f) => [likes.setLike(f.viewer, s.id, true), likes.setLike(f.viewer, s.id, true)]));
    expect(await counts(s.id, author.profileId)).toEqual({ likes: 8, received: 8, rows: 8 });
  });

  it('authorization and eligibility errors', async () => {
    const author = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const hidden = await makeShot(db, { authorId: author.profileId, hidden: true });
    const draft = await makeShot(db, { authorId: author.profileId, status: 'draft' });
    const fan = await makeProfile(db);
    expect(await errorCode(() => likes.setLike(visitor, s.id, true))).toBe('UNAUTHENTICATED');
    expect(await errorCode(() => likes.setLike({ kind: 'pending', userId: 'x', name: 'x', email: 'x@example.test' }, s.id, true))).toBe('ONBOARDING_REQUIRED');
    expect(await errorCode(() => likes.setLike(author.viewer, s.id, true))).toBe('CANNOT_LIKE_OWN');
    expect(await errorCode(() => likes.setLike(fan.viewer, hidden.id, true))).toBe('NOT_FOUND');
    expect(await errorCode(() => likes.setLike(fan.viewer, draft.id, true))).toBe('NOT_FOUND');
    expect(await errorCode(() => likes.setLike(fan.viewer, 999_999, true))).toBe('NOT_FOUND');
  });

  it('RL-SOCIAL: the 61st like in a minute is rejected before any side effect (BR-76/77)', async () => {
    const author = await makeProfile(db);
    const fan = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    for (let i = 0; i < 60; i++) await likes.setLike(fan.viewer, s.id, i % 2 === 0);
    const code = await errorCode(() => likes.setLike(fan.viewer, s.id, true));
    expect(code).toBe('RATE_LIMITED');
    expect((await counts(s.id, author.profileId)).likes).toBe(0); // last accepted call was an unlike
  });

  it('likedAmong only reports for members', async () => {
    const author = await makeProfile(db);
    const fan = await makeProfile(db);
    const s1 = await makeShot(db, { authorId: author.profileId });
    const s2 = await makeShot(db, { authorId: author.profileId });
    await likes.setLike(fan.viewer, s1.id, true);
    expect([...(await likes.likedAmong(fan.viewer, [s1.id, s2.id]))]).toEqual([s1.id]);
    expect((await likes.likedAmong(visitor, [s1.id])).size).toBe(0);
  });
});

describe('views (D-10, BR-29…BR-31)', () => {
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0';
  it('counts once per viewer per UTC day; ignores bots, authors and ineligible shots', async () => {
    const author = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const hidden = await makeShot(db, { authorId: author.profileId, hidden: true });
    const now = Date.UTC(2026, 10, 13, 12);
    const rec = (o: Partial<Parameters<typeof views.record>[0]>) => views.record({ shotId: s.id, viewer: visitor, ip: '10.0.0.1', ua, now, ...o });
    expect(await rec({})).toBe('counted');
    expect(await rec({})).toBe('duplicate');
    expect(await rec({ ip: '10.0.0.2' })).toBe('counted');
    expect(await rec({ now: now + 24 * 3_600_000 })).toBe('counted'); // next UTC day
    expect(await rec({ ua: 'Googlebot/2.1' })).toBe('ignored');
    expect(await rec({ ua: null })).toBe('ignored');
    expect(await rec({ viewer: author.viewer })).toBe('ignored');
    expect(await rec({ shotId: hidden.id })).toBe('ignored');
    const [r] = await db.all<{ v: number; d: number }>(sql`SELECT views_count AS v, (SELECT SUM(views) FROM shot_view_daily WHERE shot_id = ${s.id}) AS d FROM shots WHERE id = ${s.id}`);
    expect([Number(r!.v), Number(r!.d)]).toEqual([3, 3]);
  });

  it('anonymous viewer keys are HMACs (no raw IP) and rotate daily', () => {
    const k1 = views.viewerKey(visitor, '1.2.3.4', ua, '2026-11-13');
    const k2 = views.viewerKey(visitor, '1.2.3.4', ua, '2026-11-14');
    expect(k1).not.toContain('1.2.3.4');
    expect(k1).not.toBe(k2);
  });

  it('cleanup purges dedup keys older than 48 h; reconcile repairs drifted counters (BR-27, BR-79)', async () => {
    const author = await makeProfile(db);
    const fan = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const old = Date.now() - 72 * 3_600_000;
    await views.record({ shotId: s.id, viewer: visitor, ip: '1.1.1.1', ua, now: old });
    await likes.setLike(fan.viewer, s.id, true);
    await db.run(sql`UPDATE shots SET likes_count = 40, views_count = 99 WHERE id = ${s.id}`);
    const cleaned = await platform.cleanup();
    expect(cleaned.viewKeys).toBe(1);
    const fixed = await platform.reconcileCounters();
    expect(fixed.likes).toBeGreaterThanOrEqual(1);
    const [r] = await db.all<{ l: number; v: number }>(sql`SELECT likes_count AS l, views_count AS v FROM shots WHERE id = ${s.id}`);
    expect([Number(r!.l), Number(r!.v)]).toEqual([1, 1]);
  });
});
