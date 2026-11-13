import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as jobs from '@/modules/jobs/service';
import { sanitizeJobHtml, htmlToText } from '@/server/sanitize';
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

const LONG = '<p>We are hiring a designer to shape our product. You will work with research, engineering and brand.</p>';
const job = (over: Record<string, unknown> = {}) => ({
  title: 'Senior Product Designer',
  descriptionHtml: LONG,
  location: 'Lisbon',
  workplaceType: 'hybrid',
  specialtySlug: 'product-design',
  employmentType: 'full-time',
  applyUrl: 'https://jobs.example/apply',
  companyName: 'Acme',
  companyWebsite: 'https://acme.example',
  ...over,
});

describe('job description sanitising (BR-72)', () => {
  it('keeps the allow-list, maps h1→h2, forces link attributes, removes everything else', () => {
    const dirty = `<h1 onclick="x()">Role</h1><script>alert(1)</script><p style="color:red">Hi <b>there</b> <img src=x onerror=alert(1)>
      <a href="javascript:alert(1)">bad</a> <a href="https://ok.example" target="_self">good</a> <a href="mailto:a@b.example">mail</a></p>
      <iframe src="https://evil.example"></iframe><ul><li>One</li></ul>`;
    const clean = sanitizeJobHtml(dirty);
    expect(clean).toContain('<h2>Role</h2>');
    expect(clean).toContain('<strong>there</strong>');
    const good = /<a [^>]*href="https:\/\/ok\.example"[^>]*>good<\/a>/.exec(clean)?.[0] ?? '';
    expect(good).toContain('rel="nofollow noopener noreferrer"');
    expect(good).toContain('target="_blank"');
    expect(clean).toContain('href="mailto:a@b.example"');
    expect(clean).toContain('<ul><li>One</li></ul>');
    for (const bad of ['script', 'onclick', 'onerror', 'style=', '<img', 'javascript:', 'iframe', '_self']) expect(clean).not.toContain(bad);
    expect(htmlToText('<p>A&amp;B</p><p>C</p>')).toBe('A&B C');
  });
});

