// THROWAWAY SPIKE-02 (P02-08): FK enforcement + atomicity with @libsql/client and Drizzle (local file mode).
// Remote (Turso Cloud / HTTP) mode: re-run with TURSO_URL + TURSO_TOKEN once the account exists (B-15).
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { eq, sql } from 'drizzle-orm';
import fs from 'node:fs';

const remote = !!process.env.TURSO_URL;
const url = remote ? process.env.TURSO_URL : 'file:spike02.db';
if (!remote) for (const f of ['spike02.db', 'spike02.db-wal', 'spike02.db-shm']) try { fs.rmSync(f); } catch {}
const mk = () => createClient({ url, authToken: process.env.TURSO_TOKEN });
const out = { mode: remote ? 'remote' : 'local-file' };
const r = async (p) => { try { return await p; } catch (e) { return { error: String(e.code || '') + ' ' + String(e.message).slice(0, 110) }; } };

let c = mk();
await c.batch([
  'DROP TABLE IF EXISTS likes', 'DROP TABLE IF EXISTS shots', 'DROP TABLE IF EXISTS users',
  `CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE)`,
  `CREATE TABLE shots (id INTEGER PRIMARY KEY, author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0))`,
  `CREATE TABLE likes (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, shot_id INTEGER NOT NULL REFERENCES shots(id) ON DELETE CASCADE, created_at INTEGER NOT NULL, PRIMARY KEY (user_id, shot_id))`,
  `INSERT INTO users(id, username) VALUES (1,'ada'),(2,'lin')`,
  `INSERT INTO shots(id, author_id, title) VALUES (10, 1, 'Hello')`,
], 'write');

// 1) default FK setting on a fresh connection
out.fk_default = (await c.execute('PRAGMA foreign_keys')).rows[0]?.foreign_keys;
out.orphan_insert_without_pragma = await r(c.execute(`INSERT INTO shots(id, author_id, title) VALUES (11, 999, 'orphan')`).then(() => 'ACCEPTED (no enforcement)'));
await c.execute('DELETE FROM shots WHERE id = 11');

// 2) PRAGMA inside a batch (a batch is a transaction -> pragma is a no-op there in SQLite)
c.close(); c = mk();
out.pragma_inside_batch = await r(c.batch([`PRAGMA foreign_keys = ON`, `INSERT INTO shots(id, author_id, title) VALUES (12, 999, 'orphan')`], 'write').then(() => 'ACCEPTED (pragma ignored inside tx)'));
await c.execute('DELETE FROM shots WHERE id = 12');

// 3) PRAGMA as its own statement, then insert on same client
c.close(); c = mk();
await c.execute('PRAGMA foreign_keys = ON');
out.fk_after_pragma = (await c.execute('PRAGMA foreign_keys')).rows[0]?.foreign_keys;
out.orphan_insert_after_pragma = await r(c.execute(`INSERT INTO shots(id, author_id, title) VALUES (13, 999, 'orphan')`).then(() => 'ACCEPTED'));
out.orphan_in_batch_after_pragma = await r(c.batch([`INSERT INTO shots(id, author_id, title) VALUES (14, 999, 'orphan')`], 'write').then(() => 'ACCEPTED'));
// does it persist after many statements / reconnect?
out.fk_after_reconnect = (await (async () => { c.close(); c = mk(); return (await c.execute('PRAGMA foreign_keys')).rows[0]?.foreign_keys; })());
await c.execute('PRAGMA foreign_keys = ON');

// 4) ON DELETE CASCADE works only with FK on
await c.execute(`INSERT INTO likes(user_id, shot_id, created_at) VALUES (2, 10, 1)`);
await c.execute(`DELETE FROM shots WHERE id = 10`);
out.cascade_delete_likes_remaining = (await c.execute('SELECT count(*) n FROM likes')).rows[0].n;
await c.batch([`INSERT INTO shots(id, author_id, title) VALUES (10, 1, 'Hello')`], 'write');

// 5) Drizzle batch atomicity: like + counter, second like violates PK -> whole batch rolled back
const users = sqliteTable('users', { id: integer('id').primaryKey(), username: text('username').notNull() });
const shots = sqliteTable('shots', { id: integer('id').primaryKey(), authorId: integer('author_id').notNull(), title: text('title').notNull(), likesCount: integer('likes_count').notNull().default(0) });
const likes = sqliteTable('likes', { userId: integer('user_id').notNull(), shotId: integer('shot_id').notNull(), createdAt: integer('created_at').notNull() }, (t) => [primaryKey({ columns: [t.userId, t.shotId] })]);
const db = drizzle(c);
const likeShot = (userId, shotId) => db.batch([
  db.insert(likes).values({ userId, shotId, createdAt: Date.now() }),
  db.update(shots).set({ likesCount: sql`${shots.likesCount} + 1` }).where(eq(shots.id, shotId)),
]);
await likeShot(2, 10);
out.after_first_like = (await db.select().from(shots).where(eq(shots.id, 10)))[0].likesCount;
out.duplicate_like = await r(likeShot(2, 10).then(() => 'ACCEPTED'));
out.after_duplicate_like_count = (await db.select().from(shots).where(eq(shots.id, 10)))[0].likesCount; // expect still 1
// Reverse order (counter first, then failing insert) to prove rollback of the earlier statement
out.counter_then_fail = await r(db.batch([
  db.update(shots).set({ likesCount: sql`${shots.likesCount} + 1` }).where(eq(shots.id, 10)),
  db.insert(likes).values({ userId: 2, shotId: 10, createdAt: 1 }),
]).then(() => 'ACCEPTED'));
out.after_counter_then_fail = (await db.select().from(shots).where(eq(shots.id, 10)))[0].likesCount; // expect 1

// 6) Drizzle interactive transaction rollback
out.drizzle_tx = await r(db.transaction(async (tx) => {
  await tx.update(shots).set({ title: 'changed' }).where(eq(shots.id, 10));
  throw new Error('boom');
}).then(() => 'committed'));
out.title_after_tx_rollback = (await db.select().from(shots).where(eq(shots.id, 10)))[0].title; // expect Hello
out.fk_inside_drizzle_tx = await r(db.transaction(async (tx) => (await tx.run(sql`PRAGMA foreign_keys`)).rows?.[0]));

// 7) CHECK constraint
out.negative_counter = await r(c.execute(`UPDATE shots SET likes_count = -1 WHERE id = 10`).then(() => 'ACCEPTED'));

// 8) Recommended client factory: run PRAGMA once per new client before use
out.factory_note = 'createClient() then await execute("PRAGMA foreign_keys = ON") before first use; never inside batch()';
console.log(JSON.stringify(out, null, 2));
c.close();
