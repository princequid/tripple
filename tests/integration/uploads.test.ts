import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import type { Db } from '@/server/db/client';
import * as uploads from '@/modules/media/uploads';
import { imagekitSignature, uploadTarget } from '@/server/storage';
import { sniff, hexToLab } from '@/server/storage/image';
import { resetLimitsForTests } from '@/server/rate-limit';
import { setupTestDb, clearContent, makeProfile, visitor, errorCode } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});
beforeEach(async () => {
  await clearContent(db);
  await resetLimitsForTests();
});

/** Two-colour test image (left red, right blue) with EXIF-like metadata. */
async function png(w: number, h: number): Promise<Buffer> {
  const left = await sharp({ create: { width: Math.floor(w / 2), height: h, channels: 3, background: '#d02040' } }).png().toBuffer();
  return sharp({ create: { width: w, height: h, channels: 3, background: '#2040d0' } })
    .composite([{ input: left, left: 0, top: 0 }])
    .withMetadata({ exif: { IFD0: { Copyright: 'secret-gps-like-data' } } })
    .jpeg()
    .toBuffer();
}

async function uploadBytes(viewer: Parameters<typeof uploads.create>[0], bytes: Buffer, purpose: 'shot' | 'avatar' | 'logo' = 'shot', mimeType = 'image/jpeg') {
  const slot = await uploads.create(viewer, { purpose, fileName: 'a.jpg', mimeType, size: bytes.length });
  await uploads.receiveLocal(viewer, slot.mediaId, bytes);
  return slot;
}

