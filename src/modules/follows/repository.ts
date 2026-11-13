import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { follows } from '@/server/db/schema';

/**
 * Follow rows + both counter caches in ONE atomic batch (BR-26). Same `changes() = 1` chaining as likes:
 * each counter statement runs only if the previous statement changed a row, so repeats never drift.
 * The two counter statements on `profiles` are the documented statement-builder exception
 * (BACKEND_ARCHITECTURE §2.2 rule 2).
 */
export async function setFollow(followerId: number, followeeId: number, on: boolean, now: number) {
  const db = await getDb();
  const rows = on
    ? await db.batch([
        db.run(sql`INSERT INTO follows (follower_id, followee_id, created_at) VALUES (${followerId}, ${followeeId}, ${now}) ON CONFLICT DO NOTHING`),
        db.run(sql`UPDATE profiles SET followers_count = followers_count + 1 WHERE id = ${followeeId} AND changes() = 1`),
        db.run(sql`UPDATE profiles SET following_count = following_count + 1 WHERE id = ${followerId} AND changes() = 1`),
        db.all<{ n: number }>(sql`SELECT followers_count AS n FROM profiles WHERE id = ${followeeId}`),
      ])
    : await db.batch([
        db.run(sql`DELETE FROM follows WHERE follower_id = ${followerId} AND followee_id = ${followeeId}`),
        db.run(sql`UPDATE profiles SET followers_count = followers_count - 1 WHERE id = ${followeeId} AND changes() = 1 AND followers_count > 0`),
        db.run(sql`UPDATE profiles SET following_count = following_count - 1 WHERE id = ${followerId} AND changes() = 1 AND following_count > 0`),
        db.all<{ n: number }>(sql`SELECT followers_count AS n FROM profiles WHERE id = ${followeeId}`),
      ]);
  return Number((rows[3] as { n: number }[])[0]?.n ?? 0);
}

export async function followingAmong(followerId: number, ids: number[]): Promise<Set<number>> {
  if (ids.length === 0) return new Set();
  const db = await getDb();
  const rows = await db
    .select({ id: follows.followeeId })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), inArray(follows.followeeId, ids)));
  return new Set(rows.map((r) => r.id));
}

export type PersonRow = {
  id: number;
  username: string;
  displayName: string;
  kind: 'individual' | 'team';
  avatarKey: string | null;
  isFeaturedStudio: boolean;
  headline: string | null;
  location: string | null;
  followersCount: number;
  followedAt: number;
};

/**
 * Followers (side = 'followers': people who follow `profileId`) or following (people `profileId` follows),
 * newest first (BR-56), keyset on (created_at, other id). Suspended and deleted people are left out (BR-25).
 */
export async function listPeople(profileId: number, side: 'followers' | 'following', after: (string | number)[] | null, limit: number) {
  const db = await getDb();
  const otherCol = side === 'followers' ? sql`f.follower_id` : sql`f.followee_id`;
  const selfCol = side === 'followers' ? sql`f.followee_id` : sql`f.follower_id`;
  const cursor = after && after.length === 2 ? sql`AND (f.created_at, ${otherCol}) < (${after[0]}, ${after[1]})` : sql``;
  const rows = await db.all<{
    id: number; username: string; display_name: string; kind: 'individual' | 'team'; avatar_key: string | null;
    featured: number; headline: string | null; location: string | null; followers: number; followed_at: number;
  }>(sql`
    SELECT p.id AS id, p.username AS username, p.display_name AS display_name, p.kind AS kind,
           m.storage_key AS avatar_key, p.is_featured_studio AS featured, p.headline AS headline,
           p.location AS location, p.followers_count AS followers, f.created_at AS followed_at
    FROM follows f
    JOIN profiles p ON p.id = ${otherCol}
    LEFT JOIN media m ON m.id = p.avatar_media_id
    WHERE ${selfCol} = ${profileId} AND p.suspended_at IS NULL AND p.deleted_at IS NULL ${cursor}
    ORDER BY f.created_at DESC, ${otherCol} DESC
    LIMIT ${limit}`);
  return rows.map(
    (r): PersonRow => ({
      id: Number(r.id),
      username: r.username,
      displayName: r.display_name,
      kind: r.kind,
      avatarKey: r.avatar_key,
      isFeaturedStudio: Boolean(r.featured),
      headline: r.headline,
      location: r.location,
      followersCount: Number(r.followers),
      followedAt: Number(r.followed_at),
    }),
  );
}

/** BR-24/BR-27: remove every follow edge of a profile (account deletion) with counter updates. */
export async function removeAllFor(profileId: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE profiles SET followers_count = MAX(followers_count - 1, 0)
      WHERE id IN (SELECT followee_id FROM follows WHERE follower_id = ${profileId})`),
    db.run(sql`UPDATE profiles SET following_count = MAX(following_count - 1, 0)
      WHERE id IN (SELECT follower_id FROM follows WHERE followee_id = ${profileId})`),
    db.run(sql`DELETE FROM follows WHERE follower_id = ${profileId} OR followee_id = ${profileId}`),
    db.run(sql`UPDATE profiles SET followers_count = 0, following_count = 0 WHERE id = ${profileId}`),
  ]);
}

/** BR-27 nightly reconciliation of followers_count / following_count. */
export async function reconcile(): Promise<number> {
  const db = await getDb();
  const fers = sql`(SELECT COUNT(*) FROM follows f WHERE f.followee_id = profiles.id)`;
  const fing = sql`(SELECT COUNT(*) FROM follows f WHERE f.follower_id = profiles.id)`;
  const [a, b] = await db.batch([
    db.run(sql`UPDATE profiles SET followers_count = ${fers} WHERE followers_count <> ${fers}`),
    db.run(sql`UPDATE profiles SET following_count = ${fing} WHERE following_count <> ${fing}`),
  ]);
  return a.rowsAffected + b.rowsAffected;
}
