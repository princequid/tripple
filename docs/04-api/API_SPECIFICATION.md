# API Specification (R1 + R2)

| Field | Value |
|---|---|
| Task | P04-02 (inventory) + P04-03 (specification) |
| Version | **2.0 · 2026-11-13** · matches the code in `src/app/api/**` (71 Route Handlers) |
| Audience | The frontend session (integration contract) and reviewers |
| Conventions | [API_RESPONSE_CONVENTIONS](API_RESPONSE_CONVENTIONS.md) (envelopes, error vocabulary, cursors, set semantics) |
| Tests | [API_TESTING_PLAN](API_TESTING_PLAN.md) · R1 contracts `tests/e2e/api.spec.ts` · R2 contracts `tests/integration/api-r2.test.ts` + one service suite per module |
| Change log | §8 (every contract change is listed there; nothing breaking for R1 consumers) |

## 1. Overview

- **Transport.** Next.js Route Handlers (A-01, A-20). Pages (Server Components) may call the same services directly; browser code calls these endpoints with `fetch` (`src/lib/api-client.ts`). There are **no Server Actions**.
- **Envelope.** Success `{ "data": … }`; lists `{ "data": [...], "page": { "nextCursor": string|null, "limit": n } }` (a few lists add a sibling key such as `term`, stated per endpoint). Errors: RFC 9457 problem details `application/problem+json` with `code`, `status`, `title`, `requestId`, optional `fields` (per-field messages) and `retryAfter`. Every response has `x-request-id` and `Cache-Control: no-store`.
- **Identity.** Better Auth session cookie (HttpOnly, SameSite=Lax, Secure on https; BR-13). Viewer kinds: `visitor`, `pending` (signed in, no username yet, BR-16), `member` (with `role`). Suspended/deleted accounts are visitors (BR-25).
- **Guards.** Member-only endpoints: visitor → **401 `UNAUTHENTICATED`**; pending → **403 `ONBOARDING_REQUIRED`**. Staff-only: **403 `FORBIDDEN`**.
- **CSRF.** Every cookie-authenticated mutation (PUT/PATCH/POST/DELETE) requires an `Origin` (or `Referer`) from the app's own origin; otherwise **403 `ORIGIN_REJECTED`**. `fetch` from the app's pages sends it automatically.
- **IDs and time.** Numeric entity ids (shots, profiles, collections, comments, jobs, invitations, reports) are JSON numbers. **Media ids are opaque strings (UUIDs).** Timestamps are ISO 8601 UTC. Images are referenced by `key` and turned into URLs with `lib/media.mediaUrl(key, variant)` (ImageKit in production, local seed folder in development).
- **Malformed path ids** (non-numeric, zero, negative) → **404**, never 400.
- **Pagination.** Opaque signed cursors bound to the query that produced them (a cursor from another list → **400 `INVALID_CURSOR`**). `limit` 1–48, default 24 unless stated.

### 1.1 Shared DTOs (R1, extended additively in R2)

```ts
type MediaRef = { key: string; width: number; height: number; dominantColor: string | null; alt: string };
type PersonRef = { id: number; username: string; displayName: string; avatarKey: string | null; isTeam: boolean; isFeaturedStudio: boolean };
type ShotCard = {
  id: number; title: string; slug: string; cover: MediaRef | null;
  author: PersonRef; team: PersonRef | null;          // "{author} for {team}" (BR-59)
  likesCount: number; viewsCount: number; publishedAt: string;
  isLiked: boolean | null;                             // null for visitors
  isOwn: boolean;
};
type ShotDetail = ShotCard & {
  description: string | null; category: { slug: string; name: string };
  tags: { name: string; slug: string }[]; palette: string[];
  blocks: ({ id; type: 'image'; position; media: MediaRef; isFullWidth } | { id; type: 'text'; position; text })[];
  hidden: boolean; canonicalPath: string;
  // R2 (additive)
  savesCount: number; commentsCount: number; commentsDisabled: boolean;
  isSaved: boolean | null;                             // in any of the viewer's collections; null for visitors
  isFollowingOwner: boolean | null;                    // owner = team for team shots; null for visitors/owner
};
type PublicProfile = {
  id; username; displayName; isTeam; isFeaturedStudio; headline; bio; location; websiteUrl;
  publicEmail: string | null;                          // never the sign-in email (BR-78)
  skills: string[]; languages: string[]; avatarKey; memberSince: string;
  stats: { shots: number; likesReceived: number; followers: number; following: number };   // followers/following: R2
  socialLinks: { platform; url }[]; members: PersonListItem[]; teams: PersonListItem[];
  isOwn: boolean; isFollowing: boolean | null;          // isFollowing: R2
  suspended: boolean;
};
// R2
type PersonSummary = PersonRef & { headline: string | null; location: string | null; followersCount: number; isFollowing: boolean | null; isOwn: boolean };
```

### 1.2 Idempotent creates (R2)

