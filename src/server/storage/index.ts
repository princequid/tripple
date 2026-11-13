import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';
import { AppError } from '../errors';
import { log } from '../log';

/**
 * Object storage behind one interface (A-19, D-16 successor). Providers:
 *
 * - `imagekit` (preview/production): the browser uploads the original **directly** to ImageKit with a
 *   short-lived signature created here (the private key never leaves the server). The server then reads the
 *   file details and bytes back from ImageKit to validate them (BR-61/62), and deletes rejected files.
 * - `local` (development and tests): the browser PUTs the bytes to `/api/uploads/:id/file`; originals go to a
 *   private folder and the variants used by `lib/media` (`{key}/{variant}.webp`) are rendered into the public
 *   media folder, exactly like the seed (ADR-004).
 *
 * The provider follows NEXT_PUBLIC_MEDIA_PROVIDER, so uploads and URLs always agree.
 */
export type Provider = 'local' | 'imagekit';
export const provider = (): Provider => (process.env.NEXT_PUBLIC_MEDIA_PROVIDER === 'imagekit' ? 'imagekit' : 'local');

export type UploadTarget = {
  provider: Provider;
  method: 'POST' | 'PUT';
  uploadUrl: string;
  /** Form fields for a multipart POST (ImageKit). Empty for `local` (send the raw bytes as the PUT body). */
  fields: Record<string, string>;
  token: string;
  expiresAt: string;
};

const IK_UPLOAD = 'https://upload.imagekit.io/api/v1/files/upload';
const IK_API = 'https://api.imagekit.io/v1/files';
const SIGNATURE_TTL_S = 30 * 60; // ImageKit requires expire < 1 hour ahead.

function ikKeys() {
  const pub = process.env.IMAGEKIT_PUBLIC_KEY;
  const priv = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!pub || !priv) throw new AppError('SERVICE_UNAVAILABLE', 'Uploads are not configured.');
  return { pub, priv };
}

/** ImageKit client-upload signature: HMAC-SHA1(privateKey, token + expire), hex. */
export function imagekitSignature(privateKey: string, token: string, expire: number): string {
  return createHmac('sha1', privateKey).update(token + String(expire)).digest('hex');
}

const splitKey = (key: string) => {
  const i = key.lastIndexOf('/');
  return { folder: `/${key.slice(0, i)}`, fileName: key.slice(i + 1) };
};

export function uploadTarget(mediaId: string, key: string, now = Date.now()): UploadTarget {
  if (provider() === 'local') {
    return {
      provider: 'local',
      method: 'PUT',
      uploadUrl: `/api/uploads/${mediaId}/file`,
      fields: {},
      token: mediaId,
      expiresAt: new Date(now + SIGNATURE_TTL_S * 1000).toISOString(),
    };
  }
  const { pub, priv } = ikKeys();
  const token = randomUUID();
  const expire = Math.floor(now / 1000) + SIGNATURE_TTL_S;
  const { folder, fileName } = splitKey(key);
  return {
    provider: 'imagekit',
    method: 'POST',
    uploadUrl: IK_UPLOAD,
    fields: {
      publicKey: pub,
      signature: imagekitSignature(priv, token, expire),
      expire: String(expire),
      token,
      fileName,
      folder,
      useUniqueFileName: 'false',
      overwriteFile: 'false',
    },
    token,
    expiresAt: new Date(expire * 1000).toISOString(),
  };
}

// ---------- local provider ----------
const localOriginals = () => process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), '.data', 'uploads');
const localPublic = () => process.env.LOCAL_MEDIA_DIR ?? path.join(process.cwd(), 'public', 'seed-media');
const safe = (key: string) => {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes('..')) throw new AppError('VALIDATION', 'Invalid media key.');
  return key;
};

export function writeLocalOriginal(key: string, bytes: Buffer) {
  const p = path.join(localOriginals(), safe(key));
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, bytes);
}

