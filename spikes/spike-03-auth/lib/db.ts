import 'server-only';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './auth-schema';

const client = createClient({ url: process.env.TURSO_URL ?? 'file:spike03.db', authToken: process.env.TURSO_TOKEN });
// SPIKE-02 finding: enable FK enforcement explicitly on every new client (never inside a batch).
await client.execute('PRAGMA foreign_keys = ON');
export const db = drizzle(client, { schema });
