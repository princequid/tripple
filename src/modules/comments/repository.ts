import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';

/**
 * Comments and comment likes (S-04, BR-48…BR-52). Owned tables: comments, comment_likes.
 * `shots.comments_count` counts **visible** comments (not deleted, not hidden), replies included (BR-50); it
 * is updated in the same batch as the comment row (documented statement-builder exception, BACKEND §2.2).
 */
export type CommentRow = {
  id: number;
  shotId: number;
  parentId: number | null;
  body: string;
  likesCount: number;
  editedAt: number | null;
  hiddenAt: number | null;
  deletedAt: number | null;
  createdAt: number;
  authorId: number;
  authorUsername: string;
  authorName: string;
  authorKind: 'individual' | 'team';
  authorFeatured: boolean;
  authorAvatarKey: string | null;
  authorGone: boolean;
};

const select = sql`
  SELECT c.id AS id, c.shot_id AS shotId, c.parent_id AS parentId, c.body AS body, c.likes_count AS likesCount,
         c.edited_at AS editedAt, c.hidden_at AS hiddenAt, c.deleted_at AS deletedAt, c.created_at AS createdAt,
         p.id AS authorId, p.username AS authorUsername, p.display_name AS authorName, p.kind AS authorKind,
         p.is_featured_studio AS authorFeatured, m.storage_key AS authorAvatarKey,
         (p.suspended_at IS NOT NULL OR p.deleted_at IS NOT NULL) AS authorGone
  FROM comments c JOIN profiles p ON p.id = c.author_id LEFT JOIN media m ON m.id = p.avatar_media_id`;

const map = (r: Record<string, unknown>): CommentRow => ({
  id: Number(r.id),
  shotId: Number(r.shotId),
  parentId: r.parentId == null ? null : Number(r.parentId),
  body: String(r.body ?? ''),
  likesCount: Number(r.likesCount),
  editedAt: r.editedAt == null ? null : Number(r.editedAt),
  hiddenAt: r.hiddenAt == null ? null : Number(r.hiddenAt),
  deletedAt: r.deletedAt == null ? null : Number(r.deletedAt),
  createdAt: Number(r.createdAt),
  authorId: Number(r.authorId),
  authorUsername: String(r.authorUsername),
  authorName: String(r.authorName),
  authorKind: r.authorKind as 'individual' | 'team',
  authorFeatured: Boolean(r.authorFeatured),
  authorAvatarKey: (r.authorAvatarKey as string | null) ?? null,
  authorGone: Boolean(r.authorGone),
});

export async function findById(id: number): Promise<CommentRow | null> {
  const db = await getDb();
  const rows = await db.all<Record<string, unknown>>(sql`${select} WHERE c.id = ${id} LIMIT 1`);
  return rows[0] ? map(rows[0]) : null;
}

/** Top-level comments, oldest first (BR-49), keyset on (created_at, id) ascending. */
export async function topLevel(shotId: number, after: (string | number)[] | null, limit: number) {
  const db = await getDb();
  const cur = after && after.length === 2 ? sql`AND (c.created_at, c.id) > (${after[0]}, ${after[1]})` : sql``;
  const rows = await db.all<Record<string, unknown>>(
    sql`${select} WHERE c.shot_id = ${shotId} AND c.parent_id IS NULL ${cur} ORDER BY c.created_at ASC, c.id ASC LIMIT ${limit}`,
  );
  return rows.map(map);
}

export async function repliesOf(parentIds: number[]) {
  if (parentIds.length === 0) return [];
  const db = await getDb();
  const rows = await db.all<Record<string, unknown>>(
    sql`${select} WHERE c.parent_id IN (${sql.join(parentIds.map((i) => sql`${i}`), sql`, `)}) ORDER BY c.created_at ASC, c.id ASC`,
  );
  return rows.map(map);
}

export async function likedAmong(profileId: number, ids: number[]): Promise<Set<number>> {
  if (ids.length === 0) return new Set();
  const db = await getDb();
  const rows = await db.all<{ id: number }>(
    sql`SELECT comment_id AS id FROM comment_likes WHERE profile_id = ${profileId} AND comment_id IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`,
  );
  return new Set(rows.map((r) => Number(r.id)));
}

