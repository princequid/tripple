/**
 * Applies the supplied prototype images (public/images/) to the local demo data. Usage:
 *   npm run images:apply            assign and render
 *   npm run images:apply -- --dry   show the plan only
 *
 * Folder layout (originals are kept as supplied; derived files go to public/seed-media/, which is git-ignored):
 *   public/images/projects/                  shot artwork, assigned to the most popular shots first
 *   public/images/projects/<category-slug>/  artwork for one category (product-design, web-design, animation,
 *                                            branding, illustration, mobile, typography, print)
 *   public/images/avatars/<username>.jpg     profile picture for that account (e.g. mei-tanaka.jpg, northfield.png);
 *                                            other file names go to accounts without a picture, in order
 *   public/images/manifest.json (optional)   per-file overrides, e.g.
 *     { "projects/coffee-site.jpg": { "shot": 12, "title": "Coffee roaster website" } }
 *
 * Images are processed exactly like a real upload (src/server/storage): EXIF orientation applied, sRGB,
 * 4:3 cover crops with `attention` focus, full-width variants without enlargement, and the 7-colour palette.
 * A shot whose cover is replaced and that still has a generated second image gets the next supplied image of the
 * same category, or the generated block is removed so real and generated art never sit together.
 * Assignments are stable across runs (.data/image-assignments.json). `npm run db:reset` restores generated art.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadLocalEnv } from './_env';
loadLocalEnv();

const sharp = (await import('sharp')).default;
const { sql } = await import('drizzle-orm');
const { getDb } = await import('../src/server/db/client');
const { colours, hexToLab } = await import('../src/server/storage/image');
const { slugify } = await import('../src/lib/slug');

const DRY = process.argv.includes('--dry');
const ROOT = path.join(process.cwd(), 'public', 'images');
const MEDIA = process.env.LOCAL_MEDIA_DIR ?? path.join(process.cwd(), 'public', 'seed-media');
const STATE = path.join(process.cwd(), '.data', 'image-assignments.json');
const GENERATED = path.join(process.cwd(), 'src', 'services', 'mock', 'assets.generated.ts');
const IMG = /\.(jpe?g|png|webp|avif)$/i;
const CATS = ['product-design', 'web-design', 'animation', 'branding', 'illustration', 'mobile', 'typography', 'print'];

type Manifest = Record<string, { shot?: number; title?: string; description?: string; username?: string }>;
/** Default copy for a supplied image when the manifest gives no description (replaces the "flat shapes" seed text). */
const DESCRIBE: Record<string, (t: string) => string> = {
  'product-design': (t) => `${t}: a product design exploration focused on clear hierarchy, calm data density and the states people actually meet.`,
  'web-design': (t) => `${t}: a responsive web concept with a confident hero, generous spacing and a clear path to the main action.`,
  animation: (t) => `${t}: interface and motion study, designed so transitions guide attention instead of decorating.`,
  branding: (t) => `${t}: brand and product work where colour, type and photography carry one consistent identity.`,
  illustration: (t) => `${t}: an expressive visual concept where imagery and colour set the mood of the whole experience.`,
  mobile: (t) => `${t}: mobile screens designed for one-handed use, with thumb-friendly controls and focused flows.`,
  typography: (t) => `${t}: a type-led layout where scale, weight and rhythm do most of the design work.`,
  print: (t) => `${t}: a presentation layout composing several screens into one editorial board.`,
};
type State = { covers: Record<string, number>; details: Record<string, number>; avatars: Record<string, string> };

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join('/');
const list = (dir: string): string[] =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((d) => (d.isDirectory() ? list(path.join(dir, d.name)) : IMG.test(d.name) ? [path.join(dir, d.name)] : []))
        .sort()
    : [];
