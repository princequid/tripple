import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as reports from '@/modules/moderation/reports';
import * as comments from '@/modules/comments/service';
import * as shots from '@/modules/shots/service';
import * as users from '@/modules/users/service';
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

describe('reports and staff queue (BR-68, BR-69, P09-30)', () => {
  it('members report once per target; not their own; note required for "other"', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    expect(await reports.report(ann.viewer, { targetType: 'shot', targetId: s.id, reason: 'spam' })).toEqual({ status: 'created' });
    expect(await reports.report(ann.viewer, { targetType: 'shot', targetId: s.id, reason: 'harassment' })).toEqual({ status: 'already-reported' });
    expect(await errorCode(() => reports.report(author.viewer, { targetType: 'shot', targetId: s.id, reason: 'spam' }))).toBe('FORBIDDEN');
    expect(await errorCode(() => reports.report(ann.viewer, { targetType: 'shot', targetId: 999_999, reason: 'spam' }))).toBe('NOT_FOUND');
    expect(await errorCode(() => reports.report(ann.viewer, { targetType: 'profile', targetId: author.profileId, reason: 'other' }))).toBe('VALIDATION');
    expect((await reports.report(ann.viewer, { targetType: 'profile', targetId: author.profileId, reason: 'other', note: 'Impersonation' })).status).toBe('created');
    expect(await errorCode(() => reports.report(visitor, { targetType: 'shot', targetId: s.id, reason: 'spam' }))).toBe('UNAUTHENTICATED');
    expect(Number((await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM reports`))[0]!.n)).toBe(2);
  });

  it('queue: staff only, one row per target with count, oldest first; hide decision resolves all and is audited', async () => {
    const author = await makeProfile(db, { username: 'au-thor' });
    const r1 = await makeProfile(db);
    const r2 = await makeProfile(db);
    const mod = await makeProfile(db, { role: 'moderator', username: 'mod-x' });
    const s = await makeShot(db, { authorId: author.profileId, title: 'Reported shot' });
    const c = await comments.create(r2.viewer, s.id, { body: 'Buy followers here' });
    await reports.report(r1.viewer, { targetType: 'shot', targetId: s.id, reason: 'ip' });
    await reports.report(r2.viewer, { targetType: 'shot', targetId: s.id, reason: 'ip' });
    await reports.report(r1.viewer, { targetType: 'comment', targetId: c.id, reason: 'spam' });
    expect(await errorCode(() => reports.queue(r1.viewer, {}))).toBe('FORBIDDEN');
    const q = await reports.queue(mod.viewer, {});
    expect(q.items.map((x) => [x.targetType, x.reportsCount, x.targetLabel])).toEqual([
      ['shot', 2, 'Reported shot'],
      ['comment', 1, 'Buy followers here'],
    ]);
    expect(q.items[0]).toMatchObject({ ownerUsername: 'au-thor', targetHref: `/shots/${s.id}-reported-shot`, status: 'open' });
    expect(await errorCode(() => reports.decide(mod.viewer, q.items[0]!.id, { action: 'hide', reason: 'short' }))).toBe('VALIDATION');
    expect(await reports.decide(mod.viewer, q.items[0]!.id, { action: 'hide', reason: 'Copied artwork, confirmed' })).toEqual({ status: 'hidden', resolved: 2 });
    expect(await errorCode(() => shots.getDetail(s.id, visitor, null))).toBe('NOT_FOUND');
    expect(await errorCode(() => reports.decide(mod.viewer, q.items[0]!.id, { action: 'dismiss', reason: 'Already handled once' }))).toBe('CONFLICT');
    expect((await reports.queue(mod.viewer, {})).items.map((x) => x.targetType)).toEqual(['comment']);
    expect((await reports.queue(mod.viewer, { status: 'hidden' })).items[0]!.reportsCount).toBe(2);
    const [audit] = await db.all<{ a: string; t: string; l: string }>(sql`SELECT action AS a, target_type AS t, actor_label AS l FROM moderation_actions`);
    expect(audit).toEqual({ a: 'hide', t: 'shot', l: '@mod-x' });
  });

  it('suspend decision suspends the owner and signs them out (BR-25); dismiss leaves content', async () => {
    const author = await makeProfile(db);
    const rep = await makeProfile(db);
    const admin = await makeProfile(db, { role: 'admin' });
    const s = await makeShot(db, { authorId: author.profileId });
    await db.run(sql`INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES ('sx', ${Date.now() + 1e8}, 'tx', 1, 1, ${author.userId})`);
    await reports.report(rep.viewer, { targetType: 'shot', targetId: s.id, reason: 'harassment' });
    const [row] = (await reports.queue(admin.viewer, {})).items;
    expect(await reports.decide(admin.viewer, row!.id, { action: 'suspend', reason: 'Repeated harassment in work' })).toMatchObject({ status: 'suspended' });
    expect(await errorCode(() => users.getPublicProfile(author.username, visitor))).toBe('NOT_FOUND');
    expect(Number((await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM session WHERE user_id = ${author.userId}`))[0]!.n)).toBe(0);
    // Staff cannot suspend other staff from here.
    expect(await errorCode(() => reports.act(admin.viewer, { targetType: 'profile', targetId: admin.profileId, action: 'suspend', reason: 'Testing staff guard' }))).toBe('FORBIDDEN');
  });

  it('direct staff actions: hide/unhide a comment updates counts; profiles cannot be hidden', async () => {
    const author = await makeProfile(db);
    const ann = await makeProfile(db);
    const mod = await makeProfile(db, { role: 'moderator' });
    const s = await makeShot(db, { authorId: author.profileId });
    const c = await comments.create(ann.viewer, s.id, { body: 'hmm' });
    await reports.act(mod.viewer, { targetType: 'comment', targetId: c.id, action: 'hide', reason: 'Off-topic and rude' });
    expect((await comments.thread(s.id, visitor, {})).comments).toEqual([]);
    await reports.act(mod.viewer, { targetType: 'comment', targetId: c.id, action: 'unhide', reason: 'Reviewed again, fine' });
    expect((await comments.thread(s.id, visitor, {})).total).toBe(1);
    expect(await errorCode(() => reports.act(mod.viewer, { targetType: 'profile', targetId: ann.profileId, action: 'hide', reason: 'Not possible here' }))).toBe('VALIDATION');
    expect(await errorCode(() => reports.act(ann.viewer, { targetType: 'comment', targetId: c.id, action: 'hide', reason: 'Members cannot moderate' }))).toBe('FORBIDDEN');
  });
});
