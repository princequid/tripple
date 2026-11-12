# 09 — Implementation Roadmap

Ordering follows the dependency graph in [08-feature-breakdown.md](08-feature-breakdown.md). Each phase ends with a **shippable, demoable** increment and a set of exit criteria. Feature IDs refer to doc 08.

> **Status:** Planning only. **Implementation has not started and awaits approval.**

---

## Phase 0 — Foundation (≈ 2–3 weeks of effort, 1 dev)

**Goal:** a skeleton that renders the app shell against a seeded database.

1. **F-01** pnpm + Turborepo monorepo (`apps/web`, `apps/api`, `apps/worker`, `packages/{schemas,db,ui,config}`). Docker Compose for Postgres, Redis, MinIO and Mailpit. GitHub Actions CI (lint, typecheck, test).
2. **F-04** Prisma schema for MVP + Phase-2 entities ([06](06-database-design.md)) and a seed script: ~40 users (incl. 5 teams), ~600 shots with **licence-free placeholder images** (generated or Unsplash/Picsum, never Dribbble assets), tags, categories, likes, follows.
3. **F-05** Express API skeleton: Zod middleware, problem+json errors, pino logging, Redis rate limiter, health check.
4. **F-02** Tailwind preset with tokens from [02 §1](02-frontend-analysis.md); Radix-based primitives; a Storybook or Ladle catalogue (optional).
5. **F-03** SiteHeader (desktop mega-menu and mobile drawer), AnnouncementBanner, SiteFooter, layouts (App/Auth/Minimal/Wizard).

**Exit criteria:** `pnpm dev` boots everything; header/footer match the screenshots at 390 / 768 / 1280 / 1440px; CI green.

## Phase 1 — Public MVP: discover, view, sign in, like (≈ 9–12 weeks)

**Goal:** an anonymous visitor can browse like on Dribbble, sign in with email OTP or Google, and like shots.

Order inside the phase:
1. **D-01** Feed API (`GET /api/v1/shots`, sort, category, cursor) → **ShotGrid** with infinite scroll (responsive columns per [02 §3](02-frontend-analysis.md)).
2. **D-02** ShotCard (overlay, teaser, badges, abbreviated counts).
3. **D-03** Filter bar + Filters panel (tag, colour hex input (search itself comes in phase 3, the UI is wired now), timeframe).
4. **SD-01, SD-06** Shot page (SSR) with content blocks and the mobile layout → **SD-02** Share and Details modals → **SD-04** related sections.
5. **P-01, P-02** Profile header, Work tab, About tab.
6. **D-06, D-07** Search `/search/:term` (Postgres FTS) and tag pages, with the empty state.
7. **D-09** Homepage.
8. **A-01 → A-03 → A-02 → A-04 → A-05** Auth: OTP, sessions/CSRF, Google, AuthGateModal (`intent`, `returnTo`), route guards.
9. **S-01** Likes (optimistic). **D-10** batched view logging.

**Exit criteria:** journeys 1, 3 (like/share/details) and 4 from [04](04-user-journeys.md) pass as Playwright E2E tests. Lighthouse SEO ≥ 95 on the shot, search and tag pages. LCP < 2.5s on the seeded feed.

## Phase 2 — Creators and social (≈ 11–15 weeks)

**Goal:** designers can upload and curate. The social graph is complete. The job board is live.

1. **C-01 → C-02** Presigned uploads, image worker (derivatives, dominant colour, palette) → **SD-03** palette UI.
2. **C-04, C-05** Shot composer (ordered content blocks, tags, category, publish/draft).
3. **S-02** Collections (save picker, pages) → **P-03**. **S-01 + A-05** → **P-04** Liked tab (auth only).
4. **S-03** Follow → followers/following. **S-04** Comments.
5. **P-05** Teams and members. **A-06** onboarding → **A-07** settings → **P-06** profile edit.
6. **D-04** Popularity job + timeframe ranking. **D-08** header search type switch + autocomplete. **SD-05** prev/next.
7. **J-01 → J-02 → J-03** Job board, detail, 4-step post wizard (free posting at this stage).

**Exit criteria:** journeys 2 (discover designer → follow), 3 (save, comment), 7 and 8 (free) pass E2E. Upload of a 20MB image yields all derivatives in < 30s.

## Phase 3 — Marketplace I and polish (≈ 11–15 weeks)

1. **C-03** Video/GIF teasers. **D-05** colour search. **X-02** 404 mosaic.
2. **S-05** Notifications. **S-06** Block. **S-07** Messaging ("Get in touch").
3. **H-01** Talent directory with filters (rating filter shows once reviews exist).
4. **M-01** Services (CRUD, listing, filters, detail) → **P-07** Services tab; extend **D-08** with the Services search type.
5. **D-11** SEO: sitemaps, OG images, JSON-LD (CreativeWork for shots, JobPosting for jobs). **X-03** analytics events. **X-05** cookie consent.

