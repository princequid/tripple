# Changelog

Records important changes to the project: documentation, decisions, configuration and code. Newest first. Dates are absolute (YYYY-MM-DD).

## 2026-11-13 — Backend phase: R1 full-stack slices, database and API documentation (lead)

### Context
- User directive: backend architecture, database design and full-stack development as feature vertical slices. Found on disk: R1 services/repositories/schema existed, but no pages, Route Handlers, seed/moderation scripts or test suites.

### Decisions
- **A-20** (user directive): Route Handlers are the client API (no Server Actions in R1; supersedes Proposed ADR-007); mutations CSRF-checked by origin. Backend slices proceed before the open gates formally close.
- **A-21** (proposed): R1 pages use design-system classes without Tailwind for now.

### Added
- 15 Route Handlers (`src/app/api/**`), `src/server/route.ts`, `src/proxy.ts`, `src/server/db/reference-data.ts`, Zod schemas per module, `feed.byProfile`.
- R1 pages: home, popular/recent (+ category), shot detail, search, tags, tag, profile Work/About, login, signup, onboarding, legal pages, 404, error, robots. Components: header/footer, account menu, filter bar, shot card/grid, like button, view beacon, share, sign-in flow, onboarding form.
- `scripts/seed.ts` (deterministic, generated licence-free artwork), `scripts/moderate.ts`.
- Test harness: `vitest.config.ts` (fresh DB per file), `playwright.config.ts` (next start + seeded DB); 6 Vitest files, 2 Playwright specs.
- Docs: DATABASE_DESIGN, DATABASE_SCHEMA, API_SPECIFICATION, API_TESTING_PLAN, BACKEND_IMPLEMENTATION_PLAN, REVERSE_ENGINEERING_TO_BACKEND_MAPPING, BACKEND_PROGRESS_REPORT; BACKEND_ARCHITECTURE v1.1.

### Changed / fixed
- `users.completeOnboarding`: same-user double submit is idempotent (was `USERNAME_TAKEN`).
- `users.findByUsername` selects `role` (moderation `--actor` check).
- `env.ts`: production-only rules skipped during `next build`, enforced at start.
- Pending viewer carries the owner's email (username suggestion, BR-21).
- Accessibility: unique navigation landmark names. Layout: shot cards no longer overflow grid tracks.

### Tests executed
- `tsc --noEmit` pass · `vitest run` **94/94** (incl. new reserved-route check) · `next build` pass · Playwright **25/25** (15 API contract, 10 journeys incl. mobile).

### Not done
- ESLint import rules, CI, nonce CSP, data cache, mobile drawer, modals, `next/font`; Google/Resend/Turso-remote/ImageKit (accounts). See BACKEND_PROGRESS_REPORT §6.

## 2026-11-13 — Media host: ImageKit (lead)

### Decisions
- **A-19** (user directive): ImageKit replaces Cloudflare R2 as the media host.

### Changed
- `src/lib/media.ts`: `mediaUrl` supports `local` (seed files `{key}/{variant}.webp`) and `imagekit` (`{endpoint}/{key}?tr=...` on-the-fly transforms). Callers unchanged.
- `src/server/env.ts`, `.env.example`: `NEXT_PUBLIC_MEDIA_PROVIDER`, optional `IMAGEKIT_PUBLIC_KEY`/`IMAGEKIT_PRIVATE_KEY`; production requires `imagekit` and an https endpoint.

### Tests executed
- `tsc --noEmit`: passes.

## 2026-11-13 — R1 backend modules completed; Cloudflare removed (lead)

### Context
- A previous session started the R1 backend (P08 environment, P09 modules) after the last doc update and was lost mid-way, after writing the schema/migrations, `lib/`, server infrastructure and the `shots`, `likes` and `users` modules. That work had not been logged; it is recorded here.

### Decisions
- **A-18** (user directive): Cloudflare no longer used. Turnstile removed; R2 media host replaced by "TBD".

### Changed
- Removed `src/server/turnstile.ts`, its env variables and the Turnstile check in the auth `before` hook.
- `.env.example`, `src/server/env.ts`, `src/lib/media.ts`: R2 references removed.
- Fixed 2 type errors left by the lost session (shots detail blocks typing; Google `mapProfileToUser` image).

