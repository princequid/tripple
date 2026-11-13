import type { MediaRef, PersonRef, ShotCard } from '@/modules/shots/types';

/** Matches the frontend contract `CollectionSummary` (src/services/contracts.ts). Counts are eligible shots (FR-56). */
export type CollectionSummary = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
  owner: PersonRef;
  shotsCount: number;
  designersCount: number;
  /** Up to 4 newest covers for the mosaic. */
  covers: MediaRef[];
  updatedAt: string;
};

export type CollectionDetail = CollectionSummary & {
  isOwn: boolean;
  /** First page of shots, newest save first. More via GET /api/collections/:id/shots?cursor=shotsNextCursor. */
  shots: ShotCard[];
  shotsNextCursor: string | null;
};

/** Save picker row (FR-47). `shotsCount` is the raw item count used for the 1,000 limit (BR-53). */
export type SaveTarget = { id: number; name: string; isPrivate: boolean; contains: boolean; shotsCount: number };

export type SaveResult = { collectionId: number; saved: boolean; savesCount: number; collectionShotsCount: number };
