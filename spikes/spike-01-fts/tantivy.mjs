// THROWAWAY SPIKE-01 (P02-07): Turso new-engine FTS index (`CREATE INDEX ... USING fts`) via @tursodatabase/database (embedded).
import { connect } from '@tursodatabase/database';
const out = {};
const db = await connect(':memory:');
let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const words = ['dashboard','landing','mobile','banking','fintech','branding','logo','illustration','typography','animation','ecommerce','onboarding','travel','health','fitness','music','crypto','wallet','analytics','portfolio','agency','studio','minimal','gradient','glass','neumorphic','dark','light','icon','poster','packaging','website','app','ui','ux','saas','ai','assistant','chat','calendar','booking','food','delivery','real','estate','education','game','sports','weather','map'];
const pick = (n) => Array.from({ length: n }, () => words[Math.floor(rnd() * words.length)]);

await db.exec(`CREATE TABLE shots (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT, tags TEXT)`);
const variants = [
  `CREATE INDEX shots_fts ON shots USING fts (title, description, tags)`,
  `CREATE INDEX shots_fts ON shots USING fts (title)`,
];
for (const v of variants) {
  try { await db.exec(v); out.index_ddl = v; out.index_created = true; break; }
  catch (e) { (out.index_errors ||= []).push(v + ' -> ' + String(e.message).slice(0, 160)); }
}
const ins = db.prepare('INSERT INTO shots(id,title,description,tags) VALUES (?,?,?,?)');
let t0 = performance.now();
try {
  await db.exec('BEGIN');
  for (let i = 1; i <= 10000; i++) await ins.run(i, pick(3).join(' '), pick(12).join(' '), pick(5).join(','));
  await db.exec('COMMIT');
  out.seed_10k_ms = Math.round(performance.now() - t0);
} catch (e) { out.seed_error = String(e.message).slice(0, 200); }

if (out.index_created) {
  const tries = [
    [`fts_match + fts_score`, `SELECT id, title, fts_score(title, description, tags, 'mobile banking') AS score FROM shots WHERE fts_match(title, description, tags, 'mobile banking') ORDER BY score DESC LIMIT 24`],
    [`fts_match title-only`, `SELECT id, title FROM shots WHERE fts_match(title, 'dashboard') LIMIT 24`],
    [`prefix fin*`, `SELECT id, title FROM shots WHERE fts_match(title, description, tags, 'fin*') LIMIT 24`],
  ];
  for (const [name, sql] of tries) {
    try {
      const lat = [];
      let rows;
      for (let r = 0; r < 25; r++) { const s = performance.now(); rows = await db.prepare(sql).all(); lat.push(performance.now() - s); }
      lat.sort((a, b) => a - b);
      out[name] = { hits: rows.length, top: rows[0]?.title, p50: +lat[12].toFixed(2), p95: +lat[23].toFixed(2) };
    } catch (e) { out[name] = 'error: ' + String(e.message).slice(0, 200); }
  }
  // read-your-writes inside a transaction
  try {
    await db.exec('BEGIN');
    await db.prepare('INSERT INTO shots(id,title,description,tags) VALUES (?,?,?,?)').run(20001, 'Qwertyzz test', '', '');
    const r = await db.prepare(`SELECT id FROM shots WHERE fts_match(title, description, tags, 'qwertyzz')`).all();
    out.read_your_write_in_tx = r.length;
    await db.exec('COMMIT');
    const r2 = await db.prepare(`SELECT id FROM shots WHERE fts_match(title, description, tags, 'qwertyzz')`).all();
    out.visible_after_commit = r2.length;
  } catch (e) { out.ryw_error = String(e.message).slice(0, 200); }
}
// Does this engine also support FTS5 virtual tables?
try { await db.exec(`CREATE VIRTUAL TABLE t5 USING fts5(x)`); out.fts5_in_new_engine = 'supported'; }
catch (e) { out.fts5_in_new_engine = 'error: ' + String(e.message).slice(0, 160); }
console.log(JSON.stringify(out, null, 2));
