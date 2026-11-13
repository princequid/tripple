# Reverse Engineering → Backend Mapping

| Field | Value |
|---|---|
| Version | 1.1 · 2026-11-13 (R2 backend implemented) |
| Purpose | Trace every reverse-engineered feature, observed endpoint and entity to what implements it (table, service, endpoint, page, test), and record each deliberate deviation |
| Sources | [RE 05 API inventory](../reverse-engineering/05-api-inventory.md) · [RE 06 database](../reverse-engineering/06-database-design.md) · [RE 08 features](../reverse-engineering/08-feature-breakdown.md) · [FEATURE_INVENTORY](../01-requirements/FEATURE_INVENTORY.md) (release per feature) |

Legend — **Done**: implemented and tested · **Partial**: implemented with a noted gap · **Planned**: later release · **Blocked**: waiting on a blocker ID.

## 1. Features (R1 and R2 in full; R3 summarised)

| RE feature | Requirement | Tables | Service functions | Endpoints | Pages / components | Tests | Status |
|---|---|---|---|---|---|---|---|
| F-01 Repo, env | FR-07 | — | `server/env` | — | — | build + typecheck | Partial (no lint/CI yet) |
| F-02 Tokens/primitives | FR-03 | — | — | — | `design-system/` imported in root layout | visual (manual) | Done (foundation) |
| F-03 App shell | FR-01, FR-02 | — | `auth.getViewer` | E-11 | SiteHeader, SiteFooter, AccountMenu | J1, J5 | Partial (no mobile drawer) |
| F-04 Schema, migrations, seed | FR-06 | all R1 | `server/db/*`, `scripts/seed.ts` | — | — | migrations.test | Done |
| F-05 API skeleton | FR-07 | `app_rate_limits` | `server/route`, `http`, `errors`, `rate-limit`, `log` | E-01 | — | server.test, api.spec | Done |
| A-01 Email code sign-in | FR-10…12, FR-20 | `user`, `verification`, `rate_limit` | Better Auth + `before` hook | E-15, E-16 | `/login`, `/signup`, SignInFlow | api.spec, J5, J6 | Done |
| A-02 Google sign-in | FR-13 | `account` | Better Auth social provider | E-18 | Google button (hidden) | — | Blocked (B-16) |
| A-03 Sessions, logout | FR-14 | `session` | `auth.getViewer`, `revokeAllSessions` | E-11, E-17 | AccountMenu | api.spec, J5 | Done |
| A-04 Auth gate with intent/returnTo | FR-15 | — | `lib/return-to` | — | Like → `/login?returnTo&intent` | lib.test, J5, J6 | Partial (page, not modal) |
| A-05 Route guards | FR-16 | — | `(site)` layout BR-16 redirect, `/onboarding` guards | — | layouts | J5 | Done |
| A-06 Onboarding (minimal) | FR-17 | `profiles` | `users.checkUsername`, `suggestUsername`, `completeOnboarding` | E-12, E-13 | `/onboarding`, OnboardingForm | users-moderation.test, api.spec, J5 | Done |
| D-01 Feed + grid + infinite scroll | FR-22, FR-23 | `shots`, `media`, `profiles` | `feed.list` | E-02 | FeedView, ShotGrid | feed-search.test, api.spec, J1, J3 | Done |
| D-02 Shot card | FR-24, FR-30 | — | `shots.toCard` | — | ShotCard | J1 | Done |
| D-03 Filter bar | FR-25 | `categories` | `feed.normaliseQuery` | E-02 | FilterBar | J1 | Partial (tag filter via /tags, not in bar) |
| D-04 Popularity + timeframes | FR-27, FR-28 | `shots.popularity_score` | `shots.recomputePopularity`, `feed.list` | E-02, E-14 | timeframe radios | feed-search.test | Done (simple score, BR-33) |
| D-06 Search | FR-31, FR-32 | `shots_fts`, `tags` | `search.searchShots`, `relatedTags` | E-07, E-19 | `/search/:term`, SearchForm | feed-search.test, api.spec, J3 | Done |
| D-07 Tag pages | FR-33, FR-34 | `tags`, `shot_tags` | `search.tagIndex`, `tagPage` | E-08 | `/tags`, `/tags/:tag` | feed-search.test, api.spec, J1 | Done |
| D-09 Homepage | FR-21 | — | `feed.homepage` | E-02 | `/` | J1 | Done |
| D-10 View logging | FR-29 | `view_dedup`, `shot_view_daily` | `views.record` | E-06 | ViewBeacon | likes-views.test, api.spec, J4 | Done |
| D-11 SEO basics | FR-87 | — | — | — | `generateMetadata`, `robots.ts`, canonical | — | Partial (no JSON-LD/sitemaps: R3) |
| SD-01 Shot page | FR-37, FR-38 | `shots`, `content_blocks`, `shot_colors` | `shots.getDetail` | E-03 | `/shots/:id-:slug` | feed-search.test, J1, J2 | Done |
| SD-02 Action rail, share, details | FR-39, FR-40 | — | — | — | ShareButton, details section | J1 | Partial (details inline, no modal) |
| SD-04 More by / related | FR-41 | `shot_tags` | `feed.moreBy`, `feed.related` | — | detail page sections | feed-search.test, J1 | Done |
| SD-06 Mobile shot layout | FR-42 | — | — | — | rail below media < 1280 px | J8 | Done |
| S-01 Likes | FR-45 | `likes` | `likes.setLike`, `likedAmong` | E-04, E-05 | LikeButton | likes-views.test, api.spec, J5, J6 | Done |
| P-01 Profile Work tab | FR-54 | `profiles`, `shots` | `users.getPublicProfile`, `feed.byProfile` | E-09, E-10 | `/:username` | api.spec, J1 | Done |
| P-02 About tab | FR-55 | `profiles`, `user_social_links`, `team_memberships` | `users.getPublicProfile` | E-09 | `/:username/about` | users-moderation.test, J1 | Done |
| X-02 Simple 404 | FR-05 | — | — | — | `not-found.tsx` | J2, J7 | Done |
| NX-05 Moderation (minimal) | FR-09 | `moderation_actions` | `moderation.*` | `npm run moderate` | staff alerts on detail/profile | users-moderation.test, CLI smoke | Done |
| NX-06 Legal pages | FR-04 | — | — | — | `/terms` `/privacy` `/cookies` `/about` `/contact` | J7 | Partial (placeholder text, OQ-03) |
| A-06 Onboarding (full, R2) | FR-18 | `profiles.intents`, `skills` | `account.onboardingDetails` | E-45 | (frontend session) | account.test | Done (backend) |
| A-07 Settings, email change, sessions, deletion | FR-19, BR-23, BR-24 | `profiles`, `username_holds`, `session`, `verification`, `user` | `account.*`, `auth.listSessions`, `auth.sendStepUpCode/verifyStepUpCode` | E-46…E-50 | (frontend) | account.test | Done (backend) |
| C-01 Uploads | FR-61, BR-61, BR-62, BR-66 | `media` (+ purpose, provider_file_id) | `media/uploads.create/receiveLocal/complete/remove/purgeUnattached`, `server/storage` | E-33…E-36 | (frontend) | uploads.test, api-r2.test | Done (local provider tested; ImageKit path unit-tested only, see progress report §6) |
| C-02 Image pipeline | FR-62, BR-63 | `media.palette`, `dominant_color`; `shot_colors` (Lab) at publish | `storage/image.inspect`, `colours`, `hexToLab` | E-35 | — | uploads.test | Done (ImageKit renders variants by URL) |
| C-04 Shot composer | FR-63, BR-40, BR-59, BR-64 | `shots`, `content_blocks`, `shot_tags`, `tags` | `composer.create/update/getForEdit` | E-37…E-39 | (frontend) | composer.test, api-r2.test | Done (backend) |
| C-05 Draft / publish / delete | FR-64, BR-65, BR-66 | as above + `shot_colors` | `composer.publish/remove/listOwn/purgeDeleted` | E-38, E-40, E-41 | (frontend) | composer.test | Done (backend) |
| D-04 Popularity (full) | FR-27, BR-33 | `shots.popularity_score` | `shots.popularityScore` (R2 formula), `recomputePopularity` | E-14 | — | search-r2.test | Done |
| D-08 Header search types + autocomplete | FR-35 | `profiles`, `tags` | `search.searchDesigners`, `search.suggest` | E-60 | (frontend) | search-r2.test, api-r2.test | Done (backend) |
| SD-03 Palette display | FR-43 | `shot_colors` | `shots.getDetail` (palette) | E-03 | (frontend) | composer.test | Done (data) |
| SD-05 Prev / next | FR-44 | `shots` | `shots.neighbours` | E-42 | (frontend) | composer.test | Done (backend) |
| S-02 Collections + save | FR-46, FR-47, BR-53…BR-55 | `collections`, `collection_items`, `shots.saves_count` | `collections.*` | E-22, E-24…E-28 | (frontend) | collections.test, api-r2.test | Done (backend) |
| S-03 Follows | FR-48, BR-56 | `follows`, `profiles.followers/following_count` | `follows.*` | E-20, E-21 | (frontend) | follows.test, api-r2.test | Done (backend) |
| S-04 Comments | FR-49, FR-50, BR-48…BR-52 | `comments`, `comment_likes`, `shots.comments_count/comments_disabled` | `comments.*` | E-29…E-32 | (frontend) | comments.test, api-r2.test | Done (backend) |
| P-03 Collections tab | FR-56 | as S-02 | `collections.listForProfile/detail` | E-22, E-25 | (frontend) | collections.test | Done (backend) |
| P-04 Liked Shots tab | FR-57 | `likes` | `likes.likedShots` | E-23 | (frontend) | collections.test | Done (backend) |
| P-05 Teams | FR-58, BR-57…BR-60 | `profiles` (team), `team_memberships`, `team_invitations` | `teams.*` | E-43, E-51…E-56 | (frontend) | teams.test | Done (backend) |
| P-06 Profile edit | FR-59 | `profiles`, `user_social_links` | `account.updateProfileSettings`, `users.applySettings` | E-44 | (frontend) | account.test, api-r2.test | Done (backend; no "available for work", A-26) |
| J-01…J-03 Jobs board | FR-67…FR-70, BR-71…BR-75 | `jobs`, `companies`, `specialties` | `jobs.*`, `server/sanitize` | E-57 | (frontend) | jobs.test, api-r2.test | Done (backend) |
| NX-05 Moderation (R2 reports + queue) | FR-90, BR-68, BR-69 | `reports`, `moderation_actions` | `moderation/reports.report/queue/decide/act` | E-58, E-59 | (frontend) | reports.test, api-r2.test | Done (backend) |
| R3 features (C-03, D-05, S-05…S-07, P-07, H-01, M-01, X-03, X-05) | | designed: DATABASE_DESIGN §5.5 | | | | | Planned |
| R3 features (C-03, D-05, S-05…S-07, P-07, H-01, M-01, X-03, X-05) | | designed: DATABASE_DESIGN §5 | | | | | Planned |

