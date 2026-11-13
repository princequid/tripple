# API Testing Plan

| Field | Value |
|---|---|
| Task | P04-04 (plan) + execution record for the R1 slices |
| Version | 1.0 · 2026-11-13 |
| Stack | Vitest 5 (unit + integration), Playwright 1.64 (HTTP contract + browser journeys) — A-06 |
| Rule | A test counts as passed only when it was executed and its output was read. Results are recorded in §6 with the date and command |

## 1. Test pyramid

| Layer | Tool | What it proves | Database | Location |
|---|---|---|---|---|
| Unit | Vitest | Pure rules: formatting (BR-28), slugs (BR-42), search-term handling and FTS quoting (BR-38/39), returnTo/intent allow-lists (BR-14/15), usernames (BR-18…22), signed cursors (BR-35), error vocabulary ↔ conventions table, problem details, log redaction (BR-79), every top-level route is a reserved username (BR-20) | none | `tests/unit/` |
| Integration | Vitest | Services + repositories against a **real migrated libSQL file DB** (fresh per test file): eligibility, ordering, pagination, atomic counters, concurrency, rate limits, moderation, migrations/FTS triggers | `.data/test/<uuid>.db` | `tests/integration/` |
| HTTP contract | Playwright `request` | Every Route Handler: status codes, envelopes, problem details, validation, auth/CSRF, cursors, set semantics, real Better Auth flow | `.data/e2e.db` (reset + seeded) | `tests/e2e/api.spec.ts` |
| Journey (E2E) | Playwright browser | Complete user journeys through the UI, including sign-in with a real emailed code (outbox), onboarding, likes, views, progressive enhancement, mobile layout | same | `tests/e2e/journeys.spec.ts` |

Why a real database everywhere: the riskiest logic lives in SQL (eligibility predicate, keyset pagination, `changes()`-guarded counters, FTS5 triggers). Mocks would test nothing that matters.

## 2. Environments and isolation

- **Vitest:** `tests/setup/env.ts` gives each test file its own database file and test-only secrets; `pool: 'forks'` isolates module state. `tests/helpers/db.ts` migrates, loads reference data and provides factories (`makeProfile`, `makeShot`).
- **Playwright:** `playwright.config.ts` starts `next start -p 3100` after `reset-db → migrate → seed` on `.data/e2e.db` with `APP_ENV=test` (allows the outbox email transport) and `BETTER_AUTH_URL=http://localhost:3100`. Requires `npm run build` first. Codes are read from `.data/outbox.jsonl` (`tests/e2e/helpers.ts`).
- Optional `PW_CHANNEL=chrome` runs on the locally installed Chrome instead of the bundled Chromium.

## 3. Coverage matrix (endpoint × case)

| Endpoint | Success | Validation 400 | Auth 401/403 | Not found 404 | Rate limit 429 | Other |
|---|---|---|---|---|---|---|
| E-01 health | ✔ | — | — | — | — | request id, no-store |
| E-02 shots | ✔ shape, 24/page | ✔ limit, sort, timeframe | — | ✔ unknown category | — | ✔ cursor walk (64 once), ✔ INVALID_CURSOR, ✔ all timeframes |
| E-03 shot | ✔ | — | — | ✔ malformed, missing | — | staff sees hidden (integration) |
| E-04/05 like | ✔ set semantics, counts | — | ✔ 401 visitor, ✔ 403 ONBOARDING_REQUIRED, ✔ 403 ORIGIN_REJECTED (missing + foreign), ✔ CANNOT_LIKE_OWN (integration) | ✔ | ✔ RL-SOCIAL (integration) | ✔ concurrency (integration) |
| E-06 views | ✔ 204 | ✔ fields.shotId | — | ignored silently | ignored silently | ✔ dedup/day/bot/author/hidden (integration), ✔ beacon in browser (J4) |
| E-07 search | ✔ | — | — | — | — | ✔ hostile input, ✔ empty, ✔ ranking (integration) |
| E-08 tag shots | ✔ | — | — | ✔ | — | counts eligible only (integration) |
| E-09/10 users | ✔ | — | — | ✔ | — | ✔ no sign-in email (BR-78), ✔ team members |
| E-11 me | ✔ visitor/pending/member | — | — | — | — | |
| E-12 username check | ✔ available/reserved/taken | — | ✔ visitor (integration) | — | — | |
| E-13 onboarding | ✔ 201 + Location, idempotent | ✔ (integration) | ✔ 401 | — | — | ✔ 422 taken, ✔ race (integration) |
| E-14 cron | — | — | ✔ 404 without/with wrong secret | — | — | jobs run in integration (cleanup, reconcile) |
| E-15/16 auth | ✔ code → session | ✔ invalid email | — | — | ✔ BR-05 second send < 60 s | ✔ INVALID_OTP |
| E-17 sign-out | ✔ | — | — | — | — | session gone |

## 4. Journeys

