import { expect, test } from '@playwright/test';
import { latestCode, uniqueEmail } from './helpers';

/** User journeys (USER_JOURNEYS, API_TESTING_PLAN §4) in a real browser against `next start`. */

test('J1 browse: home → filter → shot detail → tag → profile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('independent designers');
  const cards = page.locator('.ui-shot-card');
  await expect(cards).toHaveCount(24);

  await page.getByRole('navigation', { name: 'Categories', exact: true }).getByRole('link', { name: 'Branding' }).click();
  await expect(page).toHaveURL(/\/shots\/popular\/branding$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Branding' })).toBeVisible();
  await expect(cards).toHaveCount(8);

  const first = cards.first();
  const title = (await first.locator('.ui-shot-card__bar-title').textContent())!;
  await first.locator('.ui-shot-card__media').click({ position: { x: 40, y: 40 } }); // the link's ::after covers the thumbnail
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page.locator('.detail__media img').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /^More by|You might also like/ }).first()).toBeVisible();

  await page.getByRole('list', { name: 'Shot tags' }).getByRole('link').first().click();
  await expect(page).toHaveURL(/\/tags\/[a-z-]+$/);
  await expect(page.locator('.ui-shot-card').first()).toBeVisible();

  await page.locator('.ui-shot-card__author').first().click();
  await expect(page.locator('.ui-profile')).toBeVisible();
  await page.getByRole('navigation', { name: 'Profile sections' }).getByRole('link', { name: 'About' }).click();
  await expect(page.getByText('Member since')).toBeVisible();
});

test('J2 shot URL with a wrong slug 308s to the canonical URL; unknown shot is 404', async ({ page }) => {
  await page.goto('/shots/1-wrong-slug');
  await expect(page).toHaveURL(/\/shots\/1-(?!wrong-slug)[a-z0-9-]+$/);
  const res = await page.goto('/shots/999999-nope');
  expect(res?.status()).toBe(404);
  await expect(page.getByText("We couldn't find that page")).toBeVisible();
});

test('J3 search from the header, empty state, and load more', async ({ page }) => {
  // The header search is not shown on the homepage (IA §3.2: the hero search is used there).
  await page.goto('/shots/popular');
  const box = page.locator('#header-q');
  await box.fill('Dashboard');
  await box.press('Enter');
  await expect(page).toHaveURL(/\/search\/dashboard$/);
  await expect(page.locator('.ui-shot-card').first()).toBeVisible();

  await page.goto('/search/zzqxv');
  await expect(page.getByText('No shots match')).toBeVisible();

  // Infinite scroll: reaching the end of the grid loads the next page automatically (no duplicates).
  await page.goto('/shots/recent');
  await expect(page.locator('.ui-shot-card')).toHaveCount(24);
  await page.locator('.ui-feed-status').scrollIntoViewIfNeeded();
  await expect(page.locator('.ui-shot-card')).toHaveCount(48);
  await page.locator('.ui-feed-status').scrollIntoViewIfNeeded();
  await expect(page.locator('.ui-shot-card')).toHaveCount(64);
  await expect(page.getByText("You've reached the end")).toBeVisible();
});

test('J3b without JavaScript, "Load more" is a working link (FR-23, progressive enhancement)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL: process.env.E2E_BASE ?? 'http://localhost:3100' });
  const page = await ctx.newPage();
  await page.goto('/shots/recent');
  const firstTitle = await page.locator('.ui-shot-card__bar-title').first().textContent();
  await page.getByRole('link', { name: 'Load more' }).click();
  await expect(page).toHaveURL(/\?cursor=/);
  await expect(page.locator('.ui-shot-card')).toHaveCount(24);
  expect(await page.locator('.ui-shot-card__bar-title').first().textContent()).not.toBe(firstTitle);
  await ctx.close();
});

test('J4 view beacon counts a visit once per day', async ({ page, request }) => {
  const before = (await (await request.get('/api/shots/5')).json()).data.viewsCount;
  const beacon = page.waitForResponse((r) => r.url().endsWith('/api/views') && r.status() === 204);
  await page.goto('/shots/5');
  await beacon;
  await expect.poll(async () => (await (await request.get('/api/shots/5')).json()).data.viewsCount).toBe(before + 1);
  await page.reload();
  await page.waitForTimeout(500);
  expect((await (await request.get('/api/shots/5')).json()).data.viewsCount).toBe(before + 1);
});

