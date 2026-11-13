import 'server-only';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import type { Viewer, Member } from '@/modules/auth/types';
import * as shots from '@/modules/shots/service';
import * as users from '@/modules/users/service';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import type { Page, ShotCard } from '@/modules/shots/types';
import * as repo from './repository';

/**
 * Likes (S-01, FR-45). Set semantics, not a toggle (API_RESPONSE_CONVENTIONS §5).
 * Rules: BR-46 (one per shot, not own, members only, ineligible → 404), BR-26 (atomic counters),
 * RL-SOCIAL rate limit checked before any side effect (BR-76, BR-77).
 */
export function requireMember(viewer: Viewer): Member {
  if (viewer.kind === 'visitor') throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
  if (viewer.kind === 'pending') throw new AppError('ONBOARDING_REQUIRED', 'Finish setting up your account first.');
  return viewer;
}

export async function setLike(viewer: Viewer, shotId: number, liked: boolean): Promise<{ liked: boolean; likesCount: number }> {
  const member = requireMember(viewer);
  await limit('RL-SOCIAL', `p:${member.profileId}`);
  const shot = await shots.requireEligible(shotId);
  if (shot.authorId === member.profileId) throw new AppError('CANNOT_LIKE_OWN', 'You cannot like your own shot.');
  const likesCount = await repo.setLike(member.profileId, shot.id, shot.authorId, liked, Date.now());
  return { liked, likesCount };
}

export async function likedAmong(viewer: Viewer, shotIds: number[]): Promise<Set<number>> {
  if (viewer.kind !== 'member') return new Set();
  return repo.likedAmong(viewer.profileId, shotIds);
}

/** Lookup function handed to shot listings so card DTOs carry `isLiked`. */
export const lookupFor = (viewer: Viewer) => (ids: number[]) => likedAmong(viewer, ids);

export const reconcile = () => repo.reconcile();

/**
 * Liked Shots tab (P-04, FR-57, BR-17): owner only, newest like first. Anyone else (and visitors) gets 404,
 * so the tab's existence is not revealed.
 */
export async function likedShots(viewer: Viewer, username: string, q: { cursor?: string | null; limit?: number }): Promise<Page<ShotCard>> {
  const profile = await users.findByUsername(username);
  if (!profile || viewer.kind !== 'member' || viewer.profileId !== profile.id) throw new AppError('NOT_FOUND');
  const size = Math.min(Math.max(q.limit ?? 24, 1), 48);
  const key = `liked:${profile.id}`;
  const rows = await repo.pageLikedIds(profile.id, Date.now(), decodeCursor(q.cursor, key), size + 1);
  const page = rows.slice(0, size);
  const items = await shots.cardsInOrder(page.map((r) => r.id), viewer, lookupFor(viewer));
  const last = page[page.length - 1];
  return { items, nextCursor: rows.length > size && last ? encodeCursor(key, [last.at, last.id]) : null };
}

export const removeAllBy = (profileId: number) => repo.removeAllBy(profileId);
export const removeAllOnShot = (shotId: number) => repo.removeAllOnShot(shotId);
