/**
 * Frontend data contracts for R2/R3 features (types only). They extend the R1 DTOs in the modules' types.ts files
 * and follow API_RESPONSE_CONVENTIONS: lists are `{ data: T[], page: { nextCursor, limit } }`, ids are numbers,
 * timestamps ISO 8601 UTC, media referenced by key. Every type here is the expected response body `data` of the
 * endpoint named in FRONTEND_API_INTEGRATION_REQUIREMENTS.md. Emails never appear (BR-78) except `publicEmail`.
 */
import type { MediaRef, PersonRef, ShotCard } from '@/modules/shots/types';

export type { MediaRef, PersonRef, ShotCard };

export type Paged<T> = { items: T[]; nextCursor: string | null };

/** Person row used in lists (followers, members, directory, search). */
export type PersonSummary = PersonRef & {
  headline: string | null;
  location: string | null;
  followersCount: number;
  /** null for visitors and for the viewer's own row (BR-56). */
  isFollowing: boolean | null;
  isOwn: boolean;
};

// ---------- Follows (S-03, BR-56) ----------
export type FollowState = { following: boolean; followersCount: number };
export type ProfileSocial = { followersCount: number; followingCount: number; isFollowing: boolean | null; isBlocked: boolean };

// ---------- Collections (S-02, P-03, BR-53…55) ----------
export type CollectionSummary = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
  owner: PersonRef;
  shotsCount: number;
  designersCount: number;
  /** Up to 4 cover media for the mosaic. */
  covers: MediaRef[];
  updatedAt: string;
};
/** `shotsNextCursor` pages through GET /api/collections/:id/shots (live); the mock returns everything. */
export type CollectionDetail = CollectionSummary & { isOwn: boolean; shots: ShotCard[]; shotsNextCursor?: string | null };
/** Save picker row: the viewer's collections with membership of one shot. */
export type SaveTarget = { id: number; name: string; isPrivate: boolean; contains: boolean; shotsCount: number };
export type CollectionInput = { name: string; description?: string; isPrivate: boolean };

// ---------- Comments (S-04, BR-48…52) ----------
export type CommentDto = {
  id: number;
  shotId: number;
  author: PersonRef;
  body: string;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  /** Live API: top-level parent (BR-49) and staff-visible hidden flag. */
  parentId?: number | null;
  hidden?: boolean;
  likesCount: number;
  isLiked: boolean | null;
  canEdit: boolean; // author within 15 min (BR-50)
  canDelete: boolean; // author or shot owner/team admin
  replies: CommentDto[]; // one level (BR-49)
};
export type CommentThread = { comments: CommentDto[]; total: number; disabled: boolean; canModerate: boolean };

// ---------- Reports (BR-69) ----------
export type ReportTargetType = 'shot' | 'comment' | 'profile' | 'collection' | 'job';
export type ReportReason = 'spam' | 'harassment' | 'ip' | 'explicit' | 'other';
export type ReportInput = { targetType: ReportTargetType; targetId: number; reason: ReportReason; note?: string };
export type ReportResult = { status: 'created' | 'already-reported' };
export type ReportRow = {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  targetLabel: string;
  targetHref: string;
  reason: ReportReason;
  note: string | null;
  ownerUsername?: string | null;
  reporter: PersonRef;
  reportsCount: number;
  createdAt: string;
  status: 'open' | 'hidden' | 'dismissed' | 'suspended';
};
export type ReportDecision = { action: 'hide' | 'dismiss' | 'suspend'; reason: string };

// ---------- Shot extras (SCR-22) ----------
export type ShotNeighbours = { prev: { id: number; slug: string; title: string } | null; next: { id: number; slug: string; title: string } | null };

// ---------- Composer (C-01, C-04, C-05, BR-61…66) ----------
export type UploadSlot = { uploadId: string; uploadUrl: string; token: string; expiresAt: string };
/** Media ids are opaque strings (UUID, API_SPECIFICATION §6). */
export type UploadedMedia = { mediaId: string; key: string; width: number; height: number; dominantColor: string | null; previewUrl: string };
export type ComposerBlock =
  | { kind: 'image'; clientId: string; media: UploadedMedia | null; alt: string; isFullWidth: boolean; progress: number; error: string | null; fileName: string }
  | { kind: 'text'; clientId: string; text: string };
export type ShotDraftInput = {
  title: string;
  description: string;
  categorySlug: string;
  tags: string[];
  teamUsername: string | null;
  blocks: ({ type: 'image'; mediaId: string; alt: string; isFullWidth: boolean } | { type: 'text'; text: string })[];
  commentsDisabled: boolean;
};
export type ShotDraft = ShotDraftInput & { id: number; status: 'draft' | 'published'; slug: string; updatedAt: string; previewBlocks: ComposerBlock[]; canonicalPath?: string };

