import 'server-only';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { requireMember } from '@/modules/auth/service';
import type { Viewer } from '@/modules/auth/types';
import * as users from '@/modules/users/service';
import type { Page } from '@/modules/shots/types';
import * as repo from './repository';
import type { PersonCard } from './types';

/**
 * Follows (S-03, FR-48, BR-56). Set semantics (PUT = follow, DELETE = unfollow), RL-SOCIAL, atomic counters
 * (BR-26). Members can follow individuals and teams; teams have no session so they never follow (BR-57).
 */
async function visibleTarget(username: string) {
  const p = await users.findByUsername(username);
  if (!p || p.deletedAt || p.suspendedAt) throw new AppError('NOT_FOUND');
  return p;
}

export async function setFollow(viewer: Viewer, username: string, on: boolean): Promise<{ following: boolean; followersCount: number }> {
  const member = requireMember(viewer);
  await limit('RL-SOCIAL', `p:${member.profileId}`);
  const target = await visibleTarget(username);
  if (target.id === member.profileId) throw new AppError('CANNOT_FOLLOW_SELF', 'You cannot follow yourself.');
  const followersCount = await repo.setFollow(member.profileId, target.id, on, Date.now());
  return { following: on, followersCount };
}

/** Whether the viewer follows each of the given profiles (null-safe for visitors). */
export async function followingAmong(viewer: Viewer, ids: number[]): Promise<Set<number>> {
  if (viewer.kind !== 'member') return new Set();
  return repo.followingAmong(viewer.profileId, ids);
}

/** Lookup for a single profile: null for visitors and for the viewer's own profile (no button). */
export const lookupFor = (viewer: Viewer) => async (profileId: number): Promise<boolean | null> => {
  if (viewer.kind !== 'member' || viewer.profileId === profileId) return null;
  return (await repo.followingAmong(viewer.profileId, [profileId])).has(profileId);
};

/** Public follower / following lists, newest first, 24 per page (BR-56). Hidden profiles → 404. */
export async function listPeople(
  viewer: Viewer,
  username: string,
  side: 'followers' | 'following',
  q: { cursor?: string | null; limit?: number },
): Promise<Page<PersonCard>> {
  const profile = await users.getPublicProfile(username, viewer);
  const size = Math.min(Math.max(q.limit ?? 24, 1), 48);
  const feedKey = `${side}:${profile.id}`;
  const rows = await repo.listPeople(profile.id, side, decodeCursor(q.cursor, feedKey), size + 1);
  const page = rows.slice(0, size);
  const mine = await followingAmong(viewer, page.map((r) => r.id));
  const last = page[page.length - 1];
  return {
    items: page.map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.displayName,
      avatarKey: r.avatarKey,
      isTeam: r.kind === 'team',
      isFeaturedStudio: r.isFeaturedStudio,
      headline: r.headline,
      location: r.location,
      followersCount: r.followersCount,
      isFollowing: viewer.kind !== 'member' || viewer.profileId === r.id ? null : mine.has(r.id),
      isOwn: viewer.kind === 'member' && viewer.profileId === r.id,
      followedAt: new Date(r.followedAt).toISOString(),
    })),
    nextCursor: rows.length > size && last ? encodeCursor(feedKey, [last.followedAt, last.id]) : null,
  };
}

export const removeAllFor = (profileId: number) => repo.removeAllFor(profileId);
export const reconcile = () => repo.reconcile();