**Exit criteria:** a client can find a designer and message them. Services are browsable.

## Phase 4 — Monetisation and Marketplace II (≈ 14–20 weeks)

1. **B-01** Stripe foundation (customers, webhooks, idempotency).
2. **B-02** Pro tiers and badges. **J-04** paid job tiers.
3. **M-02** Service orders (Hire Now / Request Service), **M-03** reviews and Reviews tab.
4. **M-04** Project brief wizard (optional LLM generation step) → **M-05** Pro-gated brief board + proposals.
5. **H-02** specialty SEO landings, **J-05** job directories. **C-06** rebounds, **D-12** playoffs.

## Phase 5 — Optional

**B-03** boosted shots and ad slots, **X-01** blog/resources CMS, **X-04** marketing pages.

---

## Suggested implementation order (flat list)

`F-01 → F-04 → F-05 → F-02 → F-03 → D-01 → D-02 → D-03 → SD-01 → SD-06 → SD-02 → SD-04 → P-01 → P-02 → D-06 → D-07 → D-09 → A-01 → A-03 → A-02 → A-04 → A-05 → S-01 → D-10 → C-01 → C-02 → SD-03 → C-04 → C-05 → S-02 → P-03 → P-04 → S-03 → S-04 → P-05 → A-06 → A-07 → P-06 → D-04 → D-08 → SD-05 → J-01 → J-02 → J-03 → C-03 → D-05 → X-02 → S-05 → S-06 → S-07 → H-01 → M-01 → P-07 → D-11 → X-03 → X-05 → B-01 → B-02 → J-04 → M-02 → M-03 → M-04 → M-05 → H-02 → J-05 → C-06 → D-12 → (B-03, X-01, X-04)`

Dependency check: each item appears after everything it depends on in doc 08 (verified manually, including the D-08 → P-01, P-07 → M-01 and P-06 → A-07 edges).

---

## 4. Testing strategy

| Level | Tooling | What to cover | Target |
|---|---|---|---|
| Unit | Vitest | Zod schemas, popularity scoring, count abbreviation (`7.7k`, `2m`), slug generation, colour distance, OTP hashing/expiry, permission helpers | ≥ 80% of `packages/*` and domain services |
| API integration | Supertest + Testcontainers Postgres/Redis | Every endpoint: happy path, validation 400, auth 401/403, not-found 404, idempotent like/follow, pagination cursors, rate limits 429 | All routes |
| DB | Prisma migrations in CI against a fresh DB; constraint tests (unique like, self-follow check) | — | Migrations reversible |
| Component | React Testing Library + MSW | ShotCard states (hover, logged-in vs logged-out), filter panel, AuthForm validation messages (copy matches doc 02), modals focus trap/Escape | Key components |
| E2E | Playwright (desktop 1440 and mobile 390 projects) | Journeys 1–4 and 7–8 from doc 04; infinite scroll; auth gate → return to the same shot | Every phase exit |
| Visual regression | Playwright screenshots vs approved baselines (our own UI, not Dribbble's) | Header, card, shot page, profile, auth at 3 breakpoints | On PR |
| Accessibility | axe-core in Playwright | No serious/critical violations; keyboard nav for menus, modals, tabs | Every page |
| Performance | Lighthouse CI; k6 for API (feed p95 < 200ms at 50 rps on seed data) | — | Phase 1+ |
| Security | `npm audit`/Dependabot, ZAP baseline scan, upload fuzzing (bad MIME, huge dimensions), CSRF and rate-limit tests | — | Phase 2+ |

### Definition of done (per feature)

Zod schema shared · API tests · UI states (loading skeleton, empty, error) implemented · responsive at 390/768/1280/1440 · a11y pass · E2E updated if the feature is on a journey · docs updated.

## 5. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Scope creep into marketplace and payments early | Hard phase gates; marketplace starts in phase 3 |
| Media pipeline cost and complexity | Start with images only (phase 2), video in phase 3; use a managed image CDN |
| Popular-feed ranking feels "off" | Make the scoring formula configurable; seed realistic engagement |
| Search quality with Postgres FTS | `SearchService` interface; swap to Meilisearch if relevance or perf is insufficient |
| IP and trademark | Original name, logo and copy; no Dribbble assets, fonts (Mona Sans is OFL and may be used independently, but consider choosing your own), or screenshots in the product; placeholder content only |