## 2. Observed endpoints (RE doc 05) → clone endpoints

The reference serves HTML fragments with page-number pagination; the clone uses a JSON API with signed cursors (RE doc 05 note; A-01).

| # | Observed | Clone | Change |
|---|---|---|---|
| 1–4 | GET `/shots/popular[/:category]`, `/shots/recent` (`page`, `per_page`, HTML) | GET `/api/shots?sort&category&timeframe&cursor&limit` (JSON) | Cursor instead of page numbers (BR-35); one parameter convention |
| 2 | `served_shot_ids[]` de-dup | Keyset cursor + client de-dup by id | Stable ordering makes de-dup unnecessary server-side |
| 7 | `/screenshot_boost` (ads) | — | Not built (B-03, payments) |
| 8 | POST `/shots/log_views` (batched ids in viewport) | POST `/api/views` `{shotId}` from the detail page only | Views = detail opens (A-14); no impression counting |
| 9, 10 | `/client_app/events`, `/client_app/search_results` | — | R3 first-party analytics (X-03) |
| 11 | GET `/shots/:id/more_by` | `feed.moreBy` in the page render | No separate request (NFR-09) |
| 12 | GET `/shots/:id/similar` | `feed.related` in the page render | Selection rules BR-43 |
| 13 | GET `/signups/new?intent&return_to` (modal HTML) | `/login?returnTo&intent&target` page | Relative returnTo only (BR-14) |
| 14 | GET `/:username?page` | GET `/api/users/:username/shots` | |
| 15, 16 | profile collections / reviews pagination | — | R2 / Later |
| 17–19 | `/hire`, `/services` pagination | — | R3 |
| 20 | GET `/client_app/users` (isLoggedIn, geo country) | GET `/api/me` | No geo-IP |
| 23 | `/colors/for_404.json` | — | R3 mosaic |
| F1, F2 | send OTP forms (`login` = email or username, reCAPTCHA) | POST `/api/auth/email-otp/send-verification-otp` | Email only (BR-09); no reCAPTCHA (rate limits, A-18) |
| F3 | GET `/shots/popular?tag&color&timeframe` | `timeframe` supported; `tag` via `/tags/:tag`; `color` R3 | |
| — | Like / save / follow / comment (not inspected, auth) | PUT/DELETE `/api/shots/:id/like` (R1); `/api/users/:u/follow`, `/api/collections/:id/shots/:shotId`, `/api/comments/:id/like` (R2) | Set semantics |

