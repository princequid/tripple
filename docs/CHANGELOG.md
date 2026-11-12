# Changelog

Records important changes to the project: documentation, decisions, configuration and code. Newest first. Dates are absolute (YYYY-MM-DD).

## 2026-11-12 — User accepted all defaults

### Decisions
- A-14: OQ-01…OQ-27 resolved with their defaults. "Trippple" is the working product name; profiles at `/:username`; minimal moderation approved; OTP, view, like and ranking rules as written. D-01, D-23 and D-24 approved; D-24(e) resolved to the design-system values (nav from 1024 px, 4 columns at 1280, max 5). FR-01 and NFR-28 are to be updated to match.
- B-02 resolved.

### Added
- Moderation tasks (A-14): P09-29 [R1], P09-30 [R2], P10-26 [R1], P10-27 [R2]; new module row and G6-MODERATION-R1/R2. Plan is now 148 tasks / 321 d.

### Changed
- REQUIREMENTS_SPECIFICATION Revision 1: FR-01 nav from 1024 px; NFR-28 grid per D-24(e); A-13 additions recorded. **P01-07 Completed** (checkpoint); **T-03 passed**. Formal approval at G2.
- P02-01…P02-06 started (architecture agent).

## 2026-11-12 — P06 IA, sitemap, wireframes and responsive spec delivered

### Added
- `docs/06-ui-ux/`: INFORMATION_ARCHITECTURE (56 routes), APPLICATION_SITEMAP (R1–R3 + Later), WIREFRAME_SPECIFICATION (22 R1 surfaces, 130 states, 0 uncovered R1 FRs with UI), RESPONSIVE_DESIGN (6 widths, V-01…V-12 checks for T-18).
- DECISION_LOG A-13 (lead consistency resolutions); D-24(e) expanded with the column and breakpoint conflict.

### Changed
- design-system: OTP small cells below 390 px (`--otp-cell-w-sm` / `--otp-cell-h-sm`), profile avatar 64 px below md, segmented control scrolls instead of wrapping (found at 360 px with the longer timeframe labels), preview labels per A-13. T-33 re-run: still 0 overflow, 0 undersized targets, 0 axe violations.

### Verified
- P06 docs: Mermaid 6/6 parsed; 0 broken links (excluding the known regex false positive); no reference-brand mentions.

### Status
- P06-01, P06-02, P06-03, P06-09 → Awaiting Review.

## 2026-11-12 — Constitution adopted verbatim; design foundation CSS built

### Added
- `docs/FRONTEND_DESIGN_CONSTITUTION.md`: the user's constitution, verbatim and permanent (A-12).
- `design-system/` (plain CSS, zero dependencies): `styles/design-tokens.css`, `neumorphism.css`, `glassmorphism.css`, `base.css`; `components/controls.css`, `overlays.css`, `content.css` (26 catalogue components); `preview/index.html`; README.
- `docs/08-testing/design/T-16_VISUAL_CONSISTENCY_REVIEW.md` (QA agent) and `screenshots/foundation/`.

### Changed
- 05-design-system constitution §11 now carries the user's exact 10 quality questions; the measurable QC criteria are kept as the verification column.
- DECISION_LOG A-12: foundation CSS built before G5 as an approved exception, under constitution §9/§11.

### Tests
- **T-33 passed:** preview at 5 widths, 0 overflow, 0 undersized targets, axe 0 violations, tokens verified. The first run found and fixed 5 defects (360 px header overflow, listbox separator, 32 px brand target, toggle border, raised neumorphism on glass, now auto-flattened by CSS).
- **T-16 failed** (5 high findings). Fixes in progress; T16-03/T16-04 need the user (D-24e). P05-01/02/04/05/06 back to In Progress.

## 2026-11-12 — P01 requirements and P05 design system delivered for review

### Added
- `docs/01-requirements/`: REQUIREMENTS_SPECIFICATION (94 FR, 40 NFR, P01-07 checkpoint), FEATURE_INVENTORY (70 features + 6 candidates), USER_ROLES, USER_JOURNEYS (90 planned E2E scenarios), BUSINESS_RULES (89 BR), OPEN_QUESTIONS (27 OQ).
- `docs/05-design-system/`: FRONTEND_DESIGN_CONSTITUTION, COLOR_SYSTEM, TYPOGRAPHY_SYSTEM, DESIGN_TOKENS, DESIGN_SYSTEM, COMPONENT_GUIDELINES.
- `docs/08-testing/design/T-15_CONTRAST_REPORT.md`.
- DECISION_LOG: D-23 (derived colours and glass levels) and D-24 (G3 design choices), both pending approval.

