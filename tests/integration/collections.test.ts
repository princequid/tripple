import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as collections from '@/modules/collections/service';
import * as likes from '@/modules/likes/service';
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

const saves = async (shotId: number) => Number((await db.all<{ n: number }>(sql`SELECT saves_count AS n FROM shots WHERE id = ${shotId}`))[0]!.n);

describe('collections (S-02, FR-46, BR-53…BR-55)', () => {
  it('create validates, trims and enforces case-insensitive unique names (409)', async () => {
    const ann = await makeProfile(db);
    const c = await collections.create(ann.viewer, { name: '  Mobile UI  ', description: ' Nice ', isPrivate: false });
    expect(c).toMatchObject({ name: 'Mobile UI', slug: 'mobile-ui', description: 'Nice', isPrivate: false, shotsCount: 0, designersCount: 0, covers: [] });
    expect(await errorCode(() => collections.create(ann.viewer, { name: 'mobile ui', isPrivate: false }))).toBe('CONFLICT');
    expect(await errorCode(() => collections.create(ann.viewer, { name: '   ', isPrivate: false }))).toBe('VALIDATION');
    expect(await errorCode(() => collections.create(ann.viewer, { name: 'x'.repeat(61), isPrivate: false }))).toBe('VALIDATION');
    expect(await errorCode(() => collections.create(visitor, { name: 'A', isPrivate: false }))).toBe('UNAUTHENTICATED');
    const bob = await makeProfile(db);
    expect((await collections.create(bob.viewer, { name: 'Mobile UI', isPrivate: false })).name).toBe('Mobile UI');
  });

  it('at most 100 collections per owner (BR-53)', async () => {
    const ann = await makeProfile(db);
    const now = Date.now();
    for (let i = 0; i < 100; i++) {
      const n = 'c' + i;
      await db.run(sql`INSERT INTO collections (owner_id, name, name_key, created_at, updated_at) VALUES (${ann.profileId}, ${n}, ${n}, ${now}, ${now})`);
    }
    expect(await errorCode(() => collections.create(ann.viewer, { name: 'one more', isPrivate: false }))).toBe('QUOTA_EXCEEDED');
  });

  it('save/unsave is set semantics with atomic counters; ineligible shots cannot be saved (BR-55)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const hidden = await makeShot(db, { authorId: author.profileId, hidden: true });
    const c1 = await collections.create(ann.viewer, { name: 'One', isPrivate: false });
    const c2 = await collections.create(ann.viewer, { name: 'Two', isPrivate: true });
    expect(await collections.setSaved(ann.viewer, c1.id, s.id, true)).toEqual({ collectionId: c1.id, saved: true, savesCount: 1, collectionShotsCount: 1 });
    expect(await collections.setSaved(ann.viewer, c1.id, s.id, true)).toMatchObject({ saved: true, savesCount: 1, collectionShotsCount: 1 });
    await collections.setSaved(ann.viewer, c2.id, s.id, true);
    expect(await saves(s.id)).toBe(2); // private saves count too (BR-55)
    expect(await collections.picker(ann.viewer, s.id)).toEqual(
      expect.arrayContaining([
        { id: c1.id, name: 'One', isPrivate: false, contains: true, shotsCount: 1 },
        { id: c2.id, name: 'Two', isPrivate: true, contains: true, shotsCount: 1 },
      ]),
    );
    expect(await errorCode(() => collections.setSaved(ann.viewer, c1.id, hidden.id, true))).toBe('NOT_FOUND');
    const own = await collections.create(author.viewer, { name: 'Mine', isPrivate: false });
    expect((await collections.setSaved(author.viewer, own.id, s.id, true)).saved).toBe(true);
    // Someone else's public collection → 403; private → 404 (no disclosure).
    expect(await errorCode(() => collections.setSaved(author.viewer, c1.id, s.id, false))).toBe('FORBIDDEN');
    expect(await errorCode(() => collections.setSaved(author.viewer, c2.id, s.id, false))).toBe('NOT_FOUND');
    expect(await collections.setSaved(ann.viewer, c1.id, s.id, false)).toMatchObject({ saved: false, savesCount: 2, collectionShotsCount: 0 });
    await collections.remove(ann.viewer, c2.id);
    expect(await saves(s.id)).toBe(1);
  });

  it('a full collection refuses new shots (1,000, BR-53)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const c = await collections.create(ann.viewer, { name: 'Full', isPrivate: false });
    await db.run(sql`UPDATE collections SET shots_count = 1000 WHERE id = ${c.id}`);
    expect(await errorCode(() => collections.setSaved(ann.viewer, c.id, s.id, true))).toBe('QUOTA_EXCEEDED');
    expect(await saves(s.id)).toBe(0);
  });

  it('privacy: private collections are invisible to others and unlisted (BR-54)', async () => {
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    const pub = await collections.create(ann.viewer, { name: 'Public', isPrivate: false });
    const priv = await collections.create(ann.viewer, { name: 'Secret', isPrivate: true });
    expect((await collections.listForProfile(ann.username, visitor, {})).items.map((c) => c.name)).toEqual(['Public']);
    expect((await collections.listForProfile(ann.username, ann.viewer, {})).items.map((c) => c.name).sort()).toEqual(['Public', 'Secret']);
    expect(await errorCode(() => collections.detail(priv.id, bob.viewer))).toBe('NOT_FOUND');
    expect(await errorCode(() => collections.detail(priv.id, visitor))).toBe('NOT_FOUND');
    expect((await collections.detail(priv.id, ann.viewer)).isOwn).toBe(true);
    // A rename alone keeps the privacy setting (no default leaks into PATCH).
    await collections.update(ann.viewer, priv.id, { name: 'Secret 2' });
    expect(await errorCode(() => collections.detail(priv.id, visitor))).toBe('NOT_FOUND');
    await collections.update(ann.viewer, pub.id, { isPrivate: true });
    expect(await errorCode(() => collections.detail(pub.id, visitor))).toBe('NOT_FOUND');
  });

  it('detail shows eligible shots newest-save first with stats and covers (FR-56)', async () => {
    const a1 = await makeProfile(db);
    const a2 = await makeProfile(db);
    const ann = await makeProfile(db);
    const s1 = await makeShot(db, { authorId: a1.profileId });
    const s2 = await makeShot(db, { authorId: a2.profileId });
    const s3 = await makeShot(db, { authorId: a2.profileId });
    const c = await collections.create(ann.viewer, { name: 'Mix', isPrivate: false });
    for (const s of [s1, s2, s3]) await collections.setSaved(ann.viewer, c.id, s.id, true);
    await db.run(sql`UPDATE collection_items SET created_at = shot_id`);
    await db.run(sql`UPDATE shots SET hidden_at = 1 WHERE id = ${s2.id}`);
    const d = await collections.detail(c.id, visitor);
    expect(d.shots.map((x) => x.id)).toEqual([s3.id, s1.id]);
    expect(d).toMatchObject({ shotsCount: 2, designersCount: 2, isOwn: false, shotsNextCursor: null });
    expect(d.covers).toHaveLength(2);
    const p1 = await collections.shotsPage(c.id, visitor, { limit: 1 });
    expect(p1.items.map((x) => x.id)).toEqual([s3.id]);
    const p2 = await collections.shotsPage(c.id, visitor, { limit: 1, cursor: p1.nextCursor });
    expect(p2.items.map((x) => x.id)).toEqual([s1.id]);
    expect(p2.nextCursor).toBeNull();
  });

  it('reconcile repairs drifted save counters (BR-27)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const c = await collections.create(ann.viewer, { name: 'R', isPrivate: false });
    await collections.setSaved(ann.viewer, c.id, s.id, true);
    await db.run(sql`UPDATE shots SET saves_count = 5 WHERE id = ${s.id}`);
    await db.run(sql`UPDATE collections SET shots_count = 7 WHERE id = ${c.id}`);
    expect(await collections.reconcile()).toBe(2);
    expect(await saves(s.id)).toBe(1);
  });
});

describe('Liked Shots tab (P-04, FR-57)', () => {
  it('owner only, newest like first, eligible only; others get 404', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s1 = await makeShot(db, { authorId: author.profileId });
    const s2 = await makeShot(db, { authorId: author.profileId });
    await likes.setLike(ann.viewer, s1.id, true);
    await likes.setLike(ann.viewer, s2.id, true);
    await db.run(sql`UPDATE likes SET created_at = shot_id WHERE profile_id = ${ann.profileId}`);
    expect((await likes.likedShots(ann.viewer, ann.username, {})).items.map((x) => x.id)).toEqual([s2.id, s1.id]);
    await db.run(sql`UPDATE shots SET deleted_at = 1 WHERE id = ${s2.id}`);
    expect((await likes.likedShots(ann.viewer, ann.username, {})).items.map((x) => x.id)).toEqual([s1.id]);
    expect(await errorCode(() => likes.likedShots(author.viewer, ann.username, {}))).toBe('NOT_FOUND');
    expect(await errorCode(() => likes.likedShots(visitor, ann.username, {}))).toBe('NOT_FOUND');
  });
});
