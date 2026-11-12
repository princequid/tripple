# Testing Progress

**Owner:** TPM / QA Lead · **Last updated:** 2026-11-12 · Related: [MASTER_PROJECT_WORKFLOW.md §8 Testing workflow](MASTER_PROJECT_WORKFLOW.md#8-testing-workflow), [TASK_TRACKER.md](TASK_TRACKER.md), [BLOCKERS_AND_RISKS.md](BLOCKERS_AND_RISKS.md)

> **Current state (2026-11-12):** six test activities have actually been executed and passed: T-01, T-02 and the local parts of spikes SPIKE-01…04 (T-05a, T-06a, T-07a, T-08a). Their remote/account-dependent parts are **Test blocked**. Every other suite is **Test planned** or **Not tested**. No application, schema or API exists yet, so no test result is claimed.

---

## 1. Status legend

| Status | Meaning |
|---|---|
| Not tested | Suite identified but its test cases are not designed yet |
| Test planned | Test cases or review criteria are defined (or will be defined by the named task); not executed |
| Test passed | Executed, all cases passed; evidence path recorded |
| Test failed | Executed, at least one case failed; defect IDs recorded |
| Test blocked | Cannot execute because of a blocker (B-xx) or a missing dependency |

A status changes only with evidence: a report file, CI run link or screenshot folder recorded in the Evidence column.

---

## 2. Mandatory testing model

| Validation type | Applies in phase | What is checked | Tooling | Suite IDs |
|---|---|---|---|---|
| Requirements review | P01 | Completeness, testability, traceability feature → FR → journey → test | Manual review + traceability table | T-03 |
| Architecture review | P02 | NFR coverage, security model, module boundaries, spike outcomes | Manual review, ADRs, spike code in `spikes/` | T-04, T-05..T-09 |
| Schema and integrity tests | P03 (design), P09 (execution) | Constraints, FKs, unique rules, counters, migrations | Vitest on a local libSQL file; Drizzle Kit | T-10, T-11, T-12 |
| API contract tests | P04 (design), P09 (execution) | Request/response shapes, status codes, authz, rate limits | Vitest + Zod schemas, direct Route Handler / Server Action invocation | T-13, T-14 |
| Visual consistency | P05, P06 | Token-only styling, constitution compliance, colour contrast | Contrast computation script, manual review | T-15, T-16 |
| Usability review | P06, P07 | Heuristics, task walkthroughs of journeys | Manual (with the user) | T-20 |
| Design QA | P07 | Checklist per screen: states, spacing, copy, branding | Checklist | T-17 |
| Viewport validation | P07, P10 | 1440 / 1280 / 1024 / 768 / 390 / 360 px, no overflow, grid columns | Playwright screenshots | T-18, T-26 |
| Accessibility | P07, P10, P11 | WCAG 2.2 AA, keyboard, focus, 3:1 control boundaries, reduced motion | axe-core (Playwright), manual keyboard / screen reader | T-19, T-27 |
| Toolchain smoke | P08 | Lint, typecheck, sample tests, build, preview deploy | CI | T-21 |
| Unit / integration | P09, P10 | Domain logic; services + repositories on libSQL | Vitest | T-22, T-23 |
| Component / interaction | P10 | Component states, keyboard, optimistic updates | Vitest + React Testing Library | T-24 |
| E2E | P10, P11 | User journeys per release | Playwright | T-25 |
| Regression / security | P11 | Full re-run; authz, CSRF/origin, headers, dependency audit, ZAP, upload fuzzing | Playwright, Vitest, ZAP baseline, package audit | T-30, T-28 |
| Performance | P11 | Core Web Vitals, API p95, Turso read volume | Lighthouse CI, load test tool (to be approved) | T-29 |
| Production smoke | P12 | Key routes and actions on production; restore drill | Playwright smoke project; provider restore | T-31, T-32 |

### Per-phase testing strategy

| Phase | Strategy | Gate it supports |
|---|---|---|
| P00 Assessment & Planning | Consistency review of planning documents (IDs, statuses, links, Mermaid parse) | G1 |
| P01 Requirements | Every R1 feature traced to ≥1 requirement and ≥1 planned test; every rule testable | G2 |
| P02 Architecture | Review against NFRs; each spike has pass/fail criteria, executed on throwaway code | G2 |
| P03 Database | Schema review; integrity and migration test cases designed (≥1 negative case per constraint) | G2 |
| P04 API | Spec review; ≥5 contract cases per R1 endpoint designed | G2 |
| P05 Design Constitution | Automated contrast check of every token pair; visual consistency review | G3 |
| P06 UI/UX Design | Self-review against the constitution; screenshots at 6 widths | G4 |
| P07 Design Validation | Design QA, viewport, accessibility and usability reports; fix and re-run loop | G4 |
| P08 Development Environment | One passing sample of each test type locally and in CI; preview health check | G5 |
| P09 Backend | Unit + integration + contract + integrity per module; coverage ≥ 80% on services | G6 |
| P10 Frontend | Component + E2E + visual regression + axe per module | G6 |
| P11 System QA | Full suites on the release candidate; security and performance; defect triage | G7 |
| P12 Deployment | Production smoke; backup restore drill; 24 h monitoring | G8 |

---

## 3. Test suite register

| ID | Suite | Type | Phase / task | Scope | Status | Evidence / notes |
|---|---|---|---|---|---|---|
| T-01 | Reverse-engineering Mermaid diagram parse | Documentation validation | P00-01 | All Mermaid diagrams in `docs/reverse-engineering/` | **Test passed** | Executed during P00-01 with the Mermaid parser: 10/10 diagrams parsed (result reported by the lead; the diagrams are in [reverse-engineering/](reverse-engineering/04-user-journeys.md)) |
| T-02 | Planning documents consistency check | Documentation review | P00-03..P00-05, P00-07 | Same task IDs, statuses and estimates in the workflow and tracker; only allowed statuses; relative links resolve; Mermaid critical-path diagram parses | Test passed | **Executed 2026-11-12 by the lead:** 144 task IDs in both the workflow and the tracker (0 only in one); 144 workflow task blocks with statuses identical to the tracker; only allowed statuses; 0 broken relative links across all `docs/**/*.md`; Mermaid parser (mermaid 11.4.1): docs root 1/1, reverse-engineering 10/10, 0 failures. The tracker's 149 table rows are the 144 tasks plus 5 repeated in "Current focus" (expected). Re-run after any edit to these files |
| T-03 | Requirements review and traceability | Requirements review | P01-07 | FR/NFR/BR completeness; feature → FR → journey → test | Test passed | Executed 2026-11-12: traceability script (requirements agent) shows 0 untraced R1 features (30/30 → FR → journey → planned E2E); the lead re-checked IDs (94 FR / 40 NFR / 89 BR / 27 OQ unique, no undefined references); the user accepted all defaults (A-14), leaving 0 blocking open questions; Revision 1 applied. Formal approval at G2. Evidence: [REQUIREMENTS_SPECIFICATION §6](01-requirements/REQUIREMENTS_SPECIFICATION.md) |
| T-04 | Architecture review | Architecture review | P02-13 | NFR coverage, security architecture, ADRs | Test planned | Criteria in P02-13 |
| T-05a | SPIKE-01 FTS (local libSQL) | Spike validation | P02-07 | FTS5 vs `USING fts`: latency, ranking, prefix, sync, migrations | Test passed | Executed 2026-11-12: FTS5 p95 31.2 ms / 10k rows; triggers sync ✔; new-engine `USING fts` is experimental (ruled out); `drizzle-kit push` drops FTS triggers (see ADR-001). Evidence `spikes/spike-01-fts/result-*.json` |
| T-05b | SPIKE-01 FTS on Turso Cloud | Spike validation | P02-07 | FTS5 available and p95 latency on a remote Turso DB | Test blocked | Blocked by B-15 (Turso account, D-14) |
| T-06a | SPIKE-02 FK + atomicity (local) | Spike validation | P02-08 | FK enforcement, batch/transaction rollback, CHECK | Test passed | Executed 2026-11-12: FK ON by default locally; orphans rejected; batch fully atomic; tx rollback ✔ (ADR-002). Evidence `spikes/spike-02-tx-fk/result-local.json` |
| T-06b | SPIKE-02 FK + atomicity (remote HTTP) | Spike validation | P02-08 | Same script against Turso Cloud | Test blocked | Blocked by B-15 |
| T-07a | SPIKE-03 Better Auth email OTP | Spike validation | P02-09 | OTP sign-up/in/out, hashed OTP, attempts, RSC session, origin check, DB rate limit, Drizzle migrations | Test passed | Executed 2026-11-12 (ADR-003). Evidence `spikes/spike-03-auth/result-flow*.json` |
| T-07b | SPIKE-03 Google sign-in | Spike validation | P02-09 | Google OAuth sign-in with the Drizzle adapter | Test blocked | Blocked by B-16 (Google OAuth client) |
| T-08a | SPIKE-04 sharp derivatives (local) | Spike validation | P02-10 | Derivatives, dominant colour, palette, time/memory, rejection of bad input | Test passed | Executed 2026-11-12: 55 MB 4800×3600 PNG → 4 WebP derivatives + palette in ~2.0 s, peak RSS ~316 MB (ADR-004) |
| T-08b | SPIKE-04 R2 presigned upload | Spike validation | P02-10 | Presigned PUT, CORS, post-upload size check | Test blocked | Blocked by B-11 (R2 account, D-10) |
| T-09 | SPIKE-05 deployment build | Spike validation | P02-11 | Next.js + libSQL + sharp build and run on the host | Test planned | Needs D-09 (B-10) |
| T-10 | Schema design review | Schema review | P03-06 | Normalisation, index coverage per query, ON DELETE rules | Test planned | — |
| T-11 | Schema and integrity tests | Schema & integrity | P03-05 (design), P08-06, P09-* | Unique like/follow/save, self-follow, FK negatives, counter consistency | Not tested | Cases designed in DATABASE_TEST_PLAN.md (P03-05) |
| T-12 | Migration tests | Schema & integrity | P03-04 (design), P08-06, P12-08/09 | Fresh apply, apply on the previous release copy, table-rebuild pattern | Not tested | — |
| T-13 | API specification review | API contract (design) | P04-05 | Every R1 endpoint specified with errors and authz | Test planned | — |
| T-14 | API contract tests | API contract | P04-04 (design), P09-* | Happy, 400, 401/403, 404, 409, 429 per endpoint | Not tested | Cases designed in API_TESTING_PLAN.md |
| T-15 | Token contrast validation | Visual consistency | P05-02, P05-07 | All text pairs ≥ 4.5:1 (large ≥ 3:1), control boundaries ≥ 3:1 | Test passed | Executed 2026-11-12 by the design agent (`contrast.mjs`, exit 0) and **independently re-run by the lead**: 130 required pairs, 0 failures (incl. glass surfaces worst case over white/black imagery). Lead spot-checked 6 derived pairs with an independent formula: identical. Evidence [08-testing/design/T-15_CONTRAST_REPORT.md](08-testing/design/T-15_CONTRAST_REPORT.md). Final sign-off at G3 depends on D-23 |
| T-16 | Visual consistency review | Visual consistency | P05-07, P06-10 | Token-only styling, constitution rules | Test failed | Executed 2026-11-12 (QA agent): verdict "Pass with findings" with **5 high** (T16-01 accent text on drawer glass 4.38:1; T16-02 raised neumorphism on glass; T16-03 grid columns vs NFR-28; T16-04 nav breakpoint 1024 vs 1280; T16-05 load-more focus), 12 medium, 23 low. Recorded as failed until the highs are fixed or accepted by the user, then re-run. Fixes in progress (design agent); T16-03 and T16-04 need the user (D-24e). [Report](08-testing/design/T-16_VISUAL_CONSISTENCY_REVIEW.md) |
| T-17 | Design QA checklist | Design QA | P07-01, P07-07 | Per-screen checklist incl. "no reference-product assets" | Test planned | — |
| T-18 | Prototype viewport validation | Viewport validation | P06-04, P07-02 | 1440/1280/1024/768/390/360 screenshots, no horizontal scroll | Test planned | Screenshots to `docs/08-testing/design/screenshots/` |
| T-19 | Prototype accessibility review | Accessibility | P07-03 | axe, keyboard, focus, neumorphic 3:1 boundaries, glass legibility | Test planned | — |
| T-20 | Usability review | Usability review | P07-04 | Heuristics + R1 journey walkthrough with the user | Test planned | — |
| T-21 | Toolchain smoke | Toolchain | P08-02..P08-10 | Lint, typecheck, sample unit/component/E2E, build, preview health | Test planned | — |
| T-22 | Unit tests | Unit | P09-*, P10-* | Domain logic, helpers | Not tested | Coverage ≥ 80% on services |
| T-23 | Integration tests | Integration | P09-* | Services + repositories on libSQL | Not tested | — |
| T-24 | Component / interaction tests | Component | P10-* | Primitive and feature component states, keyboard | Not tested | — |
| T-25 | E2E journey tests | E2E | P10-*, P11-02 | R1: journeys 1, 3, 4 (+ search, tags); R2: 2, 7, 8 + upload/collections/comments; R3: messaging, hire | Not tested | Journeys from [reverse-engineering/04](reverse-engineering/04-user-journeys.md), rewritten in P01-04 |
| T-26 | Visual regression (built app) | Viewport / visual | P10-*, P11-03 | Pages vs approved design screenshots at 6 widths | Not tested | Baselines generated on CI Linux |
| T-27 | Accessibility (built app) | Accessibility | P10-*, P11-07 | axe on every route; manual keyboard pass | Not tested | — |
| T-28 | Security tests | Security | P11-04 (+ P11-09 upload fuzzing) | Authz matrix, Server Action origin/CSRF, rate limits, headers/CSP, ZAP baseline, dependency audit | Not tested | — |
| T-29 | Performance tests | Performance | P11-05 | LCP < 2.5 s, CLS < 0.1, INP < 200 ms; feed p95 < 300 ms; Turso read estimate | Not tested | Load-test tool needs approval |
| T-30 | Regression suite | Regression | P11-03, P11-06, P11-09, P11-10 | Full re-run of T-22..T-27 per release | Not tested | — |
| T-31 | Production smoke tests | Production smoke | P08-09 (preview), P12-06, P12-08, P12-09 | Health, home, feed, shot, sign-in, like on production | Not tested | — |
| T-32 | Backup restore drill | Recovery | P12-03, P12-08, P12-09 | Turso point-in-time restore and R2 object recovery within RTO | Not tested | — |
| T-33 | Design foundation preview validation | Viewport / accessibility | P05 (foundation CSS) | `design-system/preview` at 360/390/768/1024/1440: overflow, ≥ 44 px targets, axe WCAG 2.2 AA, computed tokens, reduced motion | Test passed | Executed 2026-11-12 by the lead: 0 overflow at 5 widths; 0 undersized targets; axe-core 4.10.3 0 violations (1440, 390; contrast "incomplete" over gradients, covered by T-15); computed values match tokens; reduced-motion collapses animations. First run found and fixed: 12 px overflow at 360 (header), critical `aria-required-children` (separator in listbox), 32 px brand target, toggle border, raised neumorphism on glass. Evidence [screenshots/foundation/](08-testing/design/screenshots/foundation/) |

### Summary

| Status | Count |
|---|---|
| Test passed | 9 (T-01, T-02, T-03, T-05a, T-06a, T-07a, T-08a, T-15, T-33) |
| Test planned | 9 |
| Not tested | 14 |
| Test failed | 1 (T-16, fixes in progress) |
| Test blocked | 4 (T-05b, T-06b, T-07b, T-08b) |
| **Total** | **37** (T-05…T-08 split into local/remote parts) |

---

## 4. Execution log

| Date | Suite | Result | Evidence |
|---|---|---|---|
| 2026-11-12 | T-01 Reverse-engineering Mermaid parse | 10/10 diagrams parsed | Run during P00-01 (reverse-engineering study); diagrams in [reverse-engineering/](reverse-engineering/04-user-journeys.md) |

New rows are appended when a suite is executed. Rows are never edited after the fact; a re-run gets a new row.
