import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';

/** Team memberships and invitations (BR-57, BR-58). Owned tables: team_memberships (R2 writes), team_invitations. */
export const MAX_MEMBERS = 100;
export const MAX_TEAMS_PER_MEMBER = 10;
export const INVITE_TTL_MS = 14 * 86_400_000;

export type Role = 'owner' | 'admin' | 'member';

export async function addMember(teamId: number, memberId: number, role: Role, now: number) {
  const db = await getDb();
  await db.run(sql`INSERT INTO team_memberships (team_id, member_id, role, created_at) VALUES (${teamId}, ${memberId}, ${role}, ${now})
    ON CONFLICT DO UPDATE SET role = excluded.role`);
}

export async function teamsOfMember(memberId: number) {
  const db = await getDb();
  return db.all<{ id: number; username: string; name: string; avatarKey: string | null; featured: number; role: Role; members: number }>(sql`
    SELECT t.id AS id, t.username AS username, t.display_name AS name, m2.storage_key AS avatarKey, t.is_featured_studio AS featured,
           tm.role AS role, (SELECT COUNT(*) FROM team_memberships x WHERE x.team_id = t.id) AS members
    FROM team_memberships tm JOIN profiles t ON t.id = tm.team_id LEFT JOIN media m2 ON m2.id = t.avatar_media_id
    WHERE tm.member_id = ${memberId} AND t.deleted_at IS NULL
    ORDER BY tm.created_at ASC`);
}

export async function countTeamsOf(memberId: number): Promise<number> {
  const db = await getDb();
  const r = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM team_memberships tm JOIN profiles t ON t.id = tm.team_id
    WHERE tm.member_id = ${memberId} AND t.deleted_at IS NULL`);
  return Number(r[0]?.n ?? 0);
}

/** Members plus pending (unexpired) invitations count against the 100-member limit (BR-57). */
export async function seatsUsed(teamId: number, now: number): Promise<number> {
  const db = await getDb();
  const r = await db.all<{ n: number }>(sql`SELECT
    (SELECT COUNT(*) FROM team_memberships WHERE team_id = ${teamId}) +
    (SELECT COUNT(*) FROM team_invitations WHERE team_id = ${teamId} AND status = 'pending' AND expires_at > ${now}) AS n`);
  return Number(r[0]?.n ?? 0);
}

export async function members(teamId: number) {
  const db = await getDb();
  return db.all<{ id: number; username: string; name: string; avatarKey: string | null; featured: number; kind: 'individual' | 'team'; role: Role; joinedAt: number }>(sql`
    SELECT p.id AS id, p.username AS username, p.display_name AS name, m.storage_key AS avatarKey, p.is_featured_studio AS featured,
           p.kind AS kind, tm.role AS role, tm.created_at AS joinedAt
    FROM team_memberships tm JOIN profiles p ON p.id = tm.member_id LEFT JOIN media m ON m.id = p.avatar_media_id
    WHERE tm.team_id = ${teamId} AND p.deleted_at IS NULL
    ORDER BY CASE tm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, tm.created_at ASC`);
}

export async function setRole(teamId: number, memberId: number, role: Role) {
  const db = await getDb();
  await db.run(sql`UPDATE team_memberships SET role = ${role} WHERE team_id = ${teamId} AND member_id = ${memberId}`);
}

export async function removeMember(teamId: number, memberId: number): Promise<number> {
  const db = await getDb();
  const r = await db.run(sql`DELETE FROM team_memberships WHERE team_id = ${teamId} AND member_id = ${memberId}`);
  return r.rowsAffected;
}

/** BR-58 transfer: new owner becomes owner, previous owner becomes admin, in one batch. */
export async function transfer(teamId: number, fromId: number, toId: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE team_memberships SET role = 'admin' WHERE team_id = ${teamId} AND member_id = ${fromId}`),
    db.run(sql`UPDATE team_memberships SET role = 'owner' WHERE team_id = ${teamId} AND member_id = ${toId}`),
  ]);
}

