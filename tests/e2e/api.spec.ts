import { expect, test, type APIRequestContext } from '@playwright/test';
import { latestCode, uniqueEmail } from './helpers';

/**
 * HTTP contract tests (API_TESTING_PLAN §3) against `next start` with seed data. Every endpoint in
 * API_SPECIFICATION is exercised for its success shape and its documented errors.
 */
// E2E_BASE lets the suite run on another port (e.g. while another session holds 3100); default unchanged.
const BASE = process.env.E2E_BASE ?? 'http://localhost:3100';
const ORIGIN = { Origin: BASE };

const problem = async (res: Awaited<ReturnType<APIRequestContext['get']>>) => {
  expect(res.headers()['content-type']).toContain('application/problem+json');
  const body = (await res.json()) as { code: string; status: number; requestId: string; fields?: Record<string, string>; retryAfter?: number };
  expect(body.requestId).toBeTruthy();
  return body;
};

test.describe('system', () => {
  test('GET /api/health → 200 and x-request-id', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ data: { ok: true, db: 'up' } });
    expect(res.headers()['x-request-id']).toBeTruthy();
    expect(res.headers()['cache-control']).toBe('no-store');
  });

  test('GET /api/cron/:job requires the bearer secret (404 otherwise)', async ({ request }) => {
    expect((await request.get('/api/cron/popularity')).status()).toBe(404);
    expect((await request.get('/api/cron/popularity', { headers: { Authorization: 'Bearer wrong' } })).status()).toBe(404);
  });

  test('security headers are set on pages', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['x-frame-options']).toBe('DENY');
  });
});

