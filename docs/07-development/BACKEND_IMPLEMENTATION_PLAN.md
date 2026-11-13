# Backend Implementation Plan (feature-based slices, dependency-ordered)

| Field | Value |
|---|---|
| Version | 2.0 · 2026-11-13 |
| Scope | R1 (done), R2 (backend done), R3 (planned, ordered below) |
| Rule | Each slice: requirement → contract → DB → service → endpoints → tests → docs. Since A-22 the backend may run ahead of the UI: the frontend session builds against [API_SPECIFICATION](../04-api/API_SPECIFICATION.md) (mock first, then live) |
| Status source | [BACKEND_PROGRESS_REPORT](BACKEND_PROGRESS_REPORT.md) · [TASK_TRACKER](../TASK_TRACKER.md) |

## 1. Slice definition of done

| # | Step | Evidence |
|---|---|---|
| 1 | Review the reverse-engineered requirement | Row in [REVERSE_ENGINEERING_TO_BACKEND_MAPPING](REVERSE_ENGINEERING_TO_BACKEND_MAPPING.md) (feature ID, BRs) |
| 2 | Define the API contract (align with the frontend's `src/services/contracts.ts` where requirements allow) | Section in API_SPECIFICATION; differences in its §6 |
| 3 | Database operations | Schema + **add-only** migration ([DATABASE_SCHEMA](../03-database/DATABASE_SCHEMA.md)); repository functions |
| 4 | Business logic, validation, authorisation, rate limits | `service.ts` + Zod (via `server/validation`); BR references in comments |
| 5 | Endpoints | Thin Route Handlers: origin check → viewer → one service call → envelope |
| 6 | Tests | Vitest service suite + HTTP contract test; Playwright for UI journeys once the page exists |
| 7 | Document | Spec, mapping, schema, progress report, changelog, tracker, decision log |

A slice is "done" only when its tests were **executed and passed**.

## 2. Architecture used by every slice

```
src/app/api/**/route.ts          route() wrapper → assertSameOrigin (mutations) → getViewer → ONE service call → json()/jsonPage()/problem()
src/modules/<m>/service.ts       rules, authorisation, rate limits/quotas; returns DTOs
src/modules/<m>/repository.ts    Drizzle/SQL for the module's own tables; atomic db.batch for row + counters
src/server/*                     db client, auth, env, errors, http, route, rate-limit, idempotency, validation, storage, sanitize, log, email
```

Module graph (no cycles): `platform` → (`account`, `composer`, `feed`, `search`, `moderation`) → (`teams`, `jobs`, `comments`, `collections`, `follows`, `likes`, `views`) → `shots` → (`media`, `users`) → `auth`. Details: [BACKEND_ARCHITECTURE](../02-architecture/BACKEND_ARCHITECTURE.md).

## 3. R1 slices — done

Foundation, discovery feed, shot detail + views, auth + minimal onboarding, likes, search + tags, profiles, minimal moderation (CLI), static/legal. Tests pass (see the progress report). Remaining R1 hardening: §5.

## 4. R2 slices — backend done (2026-11-13)

| Order | Slice | Depends on | Tables | Endpoints | Status |
|---|---|---|---|---|---|
| 1 | Infrastructure (idempotency, validation helper, storage, sanitiser, R2 limits) | R1 | `idempotency_keys` | — | Done |
| 2 | Follows | R1 | `follows` | E-20, E-21 | Done |
| 3 | Collections + Liked tab | R1 | `collections`, `collection_items` | E-22…E-28 | Done |
| 4 | Comments | R1 | `comments`, `comment_likes` | E-29…E-32 | Done |
| 5 | Settings / account / full onboarding | R1 | `username_holds` (+ profile columns) | E-44…E-50 | Done |
| 6 | Teams | 5 | `team_invitations` | E-51…E-56 | Done |
| 7 | Uploads (ImageKit / local) | 5 | `media` columns | E-33…E-36 | Done (ImageKit live round trip pending approval) |
| 8 | Composer + prev/next | 6, 7 | (shots tables) | E-37…E-43 | Done |
| 9 | Jobs board | 7 (logo) | `jobs`, `companies`, `specialties` | E-57 | Done |
| 10 | Reports + staff queue | 4, 9 | `reports` | E-58, E-59 | Done |
| 11 | Header search + autocomplete; R2 popularity; purge jobs | 3, 4, 8 | — | E-60, E-14 | Done |
| — | **R2 UI** | all | — | — | Frontend session (mock → live via `NEXT_PUBLIC_API_LIVE`) |

## 5. Remaining hardening (R1/R2)

| Item | Why | Task |
|---|---|---|
| ESLint flat config with import rules L-01…L-08 | Enforce layering and table ownership automatically | P08-03 |
| CI workflow (typecheck, Vitest, build, Playwright with `E2E_BASE`) | Repeatable verification | P08-08 |
| Nonce-based CSP | ADR-006 | P09-01 |
| Tagged data cache + revalidation | All reads uncached (fine at seed scale) | P10 perf |
| ImageKit smoke test + private originals (R-25) | BR-63 | needs user approval |
| Remote Turso: verify + apply 0002 | Production readiness | needs user approval (B-15 resolved) |
| Google sign-in, Resend | Accounts | B-16, B-09 |

## 6. R3 roadmap (dependency-ordered)

| Order | Slice | Depends on | New tables | Endpoints (indicative) | Rules / blockers |
|---|---|---|---|---|---|
| 1 | Block user | follows, comments | `blocks` | PUT/DELETE `/api/users/:u/block`, GET `/api/me/blocked` | BR-81; adds block checks to follow, comment, message |
| 2 | Notifications | likes, comments, follows, saves, teams | `notifications` | GET `/api/me/notifications`, POST `…/read`, GET `/api/me/unread` | BR-83; created in the same batch or via `after()`; grouping of likes per hour |
| 3 | Messaging ("Get in touch") | 1, 2 | `message_threads`, `thread_participants`, `messages` | `/api/messages…` | BR-82; polling ≤ 15 s; RL-MESSAGE |
| 4 | Colour search | uploads (palette in Lab already stored) | — | `GET /api/search/shots?color=` | BR-80 ΔE76 ≤ 20 |
| 5 | Hire directory | follows, search | — | `GET /api/hire` | H-01; no Pro/rating filters |
| 6 | Services listing | 5, messaging | `services` | `/api/services…` | BR-84; "Hire now" opens a message |
| 7 | Video/GIF teasers | uploads | media columns | uploads (video) | BR-86; **D-18 decision needed** (queue/processing) |
| 8 | SEO sitemaps + JSON-LD, analytics events, cookie consent | all | `analytics_events` | `/sitemap.xml`, `/api/events` | BR-85, X-03, X-05 |

## 7. How to run locally

```bash
npm install
npm run db:reset          # local file DB: migrate + seed
npm run db:verify         # FKs, atomic batches, FTS5, migration state
npm run dev               # http://localhost:3000; demo@seed.trippple.test, code in .data/outbox.jsonl
npx vitest run            # use PowerShell on Windows (Git Bash breaks Vitest's worker runner)
npm run build && npm run test:e2e                       # Playwright on :3100
E2E_BASE=http://localhost:3200 npx playwright test -c <config on 3200>   # when :3100 is taken
```
