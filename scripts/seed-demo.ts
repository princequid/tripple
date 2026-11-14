/**
 * Demo content for the prototype (frontend demo prep, not backend logic). Usage: `npm run db:seed-demo`.
 *
 * `npm run db:seed` creates people, teams and shots (R1). The R2 tables (follows, collections, comments, jobs)
 * stay empty, so the follow graph, saved collections, comment threads and the job board look unused in a demo.
 * This script fills them with an interconnected, deterministic set of rows that use the same seed people and
 * shots, then recomputes every denormalised counter so all screens agree.
 *
 * - Data only: it writes rows that the existing R2 endpoints would have written; no service code changes.
 * - Jobs and companies reuse the mock fixtures (src/services/mock/fixtures.ts), so live and mock agree.
 * - Idempotent: refuses to run twice (checks for the demo marker collection).
 */
import { loadLocalEnv } from './_env';
loadLocalEnv();

const { sql } = await import('drizzle-orm');
const { getDb } = await import('../src/server/db/client');
const { JOB_SEEDS, jobDescription } = await import('../src/services/mock/fixtures');
const { slugify } = await import('../src/lib/slug');

const MARKER = 'Calm interfaces';
const DAY = 86_400_000;
const now = Date.now();

let state = 0x7e1e5eed;
const rand = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
const sample = <T>(xs: readonly T[], n: number): T[] => [...xs].sort(() => rand() - 0.5).slice(0, n);

const db = await getDb();
const started = Date.now();

// ---------- profile copy: real-sounding bios, skills and languages (safe to re-apply) ----------
const PROFILE_COPY: Record<string, { bio: string; skills: string[]; languages: string[]; location?: string; website?: string }> = {
  'ines-moreau': { bio: 'Product designer at Northfield Studio. I spend most of my time on budgeting and invoicing tools, turning dense financial data into screens people actually enjoy opening. Previously design lead at a Lyon fintech.', skills: ['Product design', 'UX', 'Design systems', 'Prototyping'], languages: ['French', 'English'] },
  'kofi-asante': { bio: 'Independent brand and type designer. I build identities for small food, drink and culture businesses across West Africa and Europe, and I draw a custom typeface for almost every one of them.', skills: ['Branding', 'Typography', 'Logo design', 'Packaging'], languages: ['English', 'Twi'] },
  'mei-tanaka': { bio: 'Illustrator drawing small, lived-in worlds: rooftops, night markets and quiet rooms. Editorial clients include magazines, picture book publishers and the occasional tea brand.', skills: ['Illustration', 'Editorial', 'Character design'], languages: ['Japanese', 'English'] },
  'lucas-brandt': { bio: 'Motion designer and animator. Logo reveals, product loops and UI transitions with careful timing. Currently booked through January.', skills: ['Animation', 'Motion', 'After Effects', 'Lottie'], languages: ['German', 'English'] },
  'priya-nair': { bio: 'Mobile UX lead at Northfield Studio. I run research with real commuters, patients and shoppers, then design the small screens they rely on every day.', skills: ['Mobile', 'UX research', 'Prototyping', 'Accessibility'], languages: ['English', 'Hindi', 'Malayalam'] },
  'tomas-silva': { bio: 'Web designer for independent shops, roasters and bookstores. Fast, honest websites that sell without shouting.', skills: ['Web design', 'E-commerce', 'Webflow'], languages: ['Portuguese', 'English', 'Spanish'] },
  'amara-okafor': { bio: 'Print and editorial designer, co-founder of Paper Harbor. Posters, book jackets and annual reports with a strong grid and confident type.', skills: ['Print', 'Editorial', 'Layout', 'Typography'], languages: ['English', 'Igbo'] },
  'jonah-fields': { bio: 'Design systems designer at Northfield Studio. Tokens, components and the documentation that keeps teams shipping consistent interfaces.', skills: ['Design systems', 'UI', 'Figma', 'Documentation'], languages: ['English', 'French'] },
  'sofia-lind': { bio: 'Packaging and identity designer at Paper Harbor. I love tactile materials, honest colour and labels you can read from across the shop.', skills: ['Packaging', 'Branding', 'Identity'], languages: ['Swedish', 'English'] },
  'rafael-ortiz': { bio: 'Interface designer for health and care. Patient portals, clinic tools and accessible forms that work for everyone, including on a cracked phone screen.', skills: ['Product design', 'Accessibility', 'UI'], languages: ['Spanish', 'English'] },
  'hana-kim': { bio: 'Lettering artist and type designer. Experiments with display serifs, scripts and kinetic headlines. Open to commissions for logotypes and book covers.', skills: ['Lettering', 'Typography', 'Illustration'], languages: ['Korean', 'English'] },
  demo: { bio: 'Exploring Trippple: saving inspiration, following designers and trying out the tools.', skills: ['Product design', 'UI'], languages: ['English'] },
  northfield: { bio: 'Northfield is a small product studio in Lyon. We design calm, useful software for finance, transit and health teams.', skills: ['Product design', 'Web design', 'Mobile', 'Design systems'], languages: ['English', 'French'], location: 'Lyon, France', website: 'https://example.com/northfield' },
  'paper-harbor': { bio: 'A print, packaging and identity collective working between Lagos and MalmÃ¶.', skills: ['Print', 'Packaging', 'Branding'], languages: ['English'], location: 'Lagos, Nigeria', website: 'https://example.com/paper-harbor' },
};
for (const [username, c] of Object.entries(PROFILE_COPY)) {
  await db.run(sql`UPDATE profiles SET bio = ${c.bio}, skills = ${JSON.stringify(c.skills)}, languages = ${JSON.stringify(c.languages)},
    location = COALESCE(${c.location ?? null}, location), website_url = COALESCE(${c.website ?? null}, website_url) WHERE username = ${username}`);
}