/** Invitations. A pending, unexpired invite for (team, invitee) is unique (partial unique index). */
export async function insertInvitation(teamId: number, inviteeId: number, byId: number, role: 'admin' | 'member', now: number): Promise<number> {
  const db = await getDb();
  // An expired pending invite would block the partial unique index: retire it first.
  const [, ins] = await db.batch([
    db.run(sql`UPDATE team_invitations SET status = 'revoked', responded_at = ${now}
      WHERE team_id = ${teamId} AND invitee_id = ${inviteeId} AND status = 'pending' AND expires_at <= ${now}`),
    db.all<{ id: number }>(sql`INSERT INTO team_invitations (team_id, invitee_id, invited_by_id, role, status, expires_at, created_at)
      VALUES (${teamId}, ${inviteeId}, ${byId}, ${role}, 'pending', ${now + INVITE_TTL_MS}, ${now}) RETURNING id`),
  ]);
  return Number((ins as { id: number }[])[0]!.id);
}

export async function findInvitation(id: number) {
  const db = await getDb();
  const r = await db.all<{ id: number; teamId: number; inviteeId: number; role: 'admin' | 'member'; status: string; expiresAt: number }>(sql`
    SELECT id, team_id AS teamId, invitee_id AS inviteeId, role, status, expires_at AS expiresAt FROM team_invitations WHERE id = ${id}`);
  return r[0] ?? null;
}

/** Moves a pending invitation to a final state; returns false if it was no longer pending (race → 409). */
export async function closeInvitation(id: number, status: 'accepted' | 'declined' | 'revoked', now: number): Promise<boolean> {
  const db = await getDb();
  const r = await db.run(sql`UPDATE team_invitations SET status = ${status}, responded_at = ${now} WHERE id = ${id} AND status = 'pending'`);
  return r.rowsAffected === 1;
}

/** Accept: close the invitation and add the membership in one batch (BR-58). */
export async function acceptInvitation(id: number, teamId: number, inviteeId: number, role: 'admin' | 'member', now: number): Promise<boolean> {
  const db = await getDb();
  const [closed] = await db.batch([
    db.run(sql`UPDATE team_invitations SET status = 'accepted', responded_at = ${now} WHERE id = ${id} AND status = 'pending' AND expires_at > ${now}`),
    db.run(sql`INSERT INTO team_memberships (team_id, member_id, role, created_at) SELECT ${teamId}, ${inviteeId}, ${role}, ${now}
      WHERE changes() = 1 ON CONFLICT DO NOTHING`),
  ]);
  return closed.rowsAffected === 1;
}

export async function pendingForInvitee(inviteeId: number, now: number) {
  const db = await getDb();
  return db.all<{
    id: number; role: 'admin' | 'member'; createdAt: number; expiresAt: number;
    teamId: number; teamUsername: string; teamName: string; teamAvatar: string | null; teamFeatured: number;
    byId: number | null; byUsername: string | null; byName: string | null; byAvatar: string | null;
  }>(sql`
    SELECT i.id AS id, i.role AS role, i.created_at AS createdAt, i.expires_at AS expiresAt,
           t.id AS teamId, t.username AS teamUsername, t.display_name AS teamName, tm.storage_key AS teamAvatar, t.is_featured_studio AS teamFeatured,
           b.id AS byId, b.username AS byUsername, b.display_name AS byName, bm.storage_key AS byAvatar
    FROM team_invitations i JOIN profiles t ON t.id = i.team_id LEFT JOIN media tm ON tm.id = t.avatar_media_id
    LEFT JOIN profiles b ON b.id = i.invited_by_id LEFT JOIN media bm ON bm.id = b.avatar_media_id
    WHERE i.invitee_id = ${inviteeId} AND i.status = 'pending' AND i.expires_at > ${now} AND t.deleted_at IS NULL
    ORDER BY i.created_at DESC`);
}

export async function pendingForTeam(teamId: number, now: number) {
  const db = await getDb();
  return db.all<{ id: number; username: string; role: 'admin' | 'member'; createdAt: number; expiresAt: number }>(sql`
    SELECT i.id AS id, p.username AS username, i.role AS role, i.created_at AS createdAt, i.expires_at AS expiresAt
    FROM team_invitations i JOIN profiles p ON p.id = i.invitee_id
    WHERE i.team_id = ${teamId} AND i.status = 'pending' AND i.expires_at > ${now}
    ORDER BY i.created_at DESC`);
}

/** Team deletion: memberships and pending invitations go; the team profile is soft-deleted by `users`. */
export async function dissolve(teamId: number, now: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`UPDATE team_invitations SET status = 'revoked', responded_at = ${now} WHERE team_id = ${teamId} AND status = 'pending'`),
    db.run(sql`DELETE FROM team_memberships WHERE team_id = ${teamId}`),
  ]);
}
