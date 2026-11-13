import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { likes } from '@/server/db/schema';
import { eligibleShotSql, SHOT_OWNER_JOINS } from '@/server/db/eligibility';

/**
 * Like rows + their counter caches in ONE atomic batch (BR-26, F-03/F-13, BACKEND_ARCHITECTURE §5.2).
 * Idempotency is in SQL: the insert/delete is a no-op on repeat, and each following counter statement runs
 * only when the previous statement changed exactly one row (`changes() = 1`), so counters never drift on
 * double clicks or retries. The two counter statements (shots.likes_count, profiles.likes_received_count)
 * are the documented cross-module statement-builder exception (BACKEND_ARCHITECTURE §2.2 rule 2).
 */
export async function setLike(profileId: number, shotId: number, authorId: number, liked: boolean, now: number) {
  const db = await getDb();
  const rows = liked
    ? await db.batch([
        db.run(sql`INSERT INTO likes (profile_id, shot_id, created_at) VALUES (${profileId}, ${shotId}, ${now}) ON CONFLICT DO NOTHING`),
        db.run(sql`UPDATE shots SET likes_count = likes_count + 1 WHERE id = ${shotId} AND changes() = 1`),
        db.run(sql`UPDATE profiles SET likes_received_count = likes_received_count + 1 WHERE id = ${authorId} AND changes() = 1`),
        db.all<{ n: number }>(sql`SELECT likes_count AS n FROM shots WHERE id = ${shotId}`),
      ])
    : await db.batch([
        db.run(sql`DELETE FROM likes WHERE profile_id = ${profileId} AND shot_id = ${shotId}`),
        db.run(sql`UPDATE shots SET likes_count = likes_count - 1 WHERE id = ${shotId} AND changes() = 1 AND likes_count > 0`),
        db.run(
          sql`UPDATE profiles SET likes_received_count = likes_received_count - 1 WHERE id = ${authorId} AND changes() = 1 AND likes_received_count > 0`,
        ),
        db.all<{ n: number }>(sql`SELECT likes_count AS n FROM shots WHERE id = ${shotId}`),
      ]);
  const countRows = rows[3] as { n: number }[];
  return Number(countRows[0]?.n ?? 0);
}

export async function likedAmong(profileId: number, shotIds: number[]): Promise<Set<number>> {
  if (shotIds.length === 0) return new Set();
  const db = await getDb();
  const rows = await db
    .select({ shotId: likes.shotId })
    .from(likes)
    .where(and(eq(likes.profileId, profileId), inArray(likes.shotId, shotIds)));
  return new Set(rows.map((r) => r.shotId));
}

/** BR-27: recompute shots.likes_count and profiles.likes_received_count from the likes table. */
export async function reconcile(): Promise<number> {
  const db = await getDb();
  const perShot = sql`(SELECT COUNT(*) FROM likes l WHERE l.shot_id = shots.id)`;
  const perAuthor = sql`(SELECT COUNT(*) FROM likes l JOIN shots s ON s.id = l.shot_id WHERE s.author_id = profiles.id)`;
  const [a, b] = await db.batch([
    db.run(sql`UPDATE shots SET likes_count = ${perShot} WHERE likes_count <> ${perShot}`),
    db.run(sql`UPDATE profiles SET likes_received_count = ${perAuthor} WHERE likes_received_count <> ${perAuthor}`),
  ]);
  return a.rowsAffected + b.rowsAffected;
}

/** FR-57 Liked Shots tab: eligible shots the profile liked, newest like first (keyset on like time, shot id). */
export async function pageLikedIds(profileId: number, now: number, after: (string | number)[] | null, limit: number) {
  const db = await getDb();
  const cur = after && after.length === 2 ? sql`AND (l.created_at, l.shot_id) < (${after[0]}, ${after[1]})` : sql``;
  const rows = await db.all<{ id: number; at: number }>(sql`
    SELECT l.shot_id AS id, l.created_at AS at
    FROM likes l JOIN shots s ON s.id = l.shot_id ${SHOT_OWNER_JOINS}
    WHERE l.profile_id = ${profileId} AND ${eligibleShotSql(now)} ${cur}
    ORDER BY l.created_at DESC, l.shot_id DESC LIMIT ${limit}`);
  return rows.map((r) => ({ id: Number(r.id), at: Number(r.at) }));
}

/** BR-24: an account's likes are removed with counter updates on each shot and author. */
export async function removeAllBy(profileId: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE shots SET likes_count = MAX(likes_count - 1, 0) WHERE id IN (SELECT shot_id FROM likes WHERE profile_id = ${profileId})`),
    db.run(sql`UPDATE profiles SET likes_received_count = MAX(likes_received_count - (
        SELECT COUNT(*) FROM likes l JOIN shots s ON s.id = l.shot_id WHERE l.profile_id = ${profileId} AND s.author_id = profiles.id), 0)
      WHERE id IN (SELECT s.author_id FROM likes l JOIN shots s ON s.id = l.shot_id WHERE l.profile_id = ${profileId})`),
    db.run(sql`DELETE FROM likes WHERE profile_id = ${profileId}`),
  ]);
}

/** BR-65: a deleted shot's likes are removed and its author's likes_received_count decremented. */
export async function removeAllOnShot(shotId: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE profiles SET likes_received_count = MAX(likes_received_count - (SELECT COUNT(*) FROM likes WHERE shot_id = ${shotId}), 0)
      WHERE id = (SELECT author_id FROM shots WHERE id = ${shotId})`),
    db.run(sql`DELETE FROM likes WHERE shot_id = ${shotId}`),
    db.run(sql`UPDATE shots SET likes_count = 0 WHERE id = ${shotId}`),
  ]);
}
