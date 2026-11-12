// THROWAWAY SPIKE-01 (P02-07): FTS5 on libSQL (@libsql/client, local file mode).
// Run: node fts5.mjs   -> prints JSON results
import { createClient } from '@libsql/client';
import fs from 'node:fs';

const DB = 'file:spike01.db';
for (const f of ['spike01.db', 'spike01.db-wal', 'spike01.db-shm']) try { fs.rmSync(f); } catch {}
const db = createClient({ url: DB });
const out = {};

// --- deterministic synthetic data (no real content) ---
let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const words = ['dashboard','landing','mobile','banking','fintech','branding','logo','illustration','typography','animation','ecommerce','onboarding','travel','health','fitness','music','crypto','wallet','analytics','portfolio','agency','studio','minimal','gradient','glass','neumorphic','dark','light','icon','poster','packaging','website','app','ui','ux','saas','ai','assistant','chat','calendar','booking','food','delivery','real','estate','education','game','sports','weather','map'];
const pick = (n) => Array.from({ length: n }, () => words[Math.floor(rnd() * words.length)]);
const N = 10000;

await db.batch([
  `CREATE TABLE shots (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT, tags TEXT, likes INTEGER NOT NULL DEFAULT 0, published_at INTEGER NOT NULL)`,
  // External-content FTS5 index over shots (title weighted higher via bm25 weights at query time)
  `CREATE VIRTUAL TABLE shots_fts USING fts5(title, description, tags, content='shots', content_rowid='id', tokenize='unicode61 remove_diacritics 2', prefix='2 3')`,
  `CREATE TRIGGER shots_ai AFTER INSERT ON shots BEGIN INSERT INTO shots_fts(rowid,title,description,tags) VALUES (new.id,new.title,new.description,new.tags); END`,
  `CREATE TRIGGER shots_ad AFTER DELETE ON shots BEGIN INSERT INTO shots_fts(shots_fts,rowid,title,description,tags) VALUES('delete',old.id,old.title,old.description,old.tags); END`,
  `CREATE TRIGGER shots_au AFTER UPDATE ON shots BEGIN INSERT INTO shots_fts(shots_fts,rowid,title,description,tags) VALUES('delete',old.id,old.title,old.description,old.tags); INSERT INTO shots_fts(rowid,title,description,tags) VALUES (new.id,new.title,new.description,new.tags); END`,
], 'write');
out.fts5_virtual_table_created = true;

let t0 = performance.now();
const stmts = [];
for (let i = 1; i <= N; i++) {
  const title = pick(3).join(' ');
  stmts.push({ sql: 'INSERT INTO shots(id,title,description,tags,likes,published_at) VALUES (?,?,?,?,?,?)', args: [i, title[0].toUpperCase() + title.slice(1), pick(12).join(' '), pick(5).join(','), Math.floor(rnd() * 5000), 1760000000 + i * 60] });
  if (stmts.length === 1000) { await db.batch(stmts.splice(0), 'write'); }
}
out.seed_10k_with_triggers_ms = Math.round(performance.now() - t0);
out.fts_rows = (await db.execute(`SELECT count(*) c FROM shots_fts`)).rows[0].c;

// --- queries ---
const queries = ['dashboard', 'mobile banking', 'fin*', 'logo branding', '"real estate"', 'typo*', 'glass OR neumorphic', 'ai assistant chat'];
const lat = [];
const samples = {};
for (let r = 0; r < 25; r++) for (const q of queries) {
  const s = performance.now();
  const res = await db.execute({
    sql: `SELECT s.id, s.title, bm25(shots_fts, 10.0, 1.0, 3.0) AS rank
          FROM shots_fts JOIN shots s ON s.id = shots_fts.rowid
          WHERE shots_fts MATCH ? ORDER BY rank LIMIT 24`, args: [q] });
  lat.push(performance.now() - s);
  if (r === 0) samples[q] = { hits_first_page: res.rows.length, top: res.rows[0]?.title };
}
lat.sort((a, b) => a - b);
out.queries_run = lat.length;
out.latency_ms = { p50: +lat[Math.floor(lat.length * 0.5)].toFixed(2), p95: +lat[Math.floor(lat.length * 0.95)].toFixed(2), max: +lat[lat.length - 1].toFixed(2) };
out.samples = samples;

// highlight/snippet support
out.snippet = (await db.execute({ sql: `SELECT snippet(shots_fts, 1, '<mark>', '</mark>', '…', 8) s FROM shots_fts WHERE shots_fts MATCH ? LIMIT 1`, args: ['dashboard'] })).rows[0]?.s;

// triggers keep index in sync on UPDATE/DELETE
await db.execute({ sql: `UPDATE shots SET title='Zzyzx unique title' WHERE id=1` });
out.update_synced = (await db.execute({ sql: `SELECT count(*) c FROM shots_fts WHERE shots_fts MATCH 'zzyzx'` })).rows[0].c === 1;
await db.execute({ sql: `DELETE FROM shots WHERE id=1` });
out.delete_synced = (await db.execute({ sql: `SELECT count(*) c FROM shots_fts WHERE shots_fts MATCH 'zzyzx'` })).rows[0].c === 0;

// malformed user input behaviour (must be sanitised by the app)
try { await db.execute({ sql: `SELECT rowid FROM shots_fts WHERE shots_fts MATCH ?`, args: ['"unbalanced'] }); out.malformed_query = 'accepted'; }
catch (e) { out.malformed_query = 'throws: ' + String(e.message).slice(0, 90); }

// shadow tables that tooling must ignore
out.shadow_tables = (await db.execute(`SELECT name FROM sqlite_master WHERE name LIKE 'shots_fts%' ORDER BY name`)).rows.map(r => r.name);
out.sqlite_version = (await db.execute(`SELECT sqlite_version() v`)).rows[0].v;
console.log(JSON.stringify(out, null, 2));
db.close();
