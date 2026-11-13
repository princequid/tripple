import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as follows from '@/modules/follows/service';
import * as users from '@/modules/users/service';
import { resetLimitsForTests } from '@/server/rate-limit';
import { setupTestDb, clearContent, makeProfile, visitor, errorCode } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});
beforeEach(async () => {
  await clearContent(db);
  await resetLimitsForTests();
});

const counters = async (id: number) => {
  const [r] = await db.all<{ a: number; b: number }>(sql`SELECT followers_count AS a, following_count AS b FROM profiles WHERE id = ${id}`);
  return { followers: Number(r!.a), following: Number(r!.b) };
};

describe('follows (S-03, FR-48, BR-56)', () => {
  it('set semantics with atomic counters on both profiles (BR-26)', async () => {
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    expect(await follows.setFollow(ann.viewer, bob.username, true)).toEqual({ following: true, followersCount: 1 });
    expect(await follows.setFollow(ann.viewer, bob.username, true)).toEqual({ following: true, followersCount: 1 });
    expect(await counters(bob.profileId)).toEqual({ followers: 1, following: 0 });
    expect(await counters(ann.profileId)).toEqual({ followers: 0, following: 1 });
    expect(await follows.setFollow(ann.viewer, bob.username, false)).toEqual({ following: false, followersCount: 0 });
    expect(await follows.setFollow(ann.viewer, bob.username, false)).toEqual({ following: false, followersCount: 0 });
    expect(await counters(ann.profileId)).toEqual({ followers: 0, following: 0 });
  });

  it('concurrent follows count once each', async () => {
    const star = await makeProfile(db);
    const fans = await Promise.all(Array.from({ length: 6 }, () => makeProfile(db)));
    await Promise.all(fans.flatMap((f) => [follows.setFollow(f.viewer, star.username, true), follows.setFollow(f.viewer, star.username, true)]));
    expect((await counters(star.profileId)).followers).toBe(6);
  });

  it('rules: self, visitors, pending, hidden and team targets', async () => {
    const ann = await makeProfile(db);
    const team = await makeProfile(db, { kind: 'team' });
    const gone = await makeProfile(db);
    await db.run(sql`UPDATE profiles SET suspended_at = ${Date.now()} WHERE id = ${gone.profileId}`);
    expect(await errorCode(() => follows.setFollow(ann.viewer, ann.username, true))).toBe('CANNOT_FOLLOW_SELF');
    expect(await errorCode(() => follows.setFollow(visitor, ann.username, true))).toBe('UNAUTHENTICATED');
    expect(await errorCode(() => follows.setFollow({ kind: 'pending', userId: 'x', name: 'x', email: 'x@example.test' }, ann.username, true))).toBe('ONBOARDING_REQUIRED');
    expect(await errorCode(() => follows.setFollow(ann.viewer, gone.username, true))).toBe('NOT_FOUND');
    expect(await errorCode(() => follows.setFollow(ann.viewer, 'nobody-here', true))).toBe('NOT_FOUND');
    // Members can follow teams (BR-56).
    expect((await follows.setFollow(ann.viewer, team.username, true)).following).toBe(true);
  });

  it('lists are public, newest first, paginated, and hide suspended people', async () => {
    const star = await makeProfile(db);
    const fans: Awaited<ReturnType<typeof makeProfile>>[] = [];
    for (let i = 0; i < 5; i++) {
      const f = await makeProfile(db);
      await follows.setFollow(f.viewer, star.username, true);
      await db.run(sql`UPDATE follows SET created_at = ${1_000 + i} WHERE follower_id = ${f.profileId}`);
      fans.push(f);
    }
    await db.run(sql`UPDATE profiles SET suspended_at = ${Date.now()} WHERE id = ${fans[4]!.profileId}`);
    const p1 = await follows.listPeople(visitor, star.username, 'followers', { limit: 2 });
    expect(p1.items.map((x) => x.username)).toEqual([fans[3]!.username, fans[2]!.username]);
    expect(p1.items[0]!.isFollowing).toBeNull();
    const p2 = await follows.listPeople(visitor, star.username, 'followers', { limit: 2, cursor: p1.nextCursor });
    expect(p2.items.map((x) => x.username)).toEqual([fans[1]!.username, fans[0]!.username]);
    expect(p2.nextCursor).toBeNull();
    // The viewer sees whether they follow each row; their own row has isFollowing null and isOwn true.
    await follows.setFollow(fans[0]!.viewer, fans[1]!.username, true);
    const asFan = await follows.listPeople(fans[0]!.viewer, star.username, 'followers', { limit: 10 });
    expect(asFan.items.find((x) => x.id === fans[1]!.profileId)!.isFollowing).toBe(true);
    expect(asFan.items.find((x) => x.id === fans[0]!.profileId)).toMatchObject({ isFollowing: null, isOwn: true });
    const following = await follows.listPeople(visitor, fans[0]!.username, 'following', {});
    expect(following.items.map((x) => x.username).sort()).toEqual([fans[1]!.username, star.username].sort());
    // A cursor from another list is rejected.
    expect(await errorCode(() => follows.listPeople(visitor, fans[0]!.username, 'following', { cursor: p1.nextCursor }))).toBe('INVALID_CURSOR');
  });

  it('profile exposes follower stats and isFollowing (FR-48)', async () => {
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    await follows.setFollow(ann.viewer, bob.username, true);
    const asAnn = await users.getPublicProfile(bob.username, ann.viewer, follows.lookupFor(ann.viewer));
    expect(asAnn.stats).toMatchObject({ followers: 1, following: 0 });
    expect(asAnn.isFollowing).toBe(true);
    expect((await users.getPublicProfile(bob.username, bob.viewer, follows.lookupFor(bob.viewer))).isFollowing).toBeNull();
    expect((await users.getPublicProfile(bob.username, visitor, follows.lookupFor(visitor))).isFollowing).toBeNull();
  });

  it('reconcile repairs drifted counters (BR-27)', async () => {
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    await follows.setFollow(ann.viewer, bob.username, true);
    await db.run(sql`UPDATE profiles SET followers_count = 9 WHERE id = ${bob.profileId}`);
    expect(await follows.reconcile()).toBe(1);
    expect((await counters(bob.profileId)).followers).toBe(1);
  });
});
