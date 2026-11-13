/**
 * Seed data generator (P09-02, FR-06, BR-87). Usage: `npm run db:seed` (or `npm run db:reset` for a clean DB).
 *
 * - Deterministic (fixed PRNG seed), so every developer and CI run gets the same data.
 * - All people, teams, titles and copy are original and fictional. All artwork is generated here from flat
 *   colours and simple shapes (no gradients, A-17), so it is licence-free by construction (BR-87).
 * - Images are written to `public/seed-media/<key>/<variant>.webp` (git-ignored), which is the local media
 *   host for NEXT_PUBLIC_MEDIA_BASE_URL=/seed-media (ADR-010). Binaries never go into the database (A-03).
 * - Refuses to run twice on the same database (checks for the seed marker profile).
 * - Sign-in: every seed person has the email `<username>@seed.trippple.test`; request a code on /login and read
 *   it from `.data/outbox.jsonl` (EMAIL_TRANSPORT=outbox, development only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadLocalEnv } from './_env';
loadLocalEnv();

const sharp = (await import('sharp')).default;
const { sql } = await import('drizzle-orm');
const { getDb } = await import('../src/server/db/client');
const { runMigrations } = await import('../src/server/db/migrate');
const { ensureReferenceData } = await import('../src/server/db/reference-data');
const { CATEGORIES } = await import('../src/lib/catalog');
const { slugify, tagSlug } = await import('../src/lib/slug');

const MARKER = 'northfield';
const MEDIA_DIR = path.join(process.cwd(), 'public', 'seed-media');

// ---------- deterministic randomness ----------
let state = 0x5eed1234;
const rand = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
const sample = <T>(xs: readonly T[], n: number): T[] => [...xs].sort(() => rand() - 0.5).slice(0, n);

// ---------- people ----------
const PEOPLE = [
  ['ines-moreau', 'Inès Moreau', 'Product designer crafting calm finance tools', 'Lyon, France'],
  ['kofi-asante', 'Kofi Asante', 'Brand and type designer', 'Accra, Ghana'],
  ['mei-tanaka', 'Mei Tanaka', 'Illustrator who draws small worlds', 'Osaka, Japan'],
  ['lucas-brandt', 'Lucas Brandt', 'Motion designer and animator', 'Hamburg, Germany'],
  ['priya-nair', 'Priya Nair', 'Mobile UX lead', 'Bengaluru, India'],
  ['tomas-silva', 'Tomás Silva', 'Web designer for independent shops', 'Porto, Portugal'],
  ['amara-okafor', 'Amara Okafor', 'Print and editorial designer', 'Lagos, Nigeria'],
  ['jonah-fields', 'Jonah Fields', 'Design systems at heart', 'Toronto, Canada'],
  ['sofia-lind', 'Sofia Lind', 'Packaging and identity', 'Malmö, Sweden'],
  ['rafael-ortiz', 'Rafael Ortiz', 'Interfaces for health and care', 'Bogotá, Colombia'],
  ['hana-kim', 'Hana Kim', 'Lettering and type experiments', 'Seoul, South Korea'],
  ['demo', 'Demo Member', 'Seed account for trying the product', 'Remote'],
] as const;
const TEAMS = [
  [MARKER, 'Northfield Studio', 'A small product studio', ['ines-moreau', 'jonah-fields', 'priya-nair']],
  ['paper-harbor', 'Paper Harbor', 'Print, packaging and identity collective', ['amara-okafor', 'sofia-lind']],
] as const;
const MODERATOR = 'demo'; // the demo account is a moderator so hidden-content states can be reviewed locally

// ---------- content vocabulary ----------
const SUBJECTS: Record<string, string[]> = {
  'product-design': ['Budget planner', 'Team dashboard', 'Invoice flow', 'Analytics overview', 'Onboarding checklist', 'Settings panel', 'Calendar sync', 'Task board'],
  'web-design': ['Bakery website', 'Studio landing page', 'Bookshop storefront', 'Conference site', 'Portfolio homepage', 'Recipe blog', 'Pricing page', 'Coffee roaster shop'],
  animation: ['Loading loop', 'Logo reveal', 'Weather transitions', 'Button micro-interaction', 'Splash animation', 'Character walk cycle', 'Menu morph', 'Pull to refresh'],
  branding: ['Ceramics studio identity', 'Tea house brand', 'Cycling club mark', 'Botanical shop identity', 'Fintech wordmark', 'Bakery logo system', 'Museum rebrand', 'Surf school badge'],
  illustration: ['Night market', 'Mountain cabin', 'Reading nook', 'City rooftops', 'Garden friends', 'Harbor morning', 'Rainy tram stop', 'Desert road'],
  mobile: ['Meditation app', 'Plant care app', 'Transit companion', 'Recipe app', 'Habit tracker', 'Language flashcards', 'Fitness log', 'Banking app'],
  typography: ['Display serif specimen', 'Variable sans study', 'Hand lettering set', 'Monospace explorations', 'Poster type layout', 'Script alphabet', 'Kinetic headline', 'Stencil letters'],
  print: ['Festival poster', 'Zine spread', 'Wine label', 'Annual report cover', 'Gig poster series', 'Book jacket', 'Menu card', 'Postcard set'],
};
const STYLE = ['minimal', 'dark mode', 'playful', 'bold', 'soft', 'geometric', 'editorial', 'clean'];
const TAGS_BY_CAT: Record<string, string[]> = {
  'product-design': ['dashboard', 'saas', 'fintech', 'data visualization', 'ux', 'ui'],
  'web-design': ['landing page', 'website', 'ecommerce', 'responsive', 'ui', 'layout'],
  animation: ['motion', 'animation', 'interaction', 'loop', 'microinteraction'],
  branding: ['logo', 'branding', 'identity', 'brand guidelines', 'mark'],
  illustration: ['illustration', 'character', 'drawing', 'scene', 'texture'],
  mobile: ['mobile', 'ios', 'android', 'app', 'ux', 'ui'],
  typography: ['typography', 'lettering', 'type', 'font', 'poster'],
  print: ['print', 'poster', 'editorial', 'packaging', 'layout'],
};
const PALETTES = [
  ['#F4EDE4', '#2F3E46', '#E07A5F', '#81B29A', '#F2CC8F'],
  ['#EDF2F4', '#2B2D42', '#8D99AE', '#EF233C', '#D90429'],
  ['#FEFAE0', '#283618', '#606C38', '#DDA15E', '#BC6C25'],
  ['#F1FAEE', '#1D3557', '#457B9D', '#A8DADC', '#E63946'],
  ['#FFF8F0', '#3D348B', '#7678ED', '#F7B801', '#F35B04'],
  ['#F8F9FA', '#212529', '#495057', '#ADB5BD', '#20C997'],
  ['#FDF0D5', '#003049', '#669BBC', '#C1121F', '#780000'],
  ['#EEF0EB', '#153243', '#284B63', '#B4B8AB', '#F4F9E9'],
  ['#FAF3DD', '#5E6472', '#AED9E0', '#FFA69E', '#B8F2E6'],
  ['#F7F7F2', '#1B998B', '#2D3047', '#FFFD82', '#FF9B71'],
];

// ---------- artwork (flat colours only) ----------
function artworkSvg(palette: string[], kind: string): string {
  const [bg, ...ink] = palette as [string, ...string[]];
  const shapes: string[] = [];
  const W = 1600;
  const H = 1200;
  if (kind === 'product-design' || kind === 'web-design' || kind === 'mobile') {
    // A simplified screen: frame, header bar, cards.
    const phone = kind === 'mobile';
    const fw = phone ? 520 : 1200;
    const fh = phone ? 1000 : 840;
    const fx = (W - fw) / 2;
    const fy = (H - fh) / 2;
    shapes.push(`<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="${phone ? 64 : 28}" fill="#FFFFFF"/>`);
    shapes.push(`<rect x="${fx}" y="${fy}" width="${fw}" height="${phone ? 140 : 90}" rx="${phone ? 64 : 28}" fill="${ink[0]}"/>`);
    const cols = phone ? 1 : 3;
    const rows = phone ? 4 : 2;
    const gap = 32;
    const cw = (fw - gap * (cols + 1)) / cols;
    const ch = (fh - (phone ? 180 : 130) - gap * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        shapes.push(
          `<rect x="${fx + gap + c * (cw + gap)}" y="${fy + (phone ? 170 : 120) + gap + r * (ch + gap)}" width="${cw}" height="${ch}" rx="18" fill="${ink[(r + c + 1) % ink.length]}" opacity="0.9"/>`,
        );
  } else if (kind === 'typography') {
    const letters = 'AaGgRrQqEeMm';
    const ch = letters.charAt(int(0, letters.length - 1));
    shapes.push(`<circle cx="${int(400, 1200)}" cy="${int(300, 900)}" r="${int(280, 420)}" fill="${ink[2]}"/>`);
    shapes.push(`<text x="800" y="820" text-anchor="middle" font-family="Georgia, serif" font-size="760" font-weight="700" fill="${ink[0]}">${ch}</text>`);
  } else {
    // Illustration, branding, print, animation: layered flat shapes.
    shapes.push(`<rect x="0" y="${int(700, 900)}" width="${W}" height="${H}" fill="${ink[1]}"/>`);
    shapes.push(`<circle cx="${int(300, 1300)}" cy="${int(250, 500)}" r="${int(120, 220)}" fill="${ink[3] ?? ink[0]}"/>`);
    for (let i = 0; i < 5; i++) {
      const x = int(100, 1400);
      const w = int(120, 360);
      const h = int(200, 600);
      shapes.push(`<rect x="${x}" y="${900 - h}" width="${w}" height="${h}" rx="${kind === 'branding' ? 999 : 12}" fill="${ink[i % ink.length]}"/>`);
    }
    if (kind === 'branding') shapes.push(`<circle cx="800" cy="600" r="220" fill="#FFFFFF"/><circle cx="800" cy="600" r="120" fill="${ink[0]}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${bg}"/>${shapes.join('')}</svg>`;
}

const VARIANTS = [
  ['cover-400', 400, 300],
  ['cover-800', 800, 600],
  ['w800', 800, 600],
  ['w1200', 1200, 900],
  ['w1600', 1600, 1200],
] as const;

async function writeArtwork(key: string, svg: string) {
  const dir = path.join(MEDIA_DIR, key);
  const largest = path.join(dir, 'w1600.webp');
  // Deterministic output: files from an earlier run are identical, so reuse them (the SVG was still generated,
  // which keeps the random sequence, and therefore the data, the same).
  if (VARIANTS.every(([name]) => fs.existsSync(path.join(dir, `${name}.webp`)))) return fs.statSync(largest).size;
  fs.mkdirSync(dir, { recursive: true });
  const base = sharp(Buffer.from(svg));
  const png = await base.png().toBuffer();
  let bytes = 0;
  for (const [name, w, h] of VARIANTS) {
    const out = await sharp(png).resize(w, h, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();
    fs.writeFileSync(path.join(dir, `${name}.webp`), out);
    if (name === 'w1600') bytes = out.length;
  }
  return bytes;
}

// ---------- colour maths for shot_colors (BR-63, BR-80) ----------
function hexToLab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

// ---------- main ----------
await runMigrations();
const db = await getDb();
await ensureReferenceData(db);

const existing = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM profiles WHERE username = ${MARKER}`);
if (Number(existing[0]?.n ?? 0) > 0) {
  console.log('Seed data is already present. Run `npm run db:reset` for a fresh database.');
  process.exit(0);
}

const started = Date.now();
const now = Date.now();
const DAY = 86_400_000;
const profileIds = new Map<string, number>();

for (const [username, name, headline, location] of PEOPLE) {
  const userId = `seed-${username}`;
  const created = now - int(200, 900) * DAY;
  await db.run(sql`INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
    VALUES (${userId}, ${name}, ${`${username}@seed.trippple.test`}, 1, ${created}, ${created})`);
  const skills = JSON.stringify(sample(['UI design', 'UX research', 'Branding', 'Illustration', 'Motion', 'Typography', 'Prototyping', 'Design systems'], 3));
  const rows = await db.all<{ id: number }>(sql`INSERT INTO profiles
      (user_id, kind, username, display_name, headline, bio, location, skills, languages, role, created_at, updated_at)
    VALUES (${userId}, 'individual', ${username}, ${name}, ${headline},
      ${`${name.split(' ')[0]} works on ${headline.toLowerCase()}. This is seed content for local development.`},
      ${location}, ${skills}, ${JSON.stringify(['English'])}, ${username === MODERATOR ? 'moderator' : 'member'}, ${created}, ${created})
    RETURNING id`);
  profileIds.set(username, Number(rows[0]!.id));
}
for (const [username, name, headline, members] of TEAMS) {
  const created = now - int(300, 900) * DAY;
  const rows = await db.all<{ id: number }>(sql`INSERT INTO profiles (kind, username, display_name, headline, is_featured_studio, created_at, updated_at)
    VALUES ('team', ${username}, ${name}, ${headline}, ${username === MARKER ? 1 : 0}, ${created}, ${created}) RETURNING id`);
  const teamId = Number(rows[0]!.id);
  profileIds.set(username, teamId);
  for (const [i, m] of members.entries()) {
    await db.run(sql`INSERT INTO team_memberships (team_id, member_id, role, created_at) VALUES (${teamId}, ${profileIds.get(m)!}, ${i === 0 ? 'owner' : 'member'}, ${created})`);
  }
}
for (const [username] of PEOPLE.slice(0, 6)) {
  await db.run(sql`INSERT INTO user_social_links (profile_id, platform, url, position) VALUES
    (${profileIds.get(username)!}, 'website', ${`https://example.com/${username}`}, 0)`);
}

const authors = PEOPLE.map((p) => p[0]).filter((u) => u !== 'demo');
const teamOf = new Map<string, string>();
for (const [team, , , members] of TEAMS) for (const m of members) teamOf.set(m, team);

type SeedShot = { id: number; authorId: number };
const created: SeedShot[] = [];
let mediaCount = 0;

for (const cat of CATEGORIES) {
  for (const subject of SUBJECTS[cat.slug]!) {
    const author = pick(authors);
    const authorId = profileIds.get(author)!;
    const team = teamOf.get(author) && rand() < 0.5 ? profileIds.get(teamOf.get(author)!)! : null;
    const title = `${subject} — ${pick(STYLE)}`.replace(/^(.)/, (c) => c.toUpperCase());
    const palette = pick(PALETTES);
    const publishedAt = now - Math.floor(rand() ** 2 * 400 * DAY) - int(1, 20) * 3_600_000;
    const tags = sample(TAGS_BY_CAT[cat.slug]!, int(2, 4));
    const imageCount = rand() < 0.4 ? 2 : 1;
    const mediaIds: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      const id = `seed-${String(++mediaCount).padStart(4, '0')}`;
      const key = `seed/${id}`;
      const bytes = await writeArtwork(key, artworkSvg(i === 0 ? palette : [...palette].reverse(), cat.slug));
      await db.run(sql`INSERT INTO media (id, owner_profile_id, storage_key, mime_type, width, height, bytes, dominant_color, status, created_at)
        VALUES (${id}, ${authorId}, ${key}, 'image/webp', 1600, 1200, ${bytes}, ${palette[0]}, 'ready', ${publishedAt})`);
      mediaIds.push(id);
    }
    const authorName = PEOPLE.find((p) => p[0] === author)![1];
    const description = `${subject} explored in a ${pick(STYLE)} direction. Seed content generated for local development; the artwork is flat shapes in a five-colour palette.`;
    const rows = await db.all<{ id: number }>(sql`INSERT INTO shots
        (author_id, team_id, title, slug, description, category_id, cover_media_id, status, published_at, search_tags, search_author, created_at, updated_at)
      VALUES (${authorId}, ${team}, ${title}, ${slugify(title)}, ${description}, ${cat.id}, ${mediaIds[0]!}, 'published', ${publishedAt},
        ${tags.join(' ')}, ${`${authorName} ${author}`}, ${publishedAt}, ${publishedAt})
      RETURNING id`);
    const shotId = Number(rows[0]!.id);
    let pos = 0;
    await db.run(sql`INSERT INTO content_blocks (shot_id, position, type, media_id, alt, is_full_width) VALUES (${shotId}, ${pos++}, 'image', ${mediaIds[0]!}, ${`${subject}: main artwork`}, 1)`);
    if (rand() < 0.5) {
      await db.run(sql`INSERT INTO content_blocks (shot_id, position, type, text_body) VALUES (${shotId}, ${pos++}, 'text',
        ${`Notes on ${subject.toLowerCase()}: the layout keeps one clear focal point, generous spacing and a restrained palette.`})`);
    }
    if (mediaIds[1]) {
      await db.run(sql`INSERT INTO content_blocks (shot_id, position, type, media_id, alt) VALUES (${shotId}, ${pos++}, 'image', ${mediaIds[1]}, ${`${subject}: detail view`})`);
    }
    for (const [i, hex] of palette.entries()) {
      const [l, a, b] = hexToLab(hex);
      await db.run(sql`INSERT INTO shot_colors (shot_id, position, hex, lab_l, lab_a, lab_b) VALUES (${shotId}, ${i}, ${hex.toLowerCase()}, ${l}, ${a}, ${b})`);
    }
    for (const t of tags) {
      await db.run(sql`INSERT INTO tags (name, slug) VALUES (${t}, ${tagSlug(t)}) ON CONFLICT(name) DO NOTHING`);
      await db.run(sql`INSERT INTO shot_tags (shot_id, tag_id) SELECT ${shotId}, id FROM tags WHERE name = ${t}`);
    }
    created.push({ id: shotId, authorId });
  }
}

// Likes (not own shots, BR-46) and daily views. Counters are then rebuilt from source rows (BR-27).
const members = PEOPLE.map((p) => profileIds.get(p[0])!);
for (const s of created) {
  for (const m of sample(members, int(0, members.length - 1))) {
    if (m === s.authorId) continue;
    await db.run(sql`INSERT INTO likes (profile_id, shot_id, created_at) VALUES (${m}, ${s.id}, ${now - int(1, 300) * 3_600_000}) ON CONFLICT DO NOTHING`);
  }
  for (let d = 0; d < int(1, 6); d++) {
    const day = new Date(now - d * DAY).toISOString().slice(0, 10);
    await db.run(sql`INSERT INTO shot_view_daily (shot_id, day, views) VALUES (${s.id}, ${day}, ${int(3, 400)}) ON CONFLICT DO NOTHING`);
  }
}

const shots = await import('../src/modules/shots/service');
const likes = await import('../src/modules/likes/service');
const views = await import('../src/modules/views/service');
const search = await import('../src/modules/search/service');
await likes.reconcile();
await views.reconcile();
await shots.reconcileShotsCount();
await search.reconcileTagCounts();
await shots.recomputePopularity();

console.log(
  `Seeded ${PEOPLE.length} people, ${TEAMS.length} teams, ${created.length} shots and ${mediaCount} generated images in ${((Date.now() - started) / 1000).toFixed(1)} s.`,
);
console.log('Sign in locally as demo@seed.trippple.test (moderator); the code appears in .data/outbox.jsonl.');
process.exit(0);