`POST /api/collections`, `/api/shots`, `/api/shots/:id/comments` and `/api/jobs` accept an optional header **`Idempotency-Key: <uuid v4>`**. The first successful result for (member, endpoint, key) is stored for 24 h and **replayed** for repeats (same status and body), so a double submit never creates two rows. Without the header the create simply runs.

### 1.3 Rate limits and quotas

Over a rate limit → **429 `RATE_LIMITED`** + `Retry-After` + `retryAfter`, no side effect. Business quotas (draft count, publishes per day, active jobs, collection limits, username change interval) → **422 `QUOTA_EXCEEDED`** with a human message and, where a wait applies, `retryAfter`.

| Class | Endpoints | Limit |
|---|---|---|
| RL-SOCIAL | like, follow, save | 60/min, 1,000/day per member |
| RL-COMMENT | comment create/edit/delete, comment like | 10/min, 200/day |
| RL-CONTENT | collections, shots (create/edit/delete), teams, invitations, jobs | 30/hour |
| RL-UPLOAD | `POST /api/uploads` | 30/hour, 200/day |
| RL-REPORT | `POST /api/reports` | 20/day |
| RL-ACCOUNT | profile, onboarding details, username change | 30/hour |
| RL-MODERATION | staff actions | 300/hour |
| RL-SEARCH-SUGGEST | `GET /api/search/suggest` | 120/min per IP (hashed) |
| Quotas (422) | 50 drafts · 10 publishes/day · 100 collections · 1,000 shots per collection · 3 active jobs · 5 job posts/day · 10 teams per member · 100 members per team · username change once per 30 days | BR-53, BR-57, BR-66, BR-73, BR-23 |

## 2. Endpoint inventory

### 2.1 R1 (unchanged contracts; some responses gained fields, §8)

| # | Method · Path | Auth | Purpose | Feature |
|---|---|---|---|---|
| E-01 | GET `/api/health` | none | Liveness + DB | F-05 |
| E-02 | GET `/api/shots` | optional | Explore feeds | D-01, D-03, D-04 |
| E-03 | GET `/api/shots/:id` | optional | Shot detail (R2 fields added) | SD-01 |
| E-04/05 | PUT/DELETE `/api/shots/:id/like` | member + origin | Like / unlike | S-01 |
| E-06 | POST `/api/views` | optional | View beacon | D-10 |
| E-07 | GET `/api/search/shots` | optional | Full-text search | D-06 |
| E-08 | GET `/api/tags/:tag/shots` | optional | Tag page list | D-07 |
| E-09 | GET `/api/users/:username` | optional | Public profile (R2 fields added) | P-01, P-02 |
| E-10 | GET `/api/users/:username/shots` | optional | Work tab | P-01 |
| E-11 | GET `/api/me` | optional | Who am I | A-03 |
| E-12 | GET `/api/onboarding/username?u=` | signed in | Username availability | A-06 |
| E-13 | POST `/api/onboarding` | pending + origin | Create profile | A-06 |
| E-14 | GET `/api/cron/:job` | bearer | Scheduled jobs (R2 adds `purge`) | D-04, BR-27, BR-79 |
| E-15…E-18 | `/api/auth/*` | library | Email code, sign-out, Google | A-01…A-03 |
| E-19 | GET `/search?q=` | none | 308 → `/search/:term` | D-06 |

### 2.2 R2 (new)

