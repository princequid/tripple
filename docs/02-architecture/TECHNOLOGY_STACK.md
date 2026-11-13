# Technology Stack

| Field | Value |
|---|---|
| Task | P02-02 |
| Version | 1.0, for T-04 |
| Date | 2026-11-13 |
| Rule | **No technology is listed as confirmed without a DECISION_LOG entry** (acceptance criterion). Every row cites its decision |

## 1. Version policy

- **Pin exact versions** (`--save-exact`) in `package.json`. The lockfile is committed.
- A version is adopted only if it was published **at least 14 days earlier** (supply-chain hygiene; applied in the spikes).
- Versions are **re-verified at P08** (F-09 records the 2026-11-12 observations).
- **Upgrades** go through Renovate or Dependabot-style PRs, run the full suite (T-21/T-22…T-27) and are recorded in CHANGELOG.
- **Major versions** below are fixed for R1. A major upgrade is a recorded decision.

## 2. Confirmed stack

| Layer | Technology | Major (R1) | Version seen | Role / requirement served | Decision |
|---|---|---|---|---|---|
| Language | TypeScript (strict) | 5.x | 5.9.3 (spike) | Type safety across server and client; shared contracts | A-04 |
| Framework | Next.js App Router (React Server Components, Server Actions, Route Handlers) | 16 | 16.4.3 in spike (16.4.6 latest) | UI + backend in one app; SSR for SEO | A-01 |
| UI runtime | React / React DOM | 19 | 19.2.9 (spike) | Components, `useOptimistic`, `useActionState` | A-01 |
| Styling | Tailwind CSS | 4 | 4.3.5 seen | Utilities mapped to design tokens via `@theme` | A-05 |
| Design foundation | `design-system/` (plain CSS, in repo) | — | — | Tokens, neumorphism, glass, base, components (40/30/30) | A-07, A-12 |
| Database | Turso (libSQL) | — | — | Relational data | A-02 |
| DB driver | `@libsql/client` | 0.x | 0.18.0 (spike) | Remote HTTP and local file access | A-02 |
| ORM / migrations | Drizzle ORM + Drizzle Kit | 0.45 / 0.31 | 0.45.4 / 0.31.11 (spike) | Typed schema, queries, `batch()`, migrations (**`generate` + `migrate` only; `push` forbidden**, ADR-001) | A-02 |
| Full-text search | SQLite **FTS5** on libSQL | — | — | Shot search, tag search | D-07, ADR-001 |
| Media storage | Cloudflare R2 (S3 API) | — | — | Shot media, avatars, derivatives | A-03, D-10 |
| R2 client | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | 3 | verify at P08 | Presigned PUT, object reads and deletes | D-16 |
| Image processing | `sharp` | 0.35 | 0.35.5 (spike) | Derivatives, dominant colour, palette (Node runtime) | D-15, ADR-004 |
| Auth | Better Auth (+ email-OTP plugin, Google provider, `nextCookies`) with the Drizzle adapter (sqlite provider) | 1.7 | 1.7.14 (spike) | Passwordless OTP, Google sign-in, sessions, DB rate limit | D-03, D-04, ADR-003 |
| Validation | Zod | 4 | 4.6.7 seen | Input validation for every action and handler; env validation | D-22 |
| Email | Resend (HTTP API) via `EmailService` | — | verify at P08 | OTP delivery | D-08 |
| Bot protection | Cloudflare Turnstile (widget + siteverify) | — | — | Code-request form | D-20 |
| Rate limiting | Better Auth DB limiter (auth routes) + Turso-table limiter (other classes) | — | — | BR-76/77 classes | D-12 |
| Background work | Next.js `after()` + Vercel Cron | — | — | Post-response work, daily jobs | D-11 |
| Monitoring | Sentry (`@sentry/nextjs`) | verify at P08 | — | Errors, traces, alerts | D-17 |
| Hosting | Vercel (Node runtime) | — | — | Deploys, previews, cron | D-09 |
| Fonts | Inter via `next/font` (self-hosted) | — | — | Typography | D-06 |
| Icons | Lucide (`lucide-react`, ISC licence) | verify at P08 | — | Icon set, 1.75 px stroke | 05 constitution §10; confirm at P08-03 ([§3](#3-pending--to-confirm-at-p08)) |
| Unit / service tests | Vitest | verify at P08 | — | T-22, T-23 | A-06 |
| Component tests | React Testing Library (+ `@testing-library/user-event`, `jsdom`) | verify at P08 | — | T-24 | A-06 |
| E2E / visual / a11y | Playwright (+ `@axe-core/playwright`) | verify at P08 | — | T-25…T-27, viewport validation | A-06 |
| Version control | Git + GitHub (`princequid/tripple`, user-managed) | — | — | Source of truth | D-13 |

## 3. Pending / to confirm at P08

These items are **supporting tooling** implied by approved decisions. They are confirmed (exact package and version) in P08 and logged in DECISION_LOG when adopted. None of them is a new product capability.

| Item | Proposed | Why | Note |
|---|---|---|---|
| Lint / format | ESLint (flat config, `eslint-config-next`) + Prettier | Coding standards (P08-03); **import rules use ESLint's built-in `no-restricted-imports` rule, scoped per folder with flat-config `files` overrides; no extra plugin** ([BACKEND_ARCHITECTURE §2.3](BACKEND_ARCHITECTURE.md#23-lintable-import-rules)) | Standard Next.js tooling |
| Icon package | `lucide-react` | Constitution §10 recommendation | Tree-shaken per icon |
| `@axe-core/playwright` | Accessibility assertions in E2E | T-27 | Same engine as T-33 (axe-core) |
| `server-only` | Compile-time guard against importing server code into client bundles | Security §8 | Tiny package from the React team; used in the spike |
| Sanitiser for rich text (R2 job descriptions, shot text blocks) | `sanitize-html` or DOMPurify (server) | Stored-XSS defence (SECURITY §6) | **Needed only from R2**; decision deferred to R2 planning |
| Load-testing tool | k6 or autocannon | NFR-04/05 measurement (T-29) | Decision at P11-05 (B-xx in TESTING_PROGRESS) |

## 4. Explicitly not used (and why)

| Not used | Reason |
|---|---|
| Separate Express / NestJS API | Next.js Route Handlers and Server Actions cover R1–R3 (A-01). Superseded reverse-engineering doc 07 (S-01) |
| PostgreSQL / Prisma | Turso + Drizzle confirmed (A-02, A-09) |
| Redis / BullMQ / Upstash | No queue or cache server in R1. Limiter and de-dup state live in Turso; `after()` + cron for background work (D-11, D-12) |
| Turso new-engine `USING fts` index | Experimental flag required; FTS5 missing in that engine (ADR-001, F-11) |
| `drizzle-kit push` against any persistent DB | Silently drops FTS triggers (F-12) |
| Auth.js v5 | Still beta; Better Auth chosen and spike-verified (D-04, ADR-003) |
| TanStack Query / Redux / Zustand | Server Components + Server Actions + `useOptimistic` + URL state cover R1 (D-21); reassessed in R3 |
| Algolia / Meilisearch / OpenSearch | FTS5 meets the R1 targets locally (ADR-001); `SearchService` keeps a swap path |
| Vercel Image Optimization | Hobby quota (5K transformations/month) and cost; derivatives are pre-generated by sharp and served from R2 with a `next/image` custom loader (D-15) |
| Edge runtime | libSQL client, Better Auth adapter, sharp and the S3 SDK need Node (SYSTEM_ARCHITECTURE §3) |
| CSS-in-JS, component kits (MUI, Chakra), Radix styles | Visual identity comes only from `design-system/` (A-12). Headless behaviour is implemented in-house per COMPONENT_GUIDELINES; a headless primitives library (e.g. Radix primitives, unstyled) is **not adopted in R1**. Re-evaluate only if P10-02 shows a clear accessibility-risk reduction, as a recorded decision |
| Third-party analytics / trackers | Not in R1–R2; R3 uses first-party events with consent (OQ-19) |
| Figma integration | Not authorised in this environment; coded prototypes instead (B-18) |
