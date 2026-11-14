/**
 * Prototype only (A-28): gives every seed person a password so the demo can use email + password sign-in
 * (PROTOTYPE_PASSWORD_AUTH=1). Usage: `npm run db:seed-passwords` (also run by db:reset). Idempotent.
 *
 * Sign in as `<username>@seed.trippple.test` with the password below, e.g. demo@seed.trippple.test.
 * Uses Better Auth's own hasher, so the rows are exactly what `/api/auth/sign-up/email` would have written.
 */
import { randomUUID } from 'node:crypto';
import { loadLocalEnv } from './_env';
loadLocalEnv();

export const DEMO_PASSWORD = 'Trippple2026';

const { sql } = await import('drizzle-orm');
const { hashPassword } = await import('better-auth/crypto');
const { getDb } = await import('../src/server/db/client');

const db = await getDb();
const users = await db.all<{ id: string; email: string }>(sql`SELECT id, email FROM user WHERE email LIKE '%@seed.trippple.test'`);
const hash = await hashPassword(DEMO_PASSWORD);
const now = Date.now();
let created = 0;
for (const u of users) {
  const existing = await db.all<{ id: string }>(sql`SELECT id FROM account WHERE user_id = ${u.id} AND provider_id = 'credential'`);
  if (existing.length) {
    await db.run(sql`UPDATE account SET password = ${hash}, updated_at = ${now} WHERE id = ${existing[0]!.id}`);
  } else {
    await db.run(sql`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES (${randomUUID()}, ${u.id}, 'credential', ${u.id}, ${hash}, ${now}, ${now})`);
    created++;
  }
}
console.log(`Prototype passwords set for ${users.length} seed accounts (${created} new). Password: ${DEMO_PASSWORD}`);
