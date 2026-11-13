# Database Schema (R1 + R2, as implemented)

| Field | Value |
|---|---|
| Task | P03-03 |
| Version | 1.1 · 2026-11-13 |
| Source of truth | `src/server/db/schema/*.ts` (Drizzle) and `src/server/db/migrations/` (Drizzle Kit). This page is a reading aid; if they disagree, the code wins and this page is wrong |
| Migrations | `0000_init.sql` (generated: all tables, indexes, checks) · `0001_shots_fts.sql` (hand-written: FTS5 table + 3 triggers, ADR-001) · `0002_r2_social_content.sql` (generated, add-only: 12 tables, 6 columns, 1 index) |
| Drift check | 0002 generated from the schema on 2026-11-13; `npm run db:verify` on the local DB: 3 migrations, FTS triggers 3/3 |

Conventions: `ts` = `INTEGER` milliseconds UTC (`timestamp_ms`); `bool` = `INTEGER` 0/1; `json` = `TEXT` holding JSON; PK = primary key; UK = unique; FK = foreign key (`→ table.column`, delete action).

## 1. Auth (Better Auth 1.7.14 — owned by the library, ADR-003)

**user** — `id text PK` · `name text NOT NULL` · `email text NOT NULL UK` · `email_verified bool NOT NULL default 0` · `image text` · `created_at ts NOT NULL` · `updated_at ts NOT NULL`

**session** — `id text PK` · `expires_at ts NOT NULL` · `token text NOT NULL UK` · `created_at`, `updated_at ts NOT NULL` · `ip_address text` · `user_agent text` · `user_id text NOT NULL → user.id (cascade)` · index `session_user_id_idx(user_id)`

**account** — `id text PK` · `account_id text NOT NULL` · `provider_id text NOT NULL` · `user_id text NOT NULL → user.id (cascade)` · `access_token`, `refresh_token`, `id_token`, `scope`, `password text` · `access_token_expires_at`, `refresh_token_expires_at ts` · `created_at`, `updated_at ts NOT NULL` · index `account_user_id_idx`

**verification** — `id text PK` · `identifier text NOT NULL` · `value text NOT NULL` (hashed code) · `expires_at`, `created_at`, `updated_at ts NOT NULL` · index `verification_identifier_idx`

**rate_limit** — `id text PK` · `key text NOT NULL UK` · `count integer NOT NULL` · `last_request integer NOT NULL`

## 2. Identity and profiles (module `users`)

### profiles
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | integer | PK autoincrement | | |
| user_id | text | yes | | UK · → user.id (set null) · NULL for teams |
| kind | text `individual`\|`team` | no | `individual` | |
| username | text | no | | UK · CHECK lower-case |
| display_name | text | no | | 1–50 (validated in service, BR-22) |
| headline, bio, location, website_url, public_email | text | yes | | public_email shown only if set (BR-78) |
| avatar_media_id | text | yes | | → media.id (set null) |
| skills, languages | json `string[]` | no | `[]` | |
| role | text `member`\|`moderator`\|`admin` | no | `member` | granted by operator only (BR-67) |
| is_featured_studio | bool | no | 0 | |
| shots_count, likes_received_count, followers_count, following_count | integer | no | 0 | counter caches, CHECK ≥ 0 |
| suspended_at, deleted_at | ts | yes | | |
| created_at, updated_at | ts | no | | |

Checks: `profiles_counters_nonneg`, `profiles_username_lower`, `profiles_team_no_user`.

**user_social_links** — `id integer PK` · `profile_id integer NOT NULL → profiles.id (cascade)` · `platform text` (`x`,`instagram`,`linkedin`,`github`,`behance`,`website`,`other`) · `url text NOT NULL` · `position integer default 0` · UK `(profile_id, platform)`

**team_memberships** — PK `(team_id, member_id)` both `→ profiles.id (cascade)` · `role text` (`owner`,`admin`,`member`, default `member`) · `created_at ts` · index `team_memberships_member_idx(member_id)`

## 3. Content (modules `media`, `shots`, `search`)

**media** — `id text PK` · `owner_profile_id integer → profiles.id (cascade)` · `kind text` (`image`) · `storage_key text NOT NULL UK` · `mime_type text` · `width`, `height`, `bytes integer NOT NULL` · `dominant_color text` · `status text` (`pending`,`ready`,`failed`; default `pending`) · `created_at ts` · index `media_owner_idx`

**categories** — `id integer PK` (fixed 1–8) · `slug text UK` · `name text` · `position integer`. Rows come from `lib/catalog.ts` via `ensureReferenceData` (seed and tests).

### shots
| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | integer | PK autoincrement | | numeric URL id (BR-42) |
| author_id | integer | no | | → profiles.id (cascade) |
| team_id | integer | yes | | → profiles.id (set null) |
| title | text | no | | CHECK length 1–100 |
| slug | text | no | | from title (BR-42) |
| description | text | yes | | |
| category_id | integer | no | | → categories.id |
| cover_media_id | text | yes | | → media.id (set null) |
| status | text `draft`\|`published` | no | `draft` | CHECK published ⇒ published_at |
| published_at | ts | yes | | |
| comments_disabled | bool | no | 0 | R2 |
| likes_count, saves_count, comments_count, views_count | integer | no | 0 | CHECK ≥ 0 |
| popularity_score | real | no | 0 | BR-33, recomputed by cron |
| search_tags, search_author | text | no | `''` | denormalised FTS inputs |
| hidden_at, deleted_at | ts | yes | | moderation / soft delete |
| created_at, updated_at | ts | no | | |