/** Insert a visible comment and bump `shots.comments_count` in one batch. */
export async function insert(shotId: number, authorId: number, parentId: number | null, body: string, now: number): Promise<number> {
  const db = await getDb();
  const [ins] = await db.batch([
    db.all<{ id: number }>(sql`INSERT INTO comments (shot_id, author_id, parent_id, body, created_at)
      VALUES (${shotId}, ${authorId}, ${parentId}, ${body}, ${now}) RETURNING id`),
    db.run(sql`UPDATE shots SET comments_count = comments_count + 1 WHERE id = ${shotId}`),
  ]);
  return Number((ins as { id: number }[])[0]!.id);
}

export async function updateBody(id: number, body: string, now: number) {
  const db = await getDb();
  await db.run(sql`UPDATE comments SET body = ${body}, edited_at = ${now} WHERE id = ${id}`);
}

/** Does this top-level comment still have replies (any state)? */
export async function hasReplies(id: number): Promise<boolean> {
  const db = await getDb();
  const rows = await db.all<{ n: number }>(sql`SELECT EXISTS (SELECT 1 FROM comments WHERE parent_id = ${id}) AS n`);
  return Boolean(rows[0]?.n);
}

/**
 * BR-50 delete. A top-level comment with replies becomes a placeholder (body cleared, `deleted_at` set);
 * otherwise the row is removed. A removed reply also removes a placeholder parent left with no replies.
 * The visible count drops by one only if the comment was visible.
 */
export async function remove(c: CommentRow, keepPlaceholder: boolean, now: number) {
  const db = await getDb();
  const wasVisible = c.deletedAt === null && c.hiddenAt === null;
  const dec = wasVisible ? db.run(sql`UPDATE shots SET comments_count = MAX(comments_count - 1, 0) WHERE id = ${c.shotId}`) : db.run(sql`SELECT 1`);
  if (keepPlaceholder) {
    await db.batch([
      db.run(sql`UPDATE comments SET body = '', deleted_at = ${now}, likes_count = 0 WHERE id = ${c.id}`),
      db.run(sql`DELETE FROM comment_likes WHERE comment_id = ${c.id}`),
      dec,
    ]);
    return;
  }
  await db.batch([
    db.run(sql`DELETE FROM comments WHERE id = ${c.id}`),
    db.run(sql`DELETE FROM comments WHERE id = ${c.parentId ?? -1} AND deleted_at IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM comments r WHERE r.parent_id = ${c.parentId ?? -1})`),
    dec,
  ]);
}

export async function setLike(profileId: number, commentId: number, on: boolean, now: number): Promise<number> {
  const db = await getDb();
  const rows = on
    ? await db.batch([
        db.run(sql`INSERT INTO comment_likes (profile_id, comment_id, created_at) VALUES (${profileId}, ${commentId}, ${now}) ON CONFLICT DO NOTHING`),
        db.run(sql`UPDATE comments SET likes_count = likes_count + 1 WHERE id = ${commentId} AND changes() = 1`),
        db.all<{ n: number }>(sql`SELECT likes_count AS n FROM comments WHERE id = ${commentId}`),
      ])
    : await db.batch([
        db.run(sql`DELETE FROM comment_likes WHERE profile_id = ${profileId} AND comment_id = ${commentId}`),
        db.run(sql`UPDATE comments SET likes_count = likes_count - 1 WHERE id = ${commentId} AND changes() = 1 AND likes_count > 0`),
        db.all<{ n: number }>(sql`SELECT likes_count AS n FROM comments WHERE id = ${commentId}`),
      ]);
  return Number((rows[2] as { n: number }[])[0]?.n ?? 0);
}

