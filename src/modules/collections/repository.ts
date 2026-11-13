import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { eligibleShotSql, SHOT_OWNER_JOINS } from '@/server/db/eligibility';

/**
 * Collections and their items (S-02, BR-53…BR-55). Owned tables: collections, collection_items.
 * Item writes update `collections.shots_count` and `shots.saves_count` in the same batch (BR-26), guarded by
 * `changes() = 1` like likes; `shots.saves_count` is the documented statement-builder exception.
 */
export const MAX_COLLECTIONS = 100;
export const MAX_ITEMS = 1_000;

export type CollectionRow = {
  id: number;
  ownerId: number;
  name: string;
  description: string | null;
  isPrivate: boolean;
  hiddenAt: number | null;
  rawCount: number;
  updatedAt: number;
  ownerUsername: string;
  ownerName: string;
  ownerKind: 'individual' | 'team';
  ownerFeatured: boolean;
  ownerAvatarKey: string | null;
  ownerSuspendedAt: number | null;
  ownerDeletedAt: number | null;
};

const collectionSelect = sql`
  SELECT c.id AS id, c.owner_id AS ownerId, c.name AS name, c.description AS description, c.is_private AS isPrivate,
         c.hidden_at AS hiddenAt, c.shots_count AS rawCount, c.updated_at AS updatedAt,
         o.username AS ownerUsername, o.display_name AS ownerName, o.kind AS ownerKind,
         o.is_featured_studio AS ownerFeatured, om.storage_key AS ownerAvatarKey,
         o.suspended_at AS ownerSuspendedAt, o.deleted_at AS ownerDeletedAt
  FROM collections c
  JOIN profiles o ON o.id = c.owner_id
  LEFT JOIN media om ON om.id = o.avatar_media_id`;

const mapRow = (r: Record<string, unknown>): CollectionRow => ({
  id: Number(r.id),
  ownerId: Number(r.ownerId),
  name: String(r.name),
  description: (r.description as string | null) ?? null,
  isPrivate: Boolean(r.isPrivate),
  hiddenAt: r.hiddenAt == null ? null : Number(r.hiddenAt),
  rawCount: Number(r.rawCount),
  updatedAt: Number(r.updatedAt),
  ownerUsername: String(r.ownerUsername),
  ownerName: String(r.ownerName),
  ownerKind: r.ownerKind as 'individual' | 'team',
  ownerFeatured: Boolean(r.ownerFeatured),
  ownerAvatarKey: (r.ownerAvatarKey as string | null) ?? null,
  ownerSuspendedAt: r.ownerSuspendedAt == null ? null : Number(r.ownerSuspendedAt),
  ownerDeletedAt: r.ownerDeletedAt == null ? null : Number(r.ownerDeletedAt),
});

export async function findById(id: number): Promise<CollectionRow | null> {
  const db = await getDb();
  const rows = await db.all<Record<string, unknown>>(sql`${collectionSelect} WHERE c.id = ${id} LIMIT 1`);
  return rows[0] ? mapRow(rows[0]) : null;
}

/** A profile's collections, most recently updated first. Private and hidden ones only when `includePrivate`. */
export async function listByOwner(ownerId: number, includePrivate: boolean, after: (string | number)[] | null, limit: number) {
  const db = await getDb();
  const vis = includePrivate ? sql`` : sql`AND c.is_private = 0 AND c.hidden_at IS NULL`;
  const cur = after && after.length === 2 ? sql`AND (c.updated_at, c.id) < (${after[0]}, ${after[1]})` : sql``;
  const rows = await db.all<Record<string, unknown>>(
    sql`${collectionSelect} WHERE c.owner_id = ${ownerId} ${vis} ${cur} ORDER BY c.updated_at DESC, c.id DESC LIMIT ${limit}`,
  );
  return rows.map(mapRow);
}

