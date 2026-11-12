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
| [02-architecture/](02-architecture/ARCHITECTURE_DECISIONS.md) | P02 | Spike ADRs written; architecture docs not started |
| `03-database/` | P03 | Not started |
| `04-api/` | P04 | Not started |
| [05-design-system/](05-design-system/DESIGN_SYSTEM.md) | P05 | Awaiting review (G3); T-16 fixes in progress |
| `06-ui-ux/` | P06 | In progress (IA, sitemap, wireframes) |
| `07-development/` | P08 | Not started |
| [08-testing/](08-testing/design/T-15_CONTRAST_REPORT.md) | P07 design QA and P11 system QA | Design reports T-15, T-16, T-33 |
| `09-deployment/` | P12 | Not started |

## Source layout (planned, created in P08)

```text
drizzle/migrations/        Drizzle Kit migrations
src/app/                   Next.js App Router: (public) (auth) (dashboard) api/
src/components/            ui/ shared/ features/
src/modules/               feature modules (auth, users, shots, media, …)
src/server/                services/ repositories/ validation/ integrations/ db/
src/lib/ src/hooks/ src/types/ src/styles/
tests/unit/ tests/integration/ tests/e2e/
```
