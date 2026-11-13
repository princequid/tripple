import 'server-only';
import { mediaUrl, type MediaVariant } from '@/lib/media';
import { AppError } from '@/server/errors';
import * as repo from './repository';

/**
 * Media reads (R1). Binaries live in ImageKit (A-19), never in the DB (A-03); local seed files in development.
 * URLs come from lib/media `mediaUrl` (provider + base URL from configuration). Uploads arrive with release R2
 * (server-signed ImageKit uploads; IMAGEKIT_PRIVATE_KEY never reaches the client).
 */
export const urlFor = (key: string, variant: MediaVariant) => mediaUrl(key, variant);

export async function describe(mediaId: string) {
  const m = await repo.findById(mediaId);
  return m && m.status === 'ready' ? m : null;
}

/**
 * A ready media object owned by `profileId` with one of the allowed purposes (avatar, shot block, company
 * logo). Anything else is 422 UNSUPPORTED_MEDIA with a field message, so a stolen or stale id cannot be used.
 */
export async function requireOwnedReady(mediaId: string, profileId: number, purposes: ('shot' | 'avatar' | 'logo')[], field = 'mediaId') {
  const m = await repo.findById(mediaId);
  if (!m || m.ownerProfileId !== profileId || !purposes.includes(m.purpose as 'shot')) {
    throw new AppError('UNSUPPORTED_MEDIA', 'That upload was not found.', { fields: { [field]: 'That upload was not found.' } });
  }
  if (m.status !== 'ready') {
    throw new AppError('UNSUPPORTED_MEDIA', 'That upload is not ready yet.', { fields: { [field]: 'That upload is not ready yet.' } });
  }
  return m;
}

/** BR-63 palette of a ready media object (copied into shot_colors at publish). */
export async function paletteOf(mediaId: string): Promise<string[] | null> {
  const m = await repo.findById(mediaId);
  return m?.palette ?? null;
}
