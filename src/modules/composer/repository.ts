import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { hexToLab } from '@/server/storage/image';

/**
 * Write side of shots (C-04, C-05; BR-64…BR-66). Writes `shots`, `content_blocks`, `shot_colors`,
 * `shot_tags` and `tags` (documented exception to table ownership: the composer is the shots module's write
 * half, kept in its own folder so the read modules that depend on `shots` do not form an import cycle).
 * Every save is one atomic batch; the FTS5 triggers keep the search index in step (ADR-001).
 */
export type BlockInput = { type: 'image'; mediaId: string; alt: string | null; isFullWidth: boolean } | { type: 'text'; text: string };

export type ShotFields = {
  title: string;
  slug: string;
  description: string | null;
  categoryId: number;
  teamId: number | null;
  commentsDisabled: boolean;
  searchTags: string;
  searchAuthor: string;
};

export async function countDrafts(authorId: number): Promise<number> {
  const db = await getDb();
  const r = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM shots WHERE author_id = ${authorId} AND status = 'draft' AND deleted_at IS NULL`);
  return Number(r[0]?.n ?? 0);
}

/** Creates or finds tags by slug (BR-40) and returns their ids in input order. */
export async function ensureTags(tags: { name: string; slug: string }[]): Promise<number[]> {
  if (tags.length === 0) return [];
  const db = await getDb();
  await db.batch(
    tags.map((t) => db.run(sql`INSERT INTO tags (name, slug, shots_count) VALUES (${t.name}, ${t.slug}, 0) ON CONFLICT DO NOTHING`)) as [
      ReturnType<typeof db.run>,
      ...ReturnType<typeof db.run>[],
    ],
  );
  const rows = await db.all<{ id: number; slug: string }>(
    sql`SELECT id, slug FROM tags WHERE slug IN (${sql.join(tags.map((t) => sql`${t.slug}`), sql`, `)})`,
  );
  const bySlug = new Map(rows.map((r) => [r.slug, Number(r.id)]));
  return tags.map((t) => bySlug.get(t.slug)!).filter((x) => x !== undefined);
}

/** Media ids already used by a different shot (a block image belongs to one shot). */
export async function mediaUsedElsewhere(mediaIds: string[], shotId: number | null): Promise<string[]> {
  if (mediaIds.length === 0) return [];
  const db = await getDb();
  const rows = await db.all<{ id: string }>(sql`SELECT DISTINCT media_id AS id FROM content_blocks
    WHERE media_id IN (${sql.join(mediaIds.map((m) => sql`${m}`), sql`, `)}) AND shot_id <> ${shotId ?? -1}`);
  return rows.map((r) => r.id);
}

function blockStatements(db: Awaited<ReturnType<typeof getDb>>, shotId: number | SQLRef, blocks: BlockInput[]) {
  const sid = typeof shotId === 'number' ? sql`${shotId}` : shotId.expr;
  return blocks.map((b, i) =>
    b.type === 'image'
      ? db.run(sql`INSERT INTO content_blocks (shot_id, position, type, media_id, alt, is_full_width) VALUES (${sid}, ${i}, 'image', ${b.mediaId}, ${b.alt}, ${b.isFullWidth ? 1 : 0})`)
      : db.run(sql`INSERT INTO content_blocks (shot_id, position, type, text_body, is_full_width) VALUES (${sid}, ${i}, 'text', ${b.text}, 0)`),
  );
}
type SQLRef = { expr: ReturnType<typeof sql> };

/** Inserts a draft with its blocks and tags in one batch. Returns the new id. */
export async function insertDraft(authorId: number, f: ShotFields, blocks: BlockInput[], tagIds: number[], coverMediaId: string | null, now: number): Promise<number> {
  const db = await getDb();
  const last = { expr: sql`(SELECT MAX(id) FROM shots WHERE author_id = ${authorId} AND created_at = ${now})` };
  const results = await db.batch([
    db.all<{ id: number }>(sql`INSERT INTO shots (author_id, team_id, title, slug, description, category_id, cover_media_id, status,
        comments_disabled, search_tags, search_author, created_at, updated_at)
      VALUES (${authorId}, ${f.teamId}, ${f.title}, ${f.slug}, ${f.description}, ${f.categoryId}, ${coverMediaId}, 'draft',
        ${f.commentsDisabled ? 1 : 0}, ${f.searchTags}, ${f.searchAuthor}, ${now}, ${now}) RETURNING id`),
    ...blockStatements(db, last, blocks),
    ...tagIds.map((t) => db.run(sql`INSERT INTO shot_tags (shot_id, tag_id) VALUES (${last.expr}, ${t}) ON CONFLICT DO NOTHING`)),
  ] as unknown as Parameters<typeof db.batch>[0]);
  return Number((results[0] as { id: number }[])[0]!.id);
}

/** Replaces the editable fields, blocks and tags of a shot in one batch (FR-63). */
export async function updateShot(id: number, f: Partial<ShotFields>, blocks: BlockInput[] | null, tagIds: number[] | null, coverMediaId: string | null | undefined, now: number) {
  const db = await getDb();
  const sets = [sql`updated_at = ${now}`];
  if (f.title !== undefined) sets.push(sql`title = ${f.title}`);
  if (f.slug !== undefined) sets.push(sql`slug = ${f.slug}`);
  if (f.description !== undefined) sets.push(sql`description = ${f.description}`);
  if (f.categoryId !== undefined) sets.push(sql`category_id = ${f.categoryId}`);
  if (f.teamId !== undefined) sets.push(sql`team_id = ${f.teamId}`);
  if (f.commentsDisabled !== undefined) sets.push(sql`comments_disabled = ${f.commentsDisabled ? 1 : 0}`);
  if (f.searchTags !== undefined) sets.push(sql`search_tags = ${f.searchTags}`);
  if (f.searchAuthor !== undefined) sets.push(sql`search_author = ${f.searchAuthor}`);
  if (coverMediaId !== undefined) sets.push(sql`cover_media_id = ${coverMediaId}`);
  const stmts: unknown[] = [db.run(sql`UPDATE shots SET ${sql.join(sets, sql`, `)} WHERE id = ${id}`)];
  if (blocks) {
    stmts.push(db.run(sql`DELETE FROM content_blocks WHERE shot_id = ${id}`), ...blockStatements(db, id, blocks));
  }
  if (tagIds) {
    stmts.push(db.run(sql`DELETE FROM shot_tags WHERE shot_id = ${id}`));
    for (const t of tagIds) stmts.push(db.run(sql`INSERT INTO shot_tags (shot_id, tag_id) VALUES (${id}, ${t}) ON CONFLICT DO NOTHING`));
  }
  await db.batch(stmts as unknown as Parameters<typeof db.batch>[0]);
}

export async function findOwned(id: number) {
  const db = await getDb();
  const rows = await db.all<{
    id: number; authorId: number; teamId: number | null; title: string; slug: string; description: string | null; categoryId: number;
    status: 'draft' | 'published'; publishedAt: number | null; commentsDisabled: number; coverMediaId: string | null; deletedAt: number | null; updatedAt: number;
  }>(sql`SELECT id, author_id AS authorId, team_id AS teamId, title, slug, description, category_id AS categoryId, status,
      published_at AS publishedAt, comments_disabled AS commentsDisabled, cover_media_id AS coverMediaId, deleted_at AS deletedAt, updated_at AS updatedAt
    FROM shots WHERE id = ${id}`);
  return rows[0] ?? null;
}

export async function blocksOf(id: number) {
  const db = await getDb();
  return db.all<{ type: 'image' | 'text'; mediaId: string | null; alt: string | null; isFullWidth: number; textBody: string | null; key: string | null; width: number | null; height: number | null; color: string | null }>(sql`
    SELECT b.type AS type, b.media_id AS mediaId, b.alt AS alt, b.is_full_width AS isFullWidth, b.text_body AS textBody,
           m.storage_key AS key, m.width AS width, m.height AS height, m.dominant_color AS color
    FROM content_blocks b LEFT JOIN media m ON m.id = b.media_id WHERE b.shot_id = ${id} ORDER BY b.position`);
}

export async function tagNamesOf(id: number) {
  const db = await getDb();
  const rows = await db.all<{ name: string }>(sql`SELECT t.name AS name FROM shot_tags st JOIN tags t ON t.id = st.tag_id WHERE st.shot_id = ${id} ORDER BY t.name`);
  return rows.map((r) => r.name);
}

export async function tagIdsOf(id: number): Promise<number[]> {
  const db = await getDb();
  return (await db.all<{ id: number }>(sql`SELECT tag_id AS id FROM shot_tags WHERE shot_id = ${id}`)).map((r) => Number(r.id));
}

/** BR-41 tag counts: recount the given tags from eligible-ish source rows (published, not deleted/hidden). */
export async function recountTags(tagIds: number[]) {
  if (tagIds.length === 0) return;
  const db = await getDb();
  await db.run(sql`UPDATE tags SET shots_count = (SELECT COUNT(*) FROM shot_tags st JOIN shots s ON s.id = st.shot_id
      WHERE st.tag_id = tags.id AND s.status = 'published' AND s.deleted_at IS NULL AND s.hidden_at IS NULL)
    WHERE id IN (${sql.join(tagIds.map((t) => sql`${t}`), sql`, `)})`);
}

/**
 * BR-65 publish: status + published_at once, palette from the cover (with Lab, BR-80), initial popularity,
 * `shots_count` on the author and team — one batch. Returns false if it was already published.
 */
export async function publish(id: number, authorId: number, teamId: number | null, palette: string[], score: number, now: number): Promise<boolean> {
  const db = await getDb();
  const [res] = await db.batch([
    db.run(sql`UPDATE shots SET status = 'published', published_at = ${now}, popularity_score = ${score}, updated_at = ${now}
      WHERE id = ${id} AND status = 'draft'`),
    db.run(sql`UPDATE profiles SET shots_count = shots_count + 1 WHERE id IN (${authorId}, ${teamId ?? -1}) AND changes() = 1`),
    db.run(sql`DELETE FROM shot_colors WHERE shot_id = ${id}`),
    ...palette.slice(0, 7).map((h, i) => {
      const lab = hexToLab(h);
      return db.run(sql`INSERT INTO shot_colors (shot_id, position, hex, lab_l, lab_a, lab_b) VALUES (${id}, ${i}, ${h}, ${lab.l}, ${lab.a}, ${lab.b})`);
    }),
  ] as unknown as Parameters<typeof db.batch>[0]);
  return (res as { rowsAffected: number }).rowsAffected === 1;
}

/** Palette refresh when the cover of a published shot changes. */
export async function setPalette(id: number, palette: string[]) {
  const db = await getDb();
  await db.batch([
    db.run(sql`DELETE FROM shot_colors WHERE shot_id = ${id}`),
    ...palette.slice(0, 7).map((h, i) => {
      const lab = hexToLab(h);
      return db.run(sql`INSERT INTO shot_colors (shot_id, position, hex, lab_l, lab_a, lab_b) VALUES (${id}, ${i}, ${h}, ${lab.l}, ${lab.a}, ${lab.b})`);
    }),
  ] as unknown as Parameters<typeof db.batch>[0]);
}

/** BR-65 soft delete: 404 at once; profile counters drop if it was published. */
export async function softDelete(id: number, authorId: number, teamId: number | null, wasPublished: boolean, now: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE shots SET deleted_at = ${now}, updated_at = ${now} WHERE id = ${id} AND deleted_at IS NULL`),
    db.run(sql`UPDATE profiles SET shots_count = MAX(shots_count - 1, 0)
      WHERE id IN (${authorId}, ${teamId ?? -1}) AND changes() = 1 AND ${wasPublished ? 1 : 0} = 1`),
  ]);
}

