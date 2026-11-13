import 'server-only';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { log } from '@/server/log';
import * as storage from '@/server/storage';
import { ACCEPTED_MIME, ImageRejected, LIMITS, inspect, type Purpose } from '@/server/storage/image';
import { mediaUrl } from '@/lib/media';
import { requireMember } from '@/modules/auth/service';
import type { Viewer } from '@/modules/auth/types';
import * as repo from './repository';

/**
 * Uploads (C-01, C-02, FR-61, FR-62; BR-61…BR-63, BR-66). Flow:
 *   1. POST /api/uploads → a pending media row + an upload target (signed ImageKit form, or local PUT URL).
 *   2. The browser sends the file to `uploadUrl`.
 *   3. POST /api/uploads/:id/complete → the server reads the bytes back, checks magic bytes, size, sides and
 *      pixels, extracts dominant colour + palette, and marks the media `ready` (or `failed` + deletes it).
 * Unattached uploads are deleted after 24 h (BR-66). The service module is `media`; this file keeps the
 * upload half separate from the R1 read half (service.ts).
 */
export type UploadedMedia = {
  mediaId: string;
  purpose: Purpose;
  status: 'pending' | 'ready' | 'failed';
  key: string;
  width: number;
  height: number;
  dominantColor: string | null;
  palette: string[];
  previewUrl: string | null;
  failureReason: string | null;
};

export type UploadSlot = storage.UploadTarget & { uploadId: string; mediaId: string; maxBytes: number };

export const createInput = z.object({
  purpose: z.enum(['shot', 'avatar', 'logo']).default('shot'),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ACCEPTED_MIME, { message: 'Upload a JPEG, PNG or WebP image.' }),
  size: z.number().int().positive(),
});

const EXT: Record<(typeof ACCEPTED_MIME)[number], string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function dto(m: NonNullable<Awaited<ReturnType<typeof repo.findById>>>): UploadedMedia {
  return {
    mediaId: m.id,
    purpose: m.purpose as Purpose,
    status: m.status,
    key: m.key,
    width: m.width,
    height: m.height,
    dominantColor: m.dominantColor,
    palette: m.palette ?? [],
    previewUrl: m.status === 'ready' ? mediaUrl(m.key, 'w800') : null,
    failureReason: m.failureReason,
  };
}

async function own(viewer: Viewer, id: string) {
  const member = requireMember(viewer);
  const m = await repo.findById(id);
  if (!m || m.ownerProfileId !== member.profileId || m.purpose === 'seed') throw new AppError('NOT_FOUND');
  return { member, m };
}

/** Step 1. Declared type/size are checked early (real checks happen at completion). RL-UPLOAD (BR-66). */
export async function create(viewer: Viewer, input: unknown): Promise<UploadSlot> {
  const member = requireMember(viewer);
  const v = validate(createInput, input);
  const max = LIMITS[v.purpose].maxBytes;
  if (v.size > max) {
    throw new AppError('UNSUPPORTED_MEDIA', `The file is larger than ${Math.round(max / 1024 / 1024)} MB.`, { fields: { size: 'Too large' } });
  }
  await limit('RL-UPLOAD', `p:${member.profileId}`);
  const id = randomUUID();
  const key = `uploads/${member.profileId}/${id}.${EXT[v.mimeType]}`;
  const now = Date.now();
  await repo.insertPending({ id, ownerProfileId: member.profileId, key, mimeType: v.mimeType, bytes: v.size, purpose: v.purpose }, now);
  return { uploadId: id, mediaId: id, maxBytes: max, ...storage.uploadTarget(id, key, now) };
}

/** Local provider only: receives the raw bytes (PUT /api/uploads/:id/file). */
export async function receiveLocal(viewer: Viewer, id: string, bytes: Buffer): Promise<{ received: number }> {
  if (storage.provider() !== 'local') throw new AppError('NOT_FOUND');
  const { m } = await own(viewer, id);
  if (m.status !== 'pending') throw new AppError('CONFLICT', 'This upload is already complete.');
  const max = LIMITS[m.purpose as Purpose].maxBytes;
  if (bytes.length > max) throw new AppError('UNSUPPORTED_MEDIA', `The file is larger than ${Math.round(max / 1024 / 1024)} MB.`);
  storage.writeLocalOriginal(m.key, bytes);
  return { received: bytes.length };
}

const PROCESSING_TIMEOUT_MS = 30_000; // BR-63

/** Step 3 (FR-62). Idempotent: a ready upload returns as is. Rejected → 422 UNSUPPORTED_MEDIA, object deleted. */
export async function complete(viewer: Viewer, id: string, input: unknown): Promise<UploadedMedia> {
  const { m } = await own(viewer, id);
  if (m.status === 'ready') return dto(m);
  if (m.status === 'failed') throw new AppError('UNSUPPORTED_MEDIA', m.failureReason ?? 'This upload failed. Remove it and try again.');
  const { fileId } = validate(z.object({ fileId: z.string().max(64).nullish() }), input ?? {});
  const { bytes, providerFileId } = await storage.fetchUploaded(m.key, fileId ?? null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      inspect(bytes, m.purpose as Purpose),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ImageRejected('Processing took too long. Try again or use a smaller image.')), PROCESSING_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer));
    await storage.publishVariants(m.key, bytes);
    await repo.markReady(id, {
      mimeType: result.type.mime,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      dominantColor: result.dominantColor,
      palette: result.palette,
      providerFileId,
    });
  } catch (e) {
    if (!(e instanceof ImageRejected)) throw e;
    await storage.deleteObject(m.key, providerFileId);
    await repo.markFailed(id, e.reason, null);
    throw new AppError('UNSUPPORTED_MEDIA', e.reason, { fields: { file: e.reason } });
  }
  return dto((await repo.findById(id))!);
}

export async function get(viewer: Viewer, id: string): Promise<UploadedMedia> {
  return dto((await own(viewer, id)).m);
}

/** FR-61 "Remove": only while not attached to a shot, avatar or logo. */
export async function remove(viewer: Viewer, id: string): Promise<{ deleted: true }> {
  const { m } = await own(viewer, id);
  if (await repo.isAttached(id)) throw new AppError('CONFLICT', 'This image is in use. Remove it from the shot first.');
  await storage.deleteObject(m.key, m.providerFileId);
  await repo.deleteRow(id);
  return { deleted: true };
}

/** BR-66: uploads not attached within 24 h are deleted from storage and the database (daily job). */
export async function purgeUnattached(now = Date.now()): Promise<number> {
  const rows = await repo.unattachedBefore(now - 86_400_000, 200);
  for (const r of rows) {
    await storage.deleteObject(r.key, r.providerFileId);
    await repo.deleteRow(r.id);
  }
  if (rows.length) log.info('media.purged_unattached', { count: rows.length });
  return rows.length;
}

/** BR-24 / BR-65 purge: delete a profile's stored objects before its rows cascade away. */
export async function deleteObjectsOf(profileId: number): Promise<number> {
  const rows = await repo.objectsOf(profileId);
  for (const r of rows) await storage.deleteObject(r.key, r.providerFileId);
  return rows.length;
}

export async function deleteObjectById(id: string) {
  const m = await repo.findById(id);
  if (m && m.purpose !== 'seed') await storage.deleteObject(m.key, m.providerFileId);
}