describe('image helpers (BR-61, BR-80)', () => {
  it('sniffs types by magic bytes only', async () => {
    expect(sniff(await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer())?.mime).toBe('image/png');
    expect(sniff(await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).webp().toBuffer())?.mime).toBe('image/webp');
    expect(sniff(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(sniff(Buffer.from('GIF89a......'))).toBeNull();
  });
  it('converts hex to CIELAB', () => {
    const w = hexToLab('#ffffff');
    expect(w.l).toBeCloseTo(100, 0);
    expect(Math.abs(w.a)).toBeLessThan(0.5);
    expect(hexToLab('#000000').l).toBeCloseTo(0, 1);
  });
  it('ImageKit signature = HMAC-SHA1(privateKey, token + expire) and target fields', () => {
    const sig = imagekitSignature('private_key_test', 'tok', 1700000000);
    expect(sig).toMatch(/^[0-9a-f]{40}$/);
    const prev = { ...process.env };
    Object.assign(process.env, { NEXT_PUBLIC_MEDIA_PROVIDER: 'imagekit', IMAGEKIT_PUBLIC_KEY: 'public_test', IMAGEKIT_PRIVATE_KEY: 'private_test' });
    try {
      const t = uploadTarget('mid', 'uploads/7/mid.jpg', 1_700_000_000_000);
      expect(t).toMatchObject({ provider: 'imagekit', method: 'POST', uploadUrl: 'https://upload.imagekit.io/api/v1/files/upload' });
      expect(t.fields).toMatchObject({ publicKey: 'public_test', fileName: 'mid.jpg', folder: '/uploads/7', useUniqueFileName: 'false', expire: String(1_700_000_000 + 1800) });
      expect(t.fields.signature).toBe(imagekitSignature('private_test', t.fields.token!, Number(t.fields.expire)));
      expect(JSON.stringify(t)).not.toContain('private_test'); // the private key never leaves the server
    } finally {
      process.env = prev;
    }
  });
});

describe('uploads (C-01, C-02, FR-61/62, BR-61…BR-63, BR-66)', () => {
  it('happy path: pending → ready with palette, variants rendered without metadata', async () => {
    const ann = await makeProfile(db);
    const bytes = await png(1200, 900);
    const slot = await uploadBytes(ann.viewer, bytes);
    expect(slot).toMatchObject({ provider: 'local', method: 'PUT', uploadUrl: `/api/uploads/${slot.mediaId}/file` });
    expect((await uploads.get(ann.viewer, slot.mediaId)).status).toBe('pending');
    const done = await uploads.complete(ann.viewer, slot.mediaId, {});
    expect(done).toMatchObject({ status: 'ready', width: 1200, height: 900, purpose: 'shot' });
    expect(done.palette.length).toBeGreaterThanOrEqual(2);
    expect(done.palette).toEqual(expect.arrayContaining([expect.stringMatching(/^#[0-9a-f]{6}$/)]));
    expect(done.previewUrl).toBe(`/seed-media/${done.key}/w800.webp`);
    const cover = path.join(process.env.LOCAL_MEDIA_DIR!, done.key, 'cover-400.webp');
    expect(fs.existsSync(cover)).toBe(true);
    const meta = await sharp(fs.readFileSync(cover)).metadata();
    expect([meta.width, meta.height, meta.exif]).toEqual([400, 300, undefined]); // EXIF stripped (BR-63)
    // Idempotent completion.
    expect((await uploads.complete(ann.viewer, slot.mediaId, {})).status).toBe('ready');
  });

  it('rejects by magic bytes, size and dimensions, and deletes the object (BR-61, BR-62)', async () => {
    const ann = await makeProfile(db);
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"/>');
    const s1 = await uploadBytes(ann.viewer, svg); // declared jpeg, really SVG
    expect(await errorCode(() => uploads.complete(ann.viewer, s1.mediaId, {}))).toBe('UNSUPPORTED_MEDIA');
    const failed = await uploads.get(ann.viewer, s1.mediaId);
    expect(failed).toMatchObject({ status: 'failed', failureReason: 'Upload a JPEG, PNG or WebP image.' });
    expect(fs.existsSync(path.join(process.env.LOCAL_UPLOAD_DIR!, failed.key))).toBe(false);
    const small = await uploadBytes(ann.viewer, await png(300, 200));
    expect(await errorCode(() => uploads.complete(ann.viewer, small.mediaId, {}))).toBe('UNSUPPORTED_MEDIA');
    expect((await uploads.get(ann.viewer, small.mediaId)).failureReason).toBe('Images must be at least 400 × 300 px.');
    // Small squares are fine as avatars.
    const av = await uploadBytes(ann.viewer, await png(200, 200), 'avatar');
    expect((await uploads.complete(ann.viewer, av.mediaId, {})).status).toBe('ready');
    // Declared size over the limit is refused before any upload; logos are limited to 5 MB.
    expect(await errorCode(() => uploads.create(ann.viewer, { purpose: 'shot', fileName: 'x.jpg', mimeType: 'image/jpeg', size: 21 * 1024 * 1024 }))).toBe('UNSUPPORTED_MEDIA');
    expect(await errorCode(() => uploads.create(ann.viewer, { purpose: 'logo', fileName: 'x.png', mimeType: 'image/png', size: 6 * 1024 * 1024 }))).toBe('UNSUPPORTED_MEDIA');
    expect(await errorCode(() => uploads.create(ann.viewer, { purpose: 'shot', fileName: 'x.gif', mimeType: 'image/gif', size: 10 }))).toBe('VALIDATION');
  });

  it('ownership: others cannot read, complete or delete; visitors cannot upload', async () => {
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    const slot = await uploadBytes(ann.viewer, await png(800, 600));
    expect(await errorCode(() => uploads.get(bob.viewer, slot.mediaId))).toBe('NOT_FOUND');
    expect(await errorCode(() => uploads.complete(bob.viewer, slot.mediaId, {}))).toBe('NOT_FOUND');
    expect(await errorCode(() => uploads.receiveLocal(bob.viewer, slot.mediaId, Buffer.from('x')))).toBe('NOT_FOUND');
    expect(await errorCode(() => uploads.create(visitor, { purpose: 'shot', fileName: 'a.jpg', mimeType: 'image/jpeg', size: 10 }))).toBe('UNAUTHENTICATED');
    const pending = await uploads.create(ann.viewer, { purpose: 'shot', fileName: 'a.jpg', mimeType: 'image/jpeg', size: 10 });
    expect(await errorCode(() => uploads.complete(ann.viewer, pending.mediaId, {}))).toBe('CONFLICT'); // nothing uploaded yet
  });

  it('remove and the 24-hour unattached purge (BR-66)', async () => {
    const ann = await makeProfile(db);
    const a = await uploadBytes(ann.viewer, await png(800, 600));
    await uploads.complete(ann.viewer, a.mediaId, {});
    expect(await uploads.remove(ann.viewer, a.mediaId)).toEqual({ deleted: true });
    expect(await errorCode(() => uploads.get(ann.viewer, a.mediaId))).toBe('NOT_FOUND');
    const b = await uploadBytes(ann.viewer, await png(800, 600));
    expect(await uploads.purgeUnattached()).toBe(0);
    expect(await uploads.purgeUnattached(Date.now() + 25 * 3_600_000)).toBe(1);
    expect(await errorCode(() => uploads.get(ann.viewer, b.mediaId))).toBe('NOT_FOUND');
  });

  it('RL-UPLOAD: 31st upload in an hour is refused (BR-66)', async () => {
    const ann = await makeProfile(db);
    for (let i = 0; i < 30; i++) await uploads.create(ann.viewer, { purpose: 'shot', fileName: 'a.jpg', mimeType: 'image/jpeg', size: 10 });
    expect(await errorCode(() => uploads.create(ann.viewer, { purpose: 'shot', fileName: 'a.jpg', mimeType: 'image/jpeg', size: 10 }))).toBe('RATE_LIMITED');
  });
});