/** Variants for `lib/media` local URLs (BR-63 sizes). sharp drops EXIF/GPS by default (no `withMetadata`). */
const VARIANTS: [string, number, number | null][] = [
  ['cover-400', 400, 300],
  ['cover-800', 800, 600],
  ['w800', 800, null],
  ['w1200', 1200, null],
  ['w1600', 1600, null],
];

async function renderLocalVariants(key: string, bytes: Buffer) {
  const sharp = (await import('sharp')).default;
  const dir = path.join(localPublic(), safe(key));
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, w, h] of VARIANTS) {
    const img = sharp(bytes).rotate().toColourspace('srgb');
    const out = h ? img.resize(w, h, { fit: 'cover', position: 'attention' }) : img.resize(w, null, { withoutEnlargement: true });
    fs.writeFileSync(path.join(dir, `${name}.webp`), await out.webp({ quality: 82 }).toBuffer());
  }
}

// ---------- shared operations ----------
const MAX_DOWNLOAD = 21 * 1024 * 1024;

async function ikFetch(url: string, init: RequestInit = {}) {
  const { priv } = ikKeys();
  return fetch(url, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Basic ${Buffer.from(`${priv}:`).toString('base64')}` } });
}

/**
 * Reads back an uploaded original for validation. ImageKit: the client-reported `fileId` must resolve to
 * exactly the key we issued (so nobody can attach someone else's file). Returns the bytes and provider id.
 */
export async function fetchUploaded(key: string, fileId: string | null): Promise<{ bytes: Buffer; providerFileId: string | null }> {
  if (provider() === 'local') {
    const p = path.join(localOriginals(), safe(key));
    if (!fs.existsSync(p)) throw new AppError('CONFLICT', 'The file has not been uploaded yet.');
    return { bytes: fs.readFileSync(p), providerFileId: null };
  }
  if (!fileId || !/^[A-Za-z0-9_-]{6,64}$/.test(fileId)) throw new AppError('VALIDATION', 'fileId is required.', { fields: { fileId: 'Required' } });
  const res = await ikFetch(`${IK_API}/${fileId}/details`).catch(() => null);
  if (!res) throw new AppError('SERVICE_UNAVAILABLE', 'The media service is not reachable. Try again.');
  if (res.status === 404) throw new AppError('CONFLICT', 'The file has not been uploaded yet.');
  if (!res.ok) throw new AppError('SERVICE_UNAVAILABLE', 'The media service is not reachable. Try again.');
  const details = (await res.json()) as { filePath?: string; url?: string; size?: number };
  if (details.filePath !== `/${key}` || !details.url) throw new AppError('NOT_FOUND', 'That file does not belong to this upload.');
  if ((details.size ?? 0) > MAX_DOWNLOAD) return { bytes: Buffer.alloc(MAX_DOWNLOAD + 1), providerFileId: fileId };
  const file = await fetch(details.url).catch(() => null);
  if (!file || !file.ok) throw new AppError('SERVICE_UNAVAILABLE', 'The media service is not reachable. Try again.');
  return { bytes: Buffer.from(await file.arrayBuffer()), providerFileId: fileId };
}

/** After validation: local renders variants (ImageKit renders on the fly from URL transformations). */
export async function publishVariants(key: string, bytes: Buffer) {
  if (provider() === 'local') await renderLocalVariants(key, bytes);
}

/** Deletes an object (rejected upload, unattached after 24 h, purged shot/account). Failures are logged, not thrown. */
export async function deleteObject(key: string, providerFileId: string | null): Promise<boolean> {
  try {
    if (provider() === 'local') {
      fs.rmSync(path.join(localOriginals(), safe(key)), { force: true });
      fs.rmSync(path.join(localPublic(), safe(key)), { recursive: true, force: true });
      return true;
    }
    if (!providerFileId) return false;
    const res = await ikFetch(`${IK_API}/${providerFileId}`, { method: 'DELETE' });
    return res.ok || res.status === 404;
  } catch (e) {
    log.warn('storage.delete_failed', { err: e instanceof Error ? e.message : String(e) });
    return false;
  }
}
