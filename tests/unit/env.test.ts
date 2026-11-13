import { afterEach, describe, expect, it, vi } from 'vitest';

/** src/server/env.ts (BACKEND_ARCHITECTURE §9): fail fast on missing or unsafe configuration. */
const base = { ...process.env };
const load = async (overrides: Record<string, string | undefined>) => {
  vi.resetModules();
  process.env = { ...base, ...overrides } as NodeJS.ProcessEnv;
  for (const [k, v] of Object.entries(overrides)) if (v === undefined) delete process.env[k];
  return (await import('@/server/env')).env;
};
afterEach(() => {
  process.env = { ...base };
});

const prodSafe = {
  NODE_ENV: 'production',
  APP_ENV: 'production',
  BETTER_AUTH_URL: 'https://app.example',
  EMAIL_TRANSPORT: 'resend',
  RESEND_API_KEY: 're_test',
  NEXT_PUBLIC_MEDIA_PROVIDER: 'imagekit',
  NEXT_PUBLIC_MEDIA_BASE_URL: 'https://ik.imagekit.io/example',
};

describe('environment validation', () => {
  it('accepts the test configuration', async () => {
    expect((await load({})).DATABASE_URL).toMatch(/^file:/);
  });

  it('rejects a short auth secret and missing HMAC secrets', async () => {
    await expect(load({ BETTER_AUTH_SECRET: 'short' })).rejects.toThrow(/BETTER_AUTH_SECRET/);
    await expect(load({ CURSOR_HMAC_SECRET: undefined })).rejects.toThrow(/CURSOR_HMAC_SECRET/);
  });

  it('production requires https, Resend and ImageKit', async () => {
    await expect(load({ ...prodSafe, BETTER_AUTH_URL: 'http://app.example' })).rejects.toThrow(/BETTER_AUTH_URL/);
    await expect(load({ ...prodSafe, EMAIL_TRANSPORT: 'outbox' })).rejects.toThrow(/EMAIL_TRANSPORT/);
    await expect(load({ ...prodSafe, NEXT_PUBLIC_MEDIA_PROVIDER: 'local' })).rejects.toThrow(/NEXT_PUBLIC_MEDIA_PROVIDER/);
    expect((await load(prodSafe)).EMAIL_TRANSPORT).toBe('resend');
  });

  it('production rules are skipped while `next build` collects page data', async () => {
    expect((await load({ ...prodSafe, EMAIL_TRANSPORT: 'outbox', NEXT_PHASE: 'phase-production-build' })).EMAIL_TRANSPORT).toBe('outbox');
  });
});
