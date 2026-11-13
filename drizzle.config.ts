import { defineConfig } from 'drizzle-kit';

// ADR-001 / F-12: only `generate` + `migrate` are allowed. `drizzle-kit push` is forbidden on persistent DBs
// because it drops the FTS5 objects and their triggers, which live in custom migrations.
export default defineConfig({
  dialect: 'turso',
  schema: './src/server/db/schema/index.ts',
  out: './src/server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:.data/local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  strict: true,
  verbose: false,
});