describe('jobs board (J-01…J-03, BR-71…BR-75)', () => {
  it('post: validation, published for 30 days, detail with apply link', async () => {
    const ann = await makeProfile(db);
    expect(await errorCode(() => jobs.create(ann.viewer, job({ title: 'Dsgn' })))).toBe('VALIDATION');
    expect(await errorCode(() => jobs.create(ann.viewer, job({ descriptionHtml: '<p>Too short</p>' })))).toBe('VALIDATION');
    expect(await errorCode(() => jobs.create(ann.viewer, job({ applyUrl: 'http://insecure.example' })))).toBe('VALIDATION');
    expect(await errorCode(() => jobs.create(ann.viewer, job({ companyWebsite: 'ftp://x' })))).toBe('VALIDATION');
    expect(await errorCode(() => jobs.create(ann.viewer, job({ specialtySlug: 'cooking' })))).toBe('VALIDATION');
    expect(await errorCode(() => jobs.create(visitor, job()))).toBe('UNAUTHENTICATED');
    const j = await jobs.create(ann.viewer, job({ applyUrl: 'hr@acme.example', location: '' }));
    expect(j).toMatchObject({ status: 'active', applyUrl: 'mailto:hr@acme.example', location: null, isOwn: true, noindex: false, slug: 'senior-product-designer' });
    expect(new Date(j.expiresAt).getTime() - new Date(j.postedAt).getTime()).toBe(30 * 86_400_000);
    expect((await jobs.get(visitor, j.id)).isOwn).toBe(false);
  });

  it('filters: specialties OR, location substring, remote, employment, keyword; newest first (BR-75)', async () => {
    const ann = await makeProfile(db);
    const a = await jobs.create(ann.viewer, job({ title: 'Brand Designer', specialtySlug: 'brand-graphic-design', location: 'Berlin', workplaceType: 'on-site' }));
    const b = await jobs.create(ann.viewer, job({ title: 'Remote UX Researcher', specialtySlug: 'ux-design-research', location: '', workplaceType: 'remote', employmentType: 'freelance-contract' }));
    const c = await jobs.create(ann.viewer, job({ title: 'Product Designer', companyName: 'Zeta Labs', location: 'New Berlin, WI' }));
    await db.run(sql`UPDATE jobs SET published_at = published_at + id * 1000`);
    const ids = async (q: Parameters<typeof jobs.list>[1]) => (await jobs.list(visitor, q)).items.map((x) => x.id);
    expect(await ids({})).toEqual([c.id, b.id, a.id]);
    expect(await ids({ specialty: ['brand-graphic-design', 'ux-design-research'] })).toEqual([b.id, a.id]);
    expect(await ids({ location: 'berlin' })).toEqual([c.id, a.id]);
    expect(await ids({ location: 'berlin', remote: 'true' })).toEqual([c.id, b.id, a.id]);
    expect(await ids({ remote: 'true' })).toEqual([b.id]);
    expect(await ids({ employment: ['freelance-contract'] })).toEqual([b.id]);
    expect(await ids({ q: 'zeta' })).toEqual([c.id]);
    expect(await ids({ q: '100%_' })).toEqual([]);
    expect(await errorCode(() => jobs.list(visitor, { specialty: ['nope'] }))).toBe('VALIDATION');
  });

  it('lifecycle: edit keeps the date, close, expiry; expired pages keep no apply link (BR-73)', async () => {
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    const j = await jobs.create(ann.viewer, job());
    expect(await errorCode(() => jobs.update(bob.viewer, j.id, job({ title: 'Hijacked title' })))).toBe('NOT_FOUND');
    const e = await jobs.update(ann.viewer, j.id, job({ title: 'Lead Product Designer', descriptionHtml: `${LONG}<script>x</script>` }));
    expect(e).toMatchObject({ title: 'Lead Product Designer', postedAt: j.postedAt });
    expect(e.descriptionHtml).not.toContain('script');
    const closed = await jobs.close(ann.viewer, j.id);
    expect(closed).toMatchObject({ status: 'closed', applyUrl: null, noindex: true });
    expect((await jobs.list(visitor, {})).items).toEqual([]);
    expect(await errorCode(() => jobs.update(ann.viewer, j.id, job()))).toBe('FORBIDDEN');
    const k = await jobs.create(ann.viewer, job());
    await db.run(sql`UPDATE jobs SET expires_at = ${Date.now() - 1} WHERE id = ${k.id}`);
    expect(await jobs.get(visitor, k.id)).toMatchObject({ status: 'expired', applyUrl: null, noindex: true });
    expect((await jobs.mine(ann.viewer, {})).items.map((x) => x.status).sort()).toEqual(['closed', 'expired']);
  });

  it('limits: 3 active per member, 5 posts per day (BR-73)', async () => {
    const ann = await makeProfile(db);
    for (let i = 0; i < 3; i++) await jobs.create(ann.viewer, job());
    expect(await errorCode(() => jobs.create(ann.viewer, job()))).toBe('QUOTA_EXCEEDED');
    await db.run(sql`UPDATE jobs SET closed_at = 1`);
    await jobs.create(ann.viewer, job());
    await jobs.create(ann.viewer, job());
    await db.run(sql`UPDATE jobs SET closed_at = 1`);
    expect(await errorCode(() => jobs.create(ann.viewer, job()))).toBe('QUOTA_EXCEEDED'); // 6th post today
  });

  it('hidden jobs are 404 to the public; specialties list', async () => {
    const ann = await makeProfile(db);
    const j = await jobs.create(ann.viewer, job());
    await jobs.setHidden(j.id, true);
    expect(await errorCode(() => jobs.get(visitor, j.id))).toBe('NOT_FOUND');
    expect((await jobs.list(visitor, {})).items).toEqual([]);
    expect(jobs.specialties()).toHaveLength(9);
  });
});