const manifest: Manifest = fs.existsSync(path.join(ROOT, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8')) : {};
const state: State = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { covers: {}, details: {}, avatars: {} };

async function render(key: string, buf: Buffer, square: boolean) {
  const dir = path.join(MEDIA, key);
  fs.mkdirSync(dir, { recursive: true });
  const variants: [string, number, number | null][] = square
    ? [['cover-400', 400, 400], ['cover-800', 800, 800], ['w800', 800, 800], ['w1200', 800, 800], ['w1600', 800, 800]]
    : [['cover-400', 400, 300], ['cover-800', 800, 600], ['w800', 800, null], ['w1200', 1200, null], ['w1600', 1600, null]];
  let bytes = 0;
  for (const [name, w, h] of variants) {
    const img = sharp(buf).rotate().toColourspace('srgb');
    const out = await (h ? img.resize(w, h, { fit: 'cover', position: 'attention' }) : img.resize(w, null, { withoutEnlargement: true })).webp({ quality: 84 }).toBuffer();
    fs.writeFileSync(path.join(dir, `${name}.webp`), out);
    bytes = Math.max(bytes, out.length);
  }
  const meta = await sharp(buf).rotate().metadata();
  return { bytes, width: meta.autoOrient?.width ?? meta.width ?? 1600, height: meta.autoOrient?.height ?? meta.height ?? 1200 };
}

const db = await getDb();
const shots = await db.all<{ id: number; title: string; cat: string; mediaId: string; key: string }>(sql`
  SELECT s.id AS id, s.title AS title, c.slug AS cat, s.cover_media_id AS mediaId, m.storage_key AS key
  FROM shots s JOIN categories c ON c.id = s.category_id JOIN media m ON m.id = s.cover_media_id
  WHERE s.status = 'published' ORDER BY s.likes_count DESC, s.views_count DESC, s.id`);
const projectFiles = list(path.join(ROOT, 'projects'));
const avatarFiles = list(path.join(ROOT, 'avatars'));
const otherFiles = list(ROOT).filter((f) => !projectFiles.includes(f) && !avatarFiles.includes(f));

// ---------- plan covers ----------
const taken = new Set(Object.values(state.covers));
const plan: { file: string; shot: (typeof shots)[number] }[] = [];
for (const file of projectFiles) {
  const r = rel(file);
  const m = manifest[r];
  let id = m?.shot ?? state.covers[r];
  if (id === undefined) {
    const sub = r.split('/')[1];
    const cat = CATS.includes(sub ?? '') ? sub : null;
    id = shots.find((s) => !taken.has(s.id) && (!cat || s.cat === cat))?.id;
    if (id === undefined && cat) {
      console.warn(`  ! no free ${cat} shot for ${r}; it will be used as a second image if possible`);
      continue;
    }
  }
  const shot = shots.find((s) => s.id === id);
  if (!shot) continue;
  taken.add(shot.id);
  state.covers[r] = shot.id;
  plan.push({ file, shot });
}
const usedFiles = new Set(plan.map((p) => p.file));
const spare = projectFiles.filter((f) => !usedFiles.has(f) && !Object.prototype.hasOwnProperty.call(state.details, rel(f)));

console.log(`Images found: ${projectFiles.length} project, ${avatarFiles.length} avatar, ${otherFiles.length} other (not yet placed: ${otherFiles.map(rel).join(', ') || 'none'}).`);
for (const p of plan) console.log(`  cover  ${rel(p.file)} → shot ${p.shot.id} (${p.shot.cat}) "${manifest[rel(p.file)]?.title ?? p.shot.title}"`);
if (DRY) process.exit(0);

// ---------- apply covers (+ second images) ----------
for (const { file, shot } of plan) {
  const buf = fs.readFileSync(file);
  const { bytes, width, height } = await render(shot.key, buf, false);
  const { dominant, palette } = await colours(buf);
  await db.run(sql`UPDATE media SET width = ${width}, height = ${height}, bytes = ${bytes}, dominant_color = ${dominant}, palette = ${JSON.stringify(palette)}, mime_type = 'image/webp' WHERE id = ${shot.mediaId}`);
  await db.run(sql`DELETE FROM shot_colors WHERE shot_id = ${shot.id}`);
  for (const [i, hex] of palette.slice(0, 5).entries()) {
    const { l, a, b } = hexToLab(hex);
    await db.run(sql`INSERT INTO shot_colors (shot_id, position, hex, lab_l, lab_a, lab_b) VALUES (${shot.id}, ${i}, ${hex.toLowerCase()}, ${l}, ${a}, ${b})`);
  }
  const title = manifest[rel(file)]?.title;
  if (title) await db.run(sql`UPDATE shots SET title = ${title}, slug = ${slugify(title)} WHERE id = ${shot.id}`);
  const description = manifest[rel(file)]?.description ?? DESCRIBE[shot.cat]?.(title ?? shot.title);
  if (description) await db.run(sql`UPDATE shots SET description = ${description} WHERE id = ${shot.id}`);
  await db.run(sql`UPDATE content_blocks SET alt = ${`${title ?? shot.title}: main artwork`} WHERE shot_id = ${shot.id} AND media_id = ${shot.mediaId}`);

  // Generated second images next to a real cover look wrong: replace with a spare image of the same category, else drop.
  const extra = await db.all<{ id: number; mediaId: string; key: string }>(sql`
    SELECT b.id AS id, b.media_id AS mediaId, m.storage_key AS key FROM content_blocks b JOIN media m ON m.id = b.media_id
    WHERE b.shot_id = ${shot.id} AND b.type = 'image' AND b.media_id <> ${shot.mediaId}`);
  for (const blk of extra) {
    if (Object.values(state.details).includes(blk.id)) continue;
    const i = spare.findIndex((f) => rel(f).split('/')[1] === shot.cat);
    if (i >= 0) {
      const f = spare.splice(i, 1)[0]!;
      const b2 = fs.readFileSync(f);
      const r2 = await render(blk.key, b2, false);
      await db.run(sql`UPDATE media SET width = ${r2.width}, height = ${r2.height}, bytes = ${r2.bytes} WHERE id = ${blk.mediaId}`);
      state.details[rel(f)] = blk.id;
      console.log(`  detail ${rel(f)} → shot ${shot.id}`);
    } else {
      await db.run(sql`DELETE FROM content_blocks WHERE id = ${blk.id}`);
    }
  }
}

// ---------- avatars ----------
const profiles = await db.all<{ id: number; username: string; avatar: string | null }>(sql`SELECT id, username, avatar_media_id AS avatar FROM profiles ORDER BY id`);
const byName = new Map(profiles.map((p) => [p.username, p]));
const claimed = new Set(Object.values(state.avatars));
for (const file of avatarFiles) {
  const r = rel(file);
  const stem = path.basename(file).replace(IMG, '').toLowerCase();
  let username = manifest[r]?.username ?? state.avatars[r] ?? (byName.has(stem) ? stem : undefined);
  username ??= profiles.find((p) => !claimed.has(p.username) && !p.avatar)?.username;
  const p = username ? byName.get(username) : undefined;
  if (!p) {
    console.warn(`  ! no account left for avatar ${r}`);
    continue;
  }
  claimed.add(p.username);
  state.avatars[r] = p.username;
  const id = `avatar-${p.username}`;
  const key = `avatars/${p.username}`;
  const buf = fs.readFileSync(file);
  const { bytes, width, height } = await render(key, buf, true);
  const { dominant } = await colours(buf);
  await db.run(sql`INSERT INTO media (id, owner_profile_id, storage_key, mime_type, width, height, bytes, dominant_color, status, purpose, created_at)
    VALUES (${id}, ${p.id}, ${key}, 'image/webp', ${width}, ${height}, ${bytes}, ${dominant}, 'ready', 'avatar', ${Date.now()})
    ON CONFLICT(id) DO UPDATE SET width = excluded.width, height = excluded.height, bytes = excluded.bytes, dominant_color = excluded.dominant_color`);
  await db.run(sql`UPDATE profiles SET avatar_media_id = ${id} WHERE id = ${p.id}`);
  console.log(`  avatar ${r} → @${p.username}`);
}

// ---------- outputs ----------
fs.mkdirSync(path.dirname(STATE), { recursive: true });
fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
const avatarKeys = Object.fromEntries(Object.values(state.avatars).map((u) => [u, `avatars/${u}`]));
fs.writeFileSync(
  GENERATED,
  `/** Generated by scripts/apply-images.ts — do not edit. Media keys of the supplied images, for the mock store. */\nexport const AVATAR_KEYS: Record<string, string> = ${JSON.stringify(avatarKeys, null, 2)};\n`,
);
console.log(`Applied ${plan.length} covers, ${Object.keys(state.details).length} second images, ${Object.keys(state.avatars).length} avatars.`);
