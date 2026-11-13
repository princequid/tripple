# Task Tracker

Flat list of **all 144 tasks**. IDs, titles, dependencies, estimates and statuses match [MASTER_PROJECT_WORKFLOW.md](MASTER_PROJECT_WORKFLOW.md) exactly. Subtasks, acceptance criteria and tests are listed there. Blockers are in [BLOCKERS_AND_RISKS.md](BLOCKERS_AND_RISKS.md) and test status is in [TESTING_PROGRESS.md](TESTING_PROGRESS.md).

**Last updated:** 2026-11-13 (R2 backend session) · **Status values:** Not Started · In Progress · Blocked · Awaiting Review · Approved · Completed

## Status summary

| Status | Count |
|---|---|
| Completed | 12 |
| In Progress | 5 |
| Awaiting Review | 59 |
| Approved | 0 |
| Blocked | 5 |
| Not Started | 68 |
| **Total** | **149** |

| Phase | Tasks | Estimate |
|---|---|---|
| P00 Assessment & Planning | 7 | 9.5 d |
| P01 Requirements | 7 | 7 d |
| P02 Architecture | 13 | 15.5 d |
| P03 Database | 6 | 6.5 d |
| P04 API | 5 | 6 d |
| P05 Design Constitution | 7 | 8 d |
| P06 UI/UX Design & Prototyping | 10 | 19.5 d |
| P07 Design Testing & Validation | 7 | 10.5 d |
| P08 Development Environment | 10 | 10.5 d |
| P09 Backend Implementation | 30 | 97 d |
| P10 Frontend Implementation | 27 | 92.5 d |
| P11 System Integration & QA | 10 | 26.5 d |
| P12 Deployment & Production Readiness | 9 | 12 d |
| **Total** | **148** | **321 d (317 d remaining)** |

> No task is marked Blocked yet, because none of them can start before G1 anyway. When a task's turn comes and a decision or account it needs is still missing, its status changes to **Blocked** and the blocker ID from [BLOCKERS_AND_RISKS.md](BLOCKERS_AND_RISKS.md) goes in its Notes.

## Current focus

| ID | Title | Status | What finishes it |
|---|---|---|---|
| R2 backend | P09-10…P09-19, P09-30 (backend done, A-22) | Awaiting Review | User review of [BACKEND_PROGRESS_REPORT](07-development/BACKEND_PROGRESS_REPORT.md) and the proposed decisions A-23…A-30; frontend session switches features to live ([API_SPECIFICATION §6](04-api/API_SPECIFICATION.md)) |
| R2 frontend | P10-12…P10-19, P10-27 | Frontend session | Built against mocks, then live endpoints |
| Backend R1 slices | P09-01…P09-09, P09-29 | Awaiting Review | Unchanged; re-verified 2026-11-13 (Vitest, Playwright 25/25, build) |
| P02-07…P02-11 | Spike remote/account halves | Blocked | Turso and ImageKit now exist (B-15, B-11 effectively resolved): remote checks await user approval; Google OAuth (B-16), Vercel (B-10) |

## Next up

1. **User decisions:** A-24 (onboarding intents), A-26 (available-for-work), approval for the ImageKit smoke test (R-25) and for running `db:verify` + migration 0002 on remote Turso.
2. **Backend hardening:** ESLint layering rules (P08-03), CI with `E2E_BASE` (P08-08), nonce CSP.
3. **R3 backend** in the order of [BACKEND_IMPLEMENTATION_PLAN §6](07-development/BACKEND_IMPLEMENTATION_PLAN.md): block → notifications → messaging → colour search → hire → services → teasers (D-18) → SEO/analytics/consent.

## All tasks

