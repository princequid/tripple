import { beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as users from '@/modules/users/service';
import * as moderation from '@/modules/moderation/service';
import * as shots from '@/modules/shots/service';
import { resetLimitsForTests } from '@/server/rate-limit';
import { setupTestDb, makeProfile, makeShot, visitor, errorCode } from '../helpers/db';

let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});

const pendingUser = async (id: string) => {
  const now = Date.now();
  await db.run(sql`INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (${id}, ${id}, ${`${id}@example.test`}, 1, ${now}, ${now})`);
  return { kind: 'pending' as const, userId: id, name: id, email: `${id}@example.test` };
};

describe('onboarding (A-06 minimal, BR-16…BR-22)', () => {
  it('creates the profile once; repeat by the same user is idempotent', async () => {
    const v = await pendingUser('p1');
    expect(await users.completeOnboarding(v, { username: '  Maya_K ', displayName: ' Maya ' })).toEqual({ username: 'maya_k' });
    expect(await users.completeOnboarding(v, { username: 'maya_k', displayName: 'Maya' })).toEqual({ username: 'maya_k' });
    const p = await users.getPublicProfile('maya_k', visitor);
    expect(p.displayName).toBe('Maya');
  });

  it('rejects taken, reserved and malformed names with field errors', async () => {
    const v = await pendingUser('p2');
    expect(await errorCode(() => users.completeOnboarding(v, { username: 'maya_k', displayName: 'X' }))).toBe('USERNAME_TAKEN');
    expect(await errorCode(() => users.completeOnboarding(v, { username: 'settings', displayName: 'X' }))).toBe('USERNAME_RESERVED');
    expect(await errorCode(() => users.completeOnboarding(v, { username: 'a', displayName: 'X' }))).toBe('VALIDATION');
    expect(await errorCode(() => users.completeOnboarding(v, { username: 'valid_name', displayName: '   ' }))).toBe('VALIDATION');
    expect(await errorCode(() => users.completeOnboarding(visitor, { username: 'x', displayName: 'X' }))).toBe('UNAUTHENTICATED');
  });

  it('concurrent claims of one name: exactly one wins (BR-19)', async () => {
    const a = await pendingUser('race-a');
    const b = await pendingUser('race-b');
    const results = await Promise.allSettled([
      users.completeOnboarding(a, { username: 'contested', displayName: 'A' }),
      users.completeOnboarding(b, { username: 'contested', displayName: 'B' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason.code).toBe('USERNAME_TAKEN');
  });

  it('availability check and suggestions', async () => {
    await resetLimitsForTests();
    const v = await pendingUser('p3');
    expect(await users.checkUsername(v, 'maya_k')).toMatchObject({ available: false, problem: 'taken' });
    expect(await users.checkUsername(v, 'jobs')).toMatchObject({ available: false, problem: 'reserved' });
    expect(await users.checkUsername(v, 'fresh_one')).toMatchObject({ available: true, problem: null });
    const s = await users.suggestUsername('maya_k@example.test');
    expect(s).toMatch(/^maya_k\d{2,4}$/);
  });
});

describe('public profile (P-01, P-02, BR-78)', () => {
  it('never exposes the sign-in email and 404s for unknown/invalid names', async () => {
    const a = await makeProfile(db, { username: 'pubtest' });
    const p = await users.getPublicProfile('PubTest', visitor);
    expect(JSON.stringify(p)).not.toContain('@example.test');
    expect(p.isOwn).toBe(false);
    expect((await users.getPublicProfile('pubtest', a.viewer)).isOwn).toBe(true);
    expect(await errorCode(() => users.getPublicProfile('nobody-here', visitor))).toBe('NOT_FOUND');
    expect(await errorCode(() => users.getPublicProfile('x', visitor))).toBe('NOT_FOUND');
  });
});

describe('moderation (NX-05, FR-09, BR-25, BR-67, BR-68)', () => {
  const actor = { profileId: null, label: 'operator:test' };

  it('suspend hides the profile and its shots, revokes sessions, and writes an audit row', async () => {
    const a = await makeProfile(db, { username: 'tosuspend' });
    const s = await makeShot(db, { authorId: a.profileId });
    const now = Date.now();
    await db.run(sql`INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES ('s1', ${now + 1e9}, 'tok1', ${now}, ${now}, ${a.userId})`);
    await moderation.setUserSuspended(actor, 'tosuspend', true, 'Spam account reported by users');
    expect(await errorCode(() => users.getPublicProfile('tosuspend', visitor))).toBe('NOT_FOUND');
    expect(await errorCode(() => shots.getDetail(s.id, visitor, null))).toBe('NOT_FOUND');
    const [sess] = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM session WHERE user_id = ${a.userId}`);
    expect(Number(sess!.n)).toBe(0);
    const [audit] = await db.all<{ action: string; target_id: string }>(sql`SELECT action, target_id FROM moderation_actions ORDER BY id DESC LIMIT 1`);
    expect(audit).toEqual({ action: 'suspend', target_id: String(a.profileId) });
    await moderation.setUserSuspended(actor, 'tosuspend', false, 'Appeal accepted after review');
    expect((await users.getPublicProfile('tosuspend', visitor)).username).toBe('tosuspend');
  });

  it('hide/unhide a shot; reasons under 10 characters are rejected; unknown targets are NOT_FOUND', async () => {
    const a = await makeProfile(db);
    const s = await makeShot(db, { authorId: a.profileId });
    await moderation.setShotHidden(actor, s.id, true, 'Copyright complaint received');
    expect(await errorCode(() => shots.getDetail(s.id, visitor, null))).toBe('NOT_FOUND');
    await moderation.setShotHidden(actor, s.id, false, 'Complaint withdrawn by sender');
    expect((await shots.getDetail(s.id, visitor, null)).id).toBe(s.id);
    expect(await errorCode(() => moderation.setShotHidden(actor, s.id, true, 'short'))).toBe('VALIDATION');
    expect(await errorCode(() => moderation.setShotHidden(actor, 999_999, true, 'Long enough reason'))).toBe('NOT_FOUND');
    expect(await errorCode(() => moderation.setRole(actor, 'ghost-user', 'admin', 'Long enough reason'))).toBe('NOT_FOUND');
  });
});
