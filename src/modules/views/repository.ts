import 'server-only';
import { lt, sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { viewDedup } from '@/server/db/schema';

/**
 * One atomic batch per view (BR-30, BR-31): the dedup insert is a no-op on repeat, and each following
 * statement runs only when the previous one changed a row (`changes()`), so a repeat view changes nothing.
 * `shots.views_count` is the documented cross-module counter-statement exception (BACKEND_ARCHITECTURE §2.2).
 * Returns true when the view was counted.
 */
export async function record(viewerKey: string, shotId: number, day: string, now: number): Promise<boolean> {
  const db = await getDb();
  const [ins] = await db.batch([
    db.run(
      sql`INSERT INTO view_dedup (viewer_key, shot_id, day, created_at) VALUES (${viewerKey}, ${shotId}, ${day}, ${now}) ON CONFLICT DO NOTHING`,
    ),
    db.run(
      sql`INSERT INTO shot_view_daily (shot_id, day, views) SELECT ${shotId}, ${day}, 1 WHERE changes() = 1
          ON CONFLICT(shot_id, day) DO UPDATE SET views = views + 1`,
    ),
    db.run(sql`UPDATE shots SET views_count = views_count + 1 WHERE id = ${shotId} AND changes() = 1`),
  ]);
  return ins.rowsAffected === 1;
}

/** BR-31 / BR-79: dedup keys are deleted after 48 h. */
export async function purgeDedup(before: number): Promise<number> {
  const db = await getDb();
  const res = await db.delete(viewDedup).where(lt(viewDedup.createdAt, new Date(before)));
  return res.rowsAffected;
}

/** BR-27: views_count = sum of the daily aggregate. Returns the number of corrected shots. */
export async function reconcile(): Promise<number> {
  const db = await getDb();
  const total = sql`COALESCE((SELECT SUM(d.views) FROM shot_view_daily d WHERE d.shot_id = shots.id), 0)`;
  const res = await db.run(sql`UPDATE shots SET views_count = ${total} WHERE views_count <> ${total}`);
  return res.rowsAffected;
}
