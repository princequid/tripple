/**
 * Gives the generated placeholder covers a realistic mix of aspect ratios, so the v3 masonry grid (A-27) can be
 * demonstrated before the user's own images arrive. Usage: `npm run db:shape-placeholders` (also run by db:reset).
 *
 * - Works only on generated seed art (`seed/…` keys). Shots that received a supplied image (images:apply) are skipped.
 * - Re-crops from a preserved original (`orig-1600.webp`, the 4:3 render from scripts/seed.ts), so it is idempotent.
 * - Variants match the upload pipeline: 4:3 cover crops (attention) + width-only w800/w1200/w1600 (no enlargement).
 * - No new artwork is created: the same generated image is cropped to another shape.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadLocalEnv } from './_env';
loadLocalEnv();

const sharp = (await import('sharp')).default;
const { sql } = await import('drizzle-orm');
const { getDb } = await import('../src/server/db/client');

const MEDIA = process.env.LOCAL_MEDIA_DIR ?? path.join(process.cwd(), 'public', 'seed-media');
const ASSIGNED = path.join(process.cwd(), '.data', 'image-assignments.json');
type Shape = { name: string; w: number; h: number } | null;
const S = (name: string, w: number, h: number): Shape => ({ name, w, h });
// Repeating mix (null = keep the original 4:3 landscape).
const PATTERN: Shape[] = [
  null, S('tall', 800, 1200), S('square', 1200, 1200), S('wide', 1600, 900), S('portrait', 960, 1200), null,
  S('square', 1200, 1200), S('tall', 800, 1200), S('portrait', 960, 1200), S('wide', 1600, 900), null, S('square', 1200, 1200),
];
const SMALL = S('small', 320, 320); // logo-sized art for two branding shots: shown at natural size, never stretched

const db = await getDb();
const skip = new Set<number>(fs.existsSync(ASSIGNED) ? Object.values((JSON.parse(fs.readFileSync(ASSIGNED, 'utf8')) as { covers: Record<string, number> }).covers) : []);
const shots = await db.all<{ id: number; cat: string; mediaId: string; key: string }>(sql`
  SELECT s.id AS id, c.slug AS cat, m.id AS mediaId, m.storage_key AS key
  FROM shots s JOIN categories c ON c.id = s.category_id JOIN media m ON m.id = s.cover_media_id
  WHERE m.storage_key LIKE 'seed/%' ORDER BY s.id`);

let changed = 0;
let brandingSmall = 0;
for (const [i, shot] of shots.entries()) {
  if (skip.has(shot.id)) continue;
  const dir = path.join(MEDIA, shot.key);
  const orig = path.join(dir, 'orig-1600.webp');
  const w1600 = path.join(dir, 'w1600.webp');
  if (!fs.existsSync(orig)) {
    if (!fs.existsSync(w1600)) continue;
    fs.copyFileSync(w1600, orig);
  }
  let shape = PATTERN[i % PATTERN.length] ?? null;
  if (shot.cat === 'branding' && brandingSmall < 2 && i % 2 === 1) {
    shape = SMALL;
    brandingSmall++;
  }
  const src = fs.readFileSync(orig);
  const art = shape ? await sharp(src).resize(shape.w, shape.h, { fit: 'cover', position: 'attention' }).webp({ quality: 88 }).toBuffer() : src;
  const meta = await sharp(art).metadata();
  const width = meta.width ?? 1600;
  const height = meta.height ?? 1200;
  const variants: [string, number, number | null][] = [['cover-400', 400, 300], ['cover-800', 800, 600], ['w800', 800, null], ['w1200', 1200, null], ['w1600', 1600, null]];
  for (const [name, w, h] of variants) {
    const img = sharp(art);
    const out = h ? img.resize(w, h, { fit: 'cover', position: 'attention' }) : img.resize(w, null, { withoutEnlargement: true });
    fs.writeFileSync(path.join(dir, `${name}.webp`), await out.webp({ quality: 84 }).toBuffer());
  }
  await db.run(sql`UPDATE media SET width = ${width}, height = ${height} WHERE id = ${shot.mediaId}`);
  changed++;
}
console.log(`Placeholder shapes: ${changed} covers re-rendered (${brandingSmall} small), ${skip.size} supplied images left untouched.`);
