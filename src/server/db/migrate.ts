import 'server-only';
import path from 'node:path';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { getDb } from './client';

/** Applies Drizzle Kit migrations (generate + migrate only; `push` is forbidden, ADR-001 / F-12). */
export async function runMigrations(): Promise<void> {
  const db = await getDb();
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'src/server/db/migrations') });
}
