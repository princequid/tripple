import 'server-only';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { requireMember } from '@/modules/auth/service';
import type { Viewer } from '@/modules/auth/types';
import * as users from '@/modules/users/service';
import * as media from '@/modules/media/service';
import * as shots from '@/modules/shots/service';
import type { PersonRef } from '@/modules/shots/types';
import * as repo from './repository';
import type { Role } from './repository';

/**
 * Teams (P-05, FR-58; BR-57…BR-60). A team is a profile without credentials; members act for it.
 * Owner: everything incl. transfer and delete. Admin: invite/remove members, edit the profile, manage team
 * shots. Member: publish for the team, leave. Exactly one owner; ≤ 100 members; ≤ 10 teams per member.
 */
export type TeamMembership = { team: PersonRef; role: Role; membersCount: number };
export type TeamMember = { person: PersonRef; role: Role; joinedAt: string };
export type TeamInvitation = { id: number; team: PersonRef; invitedBy: PersonRef | null; role: Role; createdAt: string; expiresAt: string };
export type TeamAdmin = {
  team: PersonRef & { headline: string | null; websiteUrl: string | null };
  myRole: Role;
  members: TeamMember[];
  pending: { id: number; username: string; role: Role; createdAt: string; expiresAt: string }[];
};

const ref = (id: number, username: string, displayName: string, avatarKey: string | null, isTeam: boolean, featured: unknown): PersonRef => ({
  id,
  username,
  displayName,
  avatarKey,
  isTeam,
  isFeaturedStudio: Boolean(featured),
});

/** Resolves a visible team and the viewer's role in it. Not a team / not a member → 404 / 403. */
async function teamFor(viewer: Viewer, username: string, need: 'member' | 'admin' | 'owner') {
  const m = requireMember(viewer);
  const t = await users.findByUsername(username);
  if (!t || t.kind !== 'team' || t.deletedAt || t.suspendedAt) throw new AppError('NOT_FOUND');
  const role = await users.teamRole(t.id, m.profileId);
  if (!role) throw new AppError('FORBIDDEN', 'You are not a member of this team.');
  const rank = { member: 0, admin: 1, owner: 2 } as const;
  if (rank[role] < rank[need]) throw new AppError('FORBIDDEN', need === 'owner' ? 'Only the team owner can do this.' : 'Only team owners and admins can do this.');
  return { member: m, team: t, role };
}

export const createInput = z.object({ username: z.string().max(60), displayName: z.string().max(200) });

/** FR-58 create: the creator becomes the owner (BR-57). RL-CONTENT; ≤ 10 teams per member. */
export async function create(viewer: Viewer, input: unknown): Promise<TeamMembership> {
  const m = requireMember(viewer);
  const v = validate(createInput, input);
  await limit('RL-CONTENT', `p:${m.profileId}`);
  if ((await repo.countTeamsOf(m.profileId)) >= repo.MAX_TEAMS_PER_MEMBER) {
    throw new AppError('QUOTA_EXCEEDED', `You can belong to at most ${repo.MAX_TEAMS_PER_MEMBER} teams.`);
  }
  const team = await users.createTeamProfile(v.username, v.displayName);
  await repo.addMember(team.id, m.profileId, 'owner', Date.now());
  return { team: ref(team.id, team.username, v.displayName.trim(), null, true, false), role: 'owner', membersCount: 1 };
}

export async function myTeams(viewer: Viewer): Promise<TeamMembership[]> {
  const m = requireMember(viewer);
  return (await repo.teamsOfMember(m.profileId)).map((r) => ({
    team: ref(r.id, r.username, r.name, r.avatarKey, true, r.featured),
    role: r.role,
    membersCount: Number(r.members),
  }));
}

/** Team settings page data (members, pending invitations). Any member may view it; actions are role-checked. */
export async function admin(viewer: Viewer, username: string): Promise<TeamAdmin> {
  const { team, role } = await teamFor(viewer, username, 'member');
  const now = Date.now();
  const [list, pending] = await Promise.all([repo.members(team.id), repo.pendingForTeam(team.id, now)]);
  return {
    team: { ...ref(team.id, team.username, team.displayName, team.avatarKey, true, team.isFeaturedStudio), headline: team.headline, websiteUrl: team.websiteUrl },
    myRole: role,
    members: list.map((r) => ({ person: ref(r.id, r.username, r.name, r.avatarKey, r.kind === 'team', r.featured), role: r.role, joinedAt: new Date(Number(r.joinedAt)).toISOString() })),
    pending: role === 'member' ? [] : pending.map((p) => ({ id: p.id, username: p.username, role: p.role, createdAt: new Date(p.createdAt).toISOString(), expiresAt: new Date(p.expiresAt).toISOString() })),
  };
}

