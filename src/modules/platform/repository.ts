import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';

export async function ping(): Promise<void> {
  const db = await getDb();
  await db.run(sql`SELECT 1`);
}
