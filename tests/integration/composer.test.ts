import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as composer from '@/modules/composer/service';
import * as uploads from '@/modules/media/uploads';
import * as shots from '@/modules/shots/service';
import * as feed from '@/modules/feed/service';
import * as search from '@/modules/search/service';
import * as likes from '@/modules/likes/service';
import * as collections from '@/modules/collections/service';
import * as comments from '@/modules/comments/service';
import * as teams from '@/modules/teams/service';
import { resetLimitsForTests } from '@/server/rate-limit';
import type { Viewer } from '@/modules/auth/types';
import { setupTestDb, clearContent, makeProfile, makeShot, visitor, errorCode } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});
beforeEach(async () => {
  await clearContent(db);
  await resetLimitsForTests();
});

const jpeg = (color: string) => sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).jpeg().toBuffer();

async function image(viewer: Viewer, color = '#3366cc'): Promise<string> {
  const bytes = await jpeg(color);
  const slot = await uploads.create(viewer, { purpose: 'shot', fileName: 'a.jpg', mimeType: 'image/jpeg', size: bytes.length });
  await uploads.receiveLocal(viewer, slot.mediaId, bytes);
  await uploads.complete(viewer, slot.mediaId, {});
  return slot.mediaId;
}

const base = { title: 'Banking dashboard', categorySlug: 'web-design', tags: ['Fintech', 'dashboard', 'fintech'] };

