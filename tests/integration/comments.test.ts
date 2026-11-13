import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as comments from '@/modules/comments/service';
import { resetLimitsForTests } from '@/server/rate-limit';
import { setupTestDb, clearContent, makeProfile, makeShot, visitor, errorCode } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});
beforeEach(async () => {
  await clearContent(db);
  await resetLimitsForTests();
});

const count = async (shotId: number) => Number((await db.all<{ n: number }>(sql`SELECT comments_count AS n FROM shots WHERE id = ${shotId}`))[0]!.n);

describe('comments (S-04, FR-49, BR-48…BR-52)', () => {
  it('normalises bodies and validates length (BR-48)', () => {
    expect(comments.normaliseBody('  hi\r\n\r\n\r\n\r\n\r\nthere \u0007 ')).toBe('hi\n\n\nthere');
  });

  it('create, reply, reply-to-reply flattening with @mention, ordering (BR-49)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db, { username: 'ann' });
    const bob = await makeProfile(db, { username: 'bob' });
    const s = await makeShot(db, { authorId: author.profileId });
    const top = await comments.create(ann.viewer, s.id, { body: 'Lovely' });
    const r1 = await comments.create(bob.viewer, s.id, { body: 'Agreed', parentId: top.id });
    const r2 = await comments.create(ann.viewer, s.id, { body: 'Thanks', parentId: r1.id });
    expect(r2.parentId).toBe(top.id);
    expect(r2.body).toBe('@bob Thanks');
    const second = await comments.create(bob.viewer, s.id, { body: 'Second' });
    const t = await comments.thread(s.id, visitor, {});
    expect(t.comments.map((c) => c.id)).toEqual([top.id, second.id]);
    expect(t.comments[0]!.replies.map((c) => c.id)).toEqual([r1.id, r2.id]);
    expect(t).toMatchObject({ total: 4, disabled: false, canModerate: false, nextCursor: null });
    expect(await count(s.id)).toBe(4);
    expect(t.comments[0]!.isLiked).toBeNull();
    expect(await errorCode(() => comments.create(ann.viewer, s.id, { body: '   ' }))).toBe('VALIDATION');
    expect(await errorCode(() => comments.create(ann.viewer, s.id, { body: 'x'.repeat(2001) }))).toBe('VALIDATION');
    expect(await errorCode(() => comments.create(visitor, s.id, { body: 'x' }))).toBe('UNAUTHENTICATED');
    expect(await errorCode(() => comments.create(ann.viewer, s.id, { body: 'x', parentId: 999_999 }))).toBe('NOT_FOUND');
  });

  it('pagination of top-level comments', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const ids = [];
    for (let i = 0; i < 3; i++) ids.push((await comments.create(ann.viewer, s.id, { body: `c${i}` })).id);
    await db.run(sql`UPDATE comments SET created_at = id`);
    const p1 = await comments.thread(s.id, visitor, { limit: 2 });
    expect(p1.comments.map((c) => c.id)).toEqual(ids.slice(0, 2));
    const p2 = await comments.thread(s.id, visitor, { limit: 2, cursor: p1.nextCursor });
    expect(p2.comments.map((c) => c.id)).toEqual(ids.slice(2));
    expect(p2.nextCursor).toBeNull();
  });

  it('edit within 15 minutes by the author only (BR-50)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const c = await comments.create(ann.viewer, s.id, { body: 'Typo' });
    expect(c.canEdit).toBe(true);
    const e = await comments.edit(ann.viewer, c.id, { body: 'Fixed' });
    expect(e.body).toBe('Fixed');
    expect(e.editedAt).not.toBeNull();
    expect(await errorCode(() => comments.edit(author.viewer, c.id, { body: 'Mine' }))).toBe('FORBIDDEN');
    await db.run(sql`UPDATE comments SET created_at = ${Date.now() - 16 * 60_000} WHERE id = ${c.id}`);
    expect(await errorCode(() => comments.edit(ann.viewer, c.id, { body: 'Late' }))).toBe('FORBIDDEN');
  });

  it('delete: placeholder when replies exist, removal otherwise; managers may delete (BR-50)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const top = await comments.create(ann.viewer, s.id, { body: 'Top' });
    const reply = await comments.create(bob.viewer, s.id, { body: 'Reply', parentId: top.id });
    const lone = await comments.create(bob.viewer, s.id, { body: 'Lone' });
    expect(await errorCode(() => comments.remove(bob.viewer, top.id))).toBe('FORBIDDEN');
    expect(await comments.remove(ann.viewer, top.id)).toEqual({ deleted: true, placeholder: true });
    let t = await comments.thread(s.id, visitor, {});
    expect(t.comments[0]).toMatchObject({ id: top.id, deleted: true, body: '' });
    expect(t.comments[0]!.replies.map((r) => r.id)).toEqual([reply.id]);
    expect(await count(s.id)).toBe(2);
    // The shot author can delete any comment on the shot; the placeholder disappears with its last reply.
    expect((await comments.thread(s.id, author.viewer, {})).canModerate).toBe(true);
    expect(await comments.remove(author.viewer, reply.id)).toEqual({ deleted: true, placeholder: false });
    await comments.remove(bob.viewer, lone.id);
    t = await comments.thread(s.id, visitor, {});
    expect(t.comments).toEqual([]);
    expect(await count(s.id)).toBe(0);
    expect(Number((await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM comments`))[0]!.n)).toBe(0);
  });

  it('team owner/admin may moderate comments on a team shot (BR-50, BR-60)', async () => {
    const team = await makeProfile(db, { kind: 'team' });
    const author = await makeProfile(db);
    const admin = await makeProfile(db);
    const ann = await makeProfile(db);
    const now = Date.now();
    await db.run(sql`INSERT INTO team_memberships (team_id, member_id, role, created_at) VALUES (${team.profileId}, ${author.profileId}, 'member', ${now}), (${team.profileId}, ${admin.profileId}, 'admin', ${now})`);
    const s = await makeShot(db, { authorId: author.profileId, teamId: team.profileId });
    const c = await comments.create(ann.viewer, s.id, { body: 'Hmm' });
    expect((await comments.remove(admin.viewer, c.id)).deleted).toBe(true);
    expect((await comments.setDisabled(admin.viewer, s.id, true)).commentsDisabled).toBe(true);
  });

  it('disabling comments blocks new ones but keeps existing (BR-51)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    await comments.create(ann.viewer, s.id, { body: 'Before' });
    expect(await errorCode(() => comments.setDisabled(ann.viewer, s.id, true))).toBe('FORBIDDEN');
    await comments.setDisabled(author.viewer, s.id, true);
    expect(await errorCode(() => comments.create(ann.viewer, s.id, { body: 'After' }))).toBe('COMMENTS_DISABLED');
    const t = await comments.thread(s.id, visitor, {});
    expect(t.disabled).toBe(true);
    expect(t.comments).toHaveLength(1);
  });

  it('comment likes: once, not own, set semantics (BR-52)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const bob = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const c = await comments.create(ann.viewer, s.id, { body: 'Like me' });
    expect(await comments.setLike(bob.viewer, c.id, true)).toEqual({ liked: true, likesCount: 1 });
    expect(await comments.setLike(bob.viewer, c.id, true)).toEqual({ liked: true, likesCount: 1 });
    expect(await errorCode(() => comments.setLike(ann.viewer, c.id, true))).toBe('CANNOT_LIKE_OWN');
    expect((await comments.thread(s.id, bob.viewer, {})).comments[0]!.isLiked).toBe(true);
    expect(await comments.setLike(bob.viewer, c.id, false)).toEqual({ liked: false, likesCount: 0 });
  });

  it('hidden comments and suspended authors are not shown; ineligible shot → 404', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const c = await comments.create(ann.viewer, s.id, { body: 'Spam' });
    await comments.setHidden(c.id, true);
    expect((await comments.thread(s.id, visitor, {})).comments).toEqual([]);
    expect(await count(s.id)).toBe(0);
    await comments.setHidden(c.id, false);
    expect(await count(s.id)).toBe(1);
    await db.run(sql`UPDATE profiles SET suspended_at = 1 WHERE id = ${ann.profileId}`);
    expect((await comments.thread(s.id, visitor, {})).comments).toEqual([]);
    await db.run(sql`UPDATE shots SET hidden_at = 1 WHERE id = ${s.id}`);
    expect(await errorCode(() => comments.thread(s.id, visitor, {}))).toBe('NOT_FOUND');
  });

  it('RL-COMMENT: the 11th comment in a minute is rejected (BR-76)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    for (let i = 0; i < 10; i++) await comments.create(ann.viewer, s.id, { body: `n${i}` });
    expect(await errorCode(() => comments.create(ann.viewer, s.id, { body: 'too many' }))).toBe('RATE_LIMITED');
    expect(await count(s.id)).toBe(10);
  });

  it('reconcile repairs comment counters (BR-27)', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    await comments.create(ann.viewer, s.id, { body: 'x' });
    await db.run(sql`UPDATE shots SET comments_count = 9 WHERE id = ${s.id}`);
    expect(await comments.reconcile()).toBe(1);
    expect(await count(s.id)).toBe(1);
  });
});