/** BR-58: owner/admin edit the team profile (same fields and rules as a member profile, FR-59). */
export async function updateProfile(viewer: Viewer, username: string, input: unknown) {
  const { member, team } = await teamFor(viewer, username, 'admin');
  await limit('RL-ACCOUNT', `u:${member.userId}`);
  return users.applySettings(
    team.id,
    input,
    (id) => media.requireOwnedReady(id, member.profileId, ['avatar'], 'avatarMediaId'),
    (displayName, uname) => shots.refreshSearchAuthor(team.id, displayName, uname),
  );
}

/** BR-23 applies to team usernames too; owner only. */
export async function changeUsername(viewer: Viewer, username: string, input: unknown) {
  const { team } = await teamFor(viewer, username, 'owner');
  const v = validate(z.object({ username: z.string().max(60) }), input);
  return users.changeUsername(team.id, v.username, (displayName, uname) => shots.refreshSearchAuthor(team.id, displayName, uname));
}

export const inviteInput = z.object({ username: z.string().max(60), role: z.enum(['admin', 'member']).default('member') });

/** BR-58 invite by username; expires after 14 days. Admins invite members; only the owner invites admins. */
export async function invite(viewer: Viewer, teamUsername: string, input: unknown) {
  const { member, team, role } = await teamFor(viewer, teamUsername, 'admin');
  const v = validate(inviteInput, input);
  if (v.role === 'admin' && role !== 'owner') throw new AppError('FORBIDDEN', 'Only the team owner can invite admins.');
  await limit('RL-CONTENT', `p:${member.profileId}`);
  const invitee = await users.findByUsername(v.username);
  if (!invitee || invitee.kind !== 'individual' || invitee.deletedAt || invitee.suspendedAt) {
    throw new AppError('NOT_FOUND', 'No member with that username.', { fields: { username: 'No member with that username.' } });
  }
  if (await users.teamRole(team.id, invitee.id)) throw new AppError('CONFLICT', 'Already a member of this team.', { fields: { username: 'Already a member of this team.' } });
  const now = Date.now();
  if ((await repo.seatsUsed(team.id, now)) >= repo.MAX_MEMBERS) throw new AppError('QUOTA_EXCEEDED', `A team has at most ${repo.MAX_MEMBERS} members.`);
  try {
    const id = await repo.insertInvitation(team.id, invitee.id, member.profileId, v.role, now);
    return { id, username: invitee.username, role: v.role, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + repo.INVITE_TTL_MS).toISOString() };
  } catch (e) {
    const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? '')}` : '';
    if (/UNIQUE constraint failed: team_invitations/i.test(msg)) throw new AppError('CONFLICT', 'This member already has a pending invitation.', { fields: { username: 'Already invited.' } });
    throw e;
  }
}

export async function revokeInvitation(viewer: Viewer, teamUsername: string, invitationId: number) {
  const { team } = await teamFor(viewer, teamUsername, 'admin');
  const inv = await repo.findInvitation(invitationId);
  if (!inv || inv.teamId !== team.id) throw new AppError('NOT_FOUND');
  if (!(await repo.closeInvitation(invitationId, 'revoked', Date.now()))) throw new AppError('CONFLICT', 'This invitation is no longer pending.');
  return { revoked: true as const };
}

export async function myInvitations(viewer: Viewer): Promise<TeamInvitation[]> {
  const m = requireMember(viewer);
  return (await repo.pendingForInvitee(m.profileId, Date.now())).map((r) => ({
    id: r.id,
    team: ref(r.teamId, r.teamUsername, r.teamName, r.teamAvatar, true, r.teamFeatured),
    invitedBy: r.byId && r.byUsername && r.byName ? ref(r.byId, r.byUsername, r.byName, r.byAvatar, false, false) : null,
    role: r.role,
    createdAt: new Date(r.createdAt).toISOString(),
    expiresAt: new Date(r.expiresAt).toISOString(),
  }));
}

/** Accept / decline (BR-58). Expired → 409 CONFLICT "expired"; someone else's → 404. ≤ 10 teams per member. */
export async function respond(viewer: Viewer, invitationId: number, accept: boolean) {
  const m = requireMember(viewer);
  const inv = await repo.findInvitation(invitationId);
  if (!inv || inv.inviteeId !== m.profileId) throw new AppError('NOT_FOUND');
  const now = Date.now();
  if (inv.status !== 'pending') throw new AppError('CONFLICT', 'This invitation is no longer pending.');
  if (inv.expiresAt <= now) throw new AppError('CONFLICT', 'This invitation has expired. Ask for a new one.');
  if (!accept) {
    if (!(await repo.closeInvitation(invitationId, 'declined', now))) throw new AppError('CONFLICT', 'This invitation is no longer pending.');
    return { status: 'declined' as const };
  }
  if ((await repo.countTeamsOf(m.profileId)) >= repo.MAX_TEAMS_PER_MEMBER) {
    throw new AppError('QUOTA_EXCEEDED', `You can belong to at most ${repo.MAX_TEAMS_PER_MEMBER} teams.`);
  }
  if (!(await repo.acceptInvitation(invitationId, inv.teamId, m.profileId, inv.role, now))) throw new AppError('CONFLICT', 'This invitation is no longer pending.');
  return { status: 'accepted' as const };
}

/** Owner changes a member's role between admin and member (ownership moves only by transfer). */
export async function setMemberRole(viewer: Viewer, teamUsername: string, memberUsername: string, input: unknown) {
  const { team } = await teamFor(viewer, teamUsername, 'owner');
  const v = validate(z.object({ role: z.enum(['admin', 'member']) }), input);
  const target = await users.findByUsername(memberUsername);
  const current = target ? await users.teamRole(team.id, target.id) : null;
  if (!target || !current) throw new AppError('NOT_FOUND');
  if (current === 'owner') throw new AppError('FORBIDDEN', 'Transfer ownership instead.');
  await repo.setRole(team.id, target.id, v.role);
  return { username: target.username, role: v.role };
}

/**
 * Remove a member or leave (BR-58, BR-60). Owner can remove anyone but themselves; admins remove members;
 * anyone but the owner may leave. Existing team shots keep their attribution.
 */
export async function removeMember(viewer: Viewer, teamUsername: string, memberUsername: string) {
  const { member, team, role } = await teamFor(viewer, teamUsername, 'member');
  const target = await users.findByUsername(memberUsername);
  const targetRole = target ? await users.teamRole(team.id, target.id) : null;
  if (!target || !targetRole) throw new AppError('NOT_FOUND');
  const self = target.id === member.profileId;
  if (targetRole === 'owner') throw new AppError('FORBIDDEN', self ? 'Transfer ownership before leaving the team.' : 'The owner cannot be removed.');
  if (!self) {
    if (role === 'member') throw new AppError('FORBIDDEN', 'Only team owners and admins can remove members.');
    if (role === 'admin' && targetRole === 'admin') throw new AppError('FORBIDDEN', 'Only the owner can remove an admin.');
  }
  await repo.removeMember(team.id, target.id);
  return { removed: target.username, left: self };
}

/** BR-58 transfer ownership to an existing member; the previous owner becomes an admin. */
export async function transfer(viewer: Viewer, teamUsername: string, input: unknown) {
  const { member, team } = await teamFor(viewer, teamUsername, 'owner');
  const v = validate(z.object({ username: z.string().max(60) }), input);
  const target = await users.findByUsername(v.username);
  if (!target || !(await users.teamRole(team.id, target.id)) || target.deletedAt || target.suspendedAt) {
    throw new AppError('NOT_FOUND', 'Choose a current member.', { fields: { username: 'Choose a current member.' } });
  }
  if (target.id === member.profileId) return { owner: target.username };
  await repo.transfer(team.id, member.profileId, target.id);
  return { owner: target.username };
}

/** BR-58 delete team (owner): profile soft-deleted, memberships removed, team shots keep their authors (BR-60). */
export async function remove(viewer: Viewer, teamUsername: string) {
  const { team } = await teamFor(viewer, teamUsername, 'owner');
  await shots.detachTeam(team.id);
  await repo.dissolve(team.id, Date.now());
  await users.softDelete(team.id);
  return { deleted: true as const };
}

/** BR-59: may this member publish for this team? (current membership, team visible). */
export async function canPublishFor(profileId: number, teamUsername: string): Promise<number> {
  const t = await users.findByUsername(teamUsername);
  if (!t || t.kind !== 'team' || t.deletedAt || t.suspendedAt) throw new AppError('FORBIDDEN', 'You can only publish for teams you belong to.', { fields: { teamUsername: 'Not one of your teams.' } });
  if (!(await users.teamRole(t.id, profileId))) throw new AppError('FORBIDDEN', 'You can only publish for teams you belong to.', { fields: { teamUsername: 'Not one of your teams.' } });
  return t.id;
}

/** BR-60: team owner/admin removes the team attribution from a team shot (the shot stays with its author). */
export async function removeAttribution(viewer: Viewer, shotId: number) {
  const m = requireMember(viewer);
  const shot = await shots.requireEligible(shotId);
  if (!shot.teamId) throw new AppError('NOT_FOUND');
  const role = await users.teamRole(shot.teamId, m.profileId);
  if (role !== 'owner' && role !== 'admin') throw new AppError('FORBIDDEN', 'Only team owners and admins can do this.');
  await shots.removeTeamAttribution(shotId);
  return { shotId, team: null };
}
