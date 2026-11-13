import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { tags } from '@/server/db/schema';

/**
 * Search and tag queries. Raw FTS5 SQL is allowed only here (ADR-001, BACKEND_ARCHITECTURE §5.4, lint L-08).
 * The MATCH expression always comes from lib/search-term `toFtsQuery`, which quotes every token, and is
 * bound as a parameter, never interpolated.
 */

/** BR-37 eligibility for raw queries over `shots s` joined to author `a` and optional team `t`. */
const eligibleRaw = (now: number) => sql`
  s.status = 'published' AND s.published_at <= ${now} AND s.hidden_at IS NULL AND s.deleted_at IS NULL
  AND a.suspended_at IS NULL AND a.deleted_at IS NULL
  AND (s.team_id IS NULL OR (t.suspended_at IS NULL AND t.deleted_at IS NULL))`;

const shotJoins = sql`JOIN profiles a ON a.id = s.author_id LEFT JOIN profiles t ON t.id = s.team_id`;

export type MatchRow = { id: number; rank: number; popularity: number };

/** BR-39: column weights title 3, description 1, tags 2, author 1 (FTS column order). bm25 is lower-is-better. */
export async function match(ftsQuery: string, now: number, limit: number): Promise<MatchRow[]> {
  const db = await getDb();
  const rows = await db.all<{ id: number; rank: number; popularity: number }>(sql`
    SELECT s.id AS id, bm25(shots_fts, 3.0, 1.0, 2.0, 1.0) AS rank, s.popularity_score AS popularity
    FROM shots_fts
    JOIN shots s ON s.id = shots_fts.rowid
    ${shotJoins}
    WHERE shots_fts MATCH ${ftsQuery} AND ${eligibleRaw(now)}
    ORDER BY rank
    LIMIT ${limit}`);
  return rows.map((r) => ({ id: Number(r.id), rank: Number(r.rank), popularity: Number(r.popularity) }));
}

/** Tags most frequent among the given shots (BR-39 "Related"). */
export async function tagsAmong(shotIds: number[], limit: number) {
  if (shotIds.length === 0) return [];
  const db = await getDb();
  return db.all<{ name: string; slug: string; n: number }>(sql`
    SELECT tg.name AS name, tg.slug AS slug, COUNT(*) AS n
    FROM shot_tags st JOIN tags tg ON tg.id = st.tag_id
    WHERE st.shot_id IN (${sql.join(shotIds.map((i) => sql`${i}`), sql`, `)})
    GROUP BY tg.id
    ORDER BY n DESC, tg.name ASC
    LIMIT ${limit}`);
}

/** Every tag with its eligible-shot count (BR-41); tags with none are left out. */
export async function eligibleTagCounts(now: number) {
  const db = await getDb();
  return db.all<{ name: string; slug: string; n: number }>(sql`
    SELECT tg.name AS name, tg.slug AS slug, COUNT(*) AS n
    FROM tags tg
    JOIN shot_tags st ON st.tag_id = tg.id
    JOIN shots s ON s.id = st.shot_id
    ${shotJoins}
    WHERE ${eligibleRaw(now)}
    GROUP BY tg.id
    ORDER BY n DESC, tg.name ASC`);
}

export async function findBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db.select({ id: tags.id, name: tags.name, slug: tags.slug }).from(tags).where(eq(tags.slug, slug)).limit(1);
  return row ?? null;
}

/** BR-27: tags.shots_count = number of shot_tags rows. */
export async function reconcileTagCounts(): Promise<number> {
  const db = await getDb();
  const total = sql`(SELECT COUNT(*) FROM shot_tags st WHERE st.tag_id = tags.id)`;
  const res = await db.run(sql`UPDATE tags SET shots_count = ${total} WHERE shots_count <> ${total}`);
  return res.rowsAffected;
}

const likePattern = (s: string, prefixOnly: boolean) => `${prefixOnly ? '' : '%'}${s.replace(/[%_\\]/g, '\\$&')}%`;

export type DesignerRow = {
  id: number; username: string; displayName: string; kind: 'individual' | 'team'; featured: number; avatarKey: string | null;
  headline: string | null; location: string | null; followers: number; shots: number;
};

/**
 * D-08 designer search: active profiles whose username or display name contains the term (a word or name
 * prefix ranks first), ordered by followers then shots; keyset on (rank, followers, shots, id).
 */
export async function designers(term: string, after: (string | number)[] | null, limit: number) {
  const db = await getDb();
  const contains = likePattern(term, false);
  const prefix = likePattern(term, true);
  const wordPrefix = `% ${term.replace(/[%_\\]/g, '\\$&')}%`;
  const rankExpr = sql`CASE WHEN p.username LIKE ${prefix} ESCAPE '\\' OR lower(p.display_name) LIKE ${prefix} ESCAPE '\\'
      OR lower(p.display_name) LIKE ${wordPrefix} ESCAPE '\\' THEN 1 ELSE 0 END`;
  const cur = after && after.length === 4 ? sql`AND (r, followers, shots, id) < (${after[0]}, ${after[1]}, ${after[2]}, ${after[3]})` : sql``;
  return db.all<DesignerRow & { r: number }>(sql`
    SELECT * FROM (
      SELECT p.id AS id, p.username AS username, p.display_name AS displayName, p.kind AS kind, p.is_featured_studio AS featured,
             m.storage_key AS avatarKey, p.headline AS headline, p.location AS location,
             p.followers_count AS followers, p.shots_count AS shots, ${rankExpr} AS r
      FROM profiles p LEFT JOIN media m ON m.id = p.avatar_media_id
      WHERE p.suspended_at IS NULL AND p.deleted_at IS NULL
        AND (p.username LIKE ${contains} ESCAPE '\\' OR lower(p.display_name) LIKE ${contains} ESCAPE '\\')
    ) WHERE 1 = 1 ${cur}
    ORDER BY r DESC, followers DESC, shots DESC, id DESC LIMIT ${limit}`);
}

/** FR-35 suggestions: tags with eligible shots and active profiles, by prefix. */
export async function suggest(prefix: string, limit: number) {
  const db = await getDb();
  const p = likePattern(prefix, true);
  const wordPrefix = `% ${prefix.replace(/[%_\\]/g, '\\$&')}%`;
  const [tagRows, people] = await db.batch([
    db.all<{ name: string; slug: string; n: number }>(sql`SELECT name, slug, shots_count AS n FROM tags
      WHERE shots_count > 0 AND (name LIKE ${p} ESCAPE '\\' OR name LIKE ${wordPrefix} ESCAPE '\\')
      ORDER BY shots_count DESC, name ASC LIMIT ${limit}`),
    db.all<{ id: number; username: string; displayName: string; kind: string; featured: number; avatarKey: string | null }>(sql`
      SELECT p.id AS id, p.username AS username, p.display_name AS displayName, p.kind AS kind, p.is_featured_studio AS featured, m.storage_key AS avatarKey
      FROM profiles p LEFT JOIN media m ON m.id = p.avatar_media_id
      WHERE p.suspended_at IS NULL AND p.deleted_at IS NULL
        AND (p.username LIKE ${p} ESCAPE '\\' OR lower(p.display_name) LIKE ${p} ESCAPE '\\' OR lower(p.display_name) LIKE ${wordPrefix} ESCAPE '\\')
      ORDER BY p.followers_count DESC, p.id DESC LIMIT ${limit}`),
  ]);
  return { tags: tagRows, people };
}
