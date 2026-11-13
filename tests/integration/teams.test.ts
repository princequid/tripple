import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import * as teams from '@/modules/teams/service';
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

async function teamWith() {
  const owner = await makeProfile(db, { username: 'own-er' });
  const admin = await makeProfile(db, { username: 'ad-min' });
  const mem = await makeProfile(db, { username: 'mem-ber' });
  await teams.create(owner.viewer, { username: 'studio-x', displayName: 'Studio X' });
  for (const [p, role] of [
    [admin, 'admin'],
    [mem, 'member'],
  ] as const) {
    const inv = await teams.invite(owner.viewer, 'studio-x', { username: p.username, role });
    await teams.respond(p.viewer, inv.id, true);
  }
  return { owner, admin, mem };
}

describe('teams (P-05, FR-58, BR-57…BR-60)', () => {
  it('create: creator is owner; username rules apply; team has no credentials (BR-57)', async () => {
    const ann = await makeProfile(db);
    const t = await teams.create(ann.viewer, { username: 'Ann-Studio', displayName: 'Ann Studio' });
    expect(t).toMatchObject({ role: 'owner', membersCount: 1, team: { username: 'ann-studio', isTeam: true } });
    const [row] = await db.all<{ k: string; u: string | null }>(sql`SELECT kind AS k, user_id AS u FROM profiles WHERE username = 'ann-studio'`);
    expect(row).toEqual({ k: 'team', u: null });
    expect(await errorCode(() => teams.create(ann.viewer, { username: 'ann-studio', displayName: 'Again' }))).toBe('USERNAME_TAKEN');
    expect(await errorCode(() => teams.create(ann.viewer, { username: 'jobs', displayName: 'X' }))).toBe('USERNAME_RESERVED');
    expect(await errorCode(() => teams.create(visitor, { username: 'abc', displayName: 'X' }))).toBe('UNAUTHENTICATED');
    expect((await teams.myTeams(ann.viewer)).map((x) => x.team.username)).toEqual(['ann-studio']);
    const profile = await users.getPublicProfile('ann-studio', visitor);
    expect(profile.isTeam).toBe(true);
    expect(profile.members.map((m) => m.username)).toEqual([ann.username]);
  });

  it('invitations: roles, duplicates, expiry, accept/decline (BR-58)', async () => {
    const { owner, admin, mem } = await teamWith();
    const out = await makeProfile(db, { username: 'out-sider' });
    const x = await makeProfile(db, { username: 'x-person' });
    expect(await errorCode(() => teams.invite(admin.viewer, 'studio-x', { username: x.username, role: 'admin' }))).toBe('FORBIDDEN');
    expect(await errorCode(() => teams.invite(mem.viewer, 'studio-x', { username: x.username }))).toBe('FORBIDDEN');
    expect(await errorCode(() => teams.invite(out.viewer, 'studio-x', { username: x.username }))).toBe('FORBIDDEN');
    const inv = await teams.invite(admin.viewer, 'studio-x', { username: x.username });
    expect(await errorCode(() => teams.invite(owner.viewer, 'studio-x', { username: x.username }))).toBe('CONFLICT');
    expect(await errorCode(() => teams.invite(owner.viewer, 'studio-x', { username: mem.username }))).toBe('CONFLICT');
    expect((await teams.myInvitations(x.viewer)).map((i) => [i.team.username, i.invitedBy?.username, i.role])).toEqual([['studio-x', 'ad-min', 'member']]);
    expect(await errorCode(() => teams.respond(out.viewer, inv.id, true))).toBe('NOT_FOUND');
    await teams.respond(x.viewer, inv.id, false);
    expect(await errorCode(() => teams.respond(x.viewer, inv.id, true))).toBe('CONFLICT');
    // Expired invitations cannot be accepted, and a new invitation can replace them.
    const inv2 = await teams.invite(owner.viewer, 'studio-x', { username: x.username });
    await db.run(sql`UPDATE team_invitations SET expires_at = 1 WHERE id = ${inv2.id}`);
    expect(await errorCode(() => teams.respond(x.viewer, inv2.id, true))).toBe('CONFLICT');
    const inv3 = await teams.invite(owner.viewer, 'studio-x', { username: x.username });
    expect((await teams.respond(x.viewer, inv3.id, true)).status).toBe('accepted');
    const adminView = await teams.admin(admin.viewer, 'studio-x');
    expect(adminView.myRole).toBe('admin');
    expect(adminView.members.map((m) => [m.person.username, m.role])).toEqual([
      ['own-er', 'owner'],
      ['ad-min', 'admin'],
      ['mem-ber', 'member'],
      ['x-person', 'member'],
    ]);
  });

  it('roles, removal, leaving, transfer and deletion (BR-58, BR-60)', async () => {
    const { owner, admin, mem } = await teamWith();
    const s = await makeShot(db, { authorId: mem.profileId, teamId: (await users.findByUsername('studio-x'))!.id });
    expect(await errorCode(() => teams.removeMember(admin.viewer, 'studio-x', 'own-er'))).toBe('FORBIDDEN');
    expect(await errorCode(() => teams.removeMember(owner.viewer, 'studio-x', 'own-er'))).toBe('FORBIDDEN'); // owner cannot leave
    expect(await errorCode(() => teams.setMemberRole(admin.viewer, 'studio-x', 'mem-ber', { role: 'admin' }))).toBe('FORBIDDEN');
    await teams.setMemberRole(owner.viewer, 'studio-x', 'mem-ber', { role: 'admin' });
    expect(await errorCode(() => teams.removeMember(admin.viewer, 'studio-x', 'mem-ber'))).toBe('FORBIDDEN'); // admin vs admin
    await teams.setMemberRole(owner.viewer, 'studio-x', 'mem-ber', { role: 'member' });
    // A member who leaves keeps their team shots' attribution (BR-60).
    expect(await teams.removeMember(mem.viewer, 'studio-x', 'mem-ber')).toEqual({ removed: 'mem-ber', left: true });
    const [kept] = await db.all<{ t: number | null }>(sql`SELECT team_id AS t FROM shots WHERE id = ${s.id}`);
    expect(kept!.t).not.toBeNull();
    // Transfer: admin becomes owner; old owner becomes admin and may now leave.
    await teams.transfer(owner.viewer, 'studio-x', { username: 'ad-min' });
    expect((await teams.admin(owner.viewer, 'studio-x')).myRole).toBe('admin');
    expect(await errorCode(() => teams.remove(owner.viewer, 'studio-x'))).toBe('FORBIDDEN');
    await teams.removeMember(owner.viewer, 'studio-x', 'own-er');
    // Deletion by the new owner: profile 404; shots keep their author without the team.
    expect(await teams.remove(admin.viewer, 'studio-x')).toEqual({ deleted: true });
    expect(await errorCode(() => users.getPublicProfile('studio-x', visitor))).toBe('NOT_FOUND');
    const [after] = await db.all<{ t: number | null }>(sql`SELECT team_id AS t FROM shots WHERE id = ${s.id}`);
    expect(after!.t).toBeNull();
  });

  it('team owner/admin removes attribution from a team shot (BR-60)', async () => {
    const { admin, mem } = await teamWith();
    const teamId = (await users.findByUsername('studio-x'))!.id;
    const s = await makeShot(db, { authorId: mem.profileId, teamId });
    expect(await errorCode(() => teams.removeAttribution(mem.viewer, s.id))).toBe('FORBIDDEN');
    expect(await teams.removeAttribution(admin.viewer, s.id)).toEqual({ shotId: s.id, team: null });
  });

  it('team profile editing by owner/admin; limits (BR-57)', async () => {
    const { owner, mem } = await teamWith();
    const saved = await teams.updateProfile(owner.viewer, 'studio-x', { headline: 'We make things', websiteUrl: 'https://studio.example' });
    expect(saved.headline).toBe('We make things');
    expect(await errorCode(() => teams.updateProfile(mem.viewer, 'studio-x', { headline: 'x' }))).toBe('FORBIDDEN');
    // 10-team limit for a member.
    const busy = await makeProfile(db);
    for (let i = 0; i < 10; i++) await teams.create(busy.viewer, { username: `busy-team-${i}`, displayName: `T${i}` });
    await resetLimitsForTests();
    expect(await errorCode(() => teams.create(busy.viewer, { username: 'busy-team-x', displayName: 'X' }))).toBe('QUOTA_EXCEEDED');
  });
});