const done = await db.all<{ n: number }>(sql`SELECT count(*) AS n FROM collections WHERE name = ${MARKER}`);
if (Number(done[0]?.n) > 0) {
  console.log('Demo content is already present. Run `npm run db:reset` for a clean copy (it re-applies this script).');
  process.exit(0);
}

const profiles = await db.all<{ id: number; username: string; kind: string }>(sql`SELECT id, username, kind FROM profiles`);
const pid = new Map(profiles.map((p) => [p.username, p.id]));
const people = profiles.filter((p) => p.kind === 'individual');
const teams = profiles.filter((p) => p.kind === 'team');
const shots = await db.all<{ id: number; authorId: number; title: string; cat: string; publishedAt: number }>(sql`
  SELECT s.id AS id, s.author_id AS authorId, s.title AS title, c.slug AS cat, s.published_at AS publishedAt
  FROM shots s JOIN categories c ON c.id = s.category_id WHERE s.status = 'published'`);
if (!people.length || !shots.length) {
  console.error('No seed people or shots. Run `npm run db:seed` first.');
  process.exit(1);
}
const byCat = (...cats: string[]) => shots.filter((s) => cats.includes(s.cat));

// ---------- follows: a believable graph (everyone follows 4-8 people; studios are popular) ----------
const follows = new Set<string>();
for (const p of people) {
  for (const o of sample(people.filter((x) => x.id !== p.id), int(4, 8))) follows.add(`${p.id}>${o.id}`);
  for (const t of teams) if (rand() < 0.55) follows.add(`${p.id}>${t.id}`);
}
// The demo account follows a curated set so its feeds and notifications feel lived in.
for (const u of ['ines-moreau', 'mei-tanaka', 'kofi-asante', 'priya-nair', 'northfield']) {
  const a = pid.get('demo');
  const b = pid.get(u);
  if (a && b) follows.add(`${a}>${b}`);
}
for (const f of follows) {
  const [a, b] = f.split('>').map(Number);
  await db.run(sql`INSERT OR IGNORE INTO follows (follower_id, followee_id, created_at) VALUES (${a}, ${b}, ${now - int(1, 90) * DAY})`);
}

