import type { PersonRef } from '@/modules/shots/types';

/**
 * Person row in lists (followers/following, team members, designer search). Matches the frontend contract
 * `PersonSummary` (src/services/contracts.ts). `isFollowing` is null for visitors and for the viewer's own row.
 */
export type PersonSummary = PersonRef & {
  headline: string | null;
  location: string | null;
  followersCount: number;
  isFollowing: boolean | null;
  isOwn: boolean;
};

/** Follower/following list row: a PersonSummary plus when the follow happened. */
export type PersonCard = PersonSummary & { followedAt: string };
