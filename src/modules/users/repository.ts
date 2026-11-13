import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { getDb } from '@/server/db/client';
import { profiles, userSocialLinks, media, teamMemberships, usernameHolds } from '@/server/db/schema';

/** Profile queries. Owned tables: profiles, user_social_links, team_memberships (read in R1). */
const avatar = alias(media, 'avatar');

export async function findByUsername(username: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: profiles.id,
      userId: profiles.userId,
      kind: profiles.kind,
      username: profiles.username,
      displayName: profiles.displayName,
      headline: profiles.headline,
      bio: profiles.bio,
      location: profiles.location,
      websiteUrl: profiles.websiteUrl,
      publicEmail: profiles.publicEmail,
      skills: profiles.skills,
      languages: profiles.languages,
      isFeaturedStudio: profiles.isFeaturedStudio,
      role: profiles.role,
      shotsCount: profiles.shotsCount,
      likesReceivedCount: profiles.likesReceivedCount,
      followersCount: profiles.followersCount,
      followingCount: profiles.followingCount,
      usernameChangedAt: profiles.usernameChangedAt,
      avatarMediaId: profiles.avatarMediaId,
      suspendedAt: profiles.suspendedAt,
      deletedAt: profiles.deletedAt,
      createdAt: profiles.createdAt,
      avatarKey: avatar.storageKey,
    })
    .from(profiles)
    .leftJoin(avatar, eq(avatar.id, profiles.avatarMediaId))
    .where(eq(profiles.username, username))
    .limit(1);
  return row ?? null;
}

export async function socialLinks(profileId: number) {
  const db = await getDb();
  return db
    .select({ platform: userSocialLinks.platform, url: userSocialLinks.url })
    .from(userSocialLinks)
    .where(eq(userSocialLinks.profileId, profileId))
    .orderBy(asc(userSocialLinks.position));
}

/** Members of a team, or teams of a member (RE doc 01 §B: Members tab; "X for Team"). */
export async function teamPeople(profileId: number, side: 'members' | 'teams') {
  const db = await getDb();
  const other = alias(profiles, 'other');
  const otherAvatar = alias(media, 'other_avatar');
  const joinCol = side === 'members' ? teamMemberships.memberId : teamMemberships.teamId;
  const whereCol = side === 'members' ? teamMemberships.teamId : teamMemberships.memberId;
  return db
    .select({
      id: other.id,
      username: other.username,
      displayName: other.displayName,
      role: teamMemberships.role,
      avatarKey: otherAvatar.storageKey,
      suspendedAt: other.suspendedAt,
      deletedAt: other.deletedAt,
    })
    .from(teamMemberships)
    .innerJoin(other, eq(other.id, joinCol))
    .leftJoin(otherAvatar, eq(otherAvatar.id, other.avatarMediaId))
    .where(eq(whereCol, profileId))
    .orderBy(asc(teamMemberships.createdAt));
}

export async function findMemberByUserId(userId: string) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      role: profiles.role,
      suspendedAt: profiles.suspendedAt,
      deletedAt: profiles.deletedAt,
      avatarKey: avatar.storageKey,
    })
    .from(profiles)
    .leftJoin(avatar, eq(avatar.id, profiles.avatarMediaId))
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/**
 * Taken = used by a profile, or held for someone else after a username change (BR-23). `exceptProfileId`
 * lets a member reclaim their own held name.
 */
export async function isUsernameTaken(username: string, exceptProfileId: number | null = null, now = Date.now()): Promise<boolean> {
  const db = await getDb();
  const rows = await db.all<{ n: number }>(sql`SELECT
    EXISTS (SELECT 1 FROM profiles WHERE username = ${username} AND (${exceptProfileId} IS NULL OR id <> ${exceptProfileId}))
    OR EXISTS (SELECT 1 FROM username_holds WHERE username = ${username} AND expires_at > ${now}
               AND (${exceptProfileId} IS NULL OR profile_id <> ${exceptProfileId})) AS n`);
  return Boolean(rows[0]?.n);
}

export async function usernamesWithPrefix(prefix: string): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db
    .select({ u: profiles.username })
    .from(profiles)
    .where(sql`${profiles.username} LIKE ${prefix.replace(/[%_\\]/g, '\\$&') + '%'} ESCAPE '\\'`);
  return new Set(rows.map((r) => r.u));
}

/** Inserts the individual profile; the unique index decides concurrent claims (BR-19). */
export async function insertProfile(userId: string, username: string, displayName: string, now: number) {
  const db = await getDb();
  return db
    .insert(profiles)
    .values({ userId, username, displayName, kind: 'individual', createdAt: new Date(now), updatedAt: new Date(now) })
    .returning({ id: profiles.id });
}

export async function findById(id: number) {
  const db = await getDb();
  const [row] = await db
    .select({ id: profiles.id, userId: profiles.userId, username: profiles.username, role: profiles.role, suspendedAt: profiles.suspendedAt })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  return row ?? null;
}

export async function setSuspended(id: number, suspended: boolean, now: number) {
  const db = await getDb();
  return db
    .update(profiles)
    .set({ suspendedAt: suspended ? new Date(now) : null, updatedAt: new Date(now) })
    .where(eq(profiles.id, id))
    .returning({ id: profiles.id });
}

export async function setRole(id: number, role: 'member' | 'moderator' | 'admin', now: number) {
  const db = await getDb();
  return db.update(profiles).set({ role, updatedAt: new Date(now) }).where(eq(profiles.id, id)).returning({ id: profiles.id });
}

