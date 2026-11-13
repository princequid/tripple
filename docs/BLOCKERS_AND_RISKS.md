# Blockers and Risks

**Owner:** TPM / QA Lead · **Last updated:** 2026-11-13 · Related: [MASTER_PROJECT_WORKFLOW.md](MASTER_PROJECT_WORKFLOW.md), [TASK_TRACKER.md](TASK_TRACKER.md), [DECISION_LOG.md](DECISION_LOG.md) (decision details are owned by the lead), [00-project-assessment/TECHNOLOGY_EVALUATION.md](00-project-assessment/TECHNOLOGY_EVALUATION.md)

A **blocker** stops a specific task from starting or finishing now, or will stop it when its turn comes. A **risk** is something that might happen. Blocker statuses: Open, Resolved. Risk statuses: Open, Monitoring, Mitigated, Closed.

---

## 1. Blockers

### 1.1 Pending decisions

All decisions are made by the user and recorded by the lead in DECISION_LOG.md.

| ID | Blocker | Blocks (task IDs) | Needed by | Unblocking action | Owner | Status |
|---|---|---|---|---|---|---|
| B-01 | **G1 not yet approved.** Every task from P01 onward depends on it | P01-*, P02-*, P05-*, and everything after | Now | Finish P00-02..P00-06, then P00-07 presents the G1 package | TPM / QA Lead → User | Resolved 2026-11-12 (G1 approved) |
| B-02 | **D-01 product name and branding** undecided | P05-01, P06-05 (logo, copy), P12-02 (domain, email sender domain) | Start of P05 | User picks a name. Lead checks trademark and domain availability | User | Resolved 2026-11-12 ("Trippple" adopted as the working name, A-14) |
| B-03 | **D-02 MVP scope (R1)** not approved | P01-01, P01-02 and all release mapping | At G1 | User approves or edits the R1 list in the brief | User | Resolved 2026-11-12 (decision approved by the user) |
| B-04 | **D-03 authentication methods** undecided (email OTP and/or password, Google) | P01-05, P02-05, P02-09 (SPIKE-03 scope), P09-03, P10-04 | P01-05 | User chooses. Recommendation in TECHNOLOGY_EVALUATION | User | Resolved 2026-11-12 (decision approved by the user) |
| B-05 | **D-04 auth library** not approved (Better Auth recommended) | P02-09 validates it; P03-03 (auth tables), P09-03 | G2 | Run SPIKE-03, then the user decides | Lead → User | Resolved 2026-11-12 (D-04 Better Auth approved; SPIKE-03 still validates it) |
| B-06 | **D-05 palette contrast refinement** not approved. Known failures: text2 `#647184` 4.22:1 on bg, white on lavender 3.82:1, white on pink 2.72:1, muted 2.39:1 | P05-04, P05-07 (G3) and all prototypes | P05-04 | P05-02 produces a refinement proposal; user approves | Designer → User | Resolved 2026-11-12 (decision approved by the user) |
| B-07 | **D-06 font** (Inter vs Geist) undecided | P05-03, P05-04 | P05-03 | User chooses (both are OFL-licensed) | User | Resolved 2026-11-12 (decision approved by the user) |
| B-08 | **D-07 search approach** (Turso FTS: FTS5 vs Tantivy `USING fts`) undecided | P03-01, P09-07 | G2 | Run SPIKE-01 (P02-07), then decide | Lead → User | Resolved 2026-11-12 (D-07 approved; SPIKE-01 picks FTS5 vs `USING fts`) |
| B-09 | **D-08 email provider** undecided | P09-03 (OTP delivery), P08-05, P12-02 | P08-05 | User picks a provider and verifies the sending domain (needs D-01) | User | Decision resolved 2026-11-12 (Resend); **still Open**: the user creates the Resend account; the sending domain needs D-01 |
| B-10 | **D-09 deployment host** undecided; no host account | P02-11 (SPIKE-05), P08-09, P12-01 | SPIKE-05 | User shortlists a host and creates the account; spike confirms | User | Decision resolved 2026-11-12 (Vercel); **still Open for the account**: the user creates the Vercel account |
| B-11 | **Media host account (ImageKit, A-19)** not created. (Originally the Cloudflare R2 account; R2 dropped by A-18) | P09-10 uploads (R2 release), production media serving (P12-02). **Not** R1 development: seed media is served locally | Before the R2-release uploads slice | User creates the ImageKit account and stores `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` and the URL endpoint locally (never in the repo) | User | **Effectively resolved 2026-11-13:** ImageKit public/private keys are present in `.env.local` (verified by prefix only). Upload code is implemented; a live smoke test awaits user approval (BACKEND_PROGRESS_REPORT §6) |
| B-12 | **D-11 background jobs approach** undecided | P02-04, P09-09, P09-10, P09-17, P09-20 | P02-04 | Lead recommends (e.g. host cron + DB-backed queue vs managed queue); user decides | Lead → User | Resolved 2026-11-12 (decision approved by the user) |
| B-13 | **D-12 rate-limiting approach** undecided | P02-05, P09-01, P09-03 | P02-05 | Lead recommends; user decides | Lead → User | Resolved 2026-11-12 (decision approved by the user) |
| B-14 | **D-13 git init and repository hosting**: the project root is not a git repository | P02-07..P02-11 (spikes), P06-04, P08-01, P08-08 | Right after G1 | User approves `git init` and picks a hosting service | User | Resolved 2026-11-12: the user sets up GitHub and git themselves; spikes do not need a repository |

