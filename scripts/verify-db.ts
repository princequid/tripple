/**
 * Database foundation check (T-05b, T-06b; ADR-001, ADR-002). Usage: `npm run db:verify`.
 * Runs against whatever DATABASE_URL points at (local file or Turso). It only creates and drops temporary
 * `_verify_*` objects, so it never touches application data. Never prints credentials.
 */
import { loadLocalEnv } from './_env';
loadLocalEnv();

const { createClient } = await import('@libsql/client');
const url = process.env.DATABASE_URL ?? 'file:.data/local.db';
const remote = !url.startsWith('file:');
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });

type Check = { name: string; ok: boolean; detail: string };
const results: Check[] = [];
const check = async (name: string, fn: () => Promise<string>) => {
  try {
    results.push({ name, ok: true, detail: await fn() });
  } catch (e) {
    results.push({ name, ok: false, detail: e instanceof Error ? e.message.split('\n')[0]!.slice(0, 160) : String(e) });
  }
};
const cleanup = async () => {
  for (const t of ['_verify_child', '_verify_parent', '_verify_fts']) await client.execute(`DROP TABLE IF EXISTS ${t}`).catch(() => {});
};

await check('connect + round trip', async () => {
  const t = Date.now();
  await client.execute('SELECT 1');
  const times: number[] = [];
  for (let i = 0; i < 5; i++) {
    const s = Date.now();
    await client.execute('SELECT 1');
    times.push(Date.now() - s);
  }
  times.sort((a, b) => a - b);
  return `${remote ? 'remote' : 'local file'}; first ${Date.now() - t} ms incl. connect; median ${times[2]} ms`;
});

await cleanup();

await check('foreign keys enforced after PRAGMA (ADR-002)', async () => {
  await client.execute('PRAGMA foreign_keys = ON');
  const v = Number((await client.execute('PRAGMA foreign_keys')).rows[0]?.[0]);
  if (v !== 1) throw new Error(`PRAGMA foreign_keys = ${v}`);
  await client.execute('CREATE TABLE _verify_parent (id INTEGER PRIMARY KEY)');
  await client.execute('CREATE TABLE _verify_child (id INTEGER PRIMARY KEY, p INTEGER NOT NULL REFERENCES _verify_parent(id))');
  try {
    await client.execute('INSERT INTO _verify_child (id, p) VALUES (1, 999)');
  } catch {
    return 'orphan insert rejected';
  }
  throw new Error('orphan insert was ACCEPTED: foreign keys are not enforced on this connection');
});

await check('pragma persists across later requests (HTTP: one per call)', async () => {
  for (let i = 0; i < 3; i++) await client.execute('SELECT 1');
  const v = Number((await client.execute('PRAGMA foreign_keys')).rows[0]?.[0]);
  try {
    await client.execute('INSERT INTO _verify_child (id, p) VALUES (3, 997)');
  } catch {
    return `still enforced (pragma reads ${v})`;
  }
  throw new Error(`not enforced on a later request (pragma reads ${v})`);
});

await check('fresh connection without PRAGMA (informational)', async () => {
  const c2 = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const v = Number((await c2.execute('PRAGMA foreign_keys')).rows[0]?.[0]);
  let enforced = false;
  try {
    await c2.execute('INSERT INTO _verify_child (id, p) VALUES (4, 996)');
  } catch {
    enforced = true;
  }
  c2.close();
  return `default foreign_keys=${v}; orphan insert ${enforced ? 'rejected' : 'accepted'} — the app always sets the pragma (client.ts)`;
});

await check('foreign keys enforced inside batch()', async () => {
  try {
    await client.batch(['INSERT INTO _verify_child (id, p) VALUES (2, 998)'], 'write');
  } catch {
    return 'orphan insert in a batch rejected';
  }
  throw new Error('orphan insert in a batch was ACCEPTED');
});

await check('batch() is atomic (F-03, F-13)', async () => {
  try {
    await client.batch(['INSERT INTO _verify_parent (id) VALUES (10)', 'INSERT INTO _verify_parent (id) VALUES (10)'], 'write');
  } catch {
    /* expected: duplicate key */
  }
  const n = Number((await client.execute('SELECT COUNT(*) FROM _verify_parent WHERE id = 10')).rows[0]?.[0]);
  if (n !== 0) throw new Error('first statement survived a failed batch');
  return 'failed batch rolled back completely';
});

await check('FTS5 available (ADR-001)', async () => {
  await client.execute("CREATE VIRTUAL TABLE _verify_fts USING fts5(body, tokenize='unicode61 remove_diacritics 2', prefix='2 3')");
  await client.execute("INSERT INTO _verify_fts (body) VALUES ('banking dashboard'), ('travel app')");
  const r = await client.execute({ sql: 'SELECT body, bm25(_verify_fts) AS r FROM _verify_fts WHERE _verify_fts MATCH ? ORDER BY r', args: ['"dash"*'] });
  if (r.rows.length !== 1) throw new Error(`expected 1 match, got ${r.rows.length}`);
  return 'MATCH + prefix + bm25 work';
});

await cleanup();

await check('migration state', async () => {
  const tables = (await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_verify_%'")).rows.map((r) => String(r[0]));
  const hasJournal = tables.includes('__drizzle_migrations');
  if (!hasJournal) return `no migrations applied yet (${tables.length} tables)`;
  const applied = Number((await client.execute('SELECT COUNT(*) FROM __drizzle_migrations')).rows[0]?.[0]);
  const triggers = (await client.execute("SELECT name FROM sqlite_master WHERE type = 'trigger'")).rows.map((r) => String(r[0]));
  const cats = tables.includes('categories') ? Number((await client.execute('SELECT COUNT(*) FROM categories')).rows[0]?.[0]) : 0;
  return `${applied} migrations applied; ${tables.length} tables; FTS triggers: ${triggers.filter((t) => t.startsWith('shots_fts')).length}/3; categories: ${cats}`;
});

client.close();
const width = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(width)}  ${r.detail}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