/** BR-68 moderation hide/unhide; the visible count follows. */
export async function setHidden(id: number, hidden: boolean, now: number): Promise<boolean> {
  const db = await getDb();
  const [res] = await db.batch([
    db.run(sql`UPDATE comments SET hidden_at = ${hidden ? now : null} WHERE id = ${id} AND deleted_at IS NULL
      AND ((${hidden ? 1 : 0} = 1 AND hidden_at IS NULL) OR (${hidden ? 1 : 0} = 0 AND hidden_at IS NOT NULL))`),
    db.run(sql`UPDATE shots SET comments_count = MAX(comments_count ${hidden ? sql`- 1` : sql`+ 1`}, 0)
      WHERE id = (SELECT shot_id FROM comments WHERE id = ${id}) AND changes() = 1`),
  ]);
  if (res.rowsAffected > 0) return true;
  const exists = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM comments WHERE id = ${id}`);
  return Number(exists[0]?.n) > 0;
}

/** Count of visible comments for a shot (thread `total`). */
export async function visibleCount(shotId: number): Promise<number> {
  const db = await getDb();
  const rows = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM comments c JOIN profiles p ON p.id = c.author_id
    WHERE c.shot_id = ${shotId} AND c.deleted_at IS NULL AND c.hidden_at IS NULL AND p.suspended_at IS NULL AND p.deleted_at IS NULL`);
  return Number(rows[0]?.n ?? 0);
}

/** BR-24: account deletion removes the account's comments (placeholders where replies exist) and likes. */
export async function removeAllBy(profileId: number, now: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE comments SET likes_count = MAX(likes_count - 1, 0) WHERE id IN (SELECT comment_id FROM comment_likes WHERE profile_id = ${profileId})`),
    db.run(sql`DELETE FROM comment_likes WHERE profile_id = ${profileId}`),
    db.run(sql`UPDATE shots SET comments_count = MAX(comments_count - (SELECT COUNT(*) FROM comments c
        WHERE c.shot_id = shots.id AND c.author_id = ${profileId} AND c.deleted_at IS NULL AND c.hidden_at IS NULL), 0)
      WHERE id IN (SELECT shot_id FROM comments WHERE author_id = ${profileId})`),
    db.run(sql`UPDATE comments SET body = '', deleted_at = ${now}
      WHERE author_id = ${profileId} AND parent_id IS NULL AND EXISTS (SELECT 1 FROM comments r WHERE r.parent_id = comments.id AND r.author_id <> ${profileId})`),
    db.run(sql`DELETE FROM comments WHERE author_id = ${profileId} AND deleted_at IS NULL`),
    db.run(sql`DELETE FROM comments WHERE deleted_at IS NOT NULL AND parent_id IS NULL AND NOT EXISTS (SELECT 1 FROM comments r WHERE r.parent_id = comments.id)`),
  ]);
}

/** BR-27: comments_count = visible comments; comment likes_count = rows. */
export async function reconcile(): Promise<number> {
  const db = await getDb();
  const visible = sql`(SELECT COUNT(*) FROM comments c WHERE c.shot_id = shots.id AND c.deleted_at IS NULL AND c.hidden_at IS NULL)`;
  const cl = sql`(SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id = comments.id)`;
  const [a, b] = await db.batch([
    db.run(sql`UPDATE shots SET comments_count = ${visible} WHERE comments_count <> ${visible}`),
    db.run(sql`UPDATE comments SET likes_count = ${cl} WHERE likes_count <> ${cl}`),
  ]);
  return a.rowsAffected + b.rowsAffected;
}

/** BR-33 R2 popularity input: comments by people other than the author. */
export async function nonAuthorCounts(shotIds: number[]): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  if (shotIds.length === 0) return out;
  const db = await getDb();
  const rows = await db.all<{ id: number; n: number }>(sql`SELECT c.shot_id AS id, COUNT(*) AS n FROM comments c JOIN shots s ON s.id = c.shot_id
    WHERE c.shot_id IN (${sql.join(shotIds.map((i) => sql`${i}`), sql`, `)}) AND c.author_id <> s.author_id AND c.deleted_at IS NULL AND c.hidden_at IS NULL
    GROUP BY c.shot_id`);
  for (const r of rows) out.set(Number(r.id), Number(r.n));
  return out;
}

/** BR-65: a deleted shot's comments go with it (counter to 0). */
export async function removeAllOnShot(shotId: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`DELETE FROM comments WHERE shot_id = ${shotId}`),
    db.run(sql`UPDATE shots SET comments_count = 0 WHERE id = ${shotId}`),
  ]);
}