describe('shot composer (C-04, C-05, FR-63/64, BR-64…BR-66)', () => {
  it('draft → publish: private draft, published in feeds/search, tags counted, palette stored', async () => {
    const ann = await makeProfile(db, { username: 'ann-c', displayName: 'Ann Composer' });
    const img = await image(ann.viewer, '#cc3344');
    const d = await composer.create(ann.viewer, { ...base, description: ' Clean UI ', blocks: [{ type: 'text', text: 'Intro' }, { type: 'image', mediaId: img, alt: '' }] });
    expect(d).toMatchObject({ status: 'draft', slug: 'banking-dashboard', description: 'Clean UI', tags: ['dashboard', 'fintech'], publishedAt: null, teamUsername: null });
    expect(d.blocks[1]).toMatchObject({ type: 'image', mediaId: img, alt: null, media: { width: 800, height: 600 } });
    // Drafts are private (BR-65).
    expect(await errorCode(() => shots.getDetail(d.id, visitor, null))).toBe('NOT_FOUND');
    const bob = await makeProfile(db);
    expect(await errorCode(() => composer.getForEdit(bob.viewer, d.id))).toBe('NOT_FOUND');
    expect((await composer.listOwn(ann.viewer, 'draft', {})).items.map((x) => x.id)).toEqual([d.id]);
    const p = await composer.publish(ann.viewer, d.id);
    expect(p.status).toBe('published');
    expect(p.publishedAt).not.toBeNull();
    const detail = await shots.getDetail(d.id, visitor, null);
    expect(detail).toMatchObject({ title: 'Banking dashboard', canonicalPath: `/shots/${d.id}-banking-dashboard`, category: { slug: 'web-design' } });
    expect(detail.cover?.key).toContain(`uploads/${ann.profileId}/`);
    // JPEG shifts colours slightly: the dominant colour is within a few units of #cc3344.
    const dom = detail.palette[0]!;
    expect([1, 3, 5].map((i) => Math.abs(parseInt(dom.slice(i, i + 2), 16) - parseInt('cc3344'.slice(i - 1, i + 1), 16))).every((d) => d <= 4)).toBe(true);
    expect((await feed.list({ sort: 'recent' }, visitor)).items.map((x) => x.id)).toContain(d.id);
    expect((await search.searchShots('fintech', null, visitor)).items.map((x) => x.id)).toEqual([d.id]);
    expect((await search.searchShots('composer', null, visitor)).items.map((x) => x.id)).toEqual([d.id]); // author name indexed
    const [tag] = await db.all<{ n: number }>(sql`SELECT shots_count AS n FROM tags WHERE slug = 'fintech'`);
    expect(tag!.n).toBe(1);
    const [prof] = await db.all<{ n: number }>(sql`SELECT shots_count AS n FROM profiles WHERE id = ${ann.profileId}`);
    expect(prof!.n).toBe(1);
    // Publishing again is a no-op; the date never changes (BR-65).
    expect((await composer.publish(ann.viewer, d.id)).publishedAt).toBe(p.publishedAt);
  });

  it('validation (BR-40, BR-64) and media ownership', async () => {
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    const bobImg = await image(bob.viewer);
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, title: '  ' }))).toBe('VALIDATION');
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, title: 'x'.repeat(101) }))).toBe('VALIDATION');
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, categorySlug: 'nope' }))).toBe('VALIDATION');
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, tags: ['a'] }))).toBe('VALIDATION');
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, tags: Array.from({ length: 21 }, (_, i) => `tag${i}`) }))).toBe('VALIDATION');
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, blocks: [{ type: 'image', mediaId: bobImg }] }))).toBe('UNSUPPORTED_MEDIA');
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, blocks: [{ type: 'text', text: '' }] }))).toBe('VALIDATION');
    // A text-only draft can be saved but not published (≥ 1 image).
    const d = await composer.create(ann.viewer, { ...base, blocks: [{ type: 'text', text: 'Only words' }] });
    expect(await errorCode(() => composer.publish(ann.viewer, d.id))).toBe('VALIDATION');
    // An image belongs to one shot.
    const img = await image(ann.viewer);
    await composer.update(ann.viewer, d.id, { blocks: [{ type: 'image', mediaId: img }] });
    expect(await errorCode(() => composer.create(ann.viewer, { ...base, blocks: [{ type: 'image', mediaId: img }] }))).toBe('CONFLICT');
    expect(await errorCode(() => composer.create(visitor, base))).toBe('UNAUTHENTICATED');
  });

  it('edit after publish: new title changes the slug, published date stays, still needs an image', async () => {
    const ann = await makeProfile(db);
    const img = await image(ann.viewer);
    const d = await composer.create(ann.viewer, { ...base, blocks: [{ type: 'image', mediaId: img }] });
    const p = await composer.publish(ann.viewer, d.id);
    const e = await composer.update(ann.viewer, d.id, { title: 'Retail dashboard', tags: ['retail'] });
    expect(e).toMatchObject({ slug: 'retail-dashboard', publishedAt: p.publishedAt, tags: ['retail'] });
    expect(await errorCode(() => composer.update(ann.viewer, d.id, { blocks: [{ type: 'text', text: 'no image' }] }))).toBe('VALIDATION');
    const [fin] = await db.all<{ n: number }>(sql`SELECT shots_count AS n FROM tags WHERE slug = 'fintech'`);
    expect(fin!.n).toBe(0);
  });

  it('quotas: 50 drafts, 10 publishes per day (BR-66)', async () => {
    const ann = await makeProfile(db);
    const now = Date.now();
    for (let i = 0; i < 50; i++) {
      await db.run(sql`INSERT INTO shots (author_id, title, slug, category_id, status, created_at, updated_at) VALUES (${ann.profileId}, 'd', 'd', 1, 'draft', ${now}, ${now})`);
    }
    expect(await errorCode(() => composer.create(ann.viewer, base))).toBe('QUOTA_EXCEEDED');
    await db.run(sql`DELETE FROM shots`);
    const ids: number[] = [];
    for (let i = 0; i < 11; i++) {
      const img = await image(ann.viewer);
      ids.push((await composer.create(ann.viewer, { ...base, blocks: [{ type: 'image', mediaId: img }] })).id);
      await resetLimitsForTests(); // keep RL-CONTENT/RL-UPLOAD out of the way; the publish quota is separate
    }
    for (let i = 0; i < 10; i++) await composer.publish(ann.viewer, ids[i]!);
    expect(await errorCode(() => composer.publish(ann.viewer, ids[10]!))).toBe('QUOTA_EXCEEDED');
  });

  it('team attribution: members only, former members cannot publish for the team (BR-59, BR-60)', async () => {
    const owner = await makeProfile(db, { username: 'owner-c' });
    const out = await makeProfile(db, { username: 'out-c' });
    await teams.create(owner.viewer, { username: 'crew-c', displayName: 'Crew' });
    const img = await image(owner.viewer);
    const d = await composer.create(owner.viewer, { ...base, teamUsername: 'crew-c', blocks: [{ type: 'image', mediaId: img }] });
    expect(d.teamUsername).toBe('crew-c');
    const outImg = await image(out.viewer);
    expect(await errorCode(() => composer.create(out.viewer, { ...base, teamUsername: 'crew-c', blocks: [{ type: 'image', mediaId: outImg }] }))).toBe('FORBIDDEN');
    await composer.publish(owner.viewer, d.id);
    const detail = await shots.getDetail(d.id, visitor, null);
    expect(detail.team?.username).toBe('crew-c');
    const [t] = await db.all<{ n: number }>(sql`SELECT shots_count AS n FROM profiles WHERE username = 'crew-c'`);
    expect(t!.n).toBe(1);
    expect(await errorCode(() => composer.update(owner.viewer, d.id, { teamUsername: null }))).toBe('VALIDATION');
    // Removing the attribution (BR-60) also drops the team count at once.
    await teams.removeAttribution(owner.viewer, d.id);
    const [t2] = await db.all<{ n: number }>(sql`SELECT shots_count AS n FROM profiles WHERE username = 'crew-c'`);
    expect(t2!.n).toBe(0);
  });

  it('delete: 404 at once; likes, saves, comments and counters removed; purged after 30 days (BR-65)', async () => {
    const ann = await makeProfile(db);
    const fan = await makeProfile(db);
    const img = await image(ann.viewer);
    const d = await composer.create(ann.viewer, { ...base, blocks: [{ type: 'image', mediaId: img }] });
    await composer.publish(ann.viewer, d.id);
    await likes.setLike(fan.viewer, d.id, true);
    const c = await collections.create(fan.viewer, { name: 'Saved', isPrivate: false });
    await collections.setSaved(fan.viewer, c.id, d.id, true);
    await comments.create(fan.viewer, d.id, { body: 'Nice' });
    expect(await errorCode(() => composer.remove(fan.viewer, d.id))).toBe('NOT_FOUND');
    expect(await composer.remove(ann.viewer, d.id)).toEqual({ deleted: true });
    expect(await errorCode(() => shots.getDetail(d.id, visitor, null))).toBe('NOT_FOUND');
    const [p] = await db.all<{ s: number; r: number }>(sql`SELECT shots_count AS s, likes_received_count AS r FROM profiles WHERE id = ${ann.profileId}`);
    expect(p).toEqual({ s: 0, r: 0 });
    const [col] = await db.all<{ n: number }>(sql`SELECT shots_count AS n FROM collections WHERE id = ${c.id}`);
    expect(col!.n).toBe(0);
    expect(await composer.purgeDeleted()).toBe(0);
    await db.run(sql`UPDATE shots SET deleted_at = ${Date.now() - 31 * 86_400_000} WHERE id = ${d.id}`);
    expect(await composer.purgeDeleted()).toBe(1);
    expect(Number((await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM media WHERE id = ${img}`))[0]!.n)).toBe(0);
  });
});

describe('prev/next navigation (SD-05, FR-44)', () => {
  it('moves within the owner shots in recent order and skips ineligible ones', async () => {
    const ann = await makeProfile(db);
    const s1 = await makeShot(db, { authorId: ann.profileId, ageHours: 30 });
    const s2 = await makeShot(db, { authorId: ann.profileId, ageHours: 20, hidden: true });
    const s3 = await makeShot(db, { authorId: ann.profileId, ageHours: 10 });
    void s2;
    expect(await shots.neighbours(s3.id, visitor)).toEqual({ prev: null, next: { id: s1.id, slug: s1.slug, title: s1.title } });
    expect(await shots.neighbours(s1.id, visitor)).toEqual({ prev: { id: s3.id, slug: s3.slug, title: s3.title }, next: null });
  });
});
