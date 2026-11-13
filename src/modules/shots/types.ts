// DTOs shared by server and client code (types only; no runtime imports). Emails never appear here (BR-78).

export type MediaRef = { key: string; width: number; height: number; dominantColor: string | null; alt: string };

export type PersonRef = {
  id: number;
  username: string;
  displayName: string;
  avatarKey: string | null;
  isTeam: boolean;
  isFeaturedStudio: boolean;
};

export type ShotCard = {
  id: number;
  title: string;
  slug: string;
  cover: MediaRef | null;
  author: PersonRef;
  team: PersonRef | null;
  likesCount: number;
  viewsCount: number;
  publishedAt: string;
  /** null for visitors (RE doc 05 §7: isLiked null when anonymous). */
  isLiked: boolean | null;
  isOwn: boolean;
};

export type ContentBlockDto =
  | { id: number; type: 'image'; position: number; media: MediaRef; isFullWidth: boolean }
  | { id: number; type: 'text'; position: number; text: string };

export type ShotDetail = ShotCard & {
  description: string | null;
  /** R2 (additive; unreleased UI ignores them, BR-45). */
  savesCount: number;
  commentsCount: number;
  commentsDisabled: boolean;
  /** Saved in any of the viewer's collections; null for visitors. */
  isSaved: boolean | null;
  /** Viewer follows the owner (the team for team shots); null for visitors, the owner, or when not requested. */
  isFollowingOwner: boolean | null;
  category: { slug: string; name: string };
  tags: { name: string; slug: string }[];
  blocks: ContentBlockDto[];
  palette: string[];
  hidden: boolean;
  canonicalPath: string;
};

export type Page<T> = { items: T[]; nextCursor: string | null };