| # | Method · Path | Auth | Purpose | Feature / rules |
|---|---|---|---|---|
| E-20 | PUT/DELETE `/api/users/:username/follow` | member + origin | Follow / unfollow | S-03, BR-56 |
| E-21 | GET `/api/users/:username/followers` · `/following` | optional | Follow lists | FR-48 |
| E-22 | GET `/api/users/:username/collections` | optional | Collections tab | P-03, FR-56 |
| E-23 | GET `/api/users/:username/likes` | owner only | Liked Shots tab | P-04, FR-57 |
| E-24 | POST `/api/collections` | member + origin | Create collection | FR-46 |
| E-25 | GET/PATCH/DELETE `/api/collections/:id` | optional / owner | Detail, edit, delete | FR-46, FR-56 |
| E-26 | GET `/api/collections/:id/shots` | optional | Collection shots page | FR-56 |
| E-27 | PUT/DELETE `/api/collections/:id/shots/:shotId` | owner + origin | Save / remove | FR-47, BR-55 |
| E-28 | GET `/api/me/collections?shotId=` | member | Save picker | FR-47 |
| E-29 | GET/POST `/api/shots/:id/comments` | optional / member | Thread, post | FR-49 |
| E-30 | PATCH/DELETE `/api/comments/:id` | member | Edit (15 min), delete | BR-50 |
| E-31 | PUT/DELETE `/api/comments/:id/like` | member | Comment like | BR-52 |
| E-32 | PUT `/api/shots/:id/comments-setting` | shot manager | Disable comments | BR-51 |
| E-33 | POST `/api/uploads` | member + origin | Start an upload | C-01, FR-61 |
| E-34 | PUT `/api/uploads/:id/file` | owner (local provider only) | Send bytes (dev/test) | FR-61 |
| E-35 | POST `/api/uploads/:id/complete` | owner | Validate + analyse | C-02, FR-62 |
| E-36 | GET/DELETE `/api/uploads/:id` | owner | Status / remove | FR-61 |
| E-37 | POST `/api/shots` | member + origin | Create draft | C-04, FR-63 |
| E-38 | PATCH/DELETE `/api/shots/:id` | author | Edit / delete | FR-63, FR-64 |
| E-39 | GET `/api/shots/:id/edit` | author | Composer data | FR-63 |
| E-40 | POST `/api/shots/:id/publish` | author | Publish | FR-64 |
| E-41 | GET `/api/me/shots?status=` | member | Drafts / own shots | FR-64 |
| E-42 | GET `/api/shots/:id/neighbours` | optional | Prev / next | SD-05, FR-44 |
| E-43 | DELETE `/api/shots/:id/team` | team owner/admin | Remove team attribution | BR-60 |
| E-44 | GET/PATCH `/api/me/profile` | member | Profile settings | FR-59 |
| E-45 | POST `/api/onboarding/details` | member | Full onboarding step | FR-18 |
| E-46 | GET `/api/me/account` | member | Account settings | FR-19 |
| E-47 | PUT `/api/me/username` | member | Change username | BR-23 |
| E-48 | GET `/api/me/sessions` · DELETE `/api/me/sessions/:id` · POST `/api/me/sessions/revoke-others` | member | Sessions | FR-19 |
| E-49 | POST `/api/me/email/code` · POST `/api/me/email` | member | Change email | FR-19 |
| E-50 | POST `/api/me/deletion/code` · POST `/api/me/deletion` | member | Delete account | BR-24 |
| E-51 | POST `/api/teams` · GET `/api/me/teams` | member | Create team, my teams | FR-58 |
| E-52 | GET/DELETE `/api/teams/:username` | team member / owner | Team settings, delete | FR-58, BR-58 |
| E-53 | PATCH `/api/teams/:username/profile` · PUT `…/username` | admin / owner | Edit team | BR-58 |
| E-54 | POST `/api/teams/:username/invitations` · DELETE `…/invitations/:id` | owner/admin | Invite, revoke | BR-58 |
| E-55 | GET `/api/me/invitations` · POST `…/:id/accept` · POST `…/:id/decline` | member | Respond | BR-58 |
| E-56 | PATCH/DELETE `/api/teams/:username/members/:member` · POST `…/transfer` | owner/admin/self | Roles, remove, leave, transfer | BR-58 |
| E-57 | GET/POST `/api/jobs` · GET/PATCH `/api/jobs/:id` · POST `/api/jobs/:id/close` · GET `/api/me/jobs` · GET `/api/specialties` | mixed | Jobs board | J-01…J-03 |
| E-58 | POST `/api/reports` | member | Report content | BR-69 |
| E-59 | GET `/api/moderation/reports` · POST `…/reports/:id/decision` · POST `/api/moderation/actions` | staff | Review queue, actions | BR-68, P10-27 |
| E-60 | GET `/api/search/designers` · GET `/api/search/suggest` | optional | Header search types, autocomplete | D-08, FR-35 |

## 3. R1 endpoints (as before)

### E-01 GET /api/health
**200** `{ data: { ok: true, db: "up" } }` · **503** `{ data: { ok: false, db: "down" } }`.

### E-02 GET /api/shots
| Query | Type | Default | Validation |
|---|---|---|---|
| `sort` | `popular`\|`recent` | `popular` | else 400 `VALIDATION` |
| `category` | one of the 8 slugs (BR-36) | all | unknown → **404** |
| `timeframe` | `now`\|`week`\|`month`\|`year`\|`ever` | `now` | else 400; ignored for `recent` (BR-34) |
| `cursor`, `limit` | | | §1 |

**200** list of `ShotCard`. Ordering per BR-32…BR-34; eligible shots only (BR-37). **R2:** popularity uses the R2 formula (BR-33: saves and non-author comments count), recomputed by the daily job.

### E-03 GET /api/shots/:id
**200** `ShotDetail` (R2 fields in §1.1). **404** missing, draft, deleted, hidden (staff excepted), owner suspended.

### E-04 / E-05 PUT|DELETE /api/shots/:id/like
**200** `{ data: { liked, likesCount } }` (set semantics). 403 `ORIGIN_REJECTED` · 401 · 403 `ONBOARDING_REQUIRED` · 403 `CANNOT_LIKE_OWN` · 404 · 429.

### E-06 POST /api/views
Body `{ shotId }`. **204** always for a well-formed body; 400 for malformed.

### E-07 GET /api/search/shots?q&cursor
**200** list of `ShotCard` + `term`, and `relatedTags` on the first page. Up to 200 results, 24 per page.

### E-08 GET /api/tags/:tag/shots?sort&cursor
**200** list + `tag` + `count`. **404** unknown tag or no eligible shot.

### E-09 GET /api/users/:username · E-10 GET /api/users/:username/shots
`PublicProfile` (§1.1); Work tab list of `ShotCard` (`sort=recent|popular`). 404 unknown/deleted/suspended (staff excepted).