test('J5 visitor likes a shot → signs in with an email code → onboarding → back on the shot, liked', async ({ page }) => {
  await page.goto('/shots/3');
  await page.waitForURL(/\/shots\/3-/);
  const shotUrl = page.url();
  const likeLink = page.locator('.ui-detail-header .ui-like');
  const countBefore = Number((await likeLink.locator('.ui-like__count').first().innerText()).replace(/\D/g, '') || 0);
  await likeLink.click();
  await expect(page).toHaveURL(/\/login\?.*intent=like-shot.*target=3/);

  const email = uniqueEmail('journey');
  const t0 = Date.now();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByText(`We sent a 6-digit code to ${email}`)).toBeVisible();
  const code = await latestCode(email, t0);
  await page.locator('.ui-otp__input').fill(code);

  await expect(page).toHaveURL(/\/onboarding\?returnTo=/);
  const username = `j${Date.now().toString(36)}`;
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Display name').fill('Journey Tester');
  await expect(page.getByText(`trippple/${username} is available.`)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(shotUrl);
  await expect(page.getByRole('button', { name: `Account menu for Journey Tester` })).toBeVisible();
  // After onboarding the intent is not replayed (the user returns via onboarding), so like explicitly now.
  const like = page.locator('.ui-detail-header button.ui-like');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like.locator('.ui-like__count')).toContainText(String(countBefore + 1));
  await page.reload();
  await expect(page.locator('.ui-detail-header button.ui-like')).toHaveAttribute('aria-pressed', 'true');

  // Unlike rolls the count back; sign out from the account menu.
  await page.locator('.ui-detail-header button.ui-like').click();
  await expect(page.locator('.ui-detail-header button.ui-like')).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Account menu for Journey Tester' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('J6 returning member: like intent completes right after sign-in (BR-15)', async ({ page, request }) => {
  test.setTimeout(180_000); // waits out the 60 s resend window (BR-05)
  // Create a member through the UI first.
  const email = uniqueEmail('returning');
  const t0 = Date.now();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.locator('.ui-otp__input').fill(await latestCode(email, t0));
  await page.waitForURL(/\/onboarding/);
  await page.getByLabel('Username').fill(`r${Date.now().toString(36)}`);
  await page.getByLabel('Display name').fill('Returning Member');
  await page.getByRole('button', { name: 'Continue' }).click();
  // SCR-29: a sign-up without a destination continues to the optional details step, which can be skipped.
  await page.waitForURL(/\/onboarding\/details/);
  await page.getByRole('link', { name: 'Skip for now' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/onboarding'));
  await page.getByRole('button', { name: 'Account menu for Returning Member' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

  // Now as a visitor: like → sign in → the like is saved without another click.
  const before = (await (await request.get('/api/shots/4')).json()).data.likesCount;
  await page.goto('/shots/4');
  await page.locator('.ui-detail-header .ui-like').click();
  await page.waitForURL(/\/login\?/);
  await page.waitForTimeout(61_000 - (Date.now() - t0) > 0 ? 61_000 - (Date.now() - t0) : 0); // BR-05 resend window
  const t1 = Date.now();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.locator('.ui-otp__input').fill(await latestCode(email, t1));
  await page.waitForURL(/\/shots\/4-/);
  await expect(page.locator('.ui-detail-header button.ui-like')).toHaveAttribute('aria-pressed', 'true');
  expect((await (await request.get('/api/shots/4')).json()).data.likesCount).toBe(before + 1);
});

test('J7 static pages and 404', async ({ page }) => {
  for (const [path, heading] of [['/terms', 'Terms of use'], ['/privacy', 'Privacy'], ['/about', 'About Trippple'], ['/tags', 'Tags']] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
  const r = await page.goto('/this-user-does-not-exist-xyz');
  expect(r?.status()).toBe(404);
});

test('J8 @mobile home and shot detail fit a phone screen without horizontal scroll', async ({ page }) => {
  for (const path of ['/', '/shots/1', '/login', '/ines-moreau']) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