| ID | Title | Phase | Depends on | Deliverable | Owner role | Estimate | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| P00-01 | Reverse-engineering study of the reference product | P00 Assessment & Planning | — | `docs/reverse-engineering/00–10 + screenshots/` | Lead / Architect | 4 d | Completed | Done before this plan; doc 07 superseded by the confirmed stack |
| P00-02 | Project assessment and technology evaluation | P00 Assessment & Planning | P00-01 | `docs/00-project-assessment/TECHNOLOGY_EVALUATION.md` | Lead / Architect | 2 d | Completed | Owned by the other agent |
| P00-03 | Master project workflow and task tracker | P00 Assessment & Planning | P00-01 | `docs/MASTER_PROJECT_WORKFLOW.md` | TPM / QA Lead | 1.5 d | Completed | — |
| P00-04 | Blockers and risk register | P00 Assessment & Planning | P00-01, P00-02 | `docs/BLOCKERS_AND_RISKS.md` | TPM / QA Lead | 0.5 d | Completed | — |
| P00-05 | Testing strategy and testing progress register | P00 Assessment & Planning | P00-03 | `docs/TESTING_PROGRESS.md` | TPM / QA Lead | 0.5 d | Completed | — |
| P00-06 | Decision log and changelog | P00 Assessment & Planning | P00-02 | `docs/DECISION_LOG.md` | Lead / Architect | 0.5 d | Completed | Owned by the lead; referenced, not written, here |
| P00-07 | G1 Project Understanding: review package and approval | P00 Assessment & Planning | P00-02, P00-03, P00-04, P00-05, P00-06 | `Gate entry in this workflow; approval recorded in docs/DECISION_LOG.md` | TPM / QA Lead | 0.5 d | Completed | — |
| P01-01 | Requirements specification | P01 Requirements | P00-07, D-02 | `docs/01-requirements/REQUIREMENTS_SPECIFICATION.md` | TPM / QA Lead | 2 d | Awaiting Review | — |
| P01-02 | Feature inventory with release mapping | P01 Requirements | P00-07, D-02 | `docs/01-requirements/FEATURE_INVENTORY.md` | TPM / QA Lead | 1 d | Awaiting Review | — |
| P01-03 | User roles and permissions | P01 Requirements | P00-07 | `docs/01-requirements/USER_ROLES.md` | TPM / QA Lead | 0.5 d | Awaiting Review | — |
| P01-04 | User journeys with acceptance scenarios | P01 Requirements | P01-01, P01-03 | `docs/01-requirements/USER_JOURNEYS.md` | TPM / QA Lead | 1.5 d | Awaiting Review | — |
| P01-05 | Business rules | P01 Requirements | P01-01, D-03 | `docs/01-requirements/BUSINESS_RULES.md` | TPM / QA Lead | 1 d | Awaiting Review | — |
| P01-06 | Open questions register | P01 Requirements | P01-01 | `docs/01-requirements/OPEN_QUESTIONS.md` | TPM / QA Lead | 0.5 d | Awaiting Review | — |
| P01-07 | Requirements review checkpoint | P01 Requirements | P01-01, P01-02, P01-03, P01-04, P01-05, P01-06 | `Review notes appended to docs/01-requirements/REQUIREMENTS_SPECIFICATION.md` | TPM / QA Lead | 0.5 d | Completed | Review checkpoint; formal approval at G2 |
| P02-01 | System architecture | P02 Architecture | P01-07 | `docs/02-architecture/SYSTEM_ARCHITECTURE.md` | Lead / Architect | 1.5 d | Awaiting Review | Written 2026-11-13; review at P02-13 (T-04) |
| P02-02 | Technology stack | P02 Architecture | P00-02, P01-07 | `docs/02-architecture/TECHNOLOGY_STACK.md` | Lead / Architect | 0.5 d | Awaiting Review | Written 2026-11-13; review at P02-13 (T-04) |
| P02-03 | Frontend architecture | P02 Architecture | P02-01 | `docs/02-architecture/FRONTEND_ARCHITECTURE.md` | Lead / Architect | 1.5 d | Awaiting Review | Written 2026-11-13; review at P02-13 (T-04) |
| P02-04 | Backend architecture | P02 Architecture | P02-01, D-11 | `docs/02-architecture/BACKEND_ARCHITECTURE.md` | Lead / Architect | 1.5 d | Awaiting Review | Written 2026-11-13; review at P02-13 (T-04) |
| P02-05 | Security architecture | P02 Architecture | P02-01, D-03, D-12 | `docs/02-architecture/SECURITY_ARCHITECTURE.md` | Lead / Architect | 1.5 d | Awaiting Review | Written 2026-11-13; review at P02-13 (T-04) |
| P02-06 | Data flow diagrams | P02 Architecture | P02-03, P02-04 | `docs/02-architecture/DATA_FLOW_DIAGRAM.md` | Lead / Architect | 1 d | Awaiting Review | Written 2026-11-13; review at P02-13 (T-04) |
| P02-07 | SPIKE-01 Turso full-text search (FTS5 vs Tantivy `USING fts`) | P02 Architecture | P00-07, D-13 | `spikes/spike-01-fts/ (throwaway)` | Lead / Architect | 1.5 d | Blocked | Local part done 2026-11-12 (ADR-001, T-05a passed). Remaining: Turso Cloud re-check, blocked by B-15 |
| P02-08 | SPIKE-02 Turso transactions and per-connection `PRAGMA foreign_keys=ON` with Drizzle | P02 Architecture | P00-07, D-13 | `spikes/spike-02-tx-fk/ (throwaway)` | Lead / Architect | 1 d | Blocked | Local part done 2026-11-12 (ADR-002, T-06a passed). Remaining: remote HTTP re-check, blocked by B-15 |
| P02-09 | SPIKE-03 Better Auth on Drizzle/libSQL | P02 Architecture | P00-07, D-13, D-04 | `spikes/spike-03-auth/ (throwaway)` | Lead / Architect | 1.5 d | Blocked | Email-OTP part done 2026-11-12 (ADR-003, T-07a passed). Remaining: Google sign-in, blocked by B-16 |
| P02-10 | SPIKE-04 R2 presigned upload + sharp derivatives (Node runtime) | P02 Architecture | P00-07, D-13, D-10 | `spikes/spike-04-media/ (throwaway)` | Lead / Architect | 1.5 d | Blocked | sharp half done 2026-11-12 (ADR-004, T-08a passed). Remaining: R2 presigned upload, blocked by B-11 (D-10) |
| P02-11 | SPIKE-05 Deployment target build | P02 Architecture | P00-07, D-13, D-09 | `spikes/spike-05-deploy/ (throwaway)` | Lead / Architect | 1 d | Blocked | Blocked by B-10 (host account). Local `next build` of the spike app succeeds |
| P02-12 | Architecture decisions (ADRs) | P02 Architecture | P02-01, P02-02, P02-03, P02-04, P02-05, P02-06, P02-07, P02-08, P02-09, P02-10, P02-11 | `docs/02-architecture/ARCHITECTURE_DECISIONS.md` | Lead / Architect | 1 d | Not Started | — |
| P02-13 | Architecture review checkpoint | P02 Architecture | P02-12 | `Review notes in docs/02-architecture/ARCHITECTURE_DECISIONS.md` | TPM / QA Lead | 0.5 d | Not Started | Review checkpoint; formal approval at G2 |
| P03-01 | Database design | P03 Database | P02-13, P01-05 | `docs/03-database/DATABASE_DESIGN.md` | Lead / Architect | 1.5 d | Awaiting Review | Written 2026-11-13 from the implemented schema: `docs/03-database/DATABASE_DESIGN.md` |
| P03-02 | Entity relationship diagram | P03 Database | P03-01 | `docs/03-database/ERD.md` | Lead / Architect | 0.5 d | Awaiting Review | ERD is DATABASE_DESIGN §2 (Mermaid), not a separate file |
| P03-03 | Database schema specification | P03 Database | P03-01, P02-09 | `docs/03-database/DATABASE_SCHEMA.md` | Lead / Architect | 2 d | Awaiting Review | `docs/03-database/DATABASE_SCHEMA.md`; drift check: no schema changes |
| P03-04 | Migration plan | P03 Database | P03-03 | `docs/03-database/MIGRATION_PLAN.md` | Lead / Architect | 1 d | Awaiting Review | Migration practice recorded in DATABASE_SCHEMA §5 and DATABASE_DESIGN §1 (add-only migrations, `generate` + `migrate`, `db:verify`); separate MIGRATION_PLAN file not written |
| P03-05 | Database test plan | P03 Database | P03-03 | `docs/03-database/DATABASE_TEST_PLAN.md` | TPM / QA Lead | 1 d | Not Started | — |
| P03-06 | Database review checkpoint | P03 Database | P03-02, P03-04, P03-05 | `Review notes in docs/03-database/DATABASE_DESIGN.md` | TPM / QA Lead | 0.5 d | Not Started | Review checkpoint; formal approval at G2 |
| P04-01 | API response conventions | P04 API | P02-04 | `docs/04-api/API_RESPONSE_CONVENTIONS.md` | Lead / Architect | 1 d | Awaiting Review | Written 2026-11-13; review at T-13 |
| P04-02 | API endpoint inventory | P04 API | P04-01, P03-03 | `docs/04-api/API_ENDPOINT_INVENTORY.md` | Lead / Architect | 1 d | Awaiting Review | Inventory is API_SPECIFICATION §2 (E-01…E-19) |
| P04-03 | API specification | P04 API | P04-02 | `docs/04-api/API_SPECIFICATION.md` | Lead / Architect | 2.5 d | Awaiting Review | `docs/04-api/API_SPECIFICATION.md`; Route Handlers per A-20 |
| P04-04 | API testing plan | P04 API | P04-03 | `docs/04-api/API_TESTING_PLAN.md` | TPM / QA Lead | 1 d | Awaiting Review | `docs/04-api/API_TESTING_PLAN.md` incl. execution record |
| P04-05 | G2 Technical Specification: review package and approval | P04 API | P01-07, P02-13, P03-06, P04-04 | `Gate entry in this workflow; approval in docs/DECISION_LOG.md` | TPM / QA Lead | 0.5 d | Not Started | — |
| P05-01 | Frontend design constitution | P05 Design Constitution | P00-07, D-01 | `docs/05-design-system/FRONTEND_DESIGN_CONSTITUTION.md` | Designer | 1 d | Awaiting Review | v1 approved at G3 (A-15); identity v2 revision (A-16) awaiting review at G3-R2 |
| P05-02 | Colour system and contrast refinement proposal | P05 Design Constitution | P00-07 | `docs/05-design-system/COLOR_SYSTEM.md` | Designer | 1.5 d | Awaiting Review | v1 approved at G3 (A-15); identity v2 revision (A-16) awaiting review at G3-R2 |
| P05-03 | Typography system | P05 Design Constitution | P00-07, D-06 | `docs/05-design-system/TYPOGRAPHY_SYSTEM.md` | Designer | 0.5 d | Awaiting Review | v1 approved at G3 (A-15); identity v2 revision (A-16) awaiting review at G3-R2 |
| P05-04 | Design tokens | P05 Design Constitution | P05-02, P05-03, D-05 | `docs/05-design-system/DESIGN_TOKENS.md` | Designer | 1 d | Awaiting Review | v1 approved at G3 (A-15); identity v2 revision (A-16) awaiting review at G3-R2 |
| P05-05 | Design system catalogue | P05 Design Constitution | P05-04, P01-04 | `docs/05-design-system/DESIGN_SYSTEM.md` | Designer | 1.5 d | Awaiting Review | v1 approved at G3 (A-15); identity v2 revision (A-16) awaiting review at G3-R2 |
| P05-06 | Component guidelines | P05 Design Constitution | P05-05 | `docs/05-design-system/COMPONENT_GUIDELINES.md` | Designer | 1.5 d | Awaiting Review | v1 approved at G3 (A-15); identity v2 revision (A-16) awaiting review at G3-R2 |
| P05-07 | G3 Design Foundation: validation and approval | P05 Design Constitution | P05-01, P05-02, P05-03, P05-04, P05-05, P05-06 | `Gate entry in this workflow; approval in docs/DECISION_LOG.md` | TPM / QA Lead | 1 d | Awaiting Review | G3 approved 2026-11-13 (A-15); revision G3-R2 (identity v2, A-16) awaiting review with D-26 |
| P06-01 | Information architecture | P06 UI/UX Design & Prototyping | P01-02, P01-04, P05-01 | `docs/06-ui-ux/INFORMATION_ARCHITECTURE.md` | Designer | 1 d | Awaiting Review | — |
| P06-02 | Application sitemap | P06 UI/UX Design & Prototyping | P06-01 | `docs/06-ui-ux/APPLICATION_SITEMAP.md` | Designer | 0.5 d | Awaiting Review | — |
| P06-03 | Wireframe specification | P06 UI/UX Design & Prototyping | P06-02 | `docs/06-ui-ux/WIREFRAME_SPECIFICATION.md` | Designer | 2.5 d | Awaiting Review | — |
| P06-04 | Prototype workspace and screenshot harness | P06 UI/UX Design & Prototyping | P05-07, D-13 | `prototypes/ (static HTML/CSS, outside src)` | Designer | 1 d | Completed | Done 2026-11-13: workspace, template, state switcher, index of 22 R1 surfaces, one-command harness; T-18 smoke passed. Figma not used (not authorised) |
| P06-05 | High-fidelity prototypes: R1 screens | P06 UI/UX Design & Prototyping | P06-03, P06-04 | `prototypes/r1/` | Designer | 5 d | Not Started | On hold until G3-R2 (identity v2) is approved |
| P06-06 | High-fidelity prototypes: R2 screens | P06 UI/UX Design & Prototyping | P06-05 | `prototypes/r2/` | Designer | 4 d | Not Started | Approved in the G4-R2 increment (P07-07) |
| P06-07 | High-fidelity prototypes: R3 screens | P06 UI/UX Design & Prototyping | P06-06 | `prototypes/r3/` | Designer | 3 d | Not Started | Approved in the G4-R3 increment (P07-07) |
| P06-08 | High-fidelity design inventory | P06 UI/UX Design & Prototyping | P06-05 | `docs/06-ui-ux/HIGH_FIDELITY_DESIGN_INVENTORY.md` | Designer | 0.5 d | Not Started | Updated again after P06-06 and P06-07 |
| P06-09 | Responsive design specification | P06 UI/UX Design & Prototyping | P06-03 | `docs/06-ui-ux/RESPONSIVE_DESIGN.md` | Designer | 1 d | Awaiting Review | — |
| P06-10 | Design review | P06 UI/UX Design & Prototyping | P06-05, P06-08, P06-09 | `docs/06-ui-ux/DESIGN_REVIEW.md` | Designer | 1 d | Not Started | — |
| P07-01 | Design QA checklist execution | P07 Design Testing & Validation | P06-10 | `docs/08-testing/design/DESIGN_QA_CHECKLIST.md` | TPM / QA Lead | 1 d | Not Started | — |
| P07-02 | Responsive validation | P07 Design Testing & Validation | P06-10 | `docs/08-testing/design/RESPONSIVE_VALIDATION_REPORT.md` | TPM / QA Lead | 1.5 d | Not Started | — |
| P07-03 | Accessibility review of prototypes | P07 Design Testing & Validation | P06-10 | `docs/08-testing/design/ACCESSIBILITY_REVIEW.md` | TPM / QA Lead | 1.5 d | Not Started | — |
| P07-04 | Usability review | P07 Design Testing & Validation | P06-10 | `docs/08-testing/design/USABILITY_REVIEW.md` | TPM / QA Lead | 1 d | Not Started | — |
| P07-05 | Design fix iteration | P07 Design Testing & Validation | P07-01, P07-02, P07-03, P07-04 | `Updated prototypes/r1/` | Designer | 2 d | Not Started | — |
| P07-06 | G4 UI/UX Approval: design approval record (R1) | P07 Design Testing & Validation | P07-05 | `docs/08-testing/design/DESIGN_APPROVAL_RECORD.md` | TPM / QA Lead | 0.5 d | Not Started | — |
| P07-07 | Design validation increments for R2 and R3 (G4-R2, G4-R3) | P07 Design Testing & Validation | P06-06, P06-07, P07-06 | `docs/08-testing/design/DESIGN_APPROVAL_RECORD.md (R2, R3 sections)` | TPM / QA Lead | 3 d | Not Started | — |
| P08-01 | Repository configuration | P08 Development Environment | P04-05, D-13 | `Git remote, branch protection, .gitignore, PR template` | Developer | 0.5 d | Not Started | git init itself happens when D-13 is approved (needed by spikes) |
| P08-02 | Development setup and application scaffold | P08 Development Environment | P08-01 | `docs/07-development/DEVELOPMENT_SETUP.md` | Developer | 1.5 d | Not Started | — |
| P08-03 | Project structure | P08 Development Environment | P08-02 | `docs/07-development/PROJECT_STRUCTURE.md` | Developer | 0.5 d | Not Started | — |
| P08-04 | Coding standards | P08 Development Environment | P08-03 | `docs/07-development/CODING_STANDARDS.md` | Developer | 0.5 d | Not Started | — |
| P08-05 | Environment configuration | P08 Development Environment | P08-02, D-10 | `docs/07-development/ENVIRONMENT_CONFIGURATION.md` | Developer | 1 d | Not Started | Needs Turso and R2 accounts |
| P08-06 | Database tooling (Drizzle, migrations, seed framework) | P08 Development Environment | P08-05, P03-04 | `drizzle config, src/server/db` | Developer | 2 d | Completed | Drizzle config, migrations, `reset-db`, `seed` (deterministic, generated licence-free media), reference data |
| P08-07 | Testing configuration | P08 Development Environment | P08-02 | `docs/07-development/TESTING_CONFIGURATION.md` | Developer | 1.5 d | Completed | `vitest.config.ts` (fresh DB per file), `playwright.config.ts` (next start + seeded DB); documented in API_TESTING_PLAN §2 |
| P08-08 | CI pipeline | P08 Development Environment | P08-07, P08-04 | `.github/workflows (or host equivalent per D-13)` | Developer | 1.5 d | Not Started | — |
| P08-09 | Walking skeleton deployed to preview | P08 Development Environment | P08-06, P08-08, D-09 | `Preview deployment with /api/health` | Developer | 1 d | Not Started | — |
| P08-10 | G5 Development Readiness: review and approval | P08 Development Environment | P08-01, P08-02, P08-03, P08-04, P08-05, P08-06, P08-07, P08-08, P08-09, P05-07 | `Gate entry in this workflow; approval in docs/DECISION_LOG.md` | TPM / QA Lead | 0.5 d | Not Started | — |
| P09-01 | [R1] Server foundation (db client, transactions, errors, validation, logging, rate-limit adapter, authz helpers) | P09 Backend Implementation | P08-10, P02-08, D-12 | `src/modules/_core/ (server)` | Developer | 3 d | Awaiting Review | Done 2026-11-13: db client, errors, problem details, `route()` wrapper, origin check, rate limiter, logger, env. ESLint rules L-01…L-08 not configured (P08-03) |
| P09-02 | [R1] Seed data generator | P09 Backend Implementation | P09-01, P03-03 | `src/modules/_seed/ (server)` | Developer | 2.5 d | Completed | `scripts/seed.ts`: 12 people, 2 teams, 64 shots, 89 generated images |
| P09-03 | [R1] Auth module: sign-up/sign-in (methods per D-03), Google OAuth, sessions, guards | P09 Backend Implementation | P09-01, P02-09, D-03, D-04, D-08, D-12 | `src/modules/auth/ (server)` | Developer | 5 d | Awaiting Review | Email-code sign-in, sessions, guards, onboarding done and E2E-tested; Google sign-in blocked by B-16 |
| P09-04 | [R1] Users/profiles read model | P09 Backend Implementation | P09-01, P09-02 | `src/modules/users/ (server)` | Developer | 2 d | Awaiting Review | Profiles read model + onboarding; integration + API tests pass |
| P09-05 | [R1] Shots/content read model | P09 Backend Implementation | P09-04 | `src/modules/shots/ (server)` | Developer | 4 d | Awaiting Review | Detail + card read model; tests pass |
| P09-06 | [R1] Discovery/feed queries | P09 Backend Implementation | P09-05 | `src/modules/discovery/ (server)` | Developer | 3 d | Awaiting Review | Feeds, timeframes, more-by, related, profile feed; tests pass |
| P09-07 | [R1] Search and tags | P09 Backend Implementation | P09-05, P02-07, D-07 | `src/modules/search/ (server)` | Developer | 4 d | Awaiting Review | FTS5 search, related tags, tag index/page; tests pass |
| P09-08 | [R1] Likes | P09 Backend Implementation | P09-03, P09-05 | `src/modules/likes/ (server)` | Developer | 1.5 d | Awaiting Review | Set-semantics likes, atomic counters, concurrency test; tests pass |
| P09-09 | [R1] View logging and counts | P09 Backend Implementation | P09-05, D-11 | `src/modules/views/ (server)` | Developer | 2 d | Awaiting Review | Beacon + `after()`, daily dedup, reconcile; tests pass |
| P09-10 | [R2] Media/uploads: presigned R2, validation, sharp derivatives, palette | P09 Backend Implementation | P11-08, P02-10, D-10, D-11 | `src/modules/media/ (server)` | Developer | 6 d | Awaiting Review | Done 2026-11-13 (backend): ImageKit signed direct upload + server read-back validation (A-29), local provider for dev/tests, magic bytes, limits, palette + Lab; uploads.test 8/8. Live ImageKit smoke test awaits approval |
| P09-11 | [R2] Shot composer: create/edit/delete/draft/publish | P09 Backend Implementation | P09-10 | `src/modules/shots/ (server)` | Developer | 5 d | Awaiting Review | Done 2026-11-13 (backend): `composer` module, drafts/publish/edit/delete/purge, tags, team attribution, quotas, prev/next; composer.test 7/7 |
| P09-12 | [R2] Users/profiles: onboarding, profile edit, settings, account deletion | P09 Backend Implementation | P11-08, P09-10 | `src/modules/users/ (server)` | Developer | 3 d | Awaiting Review | Done 2026-11-13 (backend): profile settings, full onboarding details, username change with holds (BR-23), sessions, email change and self-service deletion with step-up codes; account.test 7/7 |
| P09-13 | [R2] Collections | P09 Backend Implementation | P11-08 | `src/modules/collections/ (server)` | Developer | 3 d | Awaiting Review | Done 2026-11-13 (backend): collections, save picker, Liked tab; collections.test 8/8 |
| P09-14 | [R2] Follows | P09 Backend Implementation | P11-08 | `src/modules/follows/ (server)` | Developer | 2 d | Awaiting Review | Done 2026-11-13 (backend): follows + lists + profile follow state; follows.test 6/6 |
| P09-15 | [R2] Comments | P09 Backend Implementation | P11-08 | `src/modules/comments/ (server)` | Developer | 3.5 d | Awaiting Review | Done 2026-11-13 (backend): comments, replies, edit window, delete/placeholder, likes, disable; comments.test 11/11 |
| P09-16 | [R2] Teams and members | P09 Backend Implementation | P09-12 | `src/modules/teams/ (server)` | Developer | 3 d | Awaiting Review | Done 2026-11-13 (backend): teams, invitations, roles, transfer, delete, attribution removal; teams.test 5/5 |
| P09-17 | [R2] Discovery: popularity ranking job | P09 Backend Implementation | P11-08, D-11 | `src/modules/discovery/ (server)` | Developer | 2.5 d | Awaiting Review | Done 2026-11-13: BR-33 R2 formula (saves, non-author comments) in the daily job; search-r2.test |
| P09-18 | [R2] Search: header search types (shots/designers) and autocomplete | P09 Backend Implementation | P11-08, P09-07 | `src/modules/search/ (server)` | Developer | 2 d | Awaiting Review | Done 2026-11-13 (backend): designer search + autocomplete; search-r2.test 4/4 |
| P09-19 | [R2] Jobs: list, filters, detail, free posting | P09 Backend Implementation | P11-08 | `src/modules/jobs/ (server)` | Developer | 4 d | Awaiting Review | Done 2026-11-13 (backend): jobs board, filters, sanitised posting, close/expiry; jobs.test 6/6 |
| P09-20 | [R3] Notifications | P09 Backend Implementation | P11-09, D-11 | `src/modules/notifications/ (server)` | Developer | 4 d | Not Started | — |
| P09-21 | [R3] Block user | P09 Backend Implementation | P11-09 | `src/modules/follows/ (server)` | Developer | 1.5 d | Not Started | — |
| P09-22 | [R3] Messaging (Get in touch) | P09 Backend Implementation | P11-09, P09-20 | `src/modules/messaging/ (server)` | Developer | 6 d | Not Started | — |
| P09-23 | [R3] Media: video/GIF teasers | P09 Backend Implementation | P11-09 | `src/modules/media/ (server)` | Developer | 5 d | Not Started | Needs a video-processing decision (ID to be assigned by the lead) |
| P09-24 | [R3] Search: colour search (CIELAB) | P09 Backend Implementation | P11-09 | `src/modules/search/ (server)` | Developer | 2.5 d | Not Started | — |
| P09-25 | [R3] Hire directory | P09 Backend Implementation | P11-09 | `src/modules/hire/ (server)` | Developer | 3 d | Not Started | — |
| P09-26 | [R3] Services listing (no ordering/payments) | P09 Backend Implementation | P09-25 | `src/modules/hire/ (server)` | Developer | 5 d | Not Started | — |
| P09-27 | [R3] SEO data: sitemaps and structured data | P09 Backend Implementation | P11-09 | `src/modules/seo/ (server)` | Developer | 2 d | Not Started | — |
| P09-28 | [R3] Analytics events ingestion | P09 Backend Implementation | P11-09 | `src/modules/analytics/ (server)` | Developer | 2 d | Not Started | — |
| P09-29 | [R1] Moderation (minimal): admin-script suspend/hide with audit log | P09 Backend Implementation | P09-04, P09-05 | `src/modules/moderation/ (server)`, `scripts/moderation/` | Developer | 2 d | Awaiting Review | `npm run moderate` CLI + audited service; tests pass |
| P09-30 | [R2] Moderation: content reports and review queue | P09 Backend Implementation | P09-29, P09-15, P11-08 | `src/modules/moderation/ (server)` | Developer | 3 d | Awaiting Review | Done 2026-11-13 (backend): reports, grouped queue, decisions, direct staff actions, audit; reports.test 4/4 |
| P10-01 | [R1] Design tokens in Tailwind theme and global styles | P10 Frontend Implementation | P08-10, P05-07 | `src/app/ routes + src/modules/*/ui` | Developer | 2 d | In Progress | Design-system CSS imported in the root layout; Tailwind theme deferred (A-21); Inter via next/font pending |
| P10-02 | [R1] Base primitives | P10 Frontend Implementation | P10-01 | `src/app/ routes + src/modules/*/ui` | Developer | 5 d | In Progress | Avatar, Icon, ShotCard, LikeButton, SearchForm, FilterBar built on design-system classes |
| P10-03 | [R1] App shell: header, mobile drawer, menus, footer, layouts | P10 Frontend Implementation | P10-02, P07-06 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | In Progress | Header, account menu, footer, layouts done; mobile drawer (C04) missing |
| P10-04 | [R1] Auth UI: sign in/up, OTP entry, Google button, auth-gate modal | P10 Frontend Implementation | P10-03, P09-03 | `src/app/ routes + src/modules/*/ui` | Developer | 4 d | In Progress | Login/signup/OTP/onboarding done and E2E-tested; auth-gate is a page, not a modal; Google button hidden (B-16) |
| P10-05 | [R1] Discovery/feed UI: ShotGrid, ShotCard, infinite scroll, filter bar | P10 Frontend Implementation | P10-03, P09-06 | `src/app/ routes + src/modules/*/ui` | Developer | 6 d | Awaiting Review | ShotGrid with infinite scroll + no-JS Load more, filter bar; J1, J3, J3b pass |
| P10-06 | [R1] Shot detail UI: content blocks, action rail, share/details modals, related | P10 Frontend Implementation | P10-05, P09-05 | `src/app/ routes + src/modules/*/ui` | Developer | 5 d | In Progress | Detail page, share, more-by, related done; Share/Details modals not built (inline details) |
| P10-07 | [R1] Profile UI: header, Work tab, About tab | P10 Frontend Implementation | P10-05, P09-04 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | Awaiting Review | Profile header, Work and About tabs; J1 passes |
| P10-08 | [R1] Search and tags UI | P10 Frontend Implementation | P10-05, P09-07 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | Awaiting Review | Search page, tag index and tag pages; J1, J3 pass |
| P10-09 | [R1] Likes UI (optimistic, gated) | P10 Frontend Implementation | P10-04, P10-05, P09-08 | `src/app/ routes + src/modules/*/ui` | Developer | 1.5 d | Awaiting Review | Optimistic like with rollback, intent completion; J5, J6 pass |
| P10-10 | [R1] View tracking client (batched) | P10 Frontend Implementation | P10-06, P09-09 | `src/app/ routes + src/modules/*/ui` | Developer | 1 d | Awaiting Review | ViewBeacon; J4 passes |
| P10-11 | [R1] Homepage | P10 Frontend Implementation | P10-05, P10-08 | `src/app/ routes + src/modules/*/ui` | Developer | 2.5 d | Awaiting Review | Homepage hero + popular feed; J1 passes |
| P10-12 | [R2] Upload and shot composer UI | P10 Frontend Implementation | P09-10, P09-11, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 7 d | Not Started | — |
| P10-13 | [R2] Onboarding, profile edit, settings UI | P10 Frontend Implementation | P09-12, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 4 d | Not Started | — |
| P10-14 | [R2] Collections UI and Liked Shots tab | P10 Frontend Implementation | P09-13, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 4 d | Not Started | — |
| P10-15 | [R2] Follows UI | P10 Frontend Implementation | P09-14, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 2 d | Not Started | — |
| P10-16 | [R2] Comments UI | P10 Frontend Implementation | P09-15, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | Not Started | — |
| P10-17 | [R2] Teams UI | P10 Frontend Implementation | P09-16, P10-13 | `src/app/ routes + src/modules/*/ui` | Developer | 2.5 d | Not Started | — |
| P10-18 | [R2] Ranking timeframe UI, header search types + autocomplete, prev/next | P10 Frontend Implementation | P09-17, P09-18, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | Not Started | — |
| P10-19 | [R2] Jobs UI: board, filters, detail, post wizard | P10 Frontend Implementation | P09-19, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 5 d | Not Started | — |
| P10-20 | [R3] Notifications UI | P10 Frontend Implementation | P09-20, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | Not Started | — |
| P10-21 | [R3] Block UI | P10 Frontend Implementation | P09-21 | `src/app/ routes + src/modules/*/ui` | Developer | 1 d | Not Started | — |
| P10-22 | [R3] Messaging UI | P10 Frontend Implementation | P09-22, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 5 d | Not Started | — |
| P10-23 | [R3] Video teasers and colour search UI | P10 Frontend Implementation | P09-23, P09-24, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | Not Started | — |
| P10-24 | [R3] Hire directory and services UI | P10 Frontend Implementation | P09-25, P09-26, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 6 d | Not Started | — |
| P10-25 | [R3] SEO metadata/OG/JSON-LD, analytics client, cookie consent, custom 404 | P10 Frontend Implementation | P09-27, P09-28, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 4 d | Not Started | — |
| P10-26 | [R1] Moderation visibility UI | P10 Frontend Implementation | P09-29, P10-06 | `src/app/ routes + src/modules/*/ui` | Developer | 1 d | Awaiting Review | Hidden/suspended staff alerts on detail and profile |
| P10-27 | [R2] Report button and staff review queue page | P10 Frontend Implementation | P09-30, P07-07 | `src/app/ routes + src/modules/*/ui` | Developer | 3 d | Not Started | Approved via OQ-04 (A-14) |
| P11-01 | System test execution (R1) | P11 System Integration & QA | All G6-*-R1 gates passed | `docs/08-testing/SYSTEM_TEST_REPORT.md` | TPM / QA Lead | 2 d | Not Started | — |
| P11-02 | End-to-end journey tests (R1) | P11 System Integration & QA | All G6-*-R1 gates passed | `docs/08-testing/END_TO_END_TEST_REPORT.md` | TPM / QA Lead | 2 d | Not Started | — |
| P11-03 | Regression and visual regression baseline (R1) | P11 System Integration & QA | P11-01, P11-02 | `docs/08-testing/REGRESSION_TEST_REPORT.md` | TPM / QA Lead | 1.5 d | Not Started | — |
| P11-04 | Security testing (R1) | P11 System Integration & QA | All G6-*-R1 gates passed | `docs/08-testing/SECURITY_TEST_REPORT.md` | TPM / QA Lead | 2 d | Not Started | — |
| P11-05 | Performance testing (R1) | P11 System Integration & QA | All G6-*-R1 gates passed | `docs/08-testing/PERFORMANCE_TEST_REPORT.md` | TPM / QA Lead | 2 d | Not Started | — |
| P11-06 | Defect triage and fix cycle (R1) | P11 System Integration & QA | P11-01, P11-02, P11-04, P11-05 | `docs/08-testing/DEFECT_REGISTER.md` | Developer | 3 d | Not Started | — |
| P11-07 | Accessibility audit of the built app (R1) | P11 System Integration & QA | All G6-*-R1 gates passed | `docs/08-testing/SYSTEM_TEST_REPORT.md (accessibility section)` | TPM / QA Lead | 1.5 d | Not Started | — |
| P11-08 | G7 System Quality Approval (R1) | P11 System Integration & QA | P11-03, P11-06, P11-07 | `Gate entry; approval in docs/DECISION_LOG.md` | TPM / QA Lead | 0.5 d | Not Started | — |
| P11-09 | QA cycle and G7 for R2 | P11 System Integration & QA | All G6-*-R2 gates passed | `docs/08-testing/* (R2 sections in each report)` | TPM / QA Lead | 6 d | Not Started | — |
| P11-10 | QA cycle and G7 for R3 | P11 System Integration & QA | All G6-*-R3 gates passed | `docs/08-testing/* (R3 sections in each report)` | TPM / QA Lead | 6 d | Not Started | — |
| P12-01 | Deployment plan | P12 Deployment & Production Readiness | P08-09, D-09 | `docs/09-deployment/DEPLOYMENT_PLAN.md` | Lead / Architect | 1 d | Not Started | — |
| P12-02 | Production configuration | P12 Deployment & Production Readiness | P12-01, D-01, D-08, D-10 | `docs/09-deployment/PRODUCTION_CONFIGURATION.md` | Lead / Architect | 1.5 d | Not Started | — |
| P12-03 | Backup and recovery plan | P12 Deployment & Production Readiness | P12-02 | `docs/09-deployment/BACKUP_AND_RECOVERY_PLAN.md` | Lead / Architect | 1.5 d | Not Started | — |
| P12-04 | Monitoring and alerting | P12 Deployment & Production Readiness | P12-02 | `docs/09-deployment/PRODUCTION_CONFIGURATION.md (monitoring section)` | Lead / Architect | 1.5 d | Not Started | Monitoring tool decision has no ID yet |
| P12-05 | Production checklist execution | P12 Deployment & Production Readiness | P12-02, P12-03, P12-04, P11-08 | `docs/09-deployment/PRODUCTION_CHECKLIST.md` | TPM / QA Lead | 1 d | Not Started | — |
| P12-06 | R1 production deployment and smoke tests | P12 Deployment & Production Readiness | P12-05 | `Production deployment` | Developer | 1 d | Not Started | — |
| P12-07 | Release report and G8 Production Approval (R1) | P12 Deployment & Production Readiness | P12-06 | `docs/09-deployment/RELEASE_REPORT.md` | TPM / QA Lead | 0.5 d | Not Started | — |
| P12-08 | R2 release (deploy, smoke, report, G8-R2) | P12 Deployment & Production Readiness | P11-09 | `docs/09-deployment/RELEASE_REPORT.md (R2 section)` | Developer | 2 d | Not Started | — |
| P12-09 | R3 release (deploy, smoke, report, G8-R3) | P12 Deployment & Production Readiness | P11-10 | `docs/09-deployment/RELEASE_REPORT.md (R3 section)` | Developer | 2 d | Not Started | — |