### E-11 GET /api/me
`{ kind: "visitor" }` · `{ kind: "pending", name }` · `{ kind: "member", username, displayName, avatarKey, role }`.

### E-12 GET /api/onboarding/username?u= · E-13 POST /api/onboarding
As in v1.0: `{ username, available, problem }`; POST `{ username, displayName }` → 201 `{ username }` (422 `USERNAME_TAKEN`/`USERNAME_RESERVED`). R2: held usernames (BR-23) count as taken.

### E-14 GET /api/cron/:job
Bearer `CRON_SECRET`. Jobs: `popularity`, `cleanup` (R2 adds idempotency keys, username holds, unattached uploads > 24 h), `reconcile` (R2 adds follows, saves, comments), **`purge`** (R2: soft-deleted shots and accounts older than 30 days, with stored objects), `daily` (all).

### E-15…E-19
Unchanged (Better Auth formats; see v1.0 and API_RESPONSE_CONVENTIONS §8).

## 4. Shared R2 DTOs

```ts
type FollowState = { following: boolean; followersCount: number };
type PersonCard = PersonSummary & { followedAt: string };                       // follower lists

type CollectionSummary = { id: number; name: string; slug: string; description: string | null; isPrivate: boolean;
  owner: PersonRef; shotsCount: number; designersCount: number; covers: MediaRef[]; updatedAt: string };   // counts = eligible shots
type CollectionDetail = CollectionSummary & { isOwn: boolean; shots: ShotCard[]; shotsNextCursor: string | null };
type SaveTarget = { id: number; name: string; isPrivate: boolean; contains: boolean; shotsCount: number };
type SaveResult = { collectionId: number; saved: boolean; savesCount: number; collectionShotsCount: number };

type CommentDto = { id: number; shotId: number; parentId: number | null; author: PersonRef; body: string;
  createdAt: string; editedAt: string | null; deleted: boolean; hidden: boolean; likesCount: number;
  isLiked: boolean | null; canEdit: boolean; canDelete: boolean; replies: CommentDto[] };
type CommentThread = { comments: CommentDto[]; total: number; disabled: boolean; canModerate: boolean };

type UploadSlot = { uploadId: string; mediaId: string; provider: 'local' | 'imagekit'; method: 'POST' | 'PUT';
  uploadUrl: string; fields: Record<string, string>; token: string; expiresAt: string; maxBytes: number };
type UploadedMedia = { mediaId: string; purpose: 'shot' | 'avatar' | 'logo'; status: 'pending' | 'ready' | 'failed';
  key: string; width: number; height: number; dominantColor: string | null; palette: string[];
  previewUrl: string | null; failureReason: string | null };

type ShotDraftInput = { title: string; description?: string | null; categorySlug: string; tags?: string[];
  teamUsername?: string | null; commentsDisabled?: boolean;
  blocks?: ({ type: 'image'; mediaId: string; alt?: string | null; isFullWidth?: boolean } | { type: 'text'; text: string })[] };
type ShotDraft = { id: number; status: 'draft' | 'published'; title: string; slug: string; description: string | null;
  categorySlug: string; tags: string[]; teamUsername: string | null; commentsDisabled: boolean;
  blocks: ({ type: 'image'; mediaId: string; alt: string | null; isFullWidth: boolean; media: MediaRef | null } | { type: 'text'; text: string })[];
  updatedAt: string; publishedAt: string | null; canonicalPath: string };
type OwnShotRow = { id: number; title: string; slug: string; status: 'draft' | 'published'; updatedAt: string; cover: MediaRef | null };
type ShotNeighbours = { prev: { id: number; slug: string; title: string } | null; next: { id: number; slug: string; title: string } | null };

type ProfileSettings = { displayName: string; headline: string | null; bio: string | null; location: string | null;
  websiteUrl: string | null; publicEmail: string | null; skills: string[]; languages: string[]; intents: string[];
  avatarMediaId: string | null; avatarKey: string | null; socialLinks: { platform: string; url: string }[] };
type AccountSettings = { username: string; email: string; usernameChangedAt: string | null; canChangeUsernameAt: string | null };
type SessionRow = { id: string; device: string; location: null; lastActiveAt: string; current: boolean };

type TeamRole = 'owner' | 'admin' | 'member';
type TeamMembership = { team: PersonRef; role: TeamRole; membersCount: number };
type TeamInvitation = { id: number; team: PersonRef; invitedBy: PersonRef | null; role: TeamRole; createdAt: string; expiresAt: string };
type TeamAdmin = { team: PersonRef & { headline: string | null; websiteUrl: string | null }; myRole: TeamRole;
  members: { person: PersonRef; role: TeamRole; joinedAt: string }[];
  pending: { id: number; username: string; role: TeamRole; createdAt: string; expiresAt: string }[] };   // pending: owner/admin only

type JobSummary = { id: number; slug: string; title: string; company: { name: string; websiteUrl: string; logoKey: string | null };
  location: string | null; workplaceType: 'remote' | 'on-site' | 'hybrid'; employmentType: 'full-time' | 'freelance-contract';
  specialty: { slug: string; name: string }; postedAt: string; expiresAt: string; status: 'active' | 'expired' | 'closed' };
type JobDetail = JobSummary & { descriptionHtml: string; applyUrl: string | null; isOwn: boolean; noindex: boolean; hidden: boolean };

type ReportRow = { id: number; targetType: 'shot' | 'comment' | 'profile' | 'collection' | 'job'; targetId: number;
  targetLabel: string; targetHref: string; ownerUsername: string | null; reason: 'spam' | 'harassment' | 'ip' | 'explicit' | 'other';
  note: string | null; reporter: PersonRef; reportsCount: number; createdAt: string; status: 'open' | 'hidden' | 'suspended' | 'dismissed' };

type Suggestion = { kind: 'tag' | 'designer'; label: string; href: string; avatar?: PersonRef };
```

