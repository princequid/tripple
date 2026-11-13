import fs from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as account from '@/modules/account/service';
import * as users from '@/modules/users/service';
import * as likes from '@/modules/likes/service';
import * as follows from '@/modules/follows/service';
import * as collections from '@/modules/collections/service';
import * as comments from '@/modules/comments/service';
import { OUTBOX_FILE } from '@/server/email';
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

/** Latest code emailed to `to` (dev outbox, never real email). */
function lastCode(to: string): string {
  const lines = fs.readFileSync(OUTBOX_FILE, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { to: string; code: string });
  return lines.filter((l) => l.to === to).at(-1)!.code;
}
const unique = () => `acct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('profile settings (FR-59) and onboarding details (FR-18)', () => {
  it('validates and saves fields, links, skills; refreshes search author', async () => {
    const ann = await makeProfile(db, { username: 'ann-set' });
    const s = await makeShot(db, { authorId: ann.profileId });
    const saved = await account.updateProfileSettings(ann.viewer, {
      displayName: '  Ann Lee ',
      headline: 'Product designer',
      bio: 'Hello\nworld',
      location: '',
      websiteUrl: 'https://ann.example',
      publicEmail: 'Hi@Ann.Example',
      skills: ['UI', 'ui', 'Branding'],
      languages: ['English'],
      socialLinks: [{ platform: 'x', url: 'https://x.com/ann' }],
    });
    expect(saved).toMatchObject({
      displayName: 'Ann Lee',
      location: null,
      publicEmail: 'hi@ann.example',
      skills: ['UI', 'Branding'],
      socialLinks: [{ platform: 'x', url: 'https://x.com/ann' }],
    });
    const [row] = await db.all<{ a: string }>(sql`SELECT search_author AS a FROM shots WHERE id = ${s.id}`);
    expect(row!.a).toBe('Ann Lee ann-set');
    const profile = await users.getPublicProfile('ann-set', visitor);
    expect(profile).toMatchObject({ headline: 'Product designer', publicEmail: 'hi@ann.example' });
    expect(await errorCode(() => account.updateProfileSettings(ann.viewer, { websiteUrl: 'javascript:alert(1)' }))).toBe('VALIDATION');
    expect(await errorCode(() => account.updateProfileSettings(ann.viewer, { skills: Array.from({ length: 21 }, (_, i) => `s${i}`) }))).toBe('VALIDATION');
    expect(await errorCode(() => account.updateProfileSettings(ann.viewer, { displayName: ' ' }))).toBe('VALIDATION');
    expect(
      await errorCode(() =>
        account.updateProfileSettings(ann.viewer, { socialLinks: [{ platform: 'x', url: 'https://a.example' }, { platform: 'x', url: 'https://b.example' }] }),
      ),
    ).toBe('VALIDATION');
    expect(await errorCode(() => account.updateProfileSettings(ann.viewer, { avatarMediaId: 'nope' }))).toBe('UNSUPPORTED_MEDIA');
    expect(await errorCode(() => account.profileSettings(visitor))).toBe('UNAUTHENTICATED');
  });

  it('onboarding details store intents and skills', async () => {
    const ann = await makeProfile(db);
    const r = await account.onboardingDetails(ann.viewer, { headline: 'Hi', location: 'Lisbon', intents: ['share', 'hire'], skills: ['Motion'] });
    expect(r).toMatchObject({ headline: 'Hi', location: 'Lisbon', intents: ['share', 'hire'], skills: ['Motion'] });
    expect(await errorCode(() => account.onboardingDetails(ann.viewer, { intents: ['sell'] }))).toBe('VALIDATION');
  });
});

describe('username change (BR-23)', () => {
  it('once per 30 days; old name held for the same profile; others cannot claim it', async () => {
    const ann = await makeProfile(db, { username: 'ann-old' });
    const bob = await makeProfile(db, { username: 'bob-x' });
    expect((await account.changeUsername(ann.viewer, { username: 'Ann-New' })).username).toBe('ann-new');
    expect(await users.isUsernameTaken('ann-old')).toBe(true); // held
    expect(await errorCode(() => account.changeUsername(bob.viewer, { username: 'ann-old' }))).toBe('USERNAME_TAKEN');
    const annNow = { ...ann.viewer, username: 'ann-new' } as typeof ann.viewer;
    expect(await errorCode(() => account.changeUsername(annNow, { username: 'ann-third' }))).toBe('QUOTA_EXCEEDED');
    const acc = await account.accountSettings(annNow);
    expect(acc.username).toBe('ann-new');
    expect(acc.canChangeUsernameAt).not.toBeNull();
    // After 30 days the member may change again and reclaim the held name.
    await db.run(sql`UPDATE profiles SET username_changed_at = ${Date.now() - 31 * 86_400_000} WHERE id = ${ann.profileId}`);
    expect((await account.changeUsername(annNow, { username: 'ann-old' })).username).toBe('ann-old');
    expect(await errorCode(() => account.changeUsername(bob.viewer, { username: 'shots' }))).toBe('USERNAME_RESERVED');
    expect(await errorCode(() => account.changeUsername(bob.viewer, { username: 'a' }))).toBe('VALIDATION');
  });
});

describe('sessions (FR-19)', () => {
  it('lists without IPs, revokes one and all others', async () => {
    const ann = await makeProfile(db);
    const now = Date.now();
    for (const [id, ua, t] of [
      ['s1', 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36', now - 1000],
      ['s2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Version/17 Mobile Safari/604.1', now - 2000],
      ['s3', null, now - 3000],
    ] as const) {
      await db.run(sql`INSERT INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
        VALUES (${id}, ${now + 86_400_000}, ${`tok-${id}`}, ${t}, ${t}, '203.0.113.9', ${ua}, ${ann.userId})`);
    }
    const { listSessions, revokeSession, revokeOtherSessions } = await import('@/modules/auth/service');
    const list = await listSessions(ann.userId!, 's1');
    expect(list.map((s) => [s.id, s.device, s.current, s.location])).toEqual([
      ['s1', 'Chrome on Windows', true, null],
      ['s2', 'Safari on iOS', false, null],
      ['s3', 'Unknown device', false, null],
    ]);
    expect(JSON.stringify(list)).not.toContain('203.0.113.9');
    expect(await errorCode(() => revokeSession(ann.userId!, 's1', 's1'))).toBe('FORBIDDEN');
    await revokeSession(ann.userId!, 's2', 's1');
    expect(await errorCode(() => revokeSession(ann.userId!, 's2', 's1'))).toBe('NOT_FOUND');
    expect(await revokeOtherSessions(ann.userId!, 's1')).toBe(1);
    expect((await listSessions(ann.userId!, 's1')).map((s) => s.id)).toEqual(['s1']);
  });
});

describe('email change (FR-19)', () => {
  it('code to the new address; wrong code counts attempts; conflict for a used address', async () => {
    const ann = await makeProfile(db);
    const other = await makeProfile(db);
    const target = `${unique()}@example.test`;
    await account.requestEmailChange(ann.viewer, { email: target.toUpperCase() });
    expect(await errorCode(() => account.confirmEmailChange(ann.viewer, { email: target, code: '000000' === lastCode(target) ? '111111' : '000000' }))).toBe('INVALID_OTP');
    expect(await account.confirmEmailChange(ann.viewer, { email: target, code: lastCode(target) })).toEqual({ email: target });
    expect((await account.accountSettings(ann.viewer)).email).toBe(target);
    // The code is single-use.
    expect(await errorCode(() => account.confirmEmailChange(ann.viewer, { email: target, code: lastCode(target) }))).toBe('OTP_EXPIRED');
    // BR-05: one code per address per 60 s.
    expect(await errorCode(() => account.requestEmailChange(other.viewer, { email: target }))).toBe('RATE_LIMITED');
    await resetLimitsForTests();
    // Someone else's address: the code is sent (no enumeration) but confirm is a conflict.
    await account.requestEmailChange(other.viewer, { email: target });
    expect(await errorCode(() => account.confirmEmailChange(other.viewer, { email: target, code: lastCode(target) }))).toBe('CONFLICT');
  });

  it('5 wrong codes invalidate the code (BR-04)', async () => {
    const ann = await makeProfile(db);
    const target = `${unique()}@example.test`;
    await account.requestEmailChange(ann.viewer, { email: target });
    const wrong = lastCode(target) === '123456' ? '654321' : '123456';
    for (let i = 0; i < 4; i++) expect(await errorCode(() => account.confirmEmailChange(ann.viewer, { email: target, code: wrong }))).toBe('INVALID_OTP');
    expect(await errorCode(() => account.confirmEmailChange(ann.viewer, { email: target, code: wrong }))).toBe('TOO_MANY_ATTEMPTS');
    expect(await errorCode(() => account.confirmEmailChange(ann.viewer, { email: target, code: lastCode(target) }))).toBe('OTP_EXPIRED');
  });
});

describe('account deletion (BR-24)', () => {
  it('requires a fresh code, refuses team owners, removes social rows with counters, purges after 30 days', async () => {
    const email = `${unique()}@example.test`;
    const ann = await makeProfile(db);
    await db.run(sql`UPDATE user SET email = ${email} WHERE id = ${ann.userId}`);
    const author = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    await likes.setLike(ann.viewer, s.id, true);
    await follows.setFollow(ann.viewer, author.username, true);
    const c = await collections.create(ann.viewer, { name: 'Mine', isPrivate: false });
    await collections.setSaved(ann.viewer, c.id, s.id, true);
    await comments.create(ann.viewer, s.id, { body: 'bye' });
    const team = await makeProfile(db, { kind: 'team' });
    await db.run(sql`INSERT INTO team_memberships (team_id, member_id, role, created_at) VALUES (${team.profileId}, ${ann.profileId}, 'owner', ${Date.now()})`);
    expect(await errorCode(() => account.requestDeletion(ann.viewer))).toBe('FORBIDDEN');
    await db.run(sql`UPDATE team_memberships SET role = 'member' WHERE member_id = ${ann.profileId}`);
    await account.requestDeletion(ann.viewer);
    expect(await errorCode(() => account.confirmDeletion(ann.viewer, { code: 'abc' }))).toBe('VALIDATION');
    expect(await account.confirmDeletion(ann.viewer, { code: lastCode(email) })).toEqual({ deleted: true, purgeAfterDays: 30 });
    const [shot] = await db.all<{ l: number; sv: number; cm: number }>(sql`SELECT likes_count AS l, saves_count AS sv, comments_count AS cm FROM shots WHERE id = ${s.id}`);
    expect(shot).toEqual({ l: 0, sv: 0, cm: 0 });
    const [au] = await db.all<{ f: number; r: number }>(sql`SELECT followers_count AS f, likes_received_count AS r FROM profiles WHERE id = ${author.profileId}`);
    expect(au).toEqual({ f: 0, r: 0 });
    expect(await errorCode(() => users.getPublicProfile(ann.username, visitor))).toBe('NOT_FOUND');
    expect(Number((await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM session WHERE user_id = ${ann.userId}`))[0]!.n)).toBe(0);
    // Not purged yet; purged after 30 days with the credential row.
    expect(await account.purgeDeletedAccounts()).toBe(0);
    await db.run(sql`UPDATE profiles SET deleted_at = ${Date.now() - 31 * 86_400_000} WHERE id = ${ann.profileId}`);
    expect(await account.purgeDeletedAccounts()).toBe(1);
    expect(Number((await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM user WHERE id = ${ann.userId}`))[0]!.n)).toBe(0);
    expect(await users.isUsernameTaken(ann.username)).toBe(false); // released after the purge (BR-24)
  });
});