/** Eligible-shot statistics per collection: visible count, distinct designers, up to 4 newest covers (FR-56). */
export async function statsFor(ids: number[], now: number) {
  const out = new Map<number, { count: number; designers: number; covers: { key: string; width: number; height: number; color: string | null; title: string }[] }>();
  if (ids.length === 0) return out;
  const db = await getDb();
  const list = sql.join(ids.map((i) => sql`${i}`), sql`, `);
  const [agg, covers] = await db.batch([
    db.all<{ cid: number; n: number; d: number }>(sql`
      SELECT ci.collection_id AS cid, COUNT(*) AS n, COUNT(DISTINCT s.author_id) AS d
      FROM collection_items ci JOIN shots s ON s.id = ci.shot_id ${SHOT_OWNER_JOINS}
      WHERE ci.collection_id IN (${list}) AND ${eligibleShotSql(now)}
      GROUP BY ci.collection_id`),
    db.all<{ cid: number; k: string; w: number; h: number; c: string | null; title: string }>(sql`
      SELECT cid, k, w, h, c, title FROM (
        SELECT ci.collection_id AS cid, m.storage_key AS k, m.width AS w, m.height AS h, m.dominant_color AS c, s.title AS title,
               ROW_NUMBER() OVER (PARTITION BY ci.collection_id ORDER BY ci.created_at DESC, ci.shot_id DESC) AS rn
        FROM collection_items ci JOIN shots s ON s.id = ci.shot_id ${SHOT_OWNER_JOINS}
        JOIN media m ON m.id = s.cover_media_id
        WHERE ci.collection_id IN (${list}) AND ${eligibleShotSql(now)}
      ) WHERE rn <= 4 ORDER BY cid, rn`),
  ]);
  for (const id of ids) out.set(id, { count: 0, designers: 0, covers: [] });
  for (const r of agg) Object.assign(out.get(Number(r.cid))!, { count: Number(r.n), designers: Number(r.d) });
  for (const r of covers) out.get(Number(r.cid))!.covers.push({ key: r.k, width: Number(r.w), height: Number(r.h), color: r.c, title: r.title });
  return out;
}

/** Inserts unless the owner already has MAX_COLLECTIONS (returns null then). Duplicate name → unique-index error. */
export async function insert(ownerId: number, name: string, description: string | null, isPrivate: boolean, now: number) {
  const db = await getDb();
  const rows = await db.all<{ id: number }>(sql`
    INSERT INTO collections (owner_id, name, name_key, description, is_private, shots_count, created_at, updated_at)
    SELECT ${ownerId}, ${name}, ${name.toLowerCase()}, ${description}, ${isPrivate ? 1 : 0}, 0, ${now}, ${now}
    WHERE (SELECT COUNT(*) FROM collections WHERE owner_id = ${ownerId}) < ${MAX_COLLECTIONS}
    RETURNING id`);
  return rows[0] ? Number(rows[0].id) : null;
}

export async function update(id: number, patch: { name?: string; description?: string | null; isPrivate?: boolean }, now: number) {
  const db = await getDb();
  const sets = [sql`updated_at = ${now}`];
  if (patch.name !== undefined) sets.push(sql`name = ${patch.name}`, sql`name_key = ${patch.name.toLowerCase()}`);
  if (patch.description !== undefined) sets.push(sql`description = ${patch.description}`);
  if (patch.isPrivate !== undefined) sets.push(sql`is_private = ${patch.isPrivate ? 1 : 0}`);
  await db.run(sql`UPDATE collections SET ${sql.join(sets, sql`, `)} WHERE id = ${id}`);
}