test.describe('feeds GET /api/shots', () => {
  test('default page: 24 cards, cursor, card shape, visitor isLiked null', async ({ request }) => {
    const res = await request.get('/api/shots');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(24);
    expect(body.page).toMatchObject({ limit: 24, nextCursor: expect.any(String) });
    expect(body.data[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      slug: expect.any(String),
      cover: { key: expect.any(String), width: expect.any(Number), height: expect.any(Number) },
      author: { username: expect.any(String), displayName: expect.any(String) },
      likesCount: expect.any(Number),
      viewsCount: expect.any(Number),
      isLiked: null,
      isOwn: false,
    });
    expect(JSON.stringify(body)).not.toMatch(/@seed\.trippple\.test/); // BR-78
  });

  test('cursor walk returns all 64 seed shots once', async ({ request }) => {
    const ids: number[] = [];
    let cursor: string | null = null;
    for (let i = 0; i < 10; i++) {
      const res: Awaited<ReturnType<APIRequestContext['get']>> = await request.get(`/api/shots?sort=recent&limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      const body = (await res.json()) as { data: { id: number }[]; page: { nextCursor: string | null } };
      ids.push(...body.data.map((d) => d.id));
      cursor = body.page.nextCursor;
      if (!cursor) break;
    }
    expect(ids).toHaveLength(64);
    expect(new Set(ids).size).toBe(64);
  });

  test('category filter and errors: 400 VALIDATION, 404 NOT_FOUND, 400 INVALID_CURSOR', async ({ request }) => {
    const cat = await (await request.get('/api/shots?category=branding&limit=48')).json();
    expect(cat.data.length).toBe(8);
    expect((await problem(await request.get('/api/shots?limit=0'))).code).toBe('VALIDATION');
    expect((await problem(await request.get('/api/shots?sort=hot'))).code).toBe('VALIDATION');
    expect((await problem(await request.get('/api/shots?timeframe=decade'))).code).toBe('VALIDATION');
    const nf = await request.get('/api/shots?category=nope');
    expect(nf.status()).toBe(404);
    expect((await problem(nf)).code).toBe('NOT_FOUND');
    const page = await (await request.get('/api/shots?sort=recent&limit=2')).json();
    const bad = await request.get(`/api/shots?sort=popular&cursor=${encodeURIComponent(page.page.nextCursor)}`);
    expect(bad.status()).toBe(400);
    expect((await problem(bad)).code).toBe('INVALID_CURSOR');
  });

  test('timeframes are accepted', async ({ request }) => {
    for (const tf of ['now', 'week', 'month', 'year', 'ever']) {
      expect((await request.get(`/api/shots?timeframe=${tf}`)).status()).toBe(200);
    }
  });
});

test.describe('shot detail and views', () => {
  test('GET /api/shots/:id → detail; malformed or missing → 404', async ({ request }) => {
    const d = (await (await request.get('/api/shots/1')).json()).data;
    expect(d).toMatchObject({ id: 1, canonicalPath: expect.stringMatching(/^\/shots\/1-/), blocks: expect.any(Array), tags: expect.any(Array), palette: expect.any(Array) });
    expect((await request.get('/api/shots/abc')).status()).toBe(404);
    expect((await request.get('/api/shots/999999')).status()).toBe(404);
  });

  test('POST /api/views → 204; malformed → 400', async ({ request }) => {
    expect((await request.post('/api/views', { data: { shotId: 1 } })).status()).toBe(204);
    expect((await request.post('/api/views', { data: { shotId: 999999 } })).status()).toBe(204); // ignored silently
    const bad = await request.post('/api/views', { data: { shotId: 'x' } });
    expect(bad.status()).toBe(400);
    expect((await problem(bad)).fields).toHaveProperty('shotId');
  });
});

test.describe('search, tags, users', () => {
  test('GET /api/search/shots', async ({ request }) => {
    const r = await (await request.get('/api/search/shots?q=Dashboard')).json();
    expect(r.term).toBe('dashboard');
    expect(r.data.length).toBeGreaterThan(0);
    const hostile = await request.get(`/api/search/shots?q=${encodeURIComponent('" OR 1=1; DROP TABLE shots; --')}`);
    expect(hostile.status()).toBe(200);
    const none = await (await request.get('/api/search/shots?q=zzqxv')).json();
    expect(none.data).toEqual([]);
  });

  test('GET /api/tags/:tag/shots → 200 or 404', async ({ request }) => {
    const r = await (await request.get('/api/tags/branding/shots')).json();
    expect(r.tag).toEqual({ name: 'branding', slug: 'branding' });
    expect(r.count).toBeGreaterThan(0);
    expect((await request.get('/api/tags/no-such-tag/shots')).status()).toBe(404);
  });

  test('GET /api/users/:username and /shots; never the sign-in email', async ({ request }) => {
    const res = await request.get('/api/users/ines-moreau');
    const p = (await res.json()).data;
    expect(p).toMatchObject({ username: 'ines-moreau', displayName: 'Inès Moreau', isTeam: false });
    expect(JSON.stringify(p)).not.toContain('@seed.trippple.test');
    const team = (await (await request.get('/api/users/northfield')).json()).data;
    expect(team.isTeam).toBe(true);
    expect(team.members.length).toBe(3);
    const shots = await (await request.get('/api/users/northfield/shots')).json();
    expect(shots.page.limit).toBe(24);
    expect((await request.get('/api/users/nobody-here')).status()).toBe(404);
  });
});

test.describe('auth, onboarding and likes (API level)', () => {
  test('mutations reject cross-origin and anonymous callers', async ({ request }) => {
    const noOrigin = await request.put('/api/shots/1/like');
    expect(noOrigin.status()).toBe(403);
    expect((await problem(noOrigin)).code).toBe('ORIGIN_REJECTED');
    const evil = await request.put('/api/shots/1/like', { headers: { Origin: 'https://evil.example' } });
    expect((await problem(evil)).code).toBe('ORIGIN_REJECTED');
    const anon = await request.put('/api/shots/1/like', { headers: ORIGIN });
    expect(anon.status()).toBe(401);
    expect((await problem(anon)).code).toBe('UNAUTHENTICATED');
    expect((await request.post('/api/onboarding', { headers: ORIGIN, data: { username: 'x', displayName: 'x' } })).status()).toBe(401);
    expect((await (await request.get('/api/me')).json()).data).toEqual({ kind: 'visitor' });
  });

  test('email code → pending → onboarding → member → like (set semantics) → sign out', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE, extraHTTPHeaders: ORIGIN });
    const email = uniqueEmail('api');
    const t0 = Date.now();
    expect((await ctx.post('/api/auth/email-otp/send-verification-otp', { data: { email, type: 'sign-in' } })).status()).toBe(200);
    const code = await latestCode(email, t0);

    const wrong = await ctx.post('/api/auth/sign-in/email-otp', { data: { email, otp: code === '000000' ? '111111' : '000000' } });
    expect(wrong.status()).toBe(400);
    expect((await wrong.json()).code).toBe('INVALID_OTP');

    expect((await ctx.post('/api/auth/sign-in/email-otp', { data: { email, otp: code } })).status()).toBe(200);
    expect((await (await ctx.get('/api/me')).json()).data).toMatchObject({ kind: 'pending' });

    // BR-16: a pending user cannot like.
    const pendingLike = await ctx.put('/api/shots/1/like');
    expect((await pendingLike.json()).code).toBe('ONBOARDING_REQUIRED');

    expect((await (await ctx.get('/api/onboarding/username?u=jobs')).json()).data).toMatchObject({ available: false, problem: 'reserved' });
    const username = `api${Date.now().toString(36)}`;
    expect((await (await ctx.get(`/api/onboarding/username?u=${username}`)).json()).data).toMatchObject({ available: true });
    const taken = await ctx.post('/api/onboarding', { data: { username: 'ines-moreau', displayName: 'Me' } });
    expect(taken.status()).toBe(422);
    expect((await taken.json()).code).toBe('USERNAME_TAKEN');
    const created = await ctx.post('/api/onboarding', { data: { username, displayName: 'API Tester' } });
    expect(created.status()).toBe(201);
    expect(created.headers()['location']).toBe(`/${username}`);
    expect((await ctx.post('/api/onboarding', { data: { username, displayName: 'API Tester' } })).status()).toBe(201); // idempotent

    const me = (await (await ctx.get('/api/me')).json()).data;
    expect(me).toEqual({ kind: 'member', username, displayName: 'API Tester', avatarKey: null, role: 'member' });

    const before = (await (await ctx.get('/api/shots/2')).json()).data.likesCount;
    const on1 = (await (await ctx.put('/api/shots/2/like')).json()).data;
    const on2 = (await (await ctx.put('/api/shots/2/like')).json()).data;
    expect(on1).toEqual({ liked: true, likesCount: before + 1 });
    expect(on2).toEqual(on1);
    expect((await (await ctx.get('/api/shots/2')).json()).data.isLiked).toBe(true);
    const off = (await (await ctx.delete('/api/shots/2/like')).json()).data;
    expect(off).toEqual({ liked: false, likesCount: before });
    expect((await ctx.put('/api/shots/999999/like')).status()).toBe(404);

    expect((await ctx.post('/api/auth/sign-out', { data: {} })).status()).toBe(200);
    expect((await (await ctx.get('/api/me')).json()).data).toEqual({ kind: 'visitor' });
    await ctx.dispose();
  });

  test('BR-05: a second code within 60 s for the same email is rate limited', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: BASE, extraHTTPHeaders: ORIGIN });
    const email = uniqueEmail('rl');
    expect((await ctx.post('/api/auth/email-otp/send-verification-otp', { data: { email, type: 'sign-in' } })).status()).toBe(200);
    const again = await ctx.post('/api/auth/email-otp/send-verification-otp', { data: { email, type: 'sign-in' } });
    expect(again.status()).toBe(429);
    expect((await again.json()).code).toBe('RATE_LIMITED');
    const invalid = await ctx.post('/api/auth/email-otp/send-verification-otp', { data: { email: 'not-an-email', type: 'sign-in' } });
    expect(invalid.status()).toBe(400);
    await ctx.dispose();
  });
});