## 5. R2 endpoints

Every mutation below needs the session cookie **and** a same-origin `Origin` (403 `ORIGIN_REJECTED` otherwise) and returns 401/403 per §1 for visitors and pending users. Only endpoint-specific errors are listed.

### 5.1 Follows (S-03, FR-48, BR-56)
- **PUT / DELETE `/api/users/:username/follow`** → 200 `FollowState`. Set semantics. 403 `CANNOT_FOLLOW_SELF` · 404 unknown/suspended · 429 RL-SOCIAL. Members can follow teams.
- **GET `/api/users/:username/followers`**, **`/following`** `?cursor&limit` → list of `PersonCard`, newest first. Suspended people omitted. DB: `follows` keyset on (created_at, id).

### 5.2 Collections and Liked tab (S-02, P-03, P-04; BR-53…BR-55)
- **GET `/api/users/:username/collections`** → list of `CollectionSummary`, most recently updated first; the owner also sees private ones.
- **POST `/api/collections`** `{ name (1–60, trimmed), description? (≤ 300), isPrivate? }` → **201** `CollectionSummary` + `Location`. **409 `CONFLICT`** duplicate name (case-insensitive, per owner) · 422 `QUOTA_EXCEEDED` (100).
- **GET `/api/collections/:id`** → `CollectionDetail` (first 24 shots, newest save first). Private/hidden → **404** for everyone but the owner (staff see hidden).
- **PATCH `/api/collections/:id`** (owner) any of `{ name, description, isPrivate }` → `CollectionSummary`. Omitted fields are unchanged. Someone else's public collection → 403; private → 404.
- **DELETE `/api/collections/:id`** (owner) → `{ deleted: true }`; every shot's `saves_count` drops.
- **GET `/api/collections/:id/shots`** `?cursor&limit` → `ShotCard` list (eligible only).
- **PUT / DELETE `/api/collections/:id/shots/:shotId`** (owner) → `SaveResult`. Saving an ineligible shot → 404; full (1,000) → 422. Own shots may be saved. 429 RL-SOCIAL.
- **GET `/api/me/collections?shotId=`** → `SaveTarget[]` (save picker).
- **GET `/api/users/:username/likes`** `?cursor&limit` → `ShotCard` list, newest like first. **Owner only; anyone else 404.**

### 5.3 Comments (S-04, FR-49, FR-50; BR-48…BR-52)
- **GET `/api/shots/:id/comments`** `?cursor&limit` → `{ data: CommentThread, page }`. Top-level oldest first; replies nested oldest first. A deleted top-level comment with replies is a placeholder (`deleted: true`, empty body). Comments by suspended accounts and hidden comments are omitted (staff see hidden ones with `hidden: true`). Ineligible shot → 404.
- **POST `/api/shots/:id/comments`** `{ body (1–2,000 after normalising), parentId? }` → **201** `CommentDto`. A reply to a reply is attached to the top-level comment and prefixed `@username`. 403 **`COMMENTS_DISABLED`** · 404 parent missing · 429 RL-COMMENT. Optional `Idempotency-Key`.
- **PATCH `/api/comments/:id`** `{ body }` → `CommentDto` (author only, within 15 minutes; else 403).
- **DELETE `/api/comments/:id`** → `{ deleted: true, placeholder: boolean }` (author, shot author, team owner/admin, staff).
- **PUT / DELETE `/api/comments/:id/like`** → `{ liked, likesCount }`; own comment → 403 `CANNOT_LIKE_OWN`.
- **PUT `/api/shots/:id/comments-setting`** `{ disabled }` → `{ commentsDisabled }` (shot author or team owner/admin).
- Body rules: plain text; CR/LF normalised; control characters removed; at most 2 consecutive blank lines. **The client must render it as text** (auto-linking per BR-48 is a rendering concern).

