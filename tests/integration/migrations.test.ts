import { beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { setupTestDb, makeProfile, makeShot } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});

describe('schema integrity (ADR-001, ADR-002, BR-27, BR-36)', () => {
  it('foreign keys are enforced on the connection', async () => {
    const [r] = await db.all<{ foreign_keys: number }>(sql`PRAGMA foreign_keys`);
    expect(Number(r!.foreign_keys)).toBe(1);
    await expect(db.run(sql`INSERT INTO likes (profile_id, shot_id, created_at) VALUES (999, 999, 0)`)).rejects.toThrow();
  });

  it('exactly 8 categories exist', async () => {
    const [r] = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM categories`);
    expect(Number(r!.n)).toBe(8);
  });

  it('the three FTS triggers exist (ADR-001 rule 4)', async () => {
    const rows = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name`);
    expect(rows.map((r) => r.name)).toEqual(['shots_fts_ad', 'shots_fts_ai', 'shots_fts_au']);
  });

  it('a new shot is searchable; an edited title is re-indexed; a deleted row leaves the index', async () => {
    const a = await makeProfile(db);
    const s = await makeShot(db, { authorId: a.profileId, title: 'Zebra onboarding' });
    const find = async (q: string) => db.all<{ rowid: number }>(sql`SELECT rowid FROM shots_fts WHERE shots_fts MATCH ${q}`);
    expect((await find('"zebra"')).map((r) => Number(r.rowid))).toEqual([s.id]);
    await db.run(sql`UPDATE shots SET title = 'Giraffe onboarding' WHERE id = ${s.id}`);
    expect(await find('"zebra"')).toHaveLength(0);
    expect(await find('"giraffe"')).toHaveLength(1);
    await db.run(sql`DELETE FROM content_blocks WHERE shot_id = ${s.id}`);
    await db.run(sql`DELETE FROM shots WHERE id = ${s.id}`);
    expect(await find('"giraffe"')).toHaveLength(0);
  });

  it('counter CHECK constraints reject negatives (BR-27)', async () => {
    const a = await makeProfile(db);
    const s = await makeShot(db, { authorId: a.profileId });
    await expect(db.run(sql`UPDATE shots SET likes_count = -1 WHERE id = ${s.id}`)).rejects.toThrow();
    await expect(db.run(sql`UPDATE profiles SET username = 'UPPER' WHERE id = ${a.profileId}`)).rejects.toThrow();
  });
});
