# Backend Progress Report

| Field | Value |
|---|---|
| Date | 2026-11-13 (second backend session of the day) |
| Phase | Backend foundation verified; **R2 backend implemented** (A-22: backend and frontend now run as separate sessions) |
| Scope | R1 (complete, re-verified) + R2 backend: follows, collections + Liked tab, comments, uploads, shot composer, prev/next, settings/account, teams, jobs, reports/moderation queue, designer search + autocomplete, R2 popularity, purge jobs |
| Contract for the frontend | [API_SPECIFICATION v2.0](../04-api/API_SPECIFICATION.md) §4–§6 |

## 1. Summary

The R1 foundation was re-verified: typecheck, migrations, local database checks and the full test suites were run, not assumed. On top of it, the complete **R2 backend** is now implemented: 12 new tables (one add-only migration), 9 new or extended modules and **52 new Route Handlers** (71 in total). Every operation has validation, authorisation, rate limits or quotas, atomic counter updates and tests. **Vitest: 20 files, 185 tests pass. Playwright (R1 API + journeys): 25/25 pass. `next build` passes.** The frontend session can switch each feature from its mock store to the live API by following API_SPECIFICATION §6.

## 2. Foundation status found at the start (verified, not assumed)

| Area | Finding | Action |
|---|---|---|
| Next.js server architecture, Route Handlers, error model | Present and consistent (`route()` wrapper, problem details, origin check) | Kept; extended (`parseId`, `validate`, idempotency) |
| Turso / Drizzle / migrations | 2 migrations; FTS5 + triggers; reference data | `npm run db:verify` passes on the local DB (FKs enforced, atomic batches, FTS5, triggers 3/3). **The script had no npm entry** → `db:verify` added |
| Remote Turso | Credentials present in `.env.local` (commented out); the previous session recorded a successful remote check in `client.ts` | Not re-run this session (it writes temporary tables to the remote DB); B-15 is effectively resolved by the user |
| ImageKit | `IMAGEKIT_PUBLIC_KEY`/`PRIVATE_KEY` present with the right prefixes (values never printed) | Upload signing implemented; **no live upload performed** (§6) |
| Auth | Better Auth email code, sessions, guards, suspension hook | Kept; step-up codes, session list/revoke, email change added |
| TypeScript | `tsc --noEmit` passes | Still passes (whole repo, including the frontend's files at the time of the last run) |
| Tests | Vitest 104/104 when run from PowerShell. From Git Bash every file fails with "Vitest failed to find the runner" — an environment quirk of that shell, not a project defect | All test runs in this session use PowerShell; recorded in API_TESTING_PLAN §2 |
| Dependencies | `sharp` was a devDependency although R2 needs it at runtime | Moved to dependencies (A-27) |

## 3. Built in this session

| Slice | Tables / columns | Service | Endpoints | Tests |
|---|---|---|---|---|
| Migration 0002 (add-only) | 12 tables, 6 columns, 1 index; `specialties` reference data | — | — | migrations.test, db:verify |
| Infrastructure | `idempotency_keys` | `server/idempotency`, `server/validation`, `server/storage` (+ `image`), `server/sanitize`, `server/db/eligibility`, R2 rate-limit classes + quotas | — | all suites |
| Follows (S-03) | `follows` | `follows.*` | E-20, E-21; profile `isFollowing`, follower stats | follows.test (6) |
| Collections + Liked tab (S-02, P-03, P-04) | `collections`, `collection_items` | `collections.*`, `likes.likedShots` | E-22…E-28 | collections.test (8) |
| Comments (S-04) | `comments`, `comment_likes` | `comments.*` | E-29…E-32 | comments.test (11) |
| Shot detail extras | — | `shots.getDetail` (+ saves, comments, isSaved, isFollowingOwner), `shots.neighbours` | E-03 (additive), E-42 | composer.test |
| Uploads (C-01, C-02) | `media` + purpose, provider id, palette | `media/uploads.*`, storage providers `local` / `imagekit` | E-33…E-36 | uploads.test (8) |
| Composer (C-04, C-05) | writes `shots`, blocks, tags, colours | `composer.*` | E-37…E-41, E-43 | composer.test (7) |
| Settings / account (A-07, P-06, FR-18) | `username_holds`, `profiles.intents/username_changed_at` | `account.*`, `users.applySettings/changeUsername`, auth step-up codes + sessions | E-44…E-50 | account.test (7) |
| Teams (P-05) | `team_invitations` | `teams.*` | E-51…E-56 | teams.test (5) |
| Jobs (J-01…J-03) | `jobs`, `companies`, `specialties` | `jobs.*` (sanitised HTML) | E-57 | jobs.test (6) |
| Reports + queue (P09-30) | `reports` | `moderation/reports.*` | E-58, E-59 | reports.test (4) |
| Header search (D-08) | — | `search.searchDesigners`, `search.suggest` | E-60 | search-r2.test (4) |
| Popularity R2 + jobs | — | BR-33 R2 formula; `platform.purge`; cleanup/reconcile extended | E-14 (`purge`) | search-r2.test |
| HTTP contracts | — | — | real session cookie, origin, envelopes, idempotent replay, upload → publish over HTTP | api-r2.test (6) |

## 4. Test results (executed 2026-11-13, this session)

| Suite | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **pass** (entire repository at the time of the run) |
| Unit + integration | `npx vitest run` (PowerShell) | **20 files, 185 / 185 passed** (104 before this session) |
| Database foundation | `npm run db:verify` (local file DB) | **8 / 8 checks pass**; 3 migrations; FTS triggers 3/3 |
| Production build | `npx next build` | **pass** (includes the frontend's new pages) |
| Playwright R1 API contract + journeys | isolated config on port 3200 with its own DB (`E2E_BASE=http://localhost:3200`) | **25 / 25 passed** |
| Playwright `frontend.spec.ts` (frontend session's suite) | same run | 9 failures — **not backend defects**: the file hard-codes port 3100 (another server was running there), the run shared `test-results/` with the other session, and several cases expect mock-mode behaviour. Reported to the frontend session (§7) |

## 5. Defects found and fixed this session

| Defect | Found by | Fix |
|---|---|---|
| Zod 4 `.partial()` keeps inner `.default()` values: a PATCH that omitted `tags`/`blocks` would have wiped them, and renaming a collection reset it to public | composer.test | Patch schemas built from default-free field definitions; regression assertions added (composer, collections) |
| Popularity subquery used unqualified columns (Drizzle renders `"id"`), so non-author comments never counted | search-r2.test | Explicit `shots.id` / `shots.author_id` |
| Removing a team attribution left the team's `shots_count` stale until the nightly job | review | Decrement in the same batch |
| Processing-timeout timer was never cleared | review | `clearTimeout` in `finally` |
| R1 e2e specs hard-coded port 3100 as Origin/base URL, so an isolated run hit another server | Playwright | `E2E_BASE` (default unchanged) |
| `db:verify` script had no npm entry | foundation review | Added |

## 6. Open items, blockers and risks

| Item | Status | Owner / next step |
|---|---|---|
| **ImageKit live round trip** (sign → browser upload → `complete` reads back by `fileId`) | Implemented; the signature and form are unit-tested; **not exercised against the real account** (it would upload a file to the user's ImageKit) | User approval to run a one-file smoke test, then delete the file |
| ImageKit originals are reachable at their plain URL; BR-63 wants originals private and EXIF stripped from served images | Risk R-25 | Turn on ImageKit "restrict unsigned original image URLs" / metadata stripping in the dashboard, or serve via signed URLs (decision needed) |
| Remote Turso re-verification and migration 0002 on Turso | Not run this session | `DATABASE_URL=libsql://… npm run db:verify` then `npm run db:migrate` when the user approves touching the remote DB |
| Google sign-in (B-16), Resend email (B-09) | Blocked on accounts | User |
| ESLint layering rules, CI pipeline, nonce CSP, data cache | Not started (R1 hardening) | P08-03, P08-08, P09 |
| 4 moderate `npm audit` findings | Dev-only chain (`drizzle-kit` → `@esbuild-kit` → esbuild) | Track R-26; not in the production bundle |
| R3 backend (notifications, block, messaging, colour search, hire/services, sitemaps, analytics, cookie consent) | Designed, not started | BACKEND_IMPLEMENTATION_PLAN §4 |

## 7. Notes for the frontend session

1. Switch features to live with `NEXT_PUBLIC_API_LIVE=follows,collections,comments,reports,composer,settings,teams,onboarding,jobs,search` once each adapter matches API_SPECIFICATION §6 (main changes: **media ids are strings**; uploads use the 3-step flow; no `availableForWork`).
2. Migration 0002 is applied to the local dev database (`.data/local.db`); run `npm run db:migrate` on any other local DB.
3. `tests/e2e/frontend.spec.ts` hard-codes `http://localhost:3100`; reading `process.env.E2E_BASE` (as `api.spec.ts` now does) lets both sessions run Playwright at the same time. Use separate `--output` folders when running in parallel.
4. `lib/catalog.RELEASED` flags stay yours to flip; the server does not read them.

## 8. Questions for the user

1. **A-24:** keep the four onboarding intents (`share`, `discover`, `hire`, `find-work`), or only FR-18's two?
2. **A-26:** FR-59 lists "available for work", D-25d excludes it. Keep it excluded?
3. May I run a **one-file ImageKit smoke test** (upload, verify, delete), and should originals be restricted in the ImageKit dashboard (R-25)?
4. May I run `db:verify` and apply migration 0002 on the **remote Turso** database?
5. Proposed decisions A-23, A-25, A-27…A-30 are open for review in the DECISION_LOG.