/** BR-65 purge after 30 days: rows go (blocks, colours, tags cascade); returns media to delete from storage. */
export async function deletedBefore(before: number, limit: number) {
  const db = await getDb();
  return db.all<{ id: number }>(sql`SELECT id FROM shots WHERE deleted_at IS NOT NULL AND deleted_at < ${before} LIMIT ${limit}`);
}

export async function mediaOfShot(id: number) {
  const db = await getDb();
  return db.all<{ id: string }>(sql`SELECT DISTINCT media_id AS id FROM content_blocks WHERE shot_id = ${id} AND media_id IS NOT NULL
    UNION SELECT cover_media_id AS id FROM shots WHERE id = ${id} AND cover_media_id IS NOT NULL`);
}

export async function hardDelete(id: number, mediaIds: string[]) {
  const db = await getDb();
  await db.batch([
    db.run(sql`DELETE FROM shots WHERE id = ${id}`),
    ...mediaIds.map((m) => db.run(sql`DELETE FROM media WHERE id = ${m} AND purpose <> 'seed'`)),
  ] as unknown as Parameters<typeof db.batch>[0]);
}

/** The member's own shots by status (drafts list, FR-64), newest update first. */
export async function listOwn(authorId: number, status: 'draft' | 'published', after: (string | number)[] | null, limit: number) {
  const db = await getDb();
  const cur = after && after.length === 2 ? sql`AND (s.updated_at, s.id) < (${after[0]}, ${after[1]})` : sql``;
  return db.all<{ id: number; title: string; slug: string; status: 'draft' | 'published'; updatedAt: number; key: string | null; width: number | null; height: number | null; color: string | null }>(sql`
    SELECT s.id AS id, s.title AS title, s.slug AS slug, s.status AS status, s.updated_at AS updatedAt,
           m.storage_key AS key, m.width AS width, m.height AS height, m.dominant_color AS color
    FROM shots s LEFT JOIN media m ON m.id = s.cover_media_id
    WHERE s.author_id = ${authorId} AND s.status = ${status} AND s.deleted_at IS NULL ${cur}
    ORDER BY s.updated_at DESC, s.id DESC LIMIT ${limit}`);
}