## 3. Entities (RE doc 06) → tables

| RE entity | Table(s) | Release | Note |
|---|---|---|---|
| User (individual/team) | `user` + `profiles` | R1 | Split identity/profile (DATABASE_DESIGN §6) |
| Profile details | `profiles` columns, `user_social_links` | R1 | skills/languages as JSON |
| TeamMembership | `team_memberships` | R1 (read) / R2 (manage) | |
| Shot, ContentBlock, Media, ShotColor | `shots`, `content_blocks`, `media`, `shot_colors` | R1 | |
| Category | `categories` | R1 | 8 fixed |
| Tag / ShotTag | `tags`, `shot_tags` | R1 | |
| Like | `likes` | R1 | |
| ShotView | `view_dedup`, `shot_view_daily` | R1 | No raw views table |
| OtpCode, Session, OAuthAccount | `verification`, `session`, `account` | R1 | Better Auth |
| Comment, Collection(Item), Follow, Job, Company, Specialty | `comments`, `comment_likes`, `collections`, `collection_items`, `follows`, `jobs`, `companies`, `specialties` | R2 (implemented) | DATABASE_DESIGN §5; one specialty per job (BR-71) |
| (clone) Report, team invitation, username hold, idempotency key | `reports`, `team_invitations`, `username_holds`, `idempotency_keys` | R2 (implemented) | BR-69, BR-58, BR-23, API conventions §5 |
| Block, Notification, MessageThread/Message, Service | planned | R3 | |
| Review, ProjectBrief, Proposal, Subscription, Rebound, Playoff, Story | — | Later | Need scope/payment decisions |

