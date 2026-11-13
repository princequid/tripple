import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';

/**
 * Feed read model over `shots` (BACKEND_ARCHITECTURE §3.1). Returns candidate IDs only; eligibility
 * (BR-37) and card shaping are applied by the shots service, so this module never duplicates them.
 */

/**
 * BR-43 "You might also like" candidates: shots sharing tags with `shotId`, ordered by shared-tag count,
 * then same category, then popularity. Over-fetches so ineligible rows can be dropped afterwards.
 */
export async function relatedCandidates(shotId: number, categoryId: number, exclude: number[], limit: number): Promise<number[]> {
  const db = await getDb();
  const excl = [shotId, ...exclude];
  const rows = await db.all<{ id: number }>(sql`
    SELECT s.id AS id
    FROM shot_tags mine
    JOIN shot_tags other ON other.tag_id = mine.tag_id
    JOIN shots s ON s.id = other.shot_id
    WHERE mine.shot_id = ${shotId}
      AND s.status = 'published' AND s.hidden_at IS NULL AND s.deleted_at IS NULL
      AND s.id NOT IN (${sql.join(excl.map((i) => sql`${i}`), sql`, `)})
    GROUP BY s.id
    ORDER BY COUNT(*) DESC, (s.category_id = ${categoryId}) DESC, s.popularity_score DESC, s.id DESC
    LIMIT ${limit}`);
  return rows.map((r) => Number(r.id));
}

export async function categoryIdOf(shotId: number): Promise<number | null> {
  const db = await getDb();
  const rows = await db.all<{ c: number }>(sql`SELECT category_id AS c FROM shots WHERE id = ${shotId}`);
  return rows[0] ? Number(rows[0].c) : null;
}