// ---------- Settings (A-07, P-06, BR-23, BR-24) ----------
export type ProfileSettings = {
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  websiteUrl: string;
  publicEmail: string;
  skills: string[];
  languages: string[];
  /** R2 onboarding intents (FR-18). */
  intents: string[];
  avatarKey: string | null;
  /** Input: an own ready `avatar` upload id (the server checks ownership). */
  avatarMediaId?: string | null;
  socialLinks: { platform: string; url: string }[];
};
export type AccountSettings = { username: string; /** masked, e.g. "in••••@example.com"; null when unknown */ email: string | null; usernameChangedAt: string | null; canChangeUsernameAt: string | null };
export type SessionRow = { id: string; device: string; location: string | null; lastActiveAt: string; current: boolean };
export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamMembership = { team: PersonRef; role: TeamRole; membersCount: number };
export type TeamInvitation = { id: number; team: PersonRef; invitedBy: PersonRef | null; role: TeamRole; createdAt: string; expiresAt?: string };
export type TeamMember = { person: PersonRef; role: TeamRole; joinedAt: string };
export type TeamAdmin = { team: PersonRef & { headline: string | null; websiteUrl: string | null }; myRole: TeamRole; members: TeamMember[]; pending: { id?: number; username: string; role: TeamRole; createdAt: string; expiresAt?: string }[] };
export type BlockedRow = { person: PersonRef; blockedAt: string };

// ---------- Onboarding (A-06 full, FR-18) ----------
export type OnboardingIntent = 'share' | 'discover' | 'hire' | 'find-work';
export type OnboardingDetails = { headline: string; location: string; intents: OnboardingIntent[]; skills: string[] };

// ---------- Jobs (J-01…J-03, BR-71…75) ----------
export type WorkplaceType = 'remote' | 'on-site' | 'hybrid';
export type EmploymentType = 'full-time' | 'freelance-contract';
export type JobSummary = {
  id: number;
  slug: string;
  title: string;
  company: { name: string; websiteUrl: string; logoKey: string | null };
  location: string | null;
  workplaceType: WorkplaceType;
  employmentType: EmploymentType;
  specialty: { slug: string; name: string };
  postedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'closed';
};
/** `applyUrl` is null once a job is expired or closed (live API); `noindex`/`hidden` from the server. */
export type JobDetail = JobSummary & { descriptionHtml: string; applyUrl: string | null; isOwn: boolean; noindex?: boolean; hidden?: boolean };
export type JobQuery = { q?: string; specialties?: string[]; location?: string; remote?: boolean; employment?: EmploymentType[]; cursor?: string | null };
export type JobInput = {
  title: string;
  descriptionHtml: string;
  location: string;
  workplaceType: WorkplaceType;
  specialtySlug: string;
  employmentType: EmploymentType;
  applyUrl: string;
  companyName: string;
  companyWebsite: string;
  companyLogoKey: string | null;
};

// ---------- Notifications (S-05, BR-83) ----------
export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'save' | 'team-invite';
export type NotificationDto = {
  id: number;
  type: NotificationType;
  actors: PersonRef[]; // grouped likes (BR-83)
  target: { label: string; href: string; cover: MediaRef | null } | null;
  createdAt: string;
  readAt: string | null;
};
export type UnreadCounts = { notifications: number; messages: number };

// ---------- Messaging (S-07, BR-82) ----------
export type ThreadSummary = { id: number; other: PersonRef; lastMessage: { body: string; at: string; fromMe: boolean } | null; unread: number; context: { label: string; href: string } | null };
export type MessageDto = { id: number; threadId: number; from: PersonRef; body: string; createdAt: string; fromMe: boolean; status?: 'sending' | 'failed' };
export type ThreadDetail = { thread: ThreadSummary; messages: MessageDto[]; canReply: boolean };
export type NewMessageInput = { toUsername: string; body: string; context?: { type: 'shot' | 'service' | 'profile'; id: number } };

// ---------- Hire / services (H-01, M-01, BR-84) ----------
export type DesignerCard = PersonSummary & { skills: string[]; recentShots: ShotCard[]; servicesCount: number; startingPriceCents: number | null };
export type DesignerQuery = { q?: string; skill?: string; location?: string; kind?: 'all' | 'individual' | 'team'; cursor?: string | null };
export type ServiceSummary = {
  id: number;
  slug: string;
  title: string;
  seller: PersonRef;
  category: { slug: string; name: string };
  priceCents: number;
  deliveryDays: number;
  cover: MediaRef | null;
};
export type ServiceDetail = ServiceSummary & { description: string; revisions: number; includes: string[]; isOwn: boolean; sellerHeadline: string | null; sellerLocation: string | null };
export type ServiceQuery = { q?: string; category?: string; maxPriceCents?: number; maxDays?: number; sort?: 'recommended' | 'price-asc' | 'price-desc' | 'newest'; cursor?: string | null };
export type ServiceInput = { title: string; description: string; categorySlug: string; priceCents: number; deliveryDays: number; revisions: number; includes: string[]; coverKey: string | null };

// ---------- Search (D-08, FR-35) ----------
export type SearchType = 'shots' | 'designers' | 'services';
export type Suggestion = { kind: 'term' | 'tag' | 'designer'; label: string; href: string; avatar?: PersonRef };
