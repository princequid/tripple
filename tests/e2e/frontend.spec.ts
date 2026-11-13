import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { latestCode } from './helpers';

/**
 * P10 frontend journeys (R1 gaps + R2/R3 screens). Runs on the production build with a fresh seeded DB
 * (playwright.config.ts). R1/R2 features run on the live API; R3 features (notifications, messages, hire, services,
 * blocks) still run on the mock service layer (src/services/config.ts), so for those the tests check UI behaviour only.
 */

const BASE = process.env.E2E_BASE ?? 'http://localhost:3100';
const STATE = path.join(process.cwd(), '.data', 'pw-demo-storage.json');

/** Signs in once (BR-05 allows one code per email per 60 s) and stores the session cookie for all member tests. */
async function ensureDemoState(page: Page) {
  if (fs.existsSync(STATE) && Date.now() - fs.statSync(STATE).mtimeMs < 10 * 60_000) return;
  const email = 'demo@seed.trippple.test';
  const t0 = Date.now();
  const send = await page.request.post('/api/auth/email-otp/send-verification-otp', { data: { email, type: 'sign-in' }, headers: { Origin: BASE } });
  expect(send.ok(), await send.text()).toBeTruthy();
  const code = await latestCode(email, t0);
  const r = await page.request.post('/api/auth/sign-in/email-otp', { data: { email, otp: code }, headers: { Origin: BASE } });
  expect(r.ok()).toBeTruthy();
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await page.context().storageState({ path: STATE });
}

const firstShotPath = async (page: Page) => {
  const body = (await (await page.request.get('/api/shots?sort=popular&limit=1')).json()) as { data: { id: number; slug: string }[] };
  return `/shots/${body.data[0]!.id}-${body.data[0]!.slug}`;
};