### Verified by the lead
- Requirements: FR/NFR/BR IDs unique with no undefined references; 0 untraced R1 features (agent's check). Mermaid 6/6 parsed; 0 broken links (one regex in backticks is a false positive).
- T-15 contrast: re-run independently, 130/130 required pairs pass; 6 derived pairs spot-checked.
- P05-05 catalogue re-checked against USER_JOURNEYS: 10/11 assumptions confirmed. **V-2 changed:** a hero search block is in R1.

### Status
- P01-01…P01-06, P05-01…P05-06 → Awaiting Review. P01-07 In Progress (needs the user walkthrough). T-03 stays Test planned.

## 2026-11-12 — G1 approved; P01, P05 and spikes started

### Decisions
- **Gate G1 approved** by the user ("go ahead with all your recommendations"). D-02…D-22 approved as recommended. D-01 (product name) stays open; codename "Trippple". D-13: the user sets up GitHub and git themselves.
- BLOCKERS: decision blockers resolved. Open: B-02 (name), B-09/B-10/B-11/B-15/B-16 (accounts the user must create: Resend, Vercel, R2, Turso, Google OAuth).

### Added
- `spikes/` (throwaway, outside `src/`): SPIKE-01 FTS, SPIKE-02 FK/transactions, SPIKE-03 Better Auth (minimal Next.js 16 app), SPIKE-04 sharp. Packages pinned exact, ≥ 2 weeks old where available.
- `docs/02-architecture/ARCHITECTURE_DECISIONS.md`: ADR-001…ADR-005 from the spike results.
- DECISION_LOG facts F-11…F-15.

### Tests executed
- T-05a, T-06a, T-07a, T-08a **passed** (local parts of the spikes). T-05b, T-06b, T-07b, T-08b **blocked** on user accounts. T-02 re-run after status edits: consistent.

### Status
- P00 Completed. P01-01…P01-06 and P05-01…P05-06 In Progress (two agents). P02-07…P02-11 Blocked on accounts (local parts done).
- Both agents hit the usage limit mid-task and were resumed from their saved progress.

## 2026-11-12 — P00 Assessment & Planning (in progress → G1 review)

### Added
- `docs/README.md`: documentation index and folder structure.
- `docs/DECISION_LOG.md`: approved decisions A-01…A-11, pending decisions D-01…D-13, verified technical facts F-01…F-04, superseded items S-01…S-02.
- `docs/00-project-assessment/PROJECT_ASSESSMENT.md` and `TECHNOLOGY_EVALUATION.md` (architect/analyst agent).
- `docs/MASTER_PROJECT_WORKFLOW.md`, `docs/TASK_TRACKER.md`, `docs/BLOCKERS_AND_RISKS.md`, `docs/TESTING_PROGRESS.md` (project-manager/QA agent).

### Changed
- `docs/reverse-engineering/06-database-design.md` and `07-technology-recommendation.md`: added a supersession notice. The confirmed stack (Next.js full-stack + Turso/Drizzle + R2) replaces their PostgreSQL/Prisma/Express recommendations. Content otherwise unchanged and kept as historical reference.

### Reconciled (lead, after both agents finished)
- DECISION_LOG: D-02, D-08, D-09, D-11, D-12 updated with the technology evaluation's findings. New D-14…D-22 (Turso plan, image processing, R2 SDK, monitoring, video, seed-media hosting, bot protection, data fetching, validation). Facts F-05…F-10 added; F-01 corrected (per-connection persistence is unverified). Reverse-engineering discrepancies X-1…X-11 recorded with resolutions.
- MASTER_PROJECT_WORKFLOW §1.1: the 17 continuous-execution rules replaced with the brief's exact wording; the agent's project-specific rules kept as §1.1a.
- BLOCKERS_AND_RISKS: B-15 and B-17 linked to the new decision IDs.
- P00-02…P00-07 set to **Awaiting Review**; gate G1 set to **Awaiting Review**.
- TESTING_PROGRESS: **T-02 executed and passed** (144/144 task IDs and statuses consistent, 0 broken links, Mermaid 1/1 + 10/10 parsed).

### Not done (intentionally)
- No project scaffolding, dependencies or application code. Implementation awaits approval of the initial proposal (gate G1, then G2).
- The design-token/CSS foundation work started earlier was stopped before any files were written, at the user's request. Nothing to revert.

## 2026-11-12 — Reverse engineering (completed)

### Added
- `docs/reverse-engineering/00–10` and `screenshots/` (144 images): a logged-out, robots-respecting analysis of the reference product. 10/10 Mermaid diagrams validated with the Mermaid parser.