### Added
- Modules: `auth` (service: `getViewer`, `requireMember/Pending/Staff`, `revokeAllSessions`, retention), `media`, `views` (BR-29…31), `feed` (BR-32…35, BR-43), `search` (BR-38…41, FTS5 bm25 3/1/2/1 blended 0.7/0.3 with popularity), `moderation` (audited suspend/hide/role/featured), `platform` (health, BR-79 cleanup, BR-27 reconciliation, daily job).
- Reconcile helpers in `likes` and `shots`.

### Tests executed
- `tsc --noEmit`: passes.
- Ad-hoc smoke script (`.data/smoke/smoke.ts`, scratch DB, not part of the suite): 26/26 checks passed (idempotent likes, view dedup/author/bot/hidden exclusion, feed order + cursors + timeframes + 404, moreBy/related, search ranking/prefix/hostile input, related tags, tag index/page/404, counter reconciliation, cleanup, health).
- No Vitest suites exist yet (`tests/` is empty).

### Not done
- `scripts/seed.ts` and `scripts/moderate.ts` (referenced in package.json) do not exist yet. No route handlers, pages or server actions yet. ESLint config (lint rules L-01…L-08) not set up. TASK_TRACKER statuses not yet updated for P08/P09.

## 2026-11-13 — Identity revision 2.1: brighter crimson, re-derived tints, no gradients (lead)

### Decisions
- **A-17** (user directive and choices): remove all gradients; brighten the red (user chose +24.5% `#DF2F4D`, the brightest step keeping white text ≥ 4.5:1; +30% would fail at 4.18); re-derive primary light `#FCEEF1`, hover tint `#FBE2E6`, primary border `#F5C1CA`; background `#FFFFFF`. D-26 narrowed accordingly (still pending).

### Changed
- Tokens: crimson scale 50/100/200/500/600/700; new `--color-accent-deep` (`#B3263E`) for crimson text and thin indicators; bright `#DF2F4D` for fills; focus/selected rings deep.
- CSS: selected labels, accent badge, menu check, nav underline, drawer bar and spinners use the deep crimson; skeleton gradient shimmer replaced by a flat pulse.
- Preview: all gradients replaced by flat colours (artwork placeholders and stage backdrops); palette section regenerated.
- Docs: user constitution §3.2 values updated with a revision 2.1 note and new §3.7 "No gradients"; COLOR_SYSTEM v2.1 (rewritten), DESIGN_TOKENS v2.1 (incl. Tailwind spec, no shimmer gradient), operational constitution v2.1, DESIGN_SYSTEM v2.1, COMPONENT_GUIDELINES v2.1, TYPOGRAPHY, RE mapping, QA checklist §4b, T-15 report v2.1.

### Tests
- **T-15 v2.1 passed** (131 pairs, 0 failures). **T-33 v2.1 passed** (0 issues at 6 widths, axe 0, supplementary checks pass). `gradient(` occurrences in `design-system/` and `prototypes/`: 0. Prototype harness: pass.

## 2026-11-13 — Identity v2: Premium Crimson + Warm White (lead)

### Decisions
- **A-16** (user directive): identity v2 — Premium Crimson + Warm White + Soft Grey + Charcoal, 40/30/30 preserved. Supersedes the A-07 palette and D-23 (S-03).
- **D-26** (pending): derived and proposed values — danger sienna `#9A3412`, success `#556359`, pressed `#761729`, hover tint `#F5DEE3`, supporting tints, warm-taupe neumorphic shadow, soft-grey controls on warm white, crimson selected language.

### Changed
- `docs/FRONTEND_DESIGN_CONSTITUTION.md` §3 replaced with the user's directive verbatim (revision 2); v1 colour system moved to Appendix A.
- 05-design-system: operational constitution v2.0, COLOR_SYSTEM v2.0 (rewritten), DESIGN_TOKENS v2.0, DESIGN_SYSTEM v2.0 (C52 Card, notification dot, ratios), COMPONENT_GUIDELINES v2.0 (§0.1 styling contract for the 12 component families), TYPOGRAPHY (emphasis colour), RE_TO_DESIGN_MAPPING v1.1.
- design-system CSS: new palette and semantic values (names unchanged); `--neu-fill` split from `--neu-parent`; crimson selected fill; lavender-tint avatar initials; support badges; C52 Card; notification dot; charcoal glass shadows and scrim.
- Preview v2: approved-palette section, badges, cards, notification indicator; copy updated.
- Test scripts: T-15 v2 rewritten; T-33 harnesses updated for the v2 shadow and text colours.
- DESIGN_QA_CHECKLIST: v2 run (§4a).
- Tracker: P05-01…P05-07 back to Awaiting Review for **G3-R2**; P06-05 on hold until approval.