### 1.2 External accounts and other blockers

| ID | Blocker | Blocks (task IDs) | Needed by | Unblocking action | Owner | Status |
|---|---|---|---|---|---|---|
| B-15 | **Turso account / organisation not created** (decision **D-14**) | P02-07, P02-08 (cloud-mode checks), P08-05, P08-06 | SPIKE-01 | User creates the account. Spikes can begin on a local libSQL file in the meantime | User | **Effectively resolved 2026-11-13:** a Turso URL and token exist in `.env.local` (commented out) and a remote check was recorded by the previous session. Re-verification and migration 0002 on Turso await user approval |
| B-16 | **Google OAuth client credentials** not created | P02-09 (Google part), P09-03, P10-04 | SPIKE-03 | User creates an OAuth client in their Google Cloud console and stores the secrets locally | User | Open |
| B-17 | **Pending technologies:** image processing (**D-15**), R2 SDK (**D-16**), monitoring (**D-17**), video processing in R3 (**D-18**); also seed-media hosting (**D-19**) and bot protection (**D-20**) | P02-10, P09-10, P09-23, P12-04 | P02-10 (image, SDK); P12-04 (monitoring); P09-23 (video) | IDs assigned 2026-11-12. User approves D-15…D-20. SPIKE-04 provides evidence for image processing and the SDK | User | Resolved 2026-11-12 (D-15…D-20 approved) |
| B-18 | **Figma integration not authorised** | None (fallback in place) | — | High-fidelity work is done as coded HTML/CSS prototypes (P06-04). Figma is optional if the user authorises it | User | Open (non-blocking) |
| B-19 | **Payment approval** not given | Later scope only (Stripe, Pro, paid jobs, orders, reviews, briefs, proposals, ads) | After R3 | Not needed for R1–R3. Requires a new decision and a planning pass | User | Open (non-blocking) |

---

## 2. Risk register

Likelihood and Impact use the scale Low / Medium / High.