### 5.4 Uploads (C-01, C-02, FR-61, FR-62; BR-61…BR-63, BR-66)
Three steps; the server never trusts the declared type or size.
1. **POST `/api/uploads`** `{ purpose: 'shot'|'avatar'|'logo', fileName, mimeType: 'image/jpeg'|'image/png'|'image/webp', size }` → **201** `UploadSlot`. Declared size over the limit (20 MB; logos 5 MB) → 422 `UNSUPPORTED_MEDIA`; other types → 400. 429 RL-UPLOAD.
2. Send the file to `uploadUrl`:
   - `provider: 'imagekit'` (`method: 'POST'`): multipart form with **every entry of `fields`** plus `file`. Read `fileId` from ImageKit's JSON response. The signature expires at `expiresAt` (30 min).
   - `provider: 'local'` (`method: 'PUT'`, development/test only): send the raw bytes as the body to `/api/uploads/:id/file`, with the session cookie and Origin. Returns `{ received }`.
3. **POST `/api/uploads/:id/complete`** `{ fileId? }` (required for ImageKit) → `UploadedMedia` with `status: 'ready'`, `palette` (≤ 7 hex) and `previewUrl`. Rejected (not JPEG/PNG/WebP by magic bytes, < 400×300 for shots, > 8,000 px per side, > 40 MP, > size limit) → **422 `UNSUPPORTED_MEDIA`** with `fields.file` stating the limit; the stored object is deleted and the upload becomes `failed`. Not uploaded yet → 409. A `fileId` that isn't this upload's file → 404. Repeat calls are idempotent.
- **GET `/api/uploads/:id`** → `UploadedMedia` (owner). **DELETE `/api/uploads/:id`** → `{ deleted: true }`; 409 while used by a shot, avatar or logo.
- Uploads not attached within 24 h are deleted by the daily job (BR-66). Avatars and logos may be small squares (min 100×100 and 64×64).

### 5.5 Shot composer (C-04, C-05, FR-63, FR-64, SD-05; BR-59, BR-64…BR-66)
- **POST `/api/shots`** `ShotDraftInput` → **201** `ShotDraft` (status `draft`). Title (1–100) and `categorySlug` are required even for drafts; tags ≤ 20 (BR-40: 2–30 letters/digits/spaces/hyphens, case-insensitive, de-duplicated); blocks ≤ 20; text block 1–5,000; alt ≤ 250. Image blocks must be the member's own **ready** `shot` uploads, each used by one shot only (409 otherwise). `teamUsername` must be a team the member belongs to (403). 422 `QUOTA_EXCEEDED` at 50 drafts. Optional `Idempotency-Key`.
- **PATCH `/api/shots/:id`** partial `ShotDraftInput` → `ShotDraft`. Author only (others 404). Omitted fields are unchanged; `blocks`/`tags` replace the whole list when present. A published shot keeps `publishedAt`, must keep ≥ 1 image, and its team cannot change (400). A new title changes `slug` (old URLs 308 to the canonical one).
- **POST `/api/shots/:id/publish`** → `ShotDraft` (`published`). Needs ≥ 1 image block whose media still exists; author must still belong to the team. **422 `QUOTA_EXCEEDED`** after 10 publishes per day (`retryAfter`). Repeating on a published shot returns it unchanged.
- **DELETE `/api/shots/:id`** → `{ deleted: true }` (author). 404 at once; likes, saves and comments are removed with their counters; purged with stored files after 30 days.
- **GET `/api/shots/:id/edit`** → `ShotDraft` (author only).
- **GET `/api/me/shots?status=draft|published&cursor&limit`** → `OwnShotRow` list, newest update first.
- **GET `/api/shots/:id/neighbours`** → `ShotNeighbours`: `prev` = next newer, `next` = next older among the owner's eligible shots (Work-tab order); ineligible ones are skipped.
- **DELETE `/api/shots/:id/team`** → `{ shotId, team: null }` (team owner/admin, BR-60).

### 5.6 Settings and account (A-07, P-06, FR-18, FR-19, FR-59; BR-22…BR-24, BR-78)
- **GET `/api/me/profile`** → `ProfileSettings`. **PATCH `/api/me/profile`** partial: `displayName` (BR-22) · `headline` ≤ 160 · `bio` ≤ 1,000 · `location` ≤ 120 · `websiteUrl` (http/https) · `publicEmail` · `skills` ≤ 20 · `languages` ≤ 10 (each ≤ 40, de-duplicated) · `socialLinks` ≤ 6, one per platform (`x, instagram, linkedin, github, behance, website, other`) · `avatarMediaId` (own ready `avatar` upload, or null). Empty strings clear a field. Renaming refreshes search.
- **POST `/api/onboarding/details`** `{ headline?, location?, intents?: ('share'|'discover'|'hire'|'find-work')[], skills?, avatarMediaId? }` → `ProfileSettings`.
- **GET `/api/me/account`** → `AccountSettings` (the sign-in email, to its owner only).
- **PUT `/api/me/username`** `{ username }` → `{ username, changedAt }`. Once per 30 days (422 `QUOTA_EXCEEDED` + `retryAfter`); the old name is held 30 days for this member; 422 `USERNAME_TAKEN`/`USERNAME_RESERVED`. Old profile URLs 404.
- **GET `/api/me/sessions`** → `SessionRow[]` (no IPs, no raw user agents). **DELETE `/api/me/sessions/:id`** (not the current one: 403). **POST `/api/me/sessions/revoke-others`** → `{ revoked }`.
- **POST `/api/me/email/code`** `{ email }` → `{ sent: true, expiresInSeconds: 600 }` (code to the **new** address; 429 per-email limits). **POST `/api/me/email`** `{ email, code }` → `{ email }`. Errors: 400 `INVALID_OTP` (message says attempts left) · 400 `OTP_EXPIRED` · 403 `TOO_MANY_ATTEMPTS` (5th wrong) · 409 address unavailable.
- **POST `/api/me/deletion/code`** → `{ sent: true, expiresInSeconds }` (to the sign-in email; 403 if the member owns a team). **POST `/api/me/deletion`** `{ code }` → `{ deleted: true, purgeAfterDays: 30 }`. All sessions end; the profile is 404 immediately; likes, follows, collections and comments are removed with counters; data is purged after 30 days.

