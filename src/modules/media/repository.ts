import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { media } from '@/server/db/schema';

export async function findById(id: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: media.id,
      key: media.storageKey,
      width: media.width,
      height: media.height,
      dominantColor: media.dominantColor,
      status: media.status,
      ownerProfileId: media.ownerProfileId,
      purpose: media.purpose,
      palette: media.palette,
      providerFileId: media.providerFileId,
      mimeType: media.mimeType,
      bytes: media.bytes,
      failureReason: media.failureReason,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertPending(row: { id: string; ownerProfileId: number; key: string; mimeType: string; bytes: number; purpose: 'shot' | 'avatar' | 'logo' }, now: number) {
  const db = await getDb();
  await db.insert(media).values({
    id: row.id,
    ownerProfileId: row.ownerProfileId,
    storageKey: row.key,
    mimeType: row.mimeType,
    width: 0,
    height: 0,
    bytes: row.bytes,
    status: 'pending',
    purpose: row.purpose,
    createdAt: new Date(now),
  });
}

export async function markReady(id: string, v: { mimeType: string; width: number; height: number; bytes: number; dominantColor: string; palette: string[]; providerFileId: string | null }) {
  const db = await getDb();
  await db
    .update(media)
    .set({ ...v, status: 'ready', failureReason: null })
    .where(eq(media.id, id));
}

export async function markFailed(id: string, reason: string, providerFileId: string | null) {
  const db = await getDb();
  await db.update(media).set({ status: 'failed', failureReason: reason, providerFileId }).where(eq(media.id, id));
}

export async function deleteRow(id: string) {
  const db = await getDb();
  await db.delete(media).where(eq(media.id, id));
}

const referenced = sql`(
  EXISTS (SELECT 1 FROM content_blocks b WHERE b.media_id = media.id)
  OR EXISTS (SELECT 1 FROM shots s WHERE s.cover_media_id = media.id)
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.avatar_media_id = media.id)
  OR EXISTS (SELECT 1 FROM companies c WHERE c.logo_media_id = media.id))`;

export async function isAttached(id: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.all<{ n: number }>(sql`SELECT ${referenced} AS n FROM media WHERE id = ${id}`);
  return Boolean(rows[0]?.n);
}

/** BR-66: uploads (not seed media) older than `before` that nothing references. */
export async function unattachedBefore(before: number, limit: number) {
  const db = await getDb();
  return db.all<{ id: string; key: string; providerFileId: string | null }>(sql`
    SELECT id, storage_key AS key, provider_file_id AS providerFileId FROM media
    WHERE purpose <> 'seed' AND created_at < ${before} AND NOT ${referenced}
    LIMIT ${limit}`);
}

/** Objects owned by a profile (BR-24 purge deletes them from storage before the rows cascade). */
export async function objectsOf(profileId: number) {
  const db = await getDb();
  return db.all<{ id: string; key: string; providerFileId: string | null }>(sql`
    SELECT id, storage_key AS key, provider_file_id AS providerFileId FROM media WHERE owner_profile_id = ${profileId} AND purpose <> 'seed'`);
}
