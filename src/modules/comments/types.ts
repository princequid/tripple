import type { PersonRef } from '@/modules/shots/types';

/**
 * Matches the frontend contract `CommentDto` (src/services/contracts.ts), plus `parentId` and `hidden`
 * (true only when staff view a hidden comment). A deleted top-level comment with replies is a placeholder:
 * `deleted: true`, empty body (BR-50).
 */
export type CommentDto = {
  id: number;
  shotId: number;
  parentId: number | null;
  author: PersonRef;
  body: string;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  hidden: boolean;
  likesCount: number;
  isLiked: boolean | null;
  canEdit: boolean;
  canDelete: boolean;
  replies: CommentDto[];
};

/** `data` of GET /api/shots/:id/comments (frontend `CommentThread`) with the page cursor alongside. */
export type CommentThread = { comments: CommentDto[]; total: number; disabled: boolean; canModerate: boolean };
export type CommentThreadPage = CommentThread & { nextCursor: string | null };
