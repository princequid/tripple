import 'server-only';
import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

/**
 * DB client factory (ADR-002). One client per process.
 *
 * - `dbSync()` builds the client and Drizzle instance **without any I/O**, so modules that need the instance at
 *   import time (Better Auth's adapter) do not touch the database while `next build` imports them in parallel
 *   workers (that caused SQLITE_BUSY during page-data collection).
 * - `getDb()` additionally runs the connection setup once before the first query: `PRAGMA foreign_keys = ON`
 *   (asserted; fail fast if enforcement is off) and, for local files, WAL + busy timeout. Every repository goes
 *   through `getDb()`; entry points that reach Better Auth first call `ensureDbReady()`.
 *
 * Verified 2026-11-13 (`npm run db:verify`): Turso enforces foreign keys by default and the setting holds across
 * HTTP requests; the pragma is still set explicitly so a local or self-hosted libSQL behaves the same.
 */
export type Db = LibSQLDatabase<typeof schema>;

let instance: { client: Client; db: Db; url: string } | null = null;
let ready: Promise<void> | null = null;

function create() {
  const url = process.env.DATABASE_URL ?? 'file:.data/local.db';
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  return { client, db: drizzle(client, { schema }), url };
}

/** The Drizzle instance with no connection setup. Prefer `getDb()` everywhere except library wiring. */
export function dbSync(): Db {
  instance ??= create();
  return instance.db;
}

async function setup(): Promise<void> {
  instance ??= create();
  const { client, url } = instance;
  await client.execute('PRAGMA foreign_keys = ON');
  const fk = await client.execute('PRAGMA foreign_keys');
  if (Number(fk.rows[0]?.[0]) !== 1) {
    throw new Error('Foreign-key enforcement is OFF on the database connection (ADR-002)');
  }
  if (url.startsWith('file:')) {
    // Local file mode: WAL lets readers proceed during writes (dev server + scripts at the same time).
    await client.execute('PRAGMA busy_timeout = 5000');
    await client.execute('PRAGMA journal_mode = WAL');
  }
}

/** Runs the one-time connection setup (idempotent; retried after a failure). */
export function ensureDbReady(): Promise<void> {
  ready ??= setup().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export async function getDb(): Promise<Db> {
  await ensureDbReady();
  return dbSync();
}

export async function getClient(): Promise<Client> {
  await ensureDbReady();
  return instance!.client;
}

/** Tests only: drop the cached client so the next call reconnects (e.g. after changing DATABASE_URL). */
export async function resetDbForTests(): Promise<void> {
  if (!instance) return;
  instance.client.close();
  instance = null;
  ready = null;
}

export { schema };