### Tests
- **T-15 v2 passed** (128 pairs, 0 failures). **T-33 v2 passed** (6 widths, 0 issues; axe 0 violations; all supplementary checks). Prototype harness re-run: pass.

## 2026-11-13 — G3 approved; P06-04 prototype workspace built (lead)

### Decisions
- **Gate G3 approved** by the user ("approved"), recorded as **A-15**. **D-25 approved as recommended**: pillar balance counted by family (N 32.6 / G 30.2 / M 37.2); sort label "Recent"; categories chosen with the seed set (P09-02); no availability label or online dot in R1–R3.

### Changed
- P05-01…P05-06 → Approved; P05-07 → Completed; workflow gate G3 → Approved.
- FR-22 wording "New & noteworthy" → "Recent". IA G-01, G-02, G-04 and wireframe WF-13, WF-14, WF-17 marked resolved (D-24e, D-25).

### Added (P06-04)
- `prototypes/`: index of the 22 R1 surfaces, `r1/_template.html`, `_shared/proto.js` (state switcher via `?state=` and `<meta name="proto-states">`), `_shared/icons.svg`, README.
- `prototypes/tools/`: one-command screenshot + layout-check harness (`npm run shots`, `shots:axe`; playwright 1.58.2, axe-core 4.10.3 pinned).

### Tests
- **T-18 harness smoke passed**: 18 screenshots, 0 failures; negative test confirmed exit 1 on overflow, small targets and an unlinked page.

### Status
- P06-04 Completed. Next: P06-05 R1 high-fidelity prototypes. Note: WF-15 (back-to-top FAB on mobile) conflicts with C42 being R2+ (V-11); to settle while prototyping SCR-02.

## 2026-11-13 — G3 design foundation review package completed (lead)

### Context
- The user asked for the Frontend Design Foundation Phase grounded in the reverse-engineering findings. The P05 documents and foundation CSS already existed (Awaiting Review), so this session audited them against the findings and the brief, and filled the gaps instead of rewriting them.

### Added
- `docs/05-design-system/RE_TO_DESIGN_MAPPING.md`: every reverse-engineered token (T-1…T-21), layout rule (L-1…L-15), all 58 components, interactions/states (S-1…S-16) and introduced improvements (N-1…N-11) with a disposition (Keep 8 · Modify 32 · Replace 1 · Defer 14 · Drop 3 for components) and rationale; inconsistencies I-1…I-10.
- `docs/08-testing/design/DESIGN_QA_CHECKLIST.md`: the 10 constitution questions answered with evidence, A11Y-01…A11Y-15 results, defect list, limitations, template for P07-01.
- `docs/08-testing/design/scripts/` (T-15 contrast, T-33 preview check, T-33 extra accessibility checks) and `screenshots/foundation-v1.2/`.
- CSS for catalogue components that had none: header search, nav-link states, account trigger, mobile drawer, filter bar and panel, timeframe radios, removable tag chip, action rail, share/copy rows, stats grid, feed status rows, detail header, content block, footer.
- DECISION_LOG **D-25** (pending): pillar counting method, "Recent" label, category list, availability indicators.

### Changed
- `design-system/preview/index.html` v1.2: reorganised by R1 surface (navigation, explore filter bar, gallery, shot detail, overlays, primitives, sign-in, profile, states, footer); R1/Reserved tags; non-R1 content removed (header "Designers/Jobs", "Most viewed", colour search placeholder).
- CSS fixes X1, X2, X4–X9 (catalogue §11), plus 6 defects found by T-33 v1.2 (grid overflow at 360 px, glass class on raised rail controls, two undersized targets, invisible chip on bg-2, full-width filter toggle, forced-colours border on `.is-selected`).
- DESIGN_SYSTEM v1.2: stale "pending" text for D-24(e) replaced by the approved outcome (§12, C05, C18); C17 radius; C30 radius; class names for the new CSS; §11 table marked fixed.
- `design-system/README.md`: file map, verification, open items brought up to date (D-23/D-24 approved).