// ---------- collections: themed, owned by people who would actually keep them ----------
const COLLECTIONS: [string, string, string | null, string[], boolean][] = [
  ['ines-moreau', MARKER, 'Dashboards and tools that stay quiet until you need them.', ['product-design', 'mobile'], false],
  ['ines-moreau', 'Onboarding references', null, ['product-design', 'web-design'], false],
  ['kofi-asante', 'Marks I keep coming back to', 'Logos with one good idea each.', ['branding', 'typography'], false],
  ['kofi-asante', 'Client moodboard: tea house', null, ['branding', 'print', 'illustration'], true],
  ['mei-tanaka', 'Colour and light', 'Scenes where the palette does the storytelling.', ['illustration', 'print'], false],
  ['lucas-brandt', 'Motion studies', 'Loops, reveals and transitions worth reverse-engineering.', ['animation'], false],
  ['priya-nair', 'Mobile patterns', 'Navigation, empty states and small delights on small screens.', ['mobile', 'product-design'], false],
  ['tomas-silva', 'Shop homepages', null, ['web-design'], false],
  ['amara-okafor', 'Poster wall', 'Print pieces with confident type.', ['print', 'typography'], false],
  ['jonah-fields', 'Systems thinking', 'Interfaces built from a clear set of parts.', ['product-design', 'web-design', 'mobile'], false],
  ['sofia-lind', 'Packaging shelf', null, ['branding', 'print'], false],
  ['hana-kim', 'Letterforms', 'Type specimens and lettering I admire.', ['typography'], false],
  ['demo', 'Inspiration for the demo', 'Saved while exploring Trippple.', ['product-design', 'illustration', 'branding'], false],
  ['demo', 'Landing pages', null, ['web-design'], false],
];
let collectionCount = 0;
for (const [owner, name, description, cats, isPrivate] of COLLECTIONS) {
  const ownerId = pid.get(owner);
  if (!ownerId) continue;
  const pool = byCat(...cats).filter((s) => s.authorId !== ownerId);
  const picks = sample(pool, Math.min(pool.length, int(4, 9)));
  const created = now - int(20, 120) * DAY;
  const updated = now - int(0, 18) * DAY;
  const r = await db.all<{ id: number }>(sql`INSERT INTO collections (owner_id, name, name_key, description, is_private, created_at, updated_at)
    VALUES (${ownerId}, ${name}, ${name.trim().toLowerCase()}, ${description}, ${isPrivate ? 1 : 0}, ${created}, ${updated}) RETURNING id`);
  const cid = r[0]!.id;
  for (const [i, s] of picks.entries())
    await db.run(sql`INSERT OR IGNORE INTO collection_items (collection_id, shot_id, created_at) VALUES (${cid}, ${s.id}, ${updated - i * 3_600_000})`);
  collectionCount++;
}

// ---------- comments: category-aware threads with replies from the author ----------
const LINES: Record<string, string[]> = {
  'product-design': [
    'The hierarchy in the summary cards is so clear. Did you test it with real numbers?',
    'Love how calm this feels for something so data-heavy.',
    'The empty state treatment is a nice touch. Most dashboards skip it.',
    'How are you handling this on smaller laptops? The sidebar looks generous.',
  ],
  'web-design': [
    'The type pairing on the hero is lovely.',
    'This would convert so well. The pricing block is very readable.',
    'Great rhythm between sections. What grid are you using?',
    'The product photography placeholders fit the brand perfectly.',
  ],
  mobile: [
    'Thumb-friendly and still elegant. Nicely done.',
    'The bottom sheet pattern works really well here.',
    'Would love to see the dark mode version of this.',
    'Those tab icons are crisp. Custom set?',
  ],
  animation: [
    'The easing on this is buttery.',
    'Such a satisfying loop. I watched it ten times.',
    'Timing is spot on. What did you animate this in?',
    'The anticipation before the reveal really sells it.',
  ],
  branding: [
    'Strong mark. It will scale down really well.',
    'The colour story fits the product so well.',
    'Love the restraint here. One idea, executed cleanly.',
    'Would love to see this on packaging.',
  ],
  illustration: [
    'The light in this scene is beautiful.',
    'So much charm in the small details.',
    'Your palette choices are always so warm.',
    'This would make a perfect print. Are you selling these?',
  ],
  typography: [
    'Those curves! The weight contrast is gorgeous.',
    'Is this available as a typeface yet?',
    'The spacing between the letters is so considered.',
    'Beautiful specimen layout.',
  ],
  print: [
    'This would look incredible as a risograph print.',
    'The grid underneath this is so satisfying.',
    'Bold and readable from across the room. Perfect poster.',
    'Lovely paper-feel even on screen.',
  ],
};
const REPLIES = ['Thank you, that means a lot!', 'Thanks! Happy to share the process soon.', 'Appreciate it. That part took the longest.', 'Thank you! Yes, more coming this week.'];
let commentCount = 0;
for (const s of sample(shots, Math.round(shots.length * 0.7))) {
  const lines = LINES[s.cat] ?? LINES['product-design']!;
  const commenters = sample(people.filter((p) => p.id !== s.authorId), int(1, 4));
  for (const [i, c] of commenters.entries()) {
    const at = Math.min(now - 60_000, s.publishedAt + int(1, 72) * 3_600_000 + i * 600_000);
    const r = await db.all<{ id: number }>(sql`INSERT INTO comments (shot_id, author_id, body, created_at)
      VALUES (${s.id}, ${c.id}, ${lines[i % lines.length]!}, ${at}) RETURNING id`);
    commentCount++;
    const cid = r[0]!.id;
    for (const liker of sample(people.filter((p) => p.id !== c.id), int(0, 4)))
      await db.run(sql`INSERT OR IGNORE INTO comment_likes (profile_id, comment_id, created_at) VALUES (${liker.id}, ${cid}, ${at + 3_600_000})`);
    if (rand() < 0.4) {
      await db.run(sql`INSERT INTO comments (shot_id, author_id, parent_id, body, created_at)
        VALUES (${s.id}, ${s.authorId}, ${cid}, ${pick(REPLIES)}, ${Math.min(now - 30_000, at + int(1, 12) * 3_600_000)})`);
      commentCount++;
    }
  }
}