### 5.7 Teams (P-05, FR-58; BR-57…BR-60)
- **POST `/api/teams`** `{ username, displayName }` → **201** `TeamMembership` (creator = owner). Username rules as onboarding; 422 at 10 teams.
- **GET `/api/me/teams`** → `TeamMembership[]` (composer team picker).
- **GET `/api/teams/:username`** → `TeamAdmin` (any member; non-member 403; not a team 404).
- **PATCH `/api/teams/:username/profile`** (owner/admin): body and rules as PATCH `/api/me/profile`. **PUT `/api/teams/:username/username`** (owner).
- **POST `/api/teams/:username/invitations`** `{ username, role?: 'member'|'admin' }` → **201** `{ id, username, role, createdAt, expiresAt }`. Admins invite members only; owner may invite admins. 404 unknown member · 409 already member/invited · 422 at 100 members (members + pending).
- **DELETE `/api/teams/:username/invitations/:id`** (owner/admin) → `{ revoked: true }`.
- **GET `/api/me/invitations`** → `TeamInvitation[]`. **POST `/api/me/invitations/:id/accept`** / **`/decline`** → `{ status }`. Expired or already answered → 409.
- **PATCH `/api/teams/:username/members/:member`** `{ role: 'admin'|'member' }` (owner). **DELETE `/api/teams/:username/members/:member`** → `{ removed, left }`: remove (owner any; admin members only) or leave (self). The owner cannot leave or be removed (403).
- **POST `/api/teams/:username/transfer`** `{ username }` (owner) → `{ owner }`; the previous owner becomes admin.
- **DELETE `/api/teams/:username`** (owner) → `{ deleted: true }`; team shots stay with their authors.

### 5.8 Jobs (J-01…J-03, FR-67…FR-70; BR-71…BR-75)
- **GET `/api/jobs`** `?q&specialty&location&remote&employment&cursor` → `JobSummary` list, active only, newest first, **20 per page**. `specialty` and `employment` repeat for multi-select (OR). `remote=true` with a location adds remote jobs; alone it lists remote jobs only. Unknown specialty/employment → 400.
- **POST `/api/jobs`** `{ title (5–100), descriptionHtml, location?, workplaceType, specialtySlug, employmentType, applyUrl (https:// or an email → mailto:), companyName (1–80), companyWebsite (https://), companyLogoMediaId? }` → **201** `JobDetail` + `Location: /jobs/:id-:slug`. The description is **sanitised on the server** (allow-list p, br, h2, h3, strong, em, ul, ol, li, a; h1→h2; links get `rel="nofollow noopener noreferrer" target="_blank"`) and must have 50–20,000 characters of text. 422 at 3 active jobs or 5 posts per day. Optional `Idempotency-Key`.
- **GET `/api/jobs/:id`** → `JobDetail`. Expired/closed jobs stay reachable with `applyUrl: null` and `noindex: true`. Hidden → 404 (except staff/poster).
- **PATCH `/api/jobs/:id`** full job body (poster, active only; 403 otherwise). Dates do not change. **POST `/api/jobs/:id/close`** → `JobDetail` (`closed`).
- **GET `/api/me/jobs`** → own jobs, every status. **GET `/api/specialties`** → `{ slug, name }[]` (9).
- `descriptionHtml` is already safe to render as HTML.

### 5.9 Reports and moderation (BR-68, BR-69, P09-30, P10-27)
- **POST `/api/reports`** `{ targetType: shot|comment|profile|collection|job, targetId, reason: spam|harassment|ip|explicit|other, note? (≤ 500, required for other) }` → **201** `{ status: 'created' }` or **200** `{ status: 'already-reported' }`. Own content → 403; unknown → 404; 429 RL-REPORT.
- **GET `/api/moderation/reports?status=open|hidden|suspended|dismissed&cursor`** (staff) → `ReportRow` list, one row per target, oldest first, 24 per page.
- **POST `/api/moderation/reports/:id/decision`** `{ action: hide|suspend|dismiss, reason (≥ 10) }` (staff) → `{ status, resolved }`; resolves every open report on that target; 409 if already handled.
- **POST `/api/moderation/actions`** `{ targetType, targetId, action: hide|unhide|suspend|unsuspend, reason }` (staff). Hide applies to shots, comments, collections and jobs; suspend applies to the target's owner (staff accounts excluded) and signs them out. Every action writes the audit log.