| ID | Risk | Likelihood | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| R-01 | **Turso FTS uncertainty.** FTS5 behaviour on Turso Cloud vs the newer Tantivy-based `USING fts` index differ in syntax, ranking, prefix search and replica support. Drizzle has no FTS schema support, so raw-SQL migrations and triggers are needed | High | High | SPIKE-01 (P02-07) before G2. Hide search behind a `SearchService` interface. Keep a fallback to `LIKE`/trigram-style queries on the tags and titles tables. Document raw-SQL migrations in MIGRATION_PLAN | Lead / Architect | Open |
| R-02 | **Turso transaction semantics.** Interactive transactions over HTTP add latency and have timeouts; batch vs transaction behaviour differs between remote and embedded clients | Medium | High | SPIKE-02 (P02-08). Prefer short write transactions and `batch()` for multi-statement atomic writes. Keep counters in the same transaction as join rows. Add a nightly counter reconciliation job | Lead / Architect | Open |
| R-03 | **Foreign keys silently not enforced.** SQLite needs `PRAGMA foreign_keys=ON` per connection, which may not persist across stateless HTTP connections, allowing orphan rows | Medium | High | SPIKE-02 verifies every connection mode. A DB client helper sets the pragma. Integrity tests (T-11) include a negative FK test in CI and against the preview DB | Lead / Architect | Open |
| R-04 | **Serverless image-processing limits.** sharp binary size, memory and execution-time limits on the host. Edge runtime is incompatible with sharp | Medium | High | SPIKE-04 (P02-10) measures a 20 MB image. Force the Node runtime for media routes. Fallbacks: process asynchronously via the D-11 job mechanism, or a managed image service (needs a new decision) | Lead / Architect | Open |
| R-05 | **Video teaser processing (R3) is not feasible in serverless** (ffmpeg) | High | Medium | Defer to R3. Decide on a managed video service before P09-23. Allow a poster-only fallback | Lead / Architect | Open |
| R-06 | **Auth library maturity.** Better Auth is fast-moving; adapter or plugin behaviour (Drizzle + libSQL, email OTP) may change between versions | Medium | High | SPIKE-03 (P02-09). Pin exact versions. Wrap the library behind an `auth` module interface. Contract tests on all auth flows. Track changelogs before upgrades | Lead / Architect | Open |
| R-07 | **Palette accessibility.** Several brand colours fail WCAG AA (4.22:1, 3.82:1, 2.72:1, 2.39:1) | High (already found) | High | D-05 refinement in P05-02. Automated contrast check (T-15) on the token matrix. Restrict the pink/lavender to non-text or large-text uses where they fail | Designer | Open |
| R-08 | **Neumorphism and glass accessibility.** Soft extruded controls have low-contrast boundaries (WCAG 1.4.11 needs 3:1). Glass blur reduces text legibility over imagery. `backdrop-filter` costs performance on low-end mobiles | High | Medium | The constitution requires a ≥3:1 outline or edge on every control, solid fallbacks behind text and `prefers-reduced-transparency` support. Glass is limited to header, modals and overlays. Verified in P07-03 and T-27 | Designer | Open |
| R-09 | **Scope creep into marketplace and payments** (services orders, Pro, briefs) before the social core is stable | Medium | High | Release gates: R2 starts after G7-R1, R3 after G7-R2. The Later scope needs payment approval. Change requests go through the DECISION_LOG (rule 17) | TPM / QA Lead | Open |
| R-10 | **IP / trademark.** Accidentally shipping reference-product assets, name, copy, layout artwork or the reference screenshots | Low | High | Original branding (D-01) and a trademark check. Licence-free generated seed media. Design QA checklist item "no reference assets". Screenshots stay in `docs/reverse-engineering/` and are never imported by the app | TPM / QA Lead | Open |
| R-11 | **Cost of external services.** Turso row-read billing (feed and view-count queries can read many rows), R2 Class A operations, email volume, host function time | Medium | Medium | Read-cost estimate in P11-05. Denormalised counters and indexes on every feed query. Caching/ISR for public pages. Budget alerts on every provider. Batched view logging | Lead / Architect | Open |
| R-12 | **Single-developer throughput.** 312 d of effort; R1 alone is ~168 d. Gate reviews can stall progress | High | High | Two parallel agent streams (§5 of the workflow). R1 scope frozen at G1. Gate packages prepared ahead of time. Estimates are re-baselined at each G7 | TPM / QA Lead | Open |
| R-13 | **SQLite migration limits.** ALTER TABLE cannot drop or alter constraints or change column types, so table rebuilds are needed. Rebuilds on large tables with FKs are risky | Medium | Medium | MIGRATION_PLAN defines the table-rebuild pattern (FKs off → copy → swap → `foreign_key_check` → FKs on). Migration rehearsal on a production copy before each release (P12-08, P12-09). Backup before migrate | Lead / Architect | Open |
| R-14 | **Vendor lock-in** (Turso, R2, host-specific features) | Medium | Medium | Standard SQL via Drizzle; FTS isolated behind `SearchService`. S3-compatible storage API. Avoid host-proprietary runtime APIs outside an adapter. ADR records the exit path for each vendor | Lead / Architect | Open |
| R-15 | **Test flakiness.** Infinite scroll, animations, network timing and font rendering differences between Windows (dev) and Linux (CI) make screenshot diffs unstable | High | Medium | Visual baselines are generated on CI Linux only. Disable animations in tests. Use deterministic seed data. Use explicit waits on network idle and testids. Quarantine within one day. Three-consecutive-pass rule for gate evidence | TPM / QA Lead | Open |
| R-16 | **SQLite single-writer contention** on hot counters (likes, views) | Low | Medium | Batched view writes. Short transactions. Load test in P11-05. Counter reconciliation job | Lead / Architect | Open |
| R-17 | **Unverified reference behaviour.** Logged-in flows (upload, comments, notifications, messaging, OTP details) were not observed, so requirements may have gaps | High | Medium | Each gap becomes a business rule or an open question (P01-05, P01-06). Behaviour is designed independently rather than copied | TPM / QA Lead | Open |
| R-18 | **Windows dev vs Linux CI/production.** Native modules (sharp, libSQL), path case sensitivity, line endings | Medium | Medium | `.gitattributes` with LF line endings. Build and test the deploy target in CI (Linux). SPIKE-05 confirms the host build | Developer | Open |
| R-19 | **OTP email deliverability** (spam filtering, domain reputation) blocks sign-in | Medium | High | Verified sending domain with SPF/DKIM/DMARC (needs D-01, D-08). Keep Google sign-in as a second method (D-03). Monitor bounce rates | Lead / Architect | Open |
| R-20 | **Server Actions exposure.** Every Server Action is a public POST endpoint; missing authz or validation is an easy mistake. App Router caching can leak per-user data | Medium | High | Coding standard: every action calls validation and authz helpers first (lint-checked). Authz matrix tests (T-28). Per-user data is never cached in shared caches | Lead / Architect | Open |
| R-21 | **Design iteration speed without Figma.** Coded prototypes are slower to change than design files | Medium | Low | Prototypes consume the same tokens CSS. Figma can be used if the user authorises it | Designer | Open |
| R-22 | **Parallel sessions editing the same files.** On 2026-11-13 a second session changed `env.ts`, `media.ts`, the decision log and the changelog while the backend session was running; nothing was lost, but numbering (A-19 vs A-20) and overwrites are a risk | Medium | Medium | Targeted edits (never whole-file rewrites) of shared docs; re-read before editing; one session at a time on `docs/DECISION_LOG.md`; commit often (user-owned git, D-13) | Lead | Open |
| R-23 | **Uncached reads at scale.** R1 pages call services directly with no data cache (FRONTEND §7.2 deferred); every page view is several Turso round trips, which costs reads and latency once traffic grows | Medium | Medium | Enable the tagged data cache in the R1 hardening slice before launch; measure in P11-05 (NFR-09) | Lead / Architect | Open |
| R-24 | **Local `next start` refuses development settings.** The production env guard (correctly) rejects outbox email, `http://` auth URL and local media, so a plain `next start` returns 500 locally | High (by design) | Low | Use `npm run dev` locally; E2E sets `APP_ENV=test`. Documented in BACKEND_IMPLEMENTATION_PLAN §6 | Lead | Mitigated |
| R-25 | **ImageKit originals are public by URL.** BR-63 wants originals private and metadata stripped from served images; ImageKit serves the uploaded original at its plain path unless restricted | Medium | Medium | Enable "restrict unsigned original image URLs" (and metadata removal) in the ImageKit dashboard, or switch to signed URLs; verify with the smoke test. Owner: user + backend |
| R-26 | **Dev-dependency advisories.** `npm audit` reports 4 moderate issues in `drizzle-kit` → `@esbuild-kit` → esbuild (dev tooling only, not in the production bundle) | Low | Low | Re-check when drizzle-kit 1.0 is stable; never expose drizzle-kit studio publicly |
| R-27 | **Two sessions running tests at once.** Shared `test-results/`, shared port 3100 and a shared `.data/e2e.db` made one Playwright run unreliable on 2026-11-13 | Medium | Low | Use `E2E_BASE` + separate port, DB and `--output` per session (API_TESTING_PLAN §6.2) |

---

## 3. Review cadence

- Blockers are reviewed whenever a task changes status and at every gate.
- The risk register is reviewed at every gate (G1–G8). A risk with High likelihood and High impact must have an active mitigation task before the next gate.
- Resolved blockers and closed risks stay in the tables with their final status so history is preserved.
