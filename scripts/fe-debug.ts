/** Ad-hoc reproduction helper: signs in as demo on the dev server and runs one flow, printing page errors. */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';
async function code(email: string, after: number) {
  const file = path.join(process.cwd(), '.data', 'outbox.jsonl');
  for (let i = 0; i < 50; i++) {
    const hit = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { to: string; code: string; at: number }).filter((m) => m.to === email && m.at >= after).pop();
    if (hit) return hit.code;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('no code');
}

void (async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message, e.stack?.split('\n').slice(0, 4).join(' | ')));
  page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text().slice(0, 3000)));
  const email = process.env.FE_EMAIL ?? 'demo@seed.trippple.test';
  const t0 = Date.now();
  await page.request.post(`${BASE}/api/auth/email-otp/send-verification-otp`, { data: { email, type: 'sign-in' }, headers: { Origin: BASE } });
  await page.request.post(`${BASE}/api/auth/sign-in/email-otp`, { data: { email, otp: await code(email, t0) }, headers: { Origin: BASE } });
  page.on('response', (r) => r.url().includes('/follow') && console.log('RESP', r.request().method(), r.status()));
  await page.goto(`${BASE}/sofia-lind`, { waitUntil: 'networkidle' });
  const btn = page.getByTestId('follow-button');
  console.log('initial', await btn.getAttribute('aria-pressed'));
  await btn.click();
  await page.waitForTimeout(2500);
  console.log('after follow', await btn.getAttribute('aria-pressed'));
  await page.reload({ waitUntil: 'networkidle' });
  console.log('after reload', await btn.getAttribute('aria-pressed'));
  await btn.click();
  await page.waitForTimeout(2500);
  console.log('after unfollow', await btn.getAttribute('aria-pressed'), await page.locator('[data-testid=toast]').allTextContents());
  await b.close();
})();