## 4. Deviations from the reverse-engineered behaviour

| Observed | Clone | Decision |
|---|---|---|
| Rails HTML partials | JSON Route Handlers + Server Components | A-01, A-20 |
| Sign in with email **or username** | Email only | BR-09, D-03 |
| reCAPTCHA + AWS WAF | Per-email + per-IP database rate limits | A-18 (Turnstile dropped) |
| Auth gate as a modal that does not close on Escape | Login page with returnTo/intent (modal is a P10 gap) | A-13, FR-15 |
| Page-number pagination, 404 at the end | Signed cursors, `nextCursor: null` at the end | BR-35 |
| "Dribbble Select", Pro badge, boosted shots, ads | Featured Studio flag; no Pro/ads | X-10, payments Later |
| Impression-based view logging | Detail-page views, once per viewer per day | A-14, BR-29…31 |
| CDN on-the-fly resize | ImageKit URL transforms (prod), pre-rendered seed files (dev) | A-19 |

## 5. R2 deviations and clone decisions (2026-11-13)

| Topic | Reverse engineering / requirement | Implemented | Record |
|---|---|---|---|
| Self-follow status | FR-48 / BR-56 say 400 | 403 `CANNOT_FOLLOW_SELF` (the conventions table maps the code to 403) | A-28 |
| "Available for work" | FR-59 lists the flag | Not implemented: D-25d (approved) excludes it in R1–R3 | A-26 |
| Onboarding intents | FR-18 names "share work" and "hire designers" | 4 values (`share`, `discover`, `hire`, `find-work`) to match the frontend design | A-24 (confirm) |
| Avatar / logo minimum size | BR-62 (400 × 300) written for shot images | 100 × 100 avatars, 64 × 64 logos; shots keep 400 × 300 | A-25 |
| Upload transport | BR-62/63 written for R2 presigned PUT + sharp derivatives | ImageKit signed direct upload + server read-back validation; variants by URL transformation (A-19) | A-29 |
| Team after publish | Not specified | A published shot's team cannot change (removal only, BR-60) | A-30 |
| Draft minimum | BR-64 rules apply at publish | Drafts need title + category; images and block rules at publish | A-30 |
| Comments by suspended accounts | Not specified (BR-25 covers shots) | Hidden from threads and totals while suspended | A-30 |
| Job specialty | RE doc 06 `job_specialties` N–M | Exactly one specialty column (BR-71) | DATABASE_DESIGN §6 |