### 5.10 Search (D-08, FR-35)
- **GET `/api/search/designers?q&cursor`** → `PersonSummary` list + `term`. Username/name contains the term; prefix matches first, then followers, then shots. Suspended/deleted excluded.
- **GET `/api/search/suggest?q`** → `Suggestion[]`: nothing below 2 characters, at most 8, tags (with eligible shots) then designers, by prefix.

## 6. Frontend contract alignment (`src/services/contracts.ts`)

The frontend session drafted R2/R3 types in `src/services/contracts.ts` and switches features from mock to live with `NEXT_PUBLIC_API_LIVE` (`src/services/config.ts`). The backend follows those shapes wherever the requirements allow. **Differences the frontend must adopt:**

| Frontend type / field | Backend contract | Why |
|---|---|---|
| `UploadedMedia.mediaId: number`, `ShotDraftInput.blocks[].mediaId: number` | **string** (UUID) | Media ids are opaque strings since R1 (`media.id` TEXT). This also fixes the current type error in `src/components/composer/Composer.tsx` |
| `UploadSlot { uploadId, uploadUrl, token, expiresAt }` | adds `mediaId`, `provider`, `method`, `fields`, `maxBytes`; then **POST `/complete`** | ImageKit needs a signed multipart form; the server must verify the file after upload (BR-61/62) |
| `ShotDraft.previewBlocks: ComposerBlock[]` | `blocks[]` with `media: MediaRef \| null` | Composer UI state (`clientId`, `progress`) is client-only; build it from `blocks` |
| `ProfileSettings.availableForWork`, `DesignerCard.availableForWork` | **not supported** | Approved decision D-25d excludes the availability label in R1–R3 (FR-59 conflict, logged as A-26) |
| `ProfileSettings.avatarKey` (input) | input **`avatarMediaId`**; response has both `avatarMediaId` and `avatarKey` | The server checks ownership of the upload |
| `JobInput.companyLogoKey` | **`companyLogoMediaId`** | Same ownership check |
| `ProfileSocial.isBlocked`, `BlockedRow` | not yet (R3, BR-81) | Blocking is R3 |
| `ReportRow.targetId: number` | number ✔; adds `ownerUsername` | — |
| `CommentThread` | ✔ as `data`, with `page.nextCursor` beside it | Threads are paginated (24 top-level) |
| `CommentDto` | ✔ plus `parentId`, `hidden` | — |
| `CollectionDetail.shots` | ✔ first page plus `shotsNextCursor` | Large collections |
| `Suggestion.kind: 'term'` | not produced (tags and designers only) | FR-35 specifies tags and usernames |
| `OnboardingIntent` | ✔ same four values | FR-18 names two; logged A-24 for confirmation |
| `TeamAdmin.pending[]` | adds `id` and `expiresAt` | Needed to revoke an invitation |
| `SessionRow.location` | always `null` | No IP geolocation is stored (BR-30, BR-79) |
| `Paged<T> { items, nextCursor }` | HTTP list envelope `{ data, page: { nextCursor } }` | The client adapter maps it |
| Notifications, messaging, hire, services, blocks, unread counts | **not implemented** (R3) | §7 |

`lib/catalog.RELEASED` flags are owned by the frontend: the endpoints above are live regardless; the UI decides when to render each action (BR-45).

## 7. Not implemented yet (by design or pending)

- **R3:** notifications (BR-83), block (BR-81), messaging (BR-82), video/GIF teasers (BR-86, D-18), colour search (BR-80; palettes with Lab are already stored), hire directory and services (BR-84), sitemaps/JSON-LD, analytics events, cookie consent. Their endpoints arrive with their slices, following these conventions.
- **Later (payment approval):** orders, reviews, Pro, paid jobs, briefs, proposals, ads.
- **Accounts the user still has to enable:** Google sign-in (B-16), Resend email (B-09). ImageKit direct upload is implemented but **not yet exercised against the real ImageKit account** (see BACKEND_PROGRESS_REPORT §6).

## 8. Change log

| Date | Change | Breaking? |
|---|---|---|
| 2026-11-13 | v1.0: R1 endpoints E-01…E-19 | — |
| 2026-11-13 | v2.0: R2 endpoints E-20…E-60 added | No |
| 2026-11-13 | `ShotDetail` gains `savesCount, commentsCount, commentsDisabled, isSaved, isFollowingOwner`; `PublicProfile` gains `stats.followers, stats.following, isFollowing` | No (additive) |
| 2026-11-13 | `/api/cron/:job` gains `purge`; `cleanup`/`reconcile` results gain R2 keys | No |
| 2026-11-13 | Popular feeds rank with the R2 formula (BR-33) after the next daily run | No (ordering only) |
| 2026-11-13 | Usernames held after a change (BR-23) are reported as taken by E-12/E-13 | No |
