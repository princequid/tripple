import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright (A-06, API_TESTING_PLAN §4). Runs against a production build (`next start`) on port 3100 with its
 * own freshly reset and seeded database (`.data/e2e.db`), so it never touches the developer database.
 * APP_ENV=test allows the outbox email transport (codes are read from `.data/outbox.jsonl`).
 * Prerequisite: `npm run build`.
 */
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;
const env = {
  DATABASE_URL: 'file:.data/e2e.db',
  APP_ENV: 'test',
  BETTER_AUTH_URL: BASE,
  EMAIL_TRANSPORT: 'outbox',
  NEXT_PUBLIC_MEDIA_PROVIDER: 'local',
  NEXT_PUBLIC_MEDIA_BASE_URL: '/seed-media',
  // The suite covers the production email-code flow; the prototype password flow (A-28) is verified separately.
  PROTOTYPE_PASSWORD_AUTH: '0',
};
const tsx = 'npx tsx --conditions=react-server';
// PW_CHANNEL=chrome runs on the locally installed Google Chrome instead of Playwright's bundled Chromium.
const channel = process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list']],
  use: { baseURL: BASE, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...channel, viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], ...channel }, grep: /@mobile/ },
  ],
  webServer: {
    command: `${tsx} scripts/reset-db.ts && ${tsx} scripts/migrate.ts && ${tsx} scripts/seed.ts && npx next start -p ${PORT}`,
    url: `${BASE}/api/health`,
    env,
    timeout: 240_000,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
