import 'server-only';
import { sql } from 'drizzle-orm';
import { CATEGORIES, SPECIALTIES } from '@/lib/catalog';
import type { Db } from './client';

/**
 * Reference data every environment needs: exactly 8 fixed categories (BR-36) and 9 job specialties (BR-71).
 * Idempotent: safe to run on every seed, migration and test database. Values come from lib/catalog.
 */
export async function ensureReferenceData(db: Db): Promise<void> {
  const stmts = [
    ...CATEGORIES.map((c, i) =>
      db.run(sql`INSERT INTO categories (id, slug, name, position) VALUES (${c.id}, ${c.slug}, ${c.name}, ${i + 1})
        ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, name = excluded.name, position = excluded.position`),
    ),
    ...SPECIALTIES.map((s, i) =>
      db.run(sql`INSERT INTO specialties (id, slug, name, position) VALUES (${s.id}, ${s.slug}, ${s.name}, ${i + 1})
        ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, name = excluded.name, position = excluded.position`),
    ),
  ];
  await db.batch(stmts as [ReturnType<Db['run']>, ...ReturnType<Db['run']>[]]);
}