// ---------- jobs: same companies and roles as the mock fixtures ----------
const specialties = await db.all<{ id: number; slug: string }>(sql`SELECT id, slug FROM specialties`);
const spec = new Map(specialties.map((s) => [s.slug, s.id]));
const htmlToText = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
let jobCount = 0;
for (const j of JOB_SEEDS) {
  const poster = pid.get(j.owner);
  const specialtyId = spec.get(j.specialty) ?? specialties[0]!.id;
  if (!poster) continue;
  const c = await db.all<{ id: number }>(sql`INSERT INTO companies (owner_profile_id, name, name_key, website_url, created_at, updated_at)
    VALUES (${poster}, ${j.company}, ${j.company.toLowerCase()}, ${j.site}, ${now}, ${now})
    ON CONFLICT(owner_profile_id, name_key) DO UPDATE SET updated_at = excluded.updated_at RETURNING id`);
  const html = jobDescription(j.title, j.company);
  const published = now - j.days * DAY + int(1, 8) * 3_600_000;
  await db.run(sql`INSERT INTO jobs (poster_id, company_id, specialty_id, title, slug, description_html, description_text, location,
      workplace_type, employment_type, apply_url, published_at, expires_at, created_at, updated_at)
    VALUES (${poster}, ${c[0]!.id}, ${specialtyId}, ${j.title}, ${slugify(j.title)}, ${html}, ${htmlToText(html)}, ${j.location || null},
      ${j.workplace}, ${j.employment}, ${`${j.site}/careers`}, ${published}, ${published + 30 * DAY}, ${published}, ${published})`);
  jobCount++;
}

// ---------- recompute every counter the screens read ----------
await db.run(sql`UPDATE profiles SET
  followers_count = (SELECT count(*) FROM follows WHERE followee_id = profiles.id),
  following_count = (SELECT count(*) FROM follows WHERE follower_id = profiles.id)`);
await db.run(sql`UPDATE collections SET shots_count = (SELECT count(*) FROM collection_items WHERE collection_id = collections.id)`);
await db.run(sql`UPDATE shots SET
  saves_count = (SELECT count(DISTINCT ci.collection_id) FROM collection_items ci WHERE ci.shot_id = shots.id),
  comments_count = (SELECT count(*) FROM comments c WHERE c.shot_id = shots.id AND c.deleted_at IS NULL AND c.hidden_at IS NULL)`);
await db.run(sql`UPDATE comments SET likes_count = (SELECT count(*) FROM comment_likes WHERE comment_id = comments.id)`);

console.log(
  `Demo content: ${follows.size} follows, ${collectionCount} collections, ${commentCount} comments, ${jobCount} jobs in ${((Date.now() - started) / 1000).toFixed(1)} s.`,
);