/** BR-55: deleting a collection removes its items and decrements each shot's saves_count, atomically. */
export async function remove(id: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE shots SET saves_count = saves_count - 1
      WHERE id IN (SELECT shot_id FROM collection_items WHERE collection_id = ${id}) AND saves_count > 0`),
    db.run(sql`DELETE FROM collections WHERE id = ${id}`),
  ]);
}

/**
 * Save / unsave one shot (set semantics, BR-55). The insert is refused when the collection is full
 * (MAX_ITEMS). Returns whether the shot is now in the collection plus both counts.
 */
export async function setItem(collectionId: number, shotId: number, on: boolean, now: number) {
  const db = await getDb();
  const rows = on
    ? await db.batch([
        db.run(sql`INSERT INTO collection_items (collection_id, shot_id, created_at)
          SELECT ${collectionId}, ${shotId}, ${now}
          WHERE (SELECT shots_count FROM collections WHERE id = ${collectionId}) < ${MAX_ITEMS}
          ON CONFLICT DO NOTHING`),
        db.run(sql`UPDATE shots SET saves_count = saves_count + 1 WHERE id = ${shotId} AND changes() = 1`),
        db.run(sql`UPDATE collections SET shots_count = shots_count + 1, updated_at = ${now} WHERE id = ${collectionId} AND changes() = 1`),
        db.all<{ saves: number; n: number; inside: number }>(sql`SELECT
          (SELECT saves_count FROM shots WHERE id = ${shotId}) AS saves,
          (SELECT shots_count FROM collections WHERE id = ${collectionId}) AS n,
          EXISTS (SELECT 1 FROM collection_items WHERE collection_id = ${collectionId} AND shot_id = ${shotId}) AS inside`),
      ])
    : await db.batch([
        db.run(sql`DELETE FROM collection_items WHERE collection_id = ${collectionId} AND shot_id = ${shotId}`),
        db.run(sql`UPDATE shots SET saves_count = saves_count - 1 WHERE id = ${shotId} AND changes() = 1 AND saves_count > 0`),
        db.run(sql`UPDATE collections SET shots_count = shots_count - 1, updated_at = ${now}
          WHERE id = ${collectionId} AND changes() = 1 AND shots_count > 0`),
        db.all<{ saves: number; n: number; inside: number }>(sql`SELECT
          (SELECT saves_count FROM shots WHERE id = ${shotId}) AS saves,
          (SELECT shots_count FROM collections WHERE id = ${collectionId}) AS n,
          EXISTS (SELECT 1 FROM collection_items WHERE collection_id = ${collectionId} AND shot_id = ${shotId}) AS inside`),
      ]);
  const r = (rows[3] as { saves: number; n: number; inside: number }[])[0]!;
  return { inside: Boolean(r.inside), savesCount: Number(r.saves), shotsCount: Number(r.n) };
}

/** Eligible shot ids of a collection, newest save first (keyset on save time, shot id). */
export async function pageShotIds(collectionId: number, now: number, after: (string | number)[] | null, limit: number) {
  const db = await getDb();
  const cur = after && after.length === 2 ? sql`AND (ci.created_at, ci.shot_id) < (${after[0]}, ${after[1]})` : sql``;
  const rows = await db.all<{ id: number; at: number }>(sql`
    SELECT ci.shot_id AS id, ci.created_at AS at
    FROM collection_items ci JOIN shots s ON s.id = ci.shot_id ${SHOT_OWNER_JOINS}
    WHERE ci.collection_id = ${collectionId} AND ${eligibleShotSql(now)} ${cur}
    ORDER BY ci.created_at DESC, ci.shot_id DESC LIMIT ${limit}`);
  return rows.map((r) => ({ id: Number(r.id), at: Number(r.at) }));
}

/** The owner's collections with whether each contains `shotId` (save picker, FR-47). */
export async function pickerFor(ownerId: number, shotId: number | null) {
  const db = await getDb();
  return db.all<{ id: number; name: string; isPrivate: number; contains: number; n: number }>(sql`
    SELECT c.id AS id, c.name AS name, c.is_private AS isPrivate, c.shots_count AS n,
           ${shotId === null ? sql`0` : sql`EXISTS (SELECT 1 FROM collection_items ci WHERE ci.collection_id = c.id AND ci.shot_id = ${shotId})`} AS contains
    FROM collections c WHERE c.owner_id = ${ownerId}
    ORDER BY c.updated_at DESC, c.id DESC`);
}

/** Whether any of the viewer's collections contains each shot (ShotDetail `isSaved`). */
export async function savedAmong(ownerId: number, shotIds: number[]): Promise<Set<number>> {
  if (shotIds.length === 0) return new Set();
  const db = await getDb();
  const rows = await db.all<{ id: number }>(sql`
    SELECT DISTINCT ci.shot_id AS id FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
    WHERE c.owner_id = ${ownerId} AND ci.shot_id IN (${sql.join(shotIds.map((i) => sql`${i}`), sql`, `)})`);
  return new Set(rows.map((r) => Number(r.id)));
}

export async function setHidden(id: number, hidden: boolean, now: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.run(sql`UPDATE collections SET hidden_at = ${hidden ? now : null} WHERE id = ${id}`);
  return res.rowsAffected > 0;
}

/** BR-24: account deletion removes the profile's collections (and their saves). */
export async function removeAllFor(ownerId: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE shots SET saves_count = MAX(saves_count - (
        SELECT COUNT(*) FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
        WHERE c.owner_id = ${ownerId} AND ci.shot_id = shots.id), 0)
      WHERE id IN (SELECT ci.shot_id FROM collection_items ci JOIN collections c ON c.id = ci.collection_id WHERE c.owner_id = ${ownerId})`),
    db.run(sql`DELETE FROM collections WHERE owner_id = ${ownerId}`),
  ]);
}

/** BR-65: a deleted shot's saves are removed with the collection counters. */
export async function removeShotEverywhere(shotId: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE collections SET shots_count = MAX(shots_count - 1, 0)
      WHERE id IN (SELECT collection_id FROM collection_items WHERE shot_id = ${shotId})`),
    db.run(sql`DELETE FROM collection_items WHERE shot_id = ${shotId}`),
    db.run(sql`UPDATE shots SET saves_count = 0 WHERE id = ${shotId}`),
  ]);
}

/** BR-27 reconciliation of collections.shots_count and shots.saves_count. */
export async function reconcile(): Promise<number> {
  const db = await getDb();
  const items = sql`(SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = collections.id)`;
  const saves = sql`(SELECT COUNT(*) FROM collection_items ci WHERE ci.shot_id = shots.id)`;
  const [a, b] = await db.batch([
    db.run(sql`UPDATE collections SET shots_count = ${items} WHERE shots_count <> ${items}`),
    db.run(sql`UPDATE shots SET saves_count = ${saves} WHERE saves_count <> ${saves}`),
  ]);
  return a.rowsAffected + b.rowsAffected;
}
