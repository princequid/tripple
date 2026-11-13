# Project Documentation

Start here. **Always consult [MASTER_PROJECT_WORKFLOW.md](MASTER_PROJECT_WORKFLOW.md) before beginning new work**, check dependencies in [TASK_TRACKER.md](TASK_TRACKER.md), and record decisions in [DECISION_LOG.md](DECISION_LOG.md).

## Project management (living documents)

| Document | Purpose |
|---|---|
| [MASTER_PROJECT_WORKFLOW.md](MASTER_PROJECT_WORKFLOW.md) | Phases P00–P12, tasks, dependencies, acceptance criteria, gates G1–G8 |
| [TASK_TRACKER.md](TASK_TRACKER.md) | Flat task list with statuses (Not Started · In Progress · Blocked · Awaiting Review · Approved · Completed) |
| [DECISION_LOG.md](DECISION_LOG.md) | Approved (A-xx), pending (D-xx), facts (F-xx), superseded (S-xx) |
| [BLOCKERS_AND_RISKS.md](BLOCKERS_AND_RISKS.md) | Current blockers and the risk register |
| [TESTING_PROGRESS.md](TESTING_PROGRESS.md) | Test plan and executed results (never claims an unexecuted pass) |
| [CHANGELOG.md](CHANGELOG.md) | Important changes, newest first |
| [FRONTEND_DESIGN_CONSTITUTION.md](FRONTEND_DESIGN_CONSTITUTION.md) | **Permanent** visual-identity rules (user-authored, verbatim). Implemented by `05-design-system/` and [`design-system/`](../design-system/README.md) |

## Phase folders

Folders are created when their phase produces content, so there are no empty placeholder documents. Planned deliverables per folder are listed in the master workflow.

| Folder | Phase | Status |
|---|---|---|
| [reverse-engineering/](reverse-engineering/) | Pre-P00: analysis of the reference product | Completed |
| [00-project-assessment/](00-project-assessment/PROJECT_ASSESSMENT.md) | P00: assessment and technology evaluation | Completed (G1 approved) |
| [01-requirements/](01-requirements/REQUIREMENTS_SPECIFICATION.md) | P01 | Awaiting review |
| [02-architecture/](02-architecture/SYSTEM_ARCHITECTURE.md) | P02 | SYSTEM, TECHNOLOGY_STACK, FRONTEND, BACKEND, SECURITY, DATA_FLOW written (Awaiting Review); ADR-001…010; spikes partly blocked on accounts |
| [03-database/](03-database/DATABASE_DESIGN.md) | P03 | DATABASE_DESIGN (with ERD) and DATABASE_SCHEMA written from the implemented R1 schema (Awaiting Review) |
| [04-api/](04-api/API_SPECIFICATION.md) | P04 | API_RESPONSE_CONVENTIONS, API_SPECIFICATION (E-01…E-19), API_TESTING_PLAN with execution record (Awaiting Review) |
| [05-design-system/](05-design-system/DESIGN_SYSTEM.md) | P05 | v1 approved (G3); **identity v2 (Crimson + Warm White) awaiting review (G3-R2)**. Includes [RE_TO_DESIGN_MAPPING](05-design-system/RE_TO_DESIGN_MAPPING.md) |
| `06-ui-ux/` | P06 | In progress (IA, sitemap, wireframes) |
| [07-development/](07-development/BACKEND_PROGRESS_REPORT.md) | P08–P10 | BACKEND_IMPLEMENTATION_PLAN (vertical slices), REVERSE_ENGINEERING_TO_BACKEND_MAPPING, BACKEND_PROGRESS_REPORT |
| [08-testing/](08-testing/design/T-15_CONTRAST_REPORT.md) | P07 design QA and P11 system QA | Design reports T-15, T-16, T-33; [DESIGN_QA_CHECKLIST](08-testing/design/DESIGN_QA_CHECKLIST.md) (foundation run) |
| `09-deployment/` | P12 | Not started |

## Source layout (as built, 2026-11-13; see BACKEND_ARCHITECTURE §0)

```text
src/server/db/{schema,migrations}/   Drizzle schema + Drizzle Kit migrations (FTS5 in a hand-written migration)
src/app/(site) (auth) api/           Next.js App Router pages and Route Handlers
src/components/                      design-system-class components and client islands
src/modules/<name>/                  service.ts · repository.ts · schemas.ts · types.ts per feature
src/server/                          env, db, auth, email, rate-limit, log, errors, http, route
src/lib/                             isomorphic helpers
scripts/                             migrate · reset-db · seed · moderate
tests/unit/ tests/integration/ tests/e2e/
```