export async function setFeatured(id: number, featured: boolean, now: number) {
  const db = await getDb();
  return db
    .update(profiles)
    .set({ isFeaturedStudio: featured, updatedAt: new Date(now) })
    .where(eq(profiles.id, id))
    .returning({ id: profiles.id });
}

/** The member's role in a team, or null (BR-58). */
export async function teamRole(teamId: number, memberId: number): Promise<'owner' | 'admin' | 'member' | null> {
  const db = await getDb();
  const [row] = await db
    .select({ role: teamMemberships.role })
    .from(teamMemberships)
    .where(sql`${teamMemberships.teamId} = ${teamId} AND ${teamMemberships.memberId} = ${memberId}`)
    .limit(1);
  return row?.role ?? null;
}

export async function settingsOf(profileId: number) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: profiles.id,
      userId: profiles.userId,
      kind: profiles.kind,
      username: profiles.username,
      displayName: profiles.displayName,
      headline: profiles.headline,
      bio: profiles.bio,
      location: profiles.location,
      websiteUrl: profiles.websiteUrl,
      publicEmail: profiles.publicEmail,
      skills: profiles.skills,
      languages: profiles.languages,
      intents: profiles.intents,
      avatarMediaId: profiles.avatarMediaId,
      avatarKey: avatar.storageKey,
      usernameChangedAt: profiles.usernameChangedAt,
    })
    .from(profiles)
    .leftJoin(avatar, eq(avatar.id, profiles.avatarMediaId))
    .where(eq(profiles.id, profileId))
    .limit(1);
  return row ?? null;
}

export type ProfilePatch = Partial<{
  displayName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  skills: string[];
  languages: string[];
  intents: string[];
  avatarMediaId: string | null;
}>;

/** Profile fields + (optionally) the full social-link list, in one batch. */
export async function updateProfile(profileId: number, patch: ProfilePatch, links: { platform: string; url: string }[] | undefined, now: number) {
  const db = await getDb();
  const stmts = [db.update(profiles).set({ ...patch, updatedAt: new Date(now) }).where(eq(profiles.id, profileId))] as unknown[];
  if (links) {
    stmts.push(db.delete(userSocialLinks).where(eq(userSocialLinks.profileId, profileId)));
    links.forEach((l, i) =>
      stmts.push(db.insert(userSocialLinks).values({ profileId, platform: l.platform as 'x', url: l.url, position: i })),
    );
  }
  await db.batch(stmts as unknown as Parameters<typeof db.batch>[0]);
}

/**
 * BR-23 username change: the old name is held for this profile for 30 days; a hold of the new name by the
 * same profile (changing back) is released. The unique index on profiles.username decides races.
 */
export async function changeUsername(profileId: number, oldName: string, newName: string, holdUntil: number, now: number) {
  const db = await getDb();
  await db.batch([
    db.run(sql`DELETE FROM username_holds WHERE username = ${newName} AND profile_id = ${profileId}`),
    db.run(sql`INSERT INTO username_holds (username, profile_id, expires_at) VALUES (${oldName}, ${profileId}, ${holdUntil})
      ON CONFLICT(username) DO UPDATE SET profile_id = excluded.profile_id, expires_at = excluded.expires_at`),
    db.run(sql`UPDATE profiles SET username = ${newName}, username_changed_at = ${now}, updated_at = ${now} WHERE id = ${profileId}`),
  ]);
}

export async function purgeExpiredHolds(now: number): Promise<number> {
  const db = await getDb();
  const res = await db.delete(usernameHolds).where(sql`${usernameHolds.expiresAt} <= ${now}`);
  return res.rowsAffected;
}

/** BR-24: soft delete (profile 404 at once; content leaves feeds by eligibility). */
export async function softDelete(profileId: number, now: number) {
  const db = await getDb();
  await db.update(profiles).set({ deletedAt: new Date(now), updatedAt: new Date(now) }).where(eq(profiles.id, profileId));
}

/** Profiles soft-deleted before `before` (BR-24 30-day purge), with their credential user id. */
export async function deletedBefore(before: number, limit: number) {
  const db = await getDb();
  return db
    .select({ id: profiles.id, userId: profiles.userId })
    .from(profiles)
    .where(sql`${profiles.deletedAt} IS NOT NULL AND ${profiles.deletedAt} < ${before}`)
    .limit(limit);
}

/** BR-24 purge: removes the profile row; shots, media rows, links and memberships cascade. */
export async function hardDelete(profileId: number) {
  const db = await getDb();
  await db.run(sql`DELETE FROM profiles WHERE id = ${profileId}`);
}

/** Teams in which the profile is the owner (BR-24: must transfer or delete them first). */
export async function ownedTeams(profileId: number) {
  const db = await getDb();
  return db.all<{ id: number; username: string }>(sql`SELECT t.id AS id, t.username AS username
    FROM team_memberships m JOIN profiles t ON t.id = m.team_id
    WHERE m.member_id = ${profileId} AND m.role = 'owner' AND t.deleted_at IS NULL`);
}

/** BR-57: a team is a profile with kind 'team' and no credentials. */
export async function insertTeamProfile(username: string, displayName: string, now: number): Promise<number> {
  const db = await getDb();
  const rows = await db
    .insert(profiles)
    .values({ userId: null, username, displayName, kind: 'team', createdAt: new Date(now), updatedAt: new Date(now) })
    .returning({ id: profiles.id });
  return rows[0]!.id;
}