Indexes: `shots_recent_idx(status, published_at, id)` · `shots_popular_idx(status, popularity_score)` · `shots_cat_recent_idx(category_id, status, published_at)` · `shots_cat_popular_idx(category_id, status, popularity_score)` · `shots_author_idx(author_id, published_at)` · `shots_team_idx(team_id, published_at)`.

**content_blocks** — `id integer PK` · `shot_id → shots.id (cascade)` · `position integer` · `type text` (`image`,`text`) · `media_id → media.id (set null)` · `text_body text` · `alt text` · `is_full_width bool` · UK `(shot_id, position)` · CHECK `content_blocks_shape`

**shot_colors** — PK `(shot_id, position)` · `shot_id → shots.id (cascade)` · `hex text` · `lab_l`, `lab_a`, `lab_b real`

**tags** — `id integer PK` · `name text UK` · `slug text UK` · `shots_count integer default 0 CHECK ≥ 0`

**shot_tags** — PK `(shot_id, tag_id)` · both FK cascade · index `shot_tags_tag_idx(tag_id, shot_id)`

**shots_fts** (migration 0001) — `CREATE VIRTUAL TABLE shots_fts USING fts5(title, description, tags, author, content='shots', content_rowid='id', tokenize='unicode61 remove_diacritics 2', prefix='2 3')` with triggers `shots_fts_ai`, `shots_fts_ad`, and `shots_fts_au` (fires only when an indexed column changes, so counter updates do not rewrite the index). **Any migration that rebuilds `shots` must recreate the triggers**; `tests/integration/migrations.test.ts` checks they exist and work.

## 4. Social and platform (modules `likes`, `views`, `moderation`, infra)

**likes** — PK `(profile_id, shot_id)` · both FK cascade · `created_at ts` · index `likes_shot_idx(shot_id, created_at)`

**view_dedup** — PK `(viewer_key, shot_id, day)` · `shot_id → shots.id (cascade)` · `day text` (UTC `YYYY-MM-DD`) · `created_at ts` · index `view_dedup_created_idx`

**shot_view_daily** — PK `(shot_id, day)` · `views integer default 0`

**app_rate_limits** — `key text PK` (`class:subject:windowMs`) · `count integer` · `expires_at integer` · index `app_rate_limits_expires_idx`

**moderation_actions** — `id integer PK` · `actor_profile_id → profiles.id (set null)` · `actor_label text NOT NULL` · `target_type text` (`profile`,`shot`,`comment`,`collection`,`job`) · `target_id text` · `action text` (`suspend`,`unsuspend`,`hide`,`unhide`,`grant_role`,`revoke_role`,`set_featured`,`unset_featured`,`delete_account`) · `reason text CHECK length ≥ 10` · `created_at ts` · index `moderation_target_idx(target_type, target_id)`

## 4b. R2 additions (migration `0002_r2_social_content`, add-only)

**Columns added**
- `profiles.username_changed_at ts` (BR-23) · `profiles.intents json NOT NULL default '[]'` (FR-18)
- `media.purpose text NOT NULL default 'seed'` (`shot` | `avatar` | `logo` | `seed`) · `media.provider_file_id text` (ImageKit fileId) · `media.palette json` (hex list, BR-63) · `media.failure_reason text`
- index `likes_profile_recent_idx(profile_id, created_at)` (Liked tab)

**follows** (module `follows`) — `follower_id integer NOT NULL → profiles.id (cascade)` · `followee_id integer NOT NULL → profiles.id (cascade)` · `created_at ts NOT NULL` · PK (follower_id, followee_id) · CHECK `follows_not_self` (follower_id <> followee_id) · indexes `follows_followee_idx(followee_id, created_at)`, `follows_follower_idx(follower_id, created_at)`

**collections** (module `collections`) — `id integer PK autoincrement` · `owner_id integer NOT NULL → profiles.id (cascade)` · `name text NOT NULL` · `name_key text NOT NULL` (lower(name)) · `description text` · `is_private bool NOT NULL default 0` · `shots_count integer NOT NULL default 0` · `hidden_at ts` · `created_at`, `updated_at ts NOT NULL` · UK `collections_owner_name_uq(owner_id, name_key)` · index `collections_owner_idx(owner_id, updated_at)` · CHECKs: name length 1–60, description ≤ 300, shots_count ≥ 0

**collection_items** — `collection_id integer NOT NULL → collections.id (cascade)` · `shot_id integer NOT NULL → shots.id (cascade)` · `created_at ts NOT NULL` · PK (collection_id, shot_id) · indexes `collection_items_shot_idx(shot_id)`, `collection_items_recent_idx(collection_id, created_at)`