| ID | Journey | Requirements |
|---|---|---|
| J1 | Home → category filter → shot detail → tag → profile → About | D-01, D-03, SD-01, D-07, P-01, P-02 |
| J2 | Wrong slug 308 to canonical; unknown shot 404 page | BR-42, FR-05 |
| J3 | Header search → results; empty state; infinite scroll to the end | D-06, FR-23 |
| J3b | JavaScript off: "Load more" link pages through the feed | FR-23 progressive enhancement |
| J4 | View beacon counts once per viewer per day | D-10, BR-29, BR-30 |
| J5 | Visitor clicks Like → sign in with emailed code → onboarding → back on the shot → like/unlike → sign out | A-01, A-04, A-06, S-01, BR-14…16, BR-47 |
| J6 | Returning member: Like as visitor → sign in → like is saved automatically | BR-15 intent completion |
| J7 | Static/legal pages render; unknown profile is 404 | NX-06, FR-05 |
| J8 | Mobile (Pixel 7) and desktop: no horizontal scroll on home, detail, login, profile | NFR (responsive), SD-06 |

## 5. Commands

```bash
npm test                         # Vitest: unit + integration
npm run build                    # required before Playwright
npm run test:e2e                 # Playwright (bundled Chromium; `npx playwright install chromium` once)
PW_CHANNEL=chrome npm run test:e2e   # or use the installed Chrome
```

## 6. Execution record

| Date | Command | Result |
|---|---|---|
| 2026-11-13 | `npx tsc --noEmit` | pass |
| 2026-11-13 | `npx vitest run` | **6 files, 81 tests passed** |
| 2026-11-13 | `npx vitest run` (after adding `reserved-routes.test.ts`) | **7 files, 94 tests passed** |
| 2026-11-13 | `npx next build` | pass (all R1 pages and 15 API routes) |
| 2026-11-13 | `PW_CHANNEL=chrome npx playwright test` | **25 passed** (15 API contract + 10 journeys incl. mobile), final run after the last UI change |
| 2026-11-13 | `npx playwright test` (bundled Chromium 1248) | **25 passed** |

Defects found by these tests and fixed in the same session:

| Found by | Defect | Fix |
|---|---|---|
| integration (onboarding idempotency) | A double-submitted onboarding returned `USERNAME_TAKEN` to the user who had just claimed the name (SQLite reports the `username` index before `user_id`) | `users.completeOnboarding` checks the caller's own profile first |
| typecheck (moderation CLI) | `users.findByUsername` did not select `role`, so `--actor` could never be verified as staff | `role` added to the select |
| build | Production env rules ran during `next build`, so the app could not be built without production secrets | Skipped only in the build phase (`NEXT_PHASE`), still enforced at server start |
| J1 | Two navigation landmarks were both named "Categories" (WCAG: landmark names must be unique) | Footer nav renamed "Browse categories" |
| visual review | Long card meta rows widened grid items so cards overlapped (profile with team + featured badges) | `min-width: 0` on grid items; one badge per card |

### 6.2 R2 backend session (2026-11-13)

| Suite | Files | Result |
|---|---|---|
| Vitest unit + integration (PowerShell) | 20 files: R1 suites + `follows`, `collections`, `comments`, `account`, `teams`, `uploads`, `composer`, `jobs`, `reports`, `search-r2`, `api-r2` | **185 / 185 passed** |
| HTTP contracts (R2) | `tests/integration/api-r2.test.ts`: real Better Auth session cookie through `auth.handler`; route handlers called with real `Request`s | 6 / 6 (origin rejection, 401, problem details + requestId, 404 malformed ids, Idempotency-Key replay, 409 duplicate, upload → draft → publish, jobs, reports, settings, suggest) |
| DB foundation | `npm run db:verify` (local file) | 8 / 8 |
| Playwright R1 (`api.spec.ts`, `journeys.spec.ts`) | isolated config on :3200 with `.data/e2e-backend.db`, `E2E_BASE=http://localhost:3200`, `--output .data/pw-results` | **25 / 25 passed** |
| Build | `npx next build` | pass |

R2 coverage per endpoint is the service suite named in API_SPECIFICATION §2.2 plus `api-r2.test.ts`. Every R2 suite covers: happy path, validation (400 with `fields`), authorisation (401/403/404 non-disclosure), set semantics or idempotency, counter consistency under repeats, rate limit or quota (429/422), and reconciliation where a counter exists.

**Environment notes.** On Windows, Vitest must be started from PowerShell (or cmd): from Git Bash every file fails with "Vitest failed to find the runner". When another session holds port 3100, run Playwright with a config on another port and `E2E_BASE` (both R1 specs read it), and a separate `--output` folder.

## 7. Not yet covered (planned)

- Lint-based architecture checks (L-01…L-08) — needs ESLint config (P08-03).
- Remote Turso behaviour (FK pragma over HTTP, latency) — T-05b/T-06b, blocked by B-15.
- Google OAuth — blocked by B-16.
- Accessibility automation (axe) on built pages — the design-system preview has it (T-33); add to the journeys in P11-07.
- Performance budgets (NFR-09) and load tests on the rate limiter — P11-05.
