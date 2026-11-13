/**
 * Frontend smoke + screenshot capture against a running server (default http://localhost:3000).
 * Signs in as the seed `demo` member through the real email-code flow (outbox transport), visits every route
 * at the 6 required widths, records console errors and horizontal overflow, and saves screenshots to
 * docs/08-testing/frontend/screenshots/<width>/<route>.png.
 * Usage: npx tsx scripts/fe-smoke.ts [baseUrl] [--widths=1440,390] [--routes=/,/jobs]
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from '@playwright/test';

const BASE = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:3000';
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const WIDTHS = (arg('widths') ?? '1440,1280,1024,768,390,360').split(',').map(Number);
const OUT = path.join(process.cwd(), 'docs', '08-testing', 'frontend', 'screenshots');

const ROUTES: { path: string; auth?: boolean }[] = [
  { path: '/' },
  { path: '/shots/popular' },
  { path: '/shots/SHOT' },
  { path: '/mei-tanaka' },
  { path: '/ines-moreau/collections' },
  { path: '/mei-tanaka/followers' },
  { path: '/northfield/members' },
  { path: '/kofi-asante/services' },
  { path: '/hire' },
  { path: '/services' },
  { path: '/services/SERVICE' },
  { path: '/jobs' },
  { path: '/jobs/JOB' },
  { path: '/jobs/new' },
  { path: '/search/dashboard?type=designers' },
  { path: '/not-a-real/page' },
  { path: '/notifications', auth: true },
  { path: '/messages', auth: true },
  { path: '/messages/THREAD', auth: true },
  { path: '/settings/profile', auth: true },
  { path: '/settings/account', auth: true },
  { path: '/settings/sessions', auth: true },
  { path: '/settings/teams', auth: true },
  { path: '/settings/jobs', auth: true },
  { path: '/settings/blocked', auth: true },
  { path: '/teams/new', auth: true },
  { path: '/uploads/new', auth: true },
  { path: '/demo/likes', auth: true },
  { path: '/admin/reports', auth: true },
  { path: '/onboarding/details', auth: true },
];

async function latestCode(email: string, after: number) {
  const file = path.join(process.cwd(), '.data', 'outbox.jsonl');
  for (let i = 0; i < 50; i++) {
    if (fs.existsSync(file)) {
      const hit = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l) as { to: string; code: string; at: number }).filter((m) => m.to === email && m.at >= after).pop();
      if (hit) return hit.code;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('no code');
}

async function signIn(page: Page) {
  const email = 'demo@seed.trippple.test';
  const t0 = Date.now();
  const send = await page.request.post(`${BASE}/api/auth/email-otp/send-verification-otp`, { data: { email, type: 'sign-in' }, headers: { Origin: BASE } });
  if (!send.ok()) throw new Error(`send ${send.status()} ${await send.text()}`);
  const code = await latestCode(email, t0);
  const r = await page.request.post(`${BASE}/api/auth/sign-in/email-otp`, { data: { email, otp: code }, headers: { Origin: BASE } });
  if (!r.ok()) throw new Error(`verify ${r.status()}`);
}

async function main() {
  const routesFilter = arg('routes')?.split(',');
  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(`${page.url()} :: ${m.text().slice(0, 240)}`));
  page.on('pageerror', (e) => errors.push(`${page.url()} :: PAGEERROR ${e.message.slice(0, 240)}`));

  // Resolve placeholder ids from live data.
  const shots = (await (await page.request.get(`${BASE}/api/shots?sort=popular&limit=1`)).json()).data as { id: number; slug: string }[];
  const ids: Record<string, string> = { SHOT: `${shots[0]!.id}-${shots[0]!.slug}`, SERVICE: '', JOB: '', THREAD: '' };

  const results: { route: string; width: number; status: string; overflow: number }[] = [];
  let signedIn = false;
  for (const r of ROUTES.filter((x) => !routesFilter || routesFilter.includes(x.path))) {
    if (r.auth && !signedIn) {
      await signIn(page);
      signedIn = true;
    }
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: w < 768 ? 844 : 900 });
      let url = r.path;
      for (const [k, v] of Object.entries(ids)) url = url.replace(k, v);
      if (url.includes('/services/') && !ids.SERVICE) {
        await page.goto(`${BASE}/services`);
        const href = await page.locator('.service-card__title').first().getAttribute('href', { timeout: 15000 });
        ids.SERVICE = href!.split('/').pop()!;
        url = r.path.replace('SERVICE', ids.SERVICE);
      }
      if (url.includes('/jobs/') && url.endsWith('JOB')) {
        await page.goto(`${BASE}/jobs`);
        const href = await page.locator('.job-row__title').first().getAttribute('href', { timeout: 15000 });
        ids.JOB = href!.split('/').pop()!;
        url = r.path.replace('JOB', ids.JOB);
      }
      if (url.endsWith('THREAD')) {
        await page.goto(`${BASE}/messages`);
        const href = await page.locator('.thread-row').first().getAttribute('href', { timeout: 15000 });
        ids.THREAD = href!.split('/').pop()!;
        url = r.path.replace('THREAD', ids.THREAD);
      }
      const res = await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(700); // mock latency + skeleton → content
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = (url.replace(/[/?=&]+/g, '_').replace(/^_|_$/g, '') || 'home').slice(0, 60);
      fs.mkdirSync(path.join(OUT, String(w)), { recursive: true });
      await page.screenshot({ path: path.join(OUT, String(w), `${name}.png`), fullPage: false });
      results.push({ route: url, width: w, status: String(res?.status() ?? '?'), overflow });
    }
  }
  await browser.close();
  const bad = results.filter((x) => x.overflow > 0);
  console.log(JSON.stringify({ pages: results.length, overflow: bad, errors: [...new Set(errors)] }, null, 2));
  fs.writeFileSync(path.join(OUT, '..', 'smoke-results.json'), JSON.stringify({ at: new Date().toISOString(), base: BASE, results, errors: [...new Set(errors)] }, null, 2));
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