**comments** (module `comments`) — `id integer PK autoincrement` · `shot_id integer NOT NULL → shots.id (cascade)` · `author_id integer NOT NULL → profiles.id (cascade)` · `parent_id integer → comments.id (cascade)` · `body text NOT NULL` · `likes_count integer NOT NULL default 0` · `edited_at`, `hidden_at`, `deleted_at ts` · `created_at ts NOT NULL` · indexes `comments_thread_idx(shot_id, parent_id, created_at)`, `comments_author_idx(author_id)` · CHECKs: body length 1–2,000 unless `deleted_at` is set; likes_count ≥ 0

**comment_likes** — `profile_id integer NOT NULL → profiles.id (cascade)` · `comment_id integer NOT NULL → comments.id (cascade)` · `created_at ts NOT NULL` · PK (profile_id, comment_id) · index `comment_likes_comment_idx(comment_id)`

**team_invitations** (module `teams`) — `id integer PK autoincrement` · `team_id`, `invitee_id integer NOT NULL → profiles.id (cascade)` · `invited_by_id integer → profiles.id (set null)` · `role text NOT NULL default 'member'` (`admin` | `member`) · `status text NOT NULL default 'pending'` (`pending` | `accepted` | `declined` | `revoked`) · `expires_at ts NOT NULL` · `responded_at ts` · `created_at ts NOT NULL` · **partial UK** `team_invitations_pending_uq(team_id, invitee_id) WHERE status = 'pending'` · index `team_invitations_invitee_idx(invitee_id, status)`

**username_holds** (module `users`) — `username text PK` · `profile_id integer NOT NULL → profiles.id (cascade)` · `expires_at ts NOT NULL` · index `username_holds_expires_idx`

**specialties** (reference data, module `jobs`) — `id integer PK` · `slug text NOT NULL UK` · `name text NOT NULL` · `position integer NOT NULL` (9 rows from `lib/catalog.SPECIALTIES`)

**companies** (module `jobs`) — `id integer PK autoincrement` · `owner_profile_id integer NOT NULL → profiles.id (cascade)` · `name text NOT NULL` (CHECK 1–80) · `name_key text NOT NULL` · `website_url text NOT NULL` · `logo_media_id text → media.id (set null)` · `created_at`, `updated_at ts NOT NULL` · UK `companies_owner_name_uq(owner_profile_id, name_key)`

**jobs** (module `jobs`) — `id integer PK autoincrement` · `poster_id integer NOT NULL → profiles.id (cascade)` · `company_id integer NOT NULL → companies.id` · `specialty_id integer NOT NULL → specialties.id` · `title text NOT NULL` (CHECK 5–100) · `slug text NOT NULL` · `description_html text NOT NULL` (sanitised) · `description_text text NOT NULL` · `location text` · `workplace_type text NOT NULL` (`remote` | `on-site` | `hybrid`) · `employment_type text NOT NULL` (`full-time` | `freelance-contract`) · `apply_url text NOT NULL` · `published_at`, `expires_at ts NOT NULL` · `closed_at`, `hidden_at`, `deleted_at ts` · `created_at`, `updated_at ts NOT NULL` · indexes `jobs_board_idx(expires_at, published_at)`, `jobs_specialty_idx(specialty_id, published_at)`, `jobs_poster_idx(poster_id, published_at)`

**reports** (module `moderation`) — `id integer PK autoincrement` · `reporter_id integer NOT NULL → profiles.id (cascade)` · `target_type text NOT NULL` (`shot` | `comment` | `profile` | `collection` | `job`) · `target_id text NOT NULL` · `reason text NOT NULL` (`spam` | `harassment` | `ip` | `explicit` | `other`) · `note text` (CHECK ≤ 500) · `status text NOT NULL default 'open'` (`open` | `hidden` | `suspended` | `dismissed`) · `resolved_by_id integer → profiles.id (set null)` · `resolved_at ts` · `created_at ts NOT NULL` · UK `reports_reporter_target_uq(reporter_id, target_type, target_id)` · indexes `reports_queue_idx(status, created_at)`, `reports_target_idx(target_type, target_id)`

**idempotency_keys** (infra, `src/server/idempotency.ts`) — `actor_profile_id integer NOT NULL → profiles.id (cascade)` · `scope text NOT NULL` · `key text NOT NULL` · `status integer NOT NULL` · `result json` · `expires_at integer NOT NULL` · PK (actor_profile_id, scope, key) · index `idempotency_expires_idx`

**moderation_actions** — `target_type` now also takes `comment`, `collection`, `job` (TEXT column; TypeScript enum widened, no migration needed).

## 5. Migration rules (ADR-001, F-12)

- `npm run db:generate` (drizzle-kit generate) then `npm run db:migrate`. **`drizzle-kit push` is forbidden** on any persistent database: it drops FTS objects and silently loses triggers.
- FTS objects live only in hand-written migrations; Drizzle schema files never declare them.
- Local reset: `npm run db:reset` (deletes the local file DB, migrates, seeds). Refuses non-file URLs.
- Tests create a fresh migrated database per test file (`tests/setup/env.ts`).