test.describe('visitor', () => {
  test('FE-01 header Explore menu opens, navigates, and closes on Escape', async ({ page }) => {
    await page.goto('/shots/popular');
    const explore = page.getByRole('button', { name: 'Explore' });
    await explore.click();
    await expect(page.getByRole('menu', { name: 'Explore' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Explore' })).toBeHidden();
    await expect(explore).toBeFocused();
    await explore.click();
    await page.getByRole('menuitem', { name: 'Branding' }).click();
    await expect(page).toHaveURL(/\/shots\/popular\/branding$/);
  });

  test('FE-02 gated action opens the auth-gate modal instead of acting (follow)', async ({ page }) => {
    await page.goto('/mei-tanaka');
    await page.getByTestId('follow-button').click();
    const dialog = page.getByRole('dialog', { name: /Sign in to follow Mei Tanaka/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Email')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('FE-03 shot detail: Share and Details modals, comments panel (read-only for visitors)', async ({ page }) => {
    await page.goto(await firstShotPath(page));
    await page.getByRole('button', { name: 'Share' }).click();
    const share = page.getByRole('dialog', { name: 'Share this shot' });
    await expect(share.getByLabel('Link')).toHaveValue(/utm_source=share/);
    await share.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'Shot details' }).click();
    await expect(page.getByRole('dialog', { name: 'Shot details' }).getByText('Views')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /^Comments/ }).click();
    const panel = page.getByRole('dialog', { name: /Comments/ });
    await expect(panel.getByRole('button', { name: 'Sign in to comment' })).toBeVisible();
  });

  test('FE-04 job board filters live in the URL; list or empty state renders', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('.job-row').first().or(page.getByTestId('empty-state'))).toBeVisible();
    await page.getByLabel('Search jobs').fill('design');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(/q=design/);
    await page.getByText('Leadership', { exact: true }).click();
    await expect(page).toHaveURL(/specialty=leadership/);
    await page.getByText('Open to remote', { exact: true }).click();
    await expect(page).toHaveURL(/remote=1/);
    await expect(page.locator('.job-row').first().or(page.getByTestId('empty-state'))).toBeVisible();
  });

  test('FE-05 job wizard validates step 1 and gates Continue for visitors', async ({ page }) => {
    await page.goto('/jobs/new');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Use 5–100 characters.')).toBeVisible();
    await expect(page.getByText(/Write at least 50 characters/)).toBeVisible();
    await page.getByLabel('Job title').fill('Product Designer');
    await page.getByRole('textbox', { name: 'Description' }).fill('We are a small team building calm tools for independent shops. Join us to own the design of our app.');
    await page.getByLabel('Specialty').selectOption('product');
    await page.getByLabel('How to apply').fill('https://example.com/apply');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('dialog', { name: /Sign in to post a job/ })).toBeVisible();
  });

  test('FE-06 hire directory filters and empty state', async ({ page }) => {
    await page.goto('/hire');
    await expect(page.locator('.designer-card').first()).toBeVisible();
    await page.getByRole('radio', { name: 'Teams' }).click();
    await expect(page).toHaveURL(/kind=team/);
    await expect(page.locator('.designer-card')).toHaveCount(2);
    await page.getByLabel('Keyword').fill('zzzz-nobody');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByTestId('empty-state')).toContainText('No designers match');
  });

  test('FE-07 services: browse, category filter, detail, request gated', async ({ page }) => {
    await page.goto('/services');
    await page.getByRole('button', { name: 'Logo design' }).click();
    await expect(page).toHaveURL(/category=logo-design/);
    await page.locator('.service-card__title').first().click();
    await expect(page.getByText('Starting at')).toBeVisible();
    await page.getByRole('button', { name: 'Request service' }).click();
    await expect(page.getByRole('dialog', { name: /Sign in to message/ })).toBeVisible();
  });

  test('FE-08 forced error and empty states render with retry', async ({ page }) => {
    await page.goto('/services?__state=error');
    await expect(page.getByTestId('error-state')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await page.goto('/hire?__state=empty');
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('FE-09 404 shows the colour mosaic, search and hue slider', async ({ page }) => {
    const res = await page.goto('/this/does/not/exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /couldn.t find that page/ })).toBeVisible();
    await expect(page.locator('.mosaic404__cell.is-on').first()).toBeVisible();
    await page.getByLabel('Tile colour (hue)').fill('120');
  });

  test('FE-10 auth-only pages redirect to login with returnTo', async ({ page }) => {
    for (const p of ['/settings/profile', '/notifications', '/messages', '/uploads/new']) {
      await page.goto(p);
      await expect(page).toHaveURL(new RegExp(`/login\\?returnTo=${encodeURIComponent(p).replace(/%/g, '%')}`));
    }
  });

  test('FE-11 mobile drawer opens, navigates and closes @mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/jobs');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Menu' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: 'Hire' }).click();
    await drawer.getByRole('link', { name: 'Find designers' }).click();
    await expect(page).toHaveURL(/\/hire$/);
    await expect(drawer).toBeHidden();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('member (demo seed account)', () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE, storageState: { cookies: [], origins: [] } });
    await ensureDemoState(await ctx.newPage());
    await ctx.close();
  });
  test.use({ storageState: STATE });

  test('FE-20 header shows Share work, bell with unread count and the full account menu', async ({ page }) => {
    await page.goto('/shots/popular');
    await expect(page.getByRole('link', { name: 'Share work' })).toBeVisible();
    await page.getByRole('button', { name: /Notifications, \d+ unread/ }).click();
    await expect(page.getByRole('dialog', { name: 'Notifications' }).getByRole('link', { name: 'See all notifications' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Account menu for/ }).click();
    for (const name of ['View profile', 'Share work', 'Liked shots', 'Notifications', 'Messages', 'Settings', 'Report queue', 'Sign out']) {
      await expect(page.getByRole('menuitem', { name: new RegExp(name) })).toBeVisible();
    }
  });

  test('FE-21 follow / unfollow with optimistic count (live API)', async ({ page }) => {
    await page.goto('/kofi-asante');
    const btn = page.getByTestId('follow-button');
    const count = page.getByTestId('followers-count');
    const before = Number(await count.textContent());
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('followers-count')).toHaveText(String(before + 1));
    await page.getByTestId('follow-button').click();
    await expect(page.getByTestId('follow-button')).toHaveAttribute('aria-pressed', 'false');
  });

  test('FE-22 save a shot into a new collection, then see it on the Collections tab (live API)', async ({ page }) => {
    await page.goto(await firstShotPath(page));
    await page.locator('.detail__rail').getByTestId('save-button').click();
    const dlg = page.getByRole('dialog', { name: 'Save to collection' });
    await dlg.getByRole('button', { name: 'New collection' }).click();
    const name = `E2E ${Date.now().toString(36)}`;
    await dlg.getByLabel('Collection name').fill(name);
    await dlg.getByRole('button', { name: 'Create and save' }).click();
    await expect(page.getByTestId('toast').filter({ hasText: `Saved to ${name}` })).toBeVisible();
    await page.goto('/demo/collections');
    await expect(page.locator('.collection-card', { hasText: name })).toBeVisible();
  });

  test('FE-23 post a comment (live API); the 15-minute edit window shows Edit', async ({ page }) => {
    await page.goto(await firstShotPath(page));
    await page.getByRole('button', { name: /^Comments/ }).click();
    const panel = page.getByRole('dialog', { name: /Comments/ });
    await panel.getByRole('button', { name: 'Post' }).click();
    await expect(panel.getByText('Write something first.')).toBeVisible();
    await panel.getByLabel('Add a comment').fill('Lovely spacing and colour.');
    await panel.getByRole('button', { name: 'Post' }).click();
    const mine = panel.locator('.comment', { hasText: 'Lovely spacing and colour.' }).first();
    await expect(mine).toBeVisible();
    await expect(mine.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('FE-24 job wizard publishes (live API); owner sees Edit, a visitor sees Apply; listed in Settings → Jobs', async ({ page }) => {
    await page.goto('/jobs/new');
    await page.getByLabel('Job title').fill('E2E Visual Designer');
    await page.getByRole('textbox', { name: 'Description' }).fill('A short but complete description of a visual design role at a small, friendly studio in town.');
    await page.getByLabel('Specialty').selectOption('ui-visual');
    await page.getByLabel('How to apply').fill('mailto:jobs@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Company name').fill('E2E Studio');
    await page.getByLabel('Company website').fill('https://example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'E2E Visual Designer' })).toBeVisible();
    await page.getByRole('button', { name: 'Publish job' }).click();
    await expect(page).toHaveURL(/\/jobs\/\d+-e2e-visual-designer$/);
    await expect(page.getByRole('link', { name: 'Edit job' })).toBeVisible();
    const jobUrl = page.url();
    const visitor = await page.context().browser()!.newContext({ baseURL: BASE });
    const vp = await visitor.newPage();
    await vp.goto(jobUrl);
    await expect(vp.getByRole('link', { name: /Apply for this position/ })).toHaveAttribute('href', 'mailto:jobs@example.com');
    await visitor.close();
    await page.goto('/jobs?q=E2E+Visual');
    await expect(page.locator('.job-row', { hasText: 'E2E Visual Designer' })).toBeVisible();
    await page.goto('/settings/jobs');
    await expect(page.locator('.job-row', { hasText: 'E2E Visual Designer' })).toBeVisible();
  });

  test('FE-25 message a designer from a service, then reply in the thread (R3 mock)', async ({ page }) => {
    await page.goto('/services');
    await page.locator('.service-card__title').first().click();
    await page.getByRole('button', { name: 'Request service' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Send' }).click();
    await page.getByTestId('toast').getByRole('button', { name: 'View' }).click();
    await expect(page).toHaveURL(/\/messages\/\d+/);
    await page.getByLabel(/^Message /).fill('Following up with a timeline.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('.bubble--me', { hasText: 'Following up with a timeline.' })).toBeVisible();
  });

  test('FE-26 notifications: mark all as read clears the unread state', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('.notif-row').first()).toBeVisible();
    await page.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(page.locator('.notif-row.is-unread')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
  });

  test('FE-27 settings profile validates and saves; teams create flow', async ({ page }) => {
    await page.goto('/settings/profile');
    const name = page.getByLabel('Display name');
    await name.fill('');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Use 1–50 characters.')).toBeVisible();
    await name.fill('Demo Member');
    await page.getByLabel(/^Website/).fill('not a url');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Enter a full link starting with https://')).toBeVisible();
    await page.getByLabel(/^Website/).fill('https://example.com');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByTestId('toast').filter({ hasText: 'Profile saved.' })).toBeVisible();

    await page.goto('/teams/new');
    await page.getByLabel('Team name').fill('E2E Collective');
    await page.getByLabel('Team username').fill(`e2e-${Date.now().toString(36)}`);
    await page.getByRole('button', { name: 'Create team' }).click();
    await expect(page).toHaveURL(/\/settings\/teams\/e2e-/);
    await expect(page.getByRole('heading', { name: 'Members (1)' })).toBeVisible();
  });

  test('FE-28 composer: validation, then a text-only draft saves (live API)', async ({ page }) => {
    await page.goto('/uploads/new');
    await page.getByLabel('Title').fill('E2E shot');
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Add at least one image.')).toBeVisible();
    await expect(page.getByText('Choose a category.')).toBeVisible();
    await page.getByRole('button', { name: 'Add text' }).click();
    await expect(page.locator('.composer-block')).toHaveCount(1);
    await page.getByLabel('Text', { exact: true }).fill('Work in progress notes.');
    await page.getByLabel('Category').selectOption('print');
    await page.getByRole('button', { name: 'Save as draft' }).click();
    await expect(page).toHaveURL(/\/shots\/\d+\/edit$/);
  });

  test('FE-29 staff report queue: report a shot, then decide with a required reason (live API)', async ({ page }) => {
    const shots = (await (await page.request.get('/api/shots?sort=recent&limit=48')).json()) as { data: { id: number; author: { username: string } }[] };
    const target = shots.data.find((x) => x.author.username !== 'demo')!;
    const rep = await page.request.post('/api/reports', { data: { targetType: 'shot', targetId: target.id, reason: 'spam' }, headers: { Origin: BASE } });
    expect(rep.status()).toBeLessThan(300);
    await page.goto('/admin/reports');
    const row = page.locator('.report-row').first();
    await row.getByRole('button', { name: 'Dismiss' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('button', { name: 'Confirm' }).click();
    await expect(dlg.getByText(/Give a reason of at least 10 characters/)).toBeVisible();
    await dlg.getByLabel('Reason').fill('Not a violation.');
    await dlg.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByTestId('toast').filter({ hasText: 'Decision recorded.' })).toBeVisible();
  });

  test('FE-30 designer search via header type switch (live API)', async ({ page }) => {
    await page.goto('/shots/popular');
    await page.getByLabel('Search type').selectOption('designers');
    const box = page.getByRole('combobox', { name: 'Search designers' });
    await box.fill('kofi');
    await box.press('Enter');
    await expect(page).toHaveURL(/\/search\/kofi\?type=designers/);
    await expect(page.locator('.person-row', { hasText: 'Kofi Asante' })).toBeVisible();
  });
});