### Tests
- **T-33 v1.2 passed** (6 widths, 0 issues; axe 0 violations; forced colours, reduced motion/transparency, 200% zoom, text spacing, focus-not-obscured). **T-15 re-run: 148/148 pass.**

### Status
- P05-07 (G3) Awaiting Review: needs the user's approval and answers to D-25.

## 2026-11-13 — P02 architecture documents and P04-01 written (lead)

### Added
- `docs/02-architecture/`: FRONTEND_ARCHITECTURE (all 24 R1 routes with rendering mode, data source and cache tag; 17 client components with reasons), BACKEND_ARCHITECTURE (layering, lintable import rules L-01…L-08, services and repositories per module, error model, background jobs, rate limiter), SECURITY_ARCHITECTURE (16 R1 mutations each with an authorization rule and a rate-limit class, STRIDE TH-01…TH-24, ASVS 5.0 L1 chapter mapping), DATA_FLOW_DIAGRAM (DF-1…DF-9 with trust boundaries TB-1…TB-4).
- SYSTEM_ARCHITECTURE and TECHNOLOGY_STACK, which were left on disk by the previous session, were checked and kept.
- ARCHITECTURE_DECISIONS Part 2: ADR-006 (dynamic rendering + tagged data cache for the nonce CSP), ADR-007 (Server Actions vs Route Handlers), ADR-008 (lint-enforced layering), ADR-009 (Turso limiter and view counting in `after()`), ADR-010 (seed media base URL). All Proposed, for approval at G2.
- Review items for P02-13: AR-1 (BR-77 429 carried as `RATE_LIMITED` in Server Action results), AR-2 (system endpoints missing from the IA URL table), SR-1…SR-4 (sign-out rate-limit class, inline-style CSP, 30-day session config, cookie-cache redirect).
- `docs/04-api/API_RESPONSE_CONVENTIONS.md` (P04-01): one error vocabulary (9 classes, 24 codes) shared by Route Handlers and Server Actions; cursor pagination; set-semantics toggles; rate-limit signalling.

### Tests / checks
- Mermaid: 12/12 diagrams in 02-architecture parsed (the parser shim needed a jsdom `Option` global for `box` groups; this was not a diagram error).
- Links: 417 relative links in docs/ checked, 0 broken (anchors included). No reference-brand mentions in the new docs.
- T-04 itself is not run yet. It waits for P02-12, and the spikes are still blocked on accounts.

### Status
- P02-01…P02-06 and P04-01 → Awaiting Review. Tracker: 8 Completed · 24 Awaiting Review · 5 Blocked · 111 Not Started.

## 2026-11-13 — T-16 fixes completed by the lead; repository moved

### Context
- The user moved the project into the GitHub repository `princequid/tripple` (local path `…/Trippple/tripple/`, branch `main`). The user owns commits and pushes.
- The user asked that all work be done directly by the lead from now on (no agents). The two running agents had stopped on usage limits: the designer agent had finished DESIGN_SYSTEM v1.1 and most of COMPONENT_GUIDELINES; the architecture agent had written nothing.

### Changed
- 05-design-system: CONSTITUTION v1.1 (selected language, blur levels, nested radii, A11Y-07 inline-link exemption, testable forced-colours rule, brand slot "Trippple"); DESIGN_TOKENS v1.1 (implemented-in reference, single font stacks, `--duration-spin`, OTP small tokens, radius usage, glass fallback for all levels, D-23/D-24 approved); TYPOGRAPHY (stack reference, ≥ 24 px); COLOR_SYSTEM (D-23 approved, drawer surface, 148-pair matrix).
- design-system CSS: spinner arc `accent-strong` + `--duration-spin`; unified font stacks; TextFields 14 px radius; card hover bar 10 px radius.
- MASTER_PROJECT_WORKFLOW §7: "controls and small widgets" (T16-34).
- T-16 report: resolution column for all 40 findings (38 fixed, 2 resolved by D-24e).

### Tests
- **T-15 v1.1 passed:** 148 pairs, 0 failures; drawer worst case independently recomputed.
- **T-16 passed** after fix verification. **T-33 re-run:** 0 overflow, 0 undersized targets, 0 axe violations.
- Docs: Mermaid 29/29 parsed; 0 broken links (one known false positive).

### Status
- P05-01…P05-06 → Awaiting Review; **G3 (P05-07) ready for the user's approval**.

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
