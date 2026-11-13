import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Vitest (A-06, API_TESTING_PLAN §2). Unit tests are pure; integration tests run services and route handlers
 * against a real, freshly migrated libSQL file database per test file (tests/setup/env.ts).
 * `server-only` is aliased to an empty module: it only guards client bundles, which Vitest does not build.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      'server-only': path.resolve(import.meta.dirname, 'tests/setup/server-only-stub.ts'),
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['tests/setup/env.ts'],
    pool: 'forks',
    testTimeout: 20_000,
    hookTimeout: 30_000,
    reporters: ['default'],
  },
});
