# Requirements Specification (P01-01)

**Task:** P01-01 (with the P01-07 review checkpoint in [§6](#6-review-checkpoint-p01-07)) · **Owner:** TPM / QA Lead (Product Manager / Requirements Analyst role) · **Last updated:** 2026-11-12 · **Status:** Awaiting Review (user walkthrough pending; formal approval at G2)
**Product:** independent design-community portfolio and hiring marketplace, working codename **Trippple** (final name pending decision D-01). Original branding; the reference product is used for layout and behaviour only (decisions A-07, A-10).
**Companion documents:** [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) · [USER_ROLES.md](USER_ROLES.md) · [USER_JOURNEYS.md](USER_JOURNEYS.md) · [BUSINESS_RULES.md](BUSINESS_RULES.md) · [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
**Inputs:** [MASTER_PROJECT_WORKFLOW.md](../MASTER_PROJECT_WORKFLOW.md) (P01), [DECISION_LOG.md](../DECISION_LOG.md) (G1 approved 2026-11-12; D-02…D-22 approved; D-01 pending), [PROJECT_ASSESSMENT.md](../00-project-assessment/PROJECT_ASSESSMENT.md), [TECHNOLOGY_EVALUATION.md](../00-project-assessment/TECHNOLOGY_EVALUATION.md), reverse-engineering [01](../reverse-engineering/01-page-inventory.md), [02](../reverse-engineering/02-frontend-analysis.md), [04](../reverse-engineering/04-user-journeys.md), [05](../reverse-engineering/05-api-inventory.md), [06](../reverse-engineering/06-database-design.md), [08](../reverse-engineering/08-feature-breakdown.md), [10](../reverse-engineering/10-unknowns-and-limitations.md).

---

## 1. Purpose, scope and conventions

### 1.1 Purpose

This document states **what** the product must do (functional requirements, FR-xx) and **how well** (non-functional requirements, NFR-xx) for releases R1–R3, and records Later scope at summary level. It is the baseline for architecture (P02), database (P03), API (P04), design (P05–P07) and tests (T-xx). It does not prescribe implementation beyond the approved stack: Next.js App Router, TypeScript, Turso/libSQL + Drizzle, Cloudflare R2, Tailwind, Better Auth, Zod, Vitest/RTL/Playwright.

### 1.2 Release scope (decision D-02)

| Release | Scope |
|---|---|
| **R1 MVP** | Homepage; shot feeds (popular, recent, category; infinite scroll; filters **tag + timeframe** only); shot card; shot detail (content blocks, Share and Details modals, related shots); profile (Work, About); search and tags; likes; view counts; auth (email code + Google, auth-gate modal with `intent`/`returnTo`, protected routes); minimal username onboarding; legal pages; minimal moderation (proposal) |
| **R2** | Uploads, image pipeline and shot composer; collections; follows; comments; teams and members; profile edit, full onboarding and settings; popularity ranking job; header search types; free job board (list, detail, post); reporting (proposal) |
| **R3** | Notifications; block; messaging; video teasers; colour search; hire directory; services listing (no checkout); SEO sitemaps and structured data; analytics; cookie consent; custom colour 404 |
| **Later** | Not planned. Payments, Pro, paid jobs, service orders, reviews, briefs, proposals, ads/boosts need **payment approval** (blocker B-19). Challenges (renamed from "Playoffs"), rebounds, blog/CMS, SEO landing and directory pages need a **scope decision** |

### 1.3 Conventions

- **FR-xx** functional and **NFR-xx** non-functional requirement IDs are unique and never reused. **BR-xx** business rules are in [BUSINESS_RULES.md](BUSINESS_RULES.md), **OQ-xx** open questions in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), **UJ-xx** journeys and **E2E-xx** planned Playwright scenarios in [USER_JOURNEYS.md](USER_JOURNEYS.md).
- **Feature** references are the IDs of [doc 08](../reverse-engineering/08-feature-breakdown.md) (plus NX-xx candidates from [FEATURE_INVENTORY.md §3](FEATURE_INVENTORY.md#3-clone-candidate-features-not-in-doc-08)). Some doc-08 IDs collide with decision IDs (feature D-01 "feed" vs decision D-01 "name"); decisions are therefore always written "decision D-xx".
- **Evidence.** A requirement describes the clone. Where the reference behaviour was observed, the FR says so; anything else is a **clone decision**, and nothing here claims the reference product behaves that way.
- **Naming.** "Shot" is used as a generic term for a design post. Branded reference concepts are renamed: Featured Studio (vetted-designer badge), Challenges (playoffs), collections (buckets) (BR-88).
- **Releases gate controls.** A control for a feature that has not shipped is not rendered (BR-45).
- **Common states.** Every page and list in every FR has loading (skeleton), empty, error and success states (Definition of Done, workflow §9). FRs list only the states specific to them.
- **Errors.** Mutations return problem-details errors with a stable code (format fixed in P04-01). 401 = not signed in, 403 = not allowed, 404 = missing or not visible, 409 = conflict, 422 = validation, 429 = rate limited (BR-77).

---

## 2. Functional requirements: shell, platform and auth

### 2.1 App shell and platform

#### FR-01 — Global header and navigation · R1
**Features:** F-03 · **Journeys:** UJ-01, UJ-02

| Aspect | Specification |
|---|---|
| Purpose | Let every visitor reach discovery, search and sign-in from any standard page |
| User interaction | Desktop (≥ 1024 px, D-24e): logo, header search, Explore menu (Popular, Recent, the 8 categories, Tags), Sign up / Log in or the avatar menu. Below 1024 px: burger opening a full-height drawer with accordion sections; secondary header actions (e.g. "Log in") move into the drawer below 768 px. The homepage variant has no header search (search lives in the hero), as observed |
| Expected behaviour | Menus open on click and on keyboard (Enter/Space/Arrow keys), close on Escape or outside click, and return focus. Signed-in avatar menu: R1 = View profile, Sign out; R2 adds Upload, Settings, Liked shots; R3 adds Notifications, Messages. Entries for unshipped features are absent (BR-45). Hire talent / Get hired menus appear in R2 (jobs) and R3 (hire, services) |
| Required data | Current session (display name, username, avatar); category list (BR-36) |
| Business rules | BR-36, BR-45, BR-89 |
| Dependencies | FR-03, FR-14; design tokens (P05) |
| Success states | Correct menu set for the release and session; active section indicated with `aria-current` |
| Failure states | Session lookup fails → header renders the signed-out state and the page still loads |

#### FR-02 — Footer · R1
**Features:** F-03

| Aspect | Specification |
|---|---|
| Purpose | Provide secondary navigation and legal links |
| User interaction | Links: Terms, Privacy, Cookies, About, Contact, Tags, and (R2+) Jobs; copyright with the product name |
| Expected behaviour | Present on all standard pages; reachable by keyboard even on infinitely scrolling pages (NFR-27); not shown on auth pages and onboarding (as observed for auth pages) |
| Required data | Static configuration; product name (OQ-01) |
| Business rules | BR-45, BR-88 |
| Dependencies | FR-04 |
| Success states | All links resolve with status 200 |
| Failure states | None specific (static) |

#### FR-03 — UI primitives and shared states · R1
**Features:** F-02

| Aspect | Specification |
|---|---|
| Purpose | Consistent, accessible building blocks for every screen |
| User interaction | Buttons, icon buttons, avatar, badge, chip, input, modal, dropdown, tooltip, tabs, toast, skeleton, empty state, inline error |
| Expected behaviour | Styled only with the clone's design tokens (40/30/30 identity, A-05/A-07); modals trap focus, close on Escape and return focus; toasts are announced through a polite live region; skeletons match final layout to avoid shift |
| Required data | Design tokens (P05-04) |
| Business rules | BR-88 |
| Dependencies | P05 (G3) |
| Success states | Component tests pass for every state; 0 serious/critical axe violations (NFR-26) |
| Failure states | A component without a defined error state is a defect |

#### FR-04 — Legal and static pages · R1
**Features:** NX-06 · **Journeys:** UJ-05 (E2E-44)

| Aspect | Specification |
|---|---|
| Purpose | Meet launch legal needs and explain the product |
| User interaction | `/terms`, `/privacy`, `/cookies`, `/about`, `/contact`, linked from the footer and the sign-up form |
| Expected behaviour | Server-rendered static content; the Privacy page explains data use, retention (BR-79) and how to request deletion (BR-24) |
| Required data | Text supplied or approved by the user (OQ-03) |
| Business rules | BR-24, BR-79, BR-88 |
| Dependencies | OQ-03 (blocking R1) |
| Success states | Pages return 200 and are indexable |
| Failure states | Missing approved text blocks the R1 production checklist (P12-05), not development |

#### FR-05 — Not-found and error pages · R1
**Features:** X-02 (simple version) · **Journeys:** UJ-01 (E2E-04, E2E-05)

| Aspect | Specification |
|---|---|
| Purpose | Recover users from missing content and server errors |
| User interaction | 404 page with a message, search box and link home; error page with "Try again" |
| Expected behaviour | Unknown routes, unknown categories/tags/users and ineligible shots return HTTP 404 with this page; unexpected server errors return 500 with the error page and a request ID; nothing internal (stack, SQL) is shown |
| Required data | Request ID |
| Business rules | BR-36, BR-37, BR-41, BR-42 |
| Dependencies | FR-07 |
| Success states | Correct status codes; `noindex` on both pages |
| Failure states | Error page itself fails → minimal static fallback |

#### FR-06 — Seed content · R1
**Features:** F-04 · **Journeys:** UJ-01…UJ-05

| Aspect | Specification |
|---|---|
| Purpose | R1 has no uploads, so all discovery runs on seed data |
| User interaction | None (data only) |
| Expected behaviour | A repeatable generator loads about 40 users (including 5 team-type accounts), about 600 published shots with 1–5 content blocks, the 8 categories, tags, likes and view aggregates with realistic spreads of age and engagement; images are stored in R2 through the application's storage path (D-19); a scale dataset (100k shots, 10k users, 1M likes) is generated for performance tests (NFR-13) |
| Required data | Licence-free or generated images with a source/licence manifest |
| Business rules | BR-87, BR-88, BR-36, BR-40 |
| Dependencies | R2 bucket (D-10, D-19); OQ-13 |
| Success states | Generator is idempotent; every seed image has a manifest entry |
| Failure states | An image without a licence record fails the generator |

#### FR-07 — Server foundation · R1
**Features:** F-01, F-05

| Aspect | Specification |
|---|---|
| Purpose | Shared, safe plumbing for every module |
| User interaction | None directly; `/api/health` for monitoring |
| Expected behaviour | Every Route Handler and Server Action validates input with Zod (D-22), checks authorization (USER_ROLES), applies one rate-limit class (BR-76), returns the standard error format, and logs structured events without personal data; `/api/health` reports app and database reachability |
| Required data | Request ID, actor, rate-limit key |
| Business rules | BR-76, BR-77, BR-79 |
| Dependencies | P02-04, P04-01, P08 |
| Success states | Contract tests per endpoint cover 200, 400/422, 401/403, 404, 409/429 where applicable (workflow §9) |
| Failure states | Database unreachable → 503 from health and a generic error page; no partial writes (batches are atomic, F-05) |

#### FR-08 — Colour-mosaic 404 · R3
**Features:** X-02 (full version) · **Journeys:** R3 outline (E2E-97)

| Aspect | Specification |
|---|---|
| Purpose | A memorable 404 using the clone's own content (observed idea, original execution) |
| User interaction | The digits "404" built from shot thumbnails of a random colour; a hue slider changes the colour; search box |
| Expected behaviour | Thumbnails come from colour search (FR-36); reduced-motion users get a static mosaic |
| Required data | Shot palettes (FR-62) |
| Business rules | BR-80 |
| Dependencies | FR-36 |
| Success states | Status 404; mosaic renders within the LCP budget (NFR-01) |
| Failure states | Colour query fails → simple 404 of FR-05 |

#### FR-09 — Minimal moderation actions (proposal) · R1
**Features:** NX-05 · **Journeys:** UJ-03 (E2E-19)

| Aspect | Specification |
|---|---|
| Purpose | Let the operator remove abusive accounts or content before a reporting UI exists |
| User interaction | Admin or moderator runs a script or an admin-only Server Action: suspend/unsuspend user, hide/unhide shot, with a reason |
| Expected behaviour | Effects per BR-25 and BR-68; every action writes an immutable audit row; roles are granted only by operator script (BR-67) |
| Required data | Actor, target, action, reason, timestamp |
| Business rules | BR-25, BR-67, BR-68 |
| Dependencies | OQ-04 (approval); FR-14 |
| Success states | Hidden or suspended content disappears from all public surfaces on the next request |
| Failure states | Non-moderator invoking the action → 403 and an audit entry of the attempt |

### 2.2 Authentication and account

#### FR-10 — Request a sign-in code · R1
**Features:** A-01 · **Journeys:** UJ-05 (E2E-29, E2E-30, E2E-34, E2E-37)

| Aspect | Specification |
|---|---|
| Purpose | Start passwordless sign-in or sign-up with an email address (decision D-03; passwordless email codes observed on the reference) |
| User interaction | On `/login`, `/signup` or the auth-gate modal: enter email, Turnstile check runs, press Continue; the view switches to code entry |
| Expected behaviour | Email is normalised and validated (BR-10); the server verifies Turnstile (BR-08), applies send limits (BR-06), invalidates earlier codes, stores a hash of a new 6-digit code (BR-01–BR-03) and sends it by email; the response is identical whether or not an account exists |
| Required data | Email; Turnstile token; client IP (for limits, not stored raw) |
| Business rules | BR-01, BR-02, BR-03, BR-06, BR-08, BR-09, BR-10, BR-76 |
| Dependencies | Better Auth email-OTP plugin (D-04); email provider (D-08); Turnstile (D-20); SPIKE-03 |
| Success states | "We sent a code to {email}" with the email shown and a "use a different email" link |
| Failure states | Empty/invalid email → inline error, no request; Turnstile failure → retry message; 429 → retry time shown; email provider error → "We couldn't send the code. Try again or continue with Google" (NFR-18) |

#### FR-11 — Verify a sign-in code · R1
**Features:** A-01 · **Journeys:** UJ-05 (E2E-29, E2E-35, E2E-36, E2E-43)

| Aspect | Specification |
|---|---|
| Purpose | Prove control of the email and create or resume the session |
| User interaction | Enter 6 digits (one field accepting paste, numeric keyboard on mobile, `autocomplete="one-time-code"`); submit happens automatically on the 6th digit |
| Expected behaviour | Checks the hash, expiry and attempts (BR-03, BR-04, BR-07); on success marks the code used, creates the account if new (BR-09), creates a session (BR-13), then routes to onboarding if no username (BR-16) or to the safe `returnTo` (BR-14) and applies any intent (BR-15) |
| Required data | Email, code |
| Business rules | BR-03, BR-04, BR-07, BR-09, BR-13–BR-16, BR-25 |
| Dependencies | FR-10, FR-14 |
| Success states | Signed in and redirected |
| Failure states | Wrong code → "Incorrect code, N attempts left"; expired or exhausted → "This code is no longer valid" + "Send a new code"; suspended account → "This account is unavailable"; 429 → retry time |

#### FR-12 — Resend a code · R1
**Features:** A-01 · **Journeys:** UJ-05 (E2E-37)

| Aspect | Specification |
|---|---|
| Purpose | Recover from a lost or expired code |
| User interaction | "Send a new code" link on the code-entry view, disabled with a countdown during the cooldown |
| Expected behaviour | Same processing as FR-10 (new code invalidates the old one) under the 60 s cooldown and send limits |
| Required data | Email; Turnstile token |
| Business rules | BR-03, BR-05, BR-06, BR-08 |
| Dependencies | FR-10 |
| Success states | Confirmation toast "New code sent" |
| Failure states | Within cooldown or over limit → 429 and countdown/retry time |

#### FR-13 — Continue with Google · R1
**Features:** A-02 · **Journeys:** UJ-05 (E2E-31, E2E-42)

| Aspect | Specification |
|---|---|
| Purpose | One-click sign-in alternative (Google button observed on the reference) |
| User interaction | "Continue with Google" button on `/login`, `/signup` and the auth-gate modal (no One Tap prompt) |
| Expected behaviour | OAuth redirect flow with state/PKCE; only verified Google emails accepted; links to an existing account with the same email or creates a new one; then onboarding or `returnTo` as in FR-11 |
| Required data | Google subject ID, verified email, display name |
| Business rules | BR-11, BR-13–BR-16, BR-25 |
| Dependencies | Google OAuth client (blocker B-16); D-04 |
| Success states | Signed in and redirected |
| Failure states | User cancels, provider error or unverified email → back on `/login` with "Google sign-in didn't complete. Try again or use your email"; no account created |

#### FR-14 — Session, current user and sign-out · R1
**Features:** A-03 · **Journeys:** UJ-05 (E2E-33)

| Aspect | Specification |
|---|---|
| Purpose | Keep users signed in securely and let them sign out |
| User interaction | Avatar menu › Sign out |
| Expected behaviour | Server Components and Server Actions read the session; sessions follow BR-13; sign-out revokes server-side and clears the cookie; mutations are protected by origin/CSRF checks |
| Required data | Session ID, user ID, expiry, user agent, IP (security use only, deleted with the session, BR-79) |
| Business rules | BR-13, BR-25, BR-79 |
| Dependencies | D-04 |
| Success states | After sign-out, the header shows the signed-out state and old cookies are rejected |
| Failure states | Expired session → treated as signed out; a mutation then returns 401 and the UI opens the auth gate |

#### FR-15 — Auth-gate modal with intent and returnTo · R1
**Features:** A-04 · **Journeys:** UJ-04 (E2E-24), UJ-05 (E2E-32, E2E-39)

| Aspect | Specification |
|---|---|
| Purpose | Turn a gated action by a visitor into sign-in without losing context (observed: modal with `intent` + `return_to`) |
| User interaction | A visitor activates a gated control (R1: Like). A modal shows intent-specific copy ("To like this shot, sign in or create an account"), Google button and email field. Close button and **Escape close it** (the reference modal did not close on Escape, doc 10 §3) |
| Expected behaviour | Focus is trapped and returned to the trigger on close; on successful authentication the user returns to `returnTo` and the intent is applied once as an idempotent set (BR-15) |
| Required data | Intent (allow-list), target ID, `returnTo` |
| Business rules | BR-14, BR-15, BR-16 |
| Dependencies | FR-10–FR-13 |
| Success states | User back on the same page with the action applied |
| Failure states | Invalid `returnTo` → `/`; target gone or not allowed → toast, nothing changed; new account → onboarding first, then intent |

#### FR-16 — Protected routes · R1
**Features:** A-05 · **Journeys:** UJ-05 (E2E-40)

| Aspect | Specification |
|---|---|
| Purpose | Keep private pages private (observed: 302 to login for liked shots and upload) |
| User interaction | Visitor opens a protected URL |
| Expected behaviour | Redirect to `/login?returnTo=<path>`; API mutations return 401; pending members are routed to onboarding (BR-16). Protected routes per release are listed in BR-17 |
| Required data | Session |
| Business rules | BR-14, BR-16, BR-17 |
| Dependencies | FR-14 |
| Success states | After sign-in the user reaches the originally requested page |
| Failure states | Loop protection: `returnTo` never points to auth routes (BR-14) |

#### FR-17 — Minimal onboarding: username and display name · R1
**Features:** A-06 (minimal) · **Journeys:** UJ-05 (E2E-29, E2E-41)

| Aspect | Specification |
|---|---|
| Purpose | Profiles live at `/:username`, and email sign-up only collects an email, so every account needs a username before use (X-2, D-02) |
| User interaction | `/onboarding`: username field pre-filled with a suggestion and live availability check (debounced 300 ms), display-name field, Terms acknowledgement text, Continue |
| Expected behaviour | Validates BR-18–BR-22 on the client and again on the server; the claim is atomic (unique index); on success the account leaves pending state and the user goes to `returnTo` with any intent applied |
| Required data | Username, display name |
| Business rules | BR-16, BR-18–BR-22, BR-76 (`RL-ACCOUNT`) |
| Dependencies | FR-11/FR-13; reserved list (BUSINESS_RULES §13); OQ-02 |
| Success states | Profile reachable at `/:username` immediately |
| Failure states | Invalid, reserved or taken → specific inline error and a new suggestion; race lost → 409 "just taken" with a new suggestion |

#### FR-18 — Full onboarding · R2
**Features:** A-06 (full)

| Aspect | Specification |
|---|---|
| Purpose | Complete the profile for discovery and hiring |
| User interaction | Optional steps after the username: avatar upload, headline, location, "I want to: share work / hire designers" intent, skills; Skip available |
| Expected behaviour | Saves each step; intent influences homepage hero copy only (single account model) |
| Required data | Avatar media, headline (≤ 160), location (≤ 120), intent, skills (≤ 20 × 30 chars) |
| Business rules | BR-61, BR-62 (avatar), BR-76 |
| Dependencies | FR-61, FR-62 |
| Success states | Profile header shows the new data |
| Failure states | Avatar rejected → limits explained; skipping leaves defaults |

#### FR-19 — Account settings and deletion · R2
**Features:** A-07 · **Journeys:** UJ-13 (E2E-81, E2E-82)

| Aspect | Specification |
|---|---|
| Purpose | Let members manage their account and exercise erasure |
| User interaction | `/settings`: profile (FR-59), username change, email change (code to the new address), sessions list with "sign out other sessions", team invitations, delete account (confirm with a fresh code) |
| Expected behaviour | Username change per BR-23; email change takes effect only after verifying the new address; deletion per BR-24 |
| Required data | Account, sessions, invitations |
| Business rules | BR-03, BR-13, BR-23, BR-24, BR-58 |
| Dependencies | FR-14, FR-58 |
| Success states | Confirmation toasts; deletion signs the user out |
| Failure states | Team owner deleting → blocked with "transfer ownership first"; username change too soon → next allowed date shown |

#### FR-20 — Bot protection on code requests · R1
**Features:** A-01 · **Journeys:** UJ-05 (E2E-38)

| Aspect | Specification |
|---|---|
| Purpose | Stop automated abuse of email sending (cost and reputation, risk R-19) |
| User interaction | Turnstile widget, normally invisible or a single checkbox |
| Expected behaviour | Token verified server-side for every code request and resend (BR-08) |
| Required data | Turnstile token, site key/secret (environment) |
| Business rules | BR-08 |
| Dependencies | D-20 (Turnstile terms to verify) |
| Success states | Legitimate users see no extra step in most cases |
| Failure states | Widget fails to load → message with retry; the Google path remains available |

---

## 3. Functional requirements: discovery, search and shot detail

### 3.1 Discovery

#### FR-21 — Homepage · R1
**Features:** D-09 · **Journeys:** UJ-01 (E2E-01)

| Aspect | Specification |
|---|---|
| Purpose | Introduce the product and lead straight into discovery |
| User interaction | Hero with original copy and a primary CTA ("Explore shots"; "Sign up" when signed out); search block (Shots only in R1; Designers tab R2, Services tab R3); "Popular:" row of the 8 tags with the most eligible shots linking to `/search/:term`; Popular feed with infinite scroll; strip of the 10 designers with the most likes received |
| Expected behaviour | Server-rendered. The reference's "Hire talent / Get hired" hero toggle is not built until R3. No promo toast or announcement banner (BR-89) |
| Required data | Popular feed page 1, top tags, top designers |
| Business rules | BR-33, BR-35, BR-37, BR-45, BR-89 |
| Dependencies | FR-22–FR-24, FR-31 |
| Success states | LCP within NFR-01 |
| Failure states | Designer strip or tag row query fails → section omitted; the feed still renders |

#### FR-22 — Shot feeds: popular, recent, category · R1
**Features:** D-01 · **Journeys:** UJ-01 (E2E-01, E2E-03)

| Aspect | Specification |
|---|---|
| Purpose | Browse all eligible shots (observed routes `/shots/popular[/:category]`, `/shots/recent[/:category]`) |
| User interaction | Choose sort (Popular / New & noteworthy), a category pill or filters (FR-25) |
| Expected behaviour | The URL is the state: the path holds sort and category, the query holds `tag` and `timeframe`. The server renders page 1 (24 shots). Ordering per BR-32–BR-34; only eligible shots (BR-37) |
| Required data | Shots (id, slug, title, cover derivative, dominant colour, author summary, counts), categories |
| Business rules | BR-32–BR-37 |
| Dependencies | FR-24, FR-27, P09-06 |
| Success states | Grid of cards at the column counts of NFR-28 (D-24e) |
| Failure states | Unknown category → 404 (FR-05); zero results → empty state with "Clear filters" |

#### FR-23 — Infinite scroll with Load more fallback · R1
**Features:** D-01 · **Journeys:** UJ-01 (E2E-02, E2E-07, E2E-09)

| Aspect | Specification |
|---|---|
| Purpose | Continuous browsing without pagination clicks (observed) while staying accessible |
| User interaction | Scrolling near the end loads the next page; a visible "Load more" button does the same for keyboard and assistive-technology users |
| Expected behaviour | Cursor pagination (BR-35); skeleton cards while loading; a polite live region announces "24 more shots loaded"; duplicates dropped; end message on the last page; scroll position kept on back navigation |
| Required data | Cursor, page of shot summaries |
| Business rules | BR-35 |
| Dependencies | FR-22; custom infinite-scroll hook (D-21) |
| Success states | No duplicates; footer reachable |
| Failure states | Request fails → inline error with Retry, loaded cards kept; invalid cursor → 400 and the list restarts from page 1 |

#### FR-24 — Shot card · R1
**Features:** D-02 · **Journeys:** UJ-01, UJ-04 (E2E-20, E2E-28)

| Aspect | Specification |
|---|---|
| Purpose | Compact preview of a shot in any grid. One card component (the reference has two generations, doc 10 §3) |
| User interaction | The image (4:3, dominant-colour placeholder) links to the shot; avatar and name link to the profile; on hover or focus an overlay shows the title and the Like button; on touch devices Like sits below the image; a stats row shows likes and views |
| Expected behaviour | Counts abbreviated (BR-28). Like follows FR-45 and is hidden on own shots. Save and Get in touch are not rendered until their release (BR-45). The overlay also appears on keyboard focus; reduced motion disables the fade |
| Required data | Shot summary, `isLiked` for the viewer |
| Business rules | BR-28, BR-45, BR-46 |
| Dependencies | FR-45; image derivatives |
| Success states | Card renders without layout shift (NFR-02) |
| Failure states | Image fails to load → dominant-colour block with the title as alt text |

#### FR-25 — Filter bar: sort, category pills, tag and timeframe · R1
**Features:** D-03 · **Journeys:** UJ-01 (E2E-03, E2E-06)

| Aspect | Specification |
|---|---|
| Purpose | Narrow feeds (observed filter bar and panel) |
| User interaction | Sort dropdown; horizontally scrollable category pills (reachable by keyboard and scroll buttons); "Filters" toggle opening a panel with Tag (text input with suggestions from existing tags) and Timeframe (Now, This past week, This past month, This past year, All time); "Clear" per filter |
| Expected behaviour | Every change navigates to the new URL (shareable, server-rendered). Timeframe hidden on Recent (BR-34). The colour control is absent until R3 (X-4) |
| Required data | Categories, tags |
| Business rules | BR-34, BR-36, BR-40 |
| Dependencies | FR-22 |
| Success states | Active filters shown as removable chips |
| Failure states | Unknown tag in the query → empty state; invalid timeframe → ignored (BR-34) |

#### FR-26 — Colour filter control · R3
**Features:** D-03 (colour), D-05

| Aspect | Specification |
|---|---|
| Purpose | Filter feeds by colour from the Filters panel |
| User interaction | Hex input plus about 20 preset swatches; Clear |
| Expected behaviour | Adds `color=<hex>` to the URL and applies BR-80 |
| Required data | Shot palettes |
| Business rules | BR-80 |
| Dependencies | FR-36, FR-62 |
| Success states | Matching shots shown; the chosen colour is indicated |
| Failure states | Invalid hex → inline error; filter not applied |

#### FR-27 — Popularity score (simple, daily) · R1
**Features:** D-04 (R1 part) · **Journeys:** UJ-01 (E2E-01, E2E-03)

| Aspect | Specification |
|---|---|
| Purpose | Give the Popular feed a sensible order on seed data |
| User interaction | None (affects ordering) |
| Expected behaviour | A scheduled job recomputes `popularity_score` daily with the R1 formula; the seed generator sets initial scores |
| Required data | Likes, views, publication time |
| Business rules | BR-33 |
| Dependencies | Host cron (D-09, D-11) |
| Success states | Job completes within NFR-17 |
| Failure states | Job fails → previous scores kept and an alert raised (NFR-17) |

#### FR-28 — Popularity ranking job (full) · R2
**Features:** D-04

| Aspect | Specification |
|---|---|
| Purpose | Rank real user content once uploads, saves and comments exist |
| User interaction | None |
| Expected behaviour | R2 formula (BR-33) including saves and comments; hourly when the host plan allows, otherwise daily (OQ-24); new shots scored at publish |
| Required data | Likes, saves, comments by non-authors, views, publication time |
| Business rules | BR-33, BR-34 |
| Dependencies | FR-46, FR-49; OQ-10, OQ-24 |
| Success states | As FR-27 |
| Failure states | As FR-27 |

#### FR-29 — View logging and counts · R1
**Features:** D-10 · **Journeys:** UJ-04 (E2E-23)

| Aspect | Specification |
|---|---|
| Purpose | Show how often a shot is viewed (observed counts and batched logging), without Redis (X-3) |
| User interaction | None; counts appear on cards and in Details |
| Expected behaviour | The shot page sends one beacon after hydration; the server applies BR-29–BR-31 after responding |
| Required data | Shot ID, viewer key (user ID or daily HMAC), day |
| Business rules | BR-29, BR-30, BR-31, BR-76 (`RL-VIEW`) |
| Dependencies | `after()` (D-11) |
| Success states | The count increments at most once per viewer per day |
| Failure states | Write fails → silently dropped; the page is unaffected |

#### FR-30 — Video teaser on card hover · R3
**Features:** D-02 (teaser), C-03 · **Journeys:** R3 outline (E2E-93)

| Aspect | Specification |
|---|---|
| Purpose | Preview animated shots in grids (observed) |
| User interaction | Motion indicator on the card; the teaser plays on hover or focus; it never autoplays for reduced-motion users |
| Expected behaviour | Muted, looping small teaser; poster still otherwise |
| Required data | Teaser and poster derivatives |
| Business rules | BR-86 |
| Dependencies | FR-65 |
| Success states | Teaser starts within 300 ms of hover on broadband |
| Failure states | Teaser missing → poster only |

### 3.2 Search and tags

#### FR-31 — Shot search · R1
**Features:** D-06 · **Journeys:** UJ-02 (E2E-10, E2E-13, E2E-14)

| Aspect | Specification |
|---|---|
| Purpose | Find shots by keyword (observed `/search/:term`) |
| User interaction | Header search (or the homepage search block) → `/search/:term`; results grid with infinite scroll; heading with the term and a short generated description |
| Expected behaviour | Normalisation, safety and ranking per BR-38 and BR-39; Turso full-text search behind a `SearchService` interface (D-07) |
| Required data | Search index over title, tags, description and author name/username |
| Business rules | BR-35, BR-37, BR-38, BR-39 |
| Dependencies | SPIKE-01 (P02-07) |
| Success states | Results within NFR-05 |
| Failure states | Empty term → no navigation; index unavailable → error state with Retry (status 503) |

#### FR-32 — Search empty state and related tags · R1
**Features:** D-06 · **Journeys:** UJ-02 (E2E-10, E2E-12)

| Aspect | Specification |
|---|---|
| Purpose | Help users continue when results are poor or absent (observed empty state and "Related" terms) |
| User interaction | Related tag chips above the results; empty state with original artwork and popular-tag suggestions |
| Expected behaviour | Related tags per BR-39; zero-result pages are `noindex` |
| Required data | Tag frequency in the top results; popular tags |
| Business rules | BR-39 |
| Dependencies | FR-31 |
| Success states | Every suggestion leads to a page with results |
| Failure states | Related-tag query fails → chips omitted |

#### FR-33 — Tags index · R1
**Features:** D-07 · **Journeys:** UJ-02 (E2E-11)

| Aspect | Specification |
|---|---|
| Purpose | Browse all topics (observed `/tags`) |
| User interaction | Popular tags and an A–Z index with jump links |
| Expected behaviour | Per BR-41; server-rendered; may be cached for up to 1 hour |
| Required data | Tags with eligible shot counts |
| Business rules | BR-40, BR-41 |
| Dependencies | FR-06 |
| Success states | Each tag links to its tag page |
| Failure states | Empty catalogue → empty state |

#### FR-34 — Tag page · R1
**Features:** D-07 · **Journeys:** UJ-02 (E2E-11, E2E-15)

| Aspect | Specification |
|---|---|
| Purpose | All shots for one tag (observed `/tags/:tag` with a count headline) |
| User interaction | Headline "{n} shots tagged {tag}"; popular-ordered feed with infinite scroll |
| Expected behaviour | Per BR-41; reuses the FR-22/FR-23 components |
| Required data | Tag, eligible shot count, feed |
| Business rules | BR-28, BR-35, BR-41 |
| Dependencies | FR-22, FR-23 |
| Success states | The canonical URL uses the tag slug |
| Failure states | Tag missing or without eligible shots → 404 |

#### FR-35 — Header search types and autocomplete · R2 (Services type R3)
**Features:** D-08 · **Journeys:** R2 extension (E2E-85)

| Aspect | Specification |
|---|---|
| Purpose | Search designers as well as shots from the header (observed type switch) |
| User interaction | Type dropdown (Shots, Designers; Services in R3); suggestion list while typing |
| Expected behaviour | Suggestions start at 2 characters, are debounced by 200 ms, show at most 8 items (tags and usernames by prefix) and follow the combobox pattern (arrow keys, Enter, Escape). Designer results match name, username and skills |
| Required data | Tags; users (display name, username, skills) |
| Business rules | BR-37 (suspended users excluded), BR-38 |
| Dependencies | FR-31; P09-18 |
| Success states | Suggestions within 150 ms server time |
| Failure states | Suggestion request fails → list hidden; plain submit still works |

#### FR-36 — Colour search · R3
**Features:** D-05 · **Journeys:** R3 outline (E2E-95)

| Aspect | Specification |
|---|---|
| Purpose | Find shots by colour (observed `?color=`) |
| User interaction | Through FR-26, or a palette swatch on a shot (FR-43) |
| Expected behaviour | Matching and ordering per BR-80 |
| Required data | Palette colours in Lab |
| Business rules | BR-80 |
| Dependencies | FR-62; P09-24 |
| Success states | p95 within NFR-05 |
| Failure states | Invalid hex → inline error |

### 3.3 Shot detail

#### FR-37 — Shot detail page · R1
**Features:** SD-01 · **Journeys:** UJ-01 (E2E-01, E2E-05, E2E-08)

| Aspect | Specification |
|---|---|
| Purpose | Present one shot in full (observed `/shots/:id-:slug`) |
| User interaction | Sticky header with title, author avatar and name ("for {Team}" from R2) and the Like button; content blocks; author card; related sections; action rail (FR-39) |
| Expected behaviour | Server-rendered; canonical URL per BR-42; eligibility per BR-37; unreleased actions absent (BR-45); view beacon (FR-29) |
| Required data | Shot, ordered content blocks, author summary, counts, tags, viewer state (`isLiked`) |
| Business rules | BR-37, BR-42, BR-45, BR-46 |
| Dependencies | FR-38–FR-41, FR-29 |
| Success states | The LCP element is the first media block (NFR-01) |
| Failure states | Missing or ineligible → 404; slug mismatch → 308 |

#### FR-38 — Content block rendering · R1
**Features:** SD-01

| Aspect | Specification |
|---|---|
| Purpose | Show multi-part shots in order (block model observed in `shotData`) |
| User interaction | Scroll through image and text blocks; images may be full width |
| Expected behaviour | Image blocks use responsive derivatives with `srcset`, explicit dimensions and alt text; text blocks render plain text with links; video blocks arrive in R3 |
| Required data | Block type, position, media derivatives, alt text, full-width flag, text |
| Business rules | BR-64 (limits apply to R2 authoring) |
| Dependencies | FR-06 (R1 seed), FR-62 (R2) |
| Success states | No layout shift while images load |
| Failure states | One block's media missing → placeholder for that block; the others render |

#### FR-39 — Action rail and Share modal · R1
**Features:** SD-02 · **Journeys:** UJ-04 (E2E-21)

| Aspect | Specification |
|---|---|
| Purpose | Share a shot (observed rail with Comments, Share, Details, and a Share modal with Pinterest, X and copy link) |
| User interaction | Desktop: vertical rail at the right edge; mobile: a row below the media (FR-42). Share opens a modal with a preview, X and Pinterest buttons and a copy-link field. Where the Web Share API exists, a "More options" button opens the native share sheet (clone decision) |
| Expected behaviour | Per BR-44. The Comments entry is hidden until R2 (BR-45) |
| Required data | Canonical URL, title, cover derivative |
| Business rules | BR-44, BR-45 |
| Dependencies | FR-03 (modal) |
| Success states | "Link copied" toast |
| Failure states | Clipboard denied → link text selected with a "press Ctrl+C / ⌘C" hint |

#### FR-40 — Details modal · R1
**Features:** SD-02 · **Journeys:** UJ-04 (E2E-22)

| Aspect | Specification |
|---|---|
| Purpose | Show the shot's stats and tags (observed) |
| User interaction | The ⓘ button opens a modal: posted date, views, likes (saves and comments from R2), tag chips linking to tag pages |
| Expected behaviour | Full numbers with thousands separators; dates formatted for the viewer's locale (OQ-20) |
| Required data | Counts, `published_at`, tags |
| Business rules | BR-28, BR-45 |
| Dependencies | FR-03 |
| Success states | Dialog role, labelled, operable by keyboard |
| Failure states | None specific (data loaded with the page) |

#### FR-41 — More by and You might also like · R1
**Features:** SD-04 · **Journeys:** UJ-01 (E2E-01)

| Aspect | Specification |
|---|---|
| Purpose | Keep users exploring (observed sections) |
| User interaction | "More by {author}" (≤ 4 cards plus "View profile"); "You might also like" (≤ 12 cards) |
| Expected behaviour | Selection per BR-43. Both sections stream after the main content so they never delay LCP |
| Required data | Shot summaries |
| Business rules | BR-37, BR-43 |
| Dependencies | FR-24 |
| Success states | No shot appears in both sections |
| Failure states | Query fails or returns nothing → section omitted |

#### FR-42 — Mobile shot layout · R1
**Features:** SD-06 · **Journeys:** UJ-01, UJ-04 (run at 390 px)

| Aspect | Specification |
|---|---|
| Purpose | Usable shot pages on phones (observed mobile layout) |
| User interaction | Below 768 px: Like beside the author; the action rail becomes a horizontal row under the media; modals become bottom sheets (clone decision) |
| Expected behaviour | No horizontal scroll at 360 px; primary touch targets at least 44 × 44 px (above the NFR-26 minimum of 24 px) |
| Required data | As FR-37 |
| Business rules | BR-45 |
| Dependencies | FR-37, FR-39 |
| Success states | Passes viewport validation at 360 and 390 px (NFR-28) |
| Failure states | Overflow at any tested width is a defect |

#### FR-43 — Colour palette display · R2
**Features:** SD-03

| Aspect | Specification |
|---|---|
| Purpose | Show the shot's 7-colour palette (observed) |
| User interaction | Row of swatches under the media; activating a swatch copies its hex value (toast); from R3 it also links to colour search |
| Expected behaviour | Palette from the image pipeline; each swatch has a text label (hex) for accessibility; palette file download is Later |
| Required data | Palette (hex, Lab, position) |
| Business rules | BR-63, BR-80 (R3 link) |
| Dependencies | FR-62 |
| Success states | Hex copied |
| Failure states | No palette (processing failed) → row hidden |

#### FR-44 — Previous/next shot navigation · R2
**Features:** SD-05 · **Journeys:** R2 extension (E2E-86)

| Aspect | Specification |
|---|---|
| Purpose | Move through a designer's work without returning to the grid (observed buttons) |
| User interaction | Previous and Next buttons, plus ← and → keys when focus is not in a field |
| Expected behaviour | Navigates within the author's eligible shots in Work-tab (recent) order; a button is hidden at either end |
| Required data | Neighbouring shot IDs and slugs |
| Business rules | BR-37, BR-42 |
| Dependencies | FR-37 |
| Success states | Correct neighbours |
| Failure states | A neighbour became ineligible → it is skipped |

---

## 4. Functional requirements: social, profiles, creation, jobs and marketplace

### 4.1 Social graph

#### FR-45 — Like and unlike a shot · R1
**Features:** S-01 · **Journeys:** UJ-04 (E2E-20, E2E-24–E2E-27), UJ-05 (E2E-32)

| Aspect | Specification |
|---|---|
| Purpose | Let members appreciate shots; likes feed popularity (like button and counts observed; behaviour after sign-in unverified) |
| User interaction | Heart button on cards and the shot page; `aria-pressed` reflects state; a visitor gets the auth gate (FR-15) |
| Expected behaviour | Optimistic toggle (BR-47); the server inserts or deletes the like and changes `likes_count` and the author's `likes_received_count` in one batch (BR-26); idempotent set semantics (BR-46) |
| Required data | User ID, shot ID, timestamp |
| Business rules | BR-15, BR-26, BR-27, BR-46, BR-47, BR-76 (`RL-SOCIAL`), BR-77 |
| Dependencies | FR-14, FR-15; P09-08 |
| Success states | State and count persist after reload |
| Failure states | Own shot → 403 `CANNOT_LIKE_OWN` (control hidden); ineligible shot → 404; 401 → auth gate; 429 or 5xx → rollback and toast |

#### FR-46 — Collections: create, edit, delete, privacy · R2
**Features:** S-02 · **Journeys:** UJ-07 (E2E-57, E2E-58, E2E-60)

| Aspect | Specification |
|---|---|
| Purpose | Let members curate shots ("buckets" on the reference, renamed) |
| User interaction | Create from the save picker or the Collections tab; edit name, description and privacy; delete with confirmation |
| Expected behaviour | Limits, privacy and counts per BR-53–BR-55 |
| Required data | Collection (owner, name, slug, description, private flag), items |
| Business rules | BR-53, BR-54, BR-55, BR-76 (`RL-CONTENT`) |
| Dependencies | FR-14; P09-13 |
| Success states | Collection visible on the profile (unless private) |
| Failure states | Duplicate name → 409; over limits → 422 with the limit; another user's collection → 403 |

#### FR-47 — Save to collection (picker) · R2
**Features:** S-02 · **Journeys:** UJ-07 (E2E-57, E2E-59, E2E-60)

| Aspect | Specification |
|---|---|
| Purpose | Save a shot in one step from a card or shot page (save control observed; picker not observable) |
| User interaction | Save button opens a popover listing the member's collections with checkboxes and "New collection"; visitors get the auth gate (`save-shot`) |
| Expected behaviour | Checking or unchecking adds or removes items immediately (optimistic, BR-47 pattern); the button shows "Saved" when the shot is in at least one collection |
| Required data | Member's collections and membership of the shot |
| Business rules | BR-15, BR-53, BR-55, BR-76 (`RL-SOCIAL`) |
| Dependencies | FR-46 |
| Success states | `saves_count` updated |
| Failure states | Full collection → message, unchanged; 429 → rollback |

#### FR-48 — Follow, unfollow and follower lists · R2
**Features:** S-03 · **Journeys:** UJ-08 (E2E-61–E2E-63)

| Aspect | Specification |
|---|---|
| Purpose | Let members keep up with designers and teams (Follow/Following markup observed) |
| User interaction | Follow button on profiles and shot headers ("Following" when active); `/:username/followers` and `/:username/following` lists |
| Expected behaviour | Per BR-56; counts per BR-26 |
| Required data | Follower ID, followee ID, timestamp |
| Business rules | BR-15, BR-26, BR-56, BR-76 (`RL-SOCIAL`) |
| Dependencies | FR-14; P09-14 |
| Success states | Counts update on both profiles |
| Failure states | Self-follow → 400; 401 → auth gate; 429 → rollback |

#### FR-49 — Comments: read, post, reply, edit, delete · R2
**Features:** S-04 · **Journeys:** UJ-09 (E2E-64, E2E-65, E2E-67, E2E-68)

| Aspect | Specification |
|---|---|
| Purpose | Conversation on shots (comment counts and flags observed; comment content not inspected) |
| User interaction | Comments open in a side panel (desktop) or sheet (mobile) from the rail; composer at the bottom; Reply, Edit (15 min), Delete actions |
| Expected behaviour | Per BR-48–BR-50; new comments appear immediately for the author; others see them on reload or panel reopen (no realtime) |
| Required data | Comment (shot, author, parent, body, timestamps, deleted flag) |
| Business rules | BR-26, BR-48, BR-49, BR-50, BR-76 (`RL-COMMENT`) |
| Dependencies | FR-14; P09-15 |
| Success states | Count updated; focus moves to the new comment |
| Failure states | Validation → inline error with the draft kept; 429 → retry time; ineligible shot → 404 |

#### FR-50 — Comment likes and disabling comments · R2
**Features:** S-04 · **Journeys:** UJ-09 (E2E-66)

| Aspect | Specification |
|---|---|
| Purpose | Light feedback on comments; let authors switch comments off (`commentsDisabled` observed) |
| User interaction | Heart on each comment; "Disable comments" toggle in the shot's owner menu |
| Expected behaviour | Per BR-51, BR-52 |
| Required data | Comment likes; shot `comments_disabled` |
| Business rules | BR-51, BR-52, BR-76 (`RL-COMMENT`) |
| Dependencies | FR-49 |
| Success states | Toggle effective immediately |
| Failure states | Commenting on a disabled shot → 403 `COMMENTS_DISABLED` |

#### FR-51 — Notifications · R3
**Features:** S-05 · **Journeys:** R3 outline (E2E-90)

| Aspect | Specification |
|---|---|
| Purpose | Tell members about activity on their work |
| User interaction | Bell with unread count in the header; `/notifications` list; mark one or all as read |
| Expected behaviour | Events and grouping per BR-83; created post-response or via a queue (D-11) |
| Required data | Recipient, actor, type, subject, read time |
| Business rules | BR-81 (no notifications from blocked users), BR-83 |
| Dependencies | FR-45–FR-49; P09-20; OQ-18 |
| Success states | Unread count correct after reading |
| Failure states | Fan-out failure → notification skipped and logged; the original action still succeeds |

#### FR-52 — Block a user · R3
**Features:** S-06 · **Journeys:** R3 outline (E2E-91)

| Aspect | Specification |
|---|---|
| Purpose | Let members stop unwanted interaction ("Blocked" state markup observed) |
| User interaction | "Block" in the profile menu with confirmation; unblock in Settings |
| Expected behaviour | Per BR-81 |
| Required data | Blocker, blocked, timestamp |
| Business rules | BR-81 |
| Dependencies | FR-48, FR-49, FR-53 |
| Success states | Follows removed; interactions refused |
| Failure states | Self-block → 400 |

#### FR-53 — Messaging ("Get in touch") · R3
**Features:** S-07 · **Journeys:** R3 outline (E2E-92)

| Aspect | Specification |
|---|---|
| Purpose | Let clients contact designers (button observed; flow not observable) |
| User interaction | "Get in touch" on cards, shots and profiles opens a composer; `/messages` inbox with threads |
| Expected behaviour | Per BR-82; polling (OQ-17); messages to a team go to its owner and admins |
| Required data | Threads, participants, messages, read state |
| Business rules | BR-81, BR-82, BR-76 (`RL-MESSAGE`) |
| Dependencies | FR-14; P09-22 |
| Success states | Message visible to both participants |
| Failure states | Blocked → 403 with a neutral message; 429 → retry time |

### 4.2 Profiles and teams

#### FR-54 — Profile header and Work tab · R1
**Features:** P-01 · **Journeys:** UJ-03 (E2E-16–E2E-19)

| Aspect | Specification |
|---|---|
| Purpose | A designer's or team's portfolio at `/:username` (observed) |
| User interaction | Header: avatar, display name, Featured Studio badge when set (OQ-27), headline, stats (R1: shots and likes received; R2 adds followers and following); tabs (R1: Work, About; R2 adds Collections, Liked shots for the owner, Members for teams); Work grid with sort Recent/Popular and infinite scroll |
| Expected behaviour | Server-rendered; unknown, suspended or deleted accounts → 404 (BR-25); unreleased actions (Follow, Get in touch) absent (BR-45); team-type accounts render with a "Team" label in R1 |
| Required data | Profile, counts, shots by author (and by team from R2) |
| Business rules | BR-25, BR-28, BR-32, BR-33, BR-35, BR-45 |
| Dependencies | FR-22–FR-24; P09-04 |
| Success states | Canonical `/:username` in lower case |
| Failure states | No shots → "No shots yet" empty state; unknown → 404 |

#### FR-55 — About tab · R1
**Features:** P-02 · **Journeys:** UJ-03 (E2E-16)

| Aspect | Specification |
|---|---|
| Purpose | Tell visitors who the designer is (observed About tab) |
| User interaction | `/:username/about`: bio, location, member since (month and year), skills, languages, social and website links, public contact email with copy-to-clipboard toast |
| Expected behaviour | External links open in a new tab with `rel="nofollow noopener noreferrer"`; empty fields are omitted, not shown blank |
| Required data | Bio, location, created date, skills, languages, links, public email |
| Business rules | BR-78 |
| Dependencies | FR-54 |
| Success states | "Email copied" toast |
| Failure states | Clipboard denied → email shown as selectable text |

#### FR-56 — Collections tab and collection detail · R2
**Features:** P-03

| Aspect | Specification |
|---|---|
| Purpose | Show a member's public collections (observed `/:username/collections[/:id-:slug]`) |
| User interaction | Cards with a thumbnail mosaic, name and "N shots"; detail page with curator header, Share and a shot grid |
| Expected behaviour | Private collections only for the owner (BR-54); shots that became ineligible are hidden from the grid |
| Required data | Collections and items |
| Business rules | BR-37, BR-54 |
| Dependencies | FR-46 |
| Success states | Counts match visible items |
| Failure states | Private or missing → 404 |

#### FR-57 — Liked shots tab (owner only) · R2
**Features:** P-04 · **Journeys:** R2 extension (E2E-87)

| Aspect | Specification |
|---|---|
| Purpose | Let members revisit what they liked (observed: protected route) |
| User interaction | `/:username/likes` grid, newest like first |
| Expected behaviour | Visitor → login redirect (BR-17); another member → 404; owner → list of eligible liked shots |
| Required data | Likes with timestamps |
| Business rules | BR-17, BR-37 |
| Dependencies | FR-45; OQ-12 (possible R1 inclusion) |
| Success states | Owner sees their likes |
| Failure states | As listed in Expected behaviour |

#### FR-58 — Teams and members · R2
**Features:** P-05 · **Journeys:** UJ-12 (E2E-77–E2E-79)

| Aspect | Specification |
|---|---|
| Purpose | Studios present shared work ("X for Team" and Members tab observed; team administration not observable) |
| User interaction | Create team (username, name); Members tab listing members; team settings to invite by username, change roles, remove, transfer ownership, delete team; members accept invitations in Settings › Teams; composer option "Publish for {team}" |
| Expected behaviour | Per BR-57–BR-60 |
| Required data | Team account, memberships (role), invitations (expiry) |
| Business rules | BR-20, BR-57, BR-58, BR-59, BR-60, BR-76 (`RL-CONTENT`) |
| Dependencies | FR-63; P09-16; OQ-15 |
| Success states | Attribution shown on cards and shot pages |
| Failure states | Non-member attribution → 403; owner leaving → refused; invitation expired → message |

#### FR-59 — Profile edit · R2
**Features:** P-06 · **Journeys:** UJ-13 (E2E-80)

| Aspect | Specification |
|---|---|
| Purpose | Members maintain their public profile |
| User interaction | Settings › Profile: avatar, display name, headline, bio (≤ 1,000), location, website and social links (≤ 6), skills (≤ 20), languages (≤ 10), public email, "available for work" flag |
| Expected behaviour | Validation on client and server; URLs must be `https://`; changes visible immediately |
| Required data | Profile fields |
| Business rules | BR-22, BR-61, BR-62, BR-78, BR-76 (`RL-ACCOUNT`) |
| Dependencies | FR-61, FR-62 |
| Success states | Saved toast; profile updated |
| Failure states | Invalid field → inline error; avatar rejected → limits explained |

#### FR-60 — Services tab · R3
**Features:** P-07

| Aspect | Specification |
|---|---|
| Purpose | Show a designer's service listings on their profile (observed) |
| User interaction | `/:username/services`: rows with title, "From $X", delivery time and excerpt |
| Expected behaviour | Lists the seller's active listings (FR-75); the Reviews tab is Later |
| Required data | Service listings |
| Business rules | BR-84 |
| Dependencies | FR-75 |
| Success states | Rows link to service detail |
| Failure states | No services → tab hidden |

### 4.3 Media and shot creation (R2/R3)

#### FR-61 — Upload media · R2
**Features:** C-01 · **Journeys:** UJ-06 (E2E-50, E2E-52, E2E-53)

| Aspect | Specification |
|---|---|
| Purpose | Get images into R2 safely (uploader not observable on the reference) |
| User interaction | Drag-and-drop or file picker in the composer with per-file progress |
| Expected behaviour | Client pre-checks type and size; the server issues a presigned PUT (D-16), then verifies magic bytes, size and dimensions after upload and deletes rejected objects (BR-61, BR-62, F-08) |
| Required data | Media record (owner, key, MIME, bytes, width, height, status) |
| Business rules | BR-61, BR-62, BR-66, BR-76 (`RL-UPLOAD`) |
| Dependencies | R2 account (D-10); SPIKE-04 |
| Success states | Media status `ready` after FR-62 |
| Failure states | Rejected type/size/dimensions → message with the limit; network failure → retry per file |

#### FR-62 — Image pipeline · R2
**Features:** C-02 · **Journeys:** UJ-06 (E2E-50, E2E-54)

| Aspect | Specification |
|---|---|
| Purpose | Produce fast, safe derivatives and colour data (outputs observed) |
| User interaction | Processing indicator per block |
| Expected behaviour | Per BR-63, with sharp in a Node runtime handler (D-15) |
| Required data | Derivative keys, dominant colour, palette (Lab) |
| Business rules | BR-63 |
| Dependencies | FR-61; SPIKE-04, SPIKE-05 |
| Success states | Derivatives served through the custom image loader |
| Failure states | Timeout or error → `failed` with Retry/Remove |

#### FR-63 — Shot composer (create and edit) · R2
**Features:** C-04 · **Journeys:** UJ-06 (E2E-50, E2E-55)

| Aspect | Specification |
|---|---|
| Purpose | Author multi-block shots (block structure observed in `shotData`) |
| User interaction | `/uploads/new` and `/shots/:id/edit`: add, reorder (drag and keyboard), remove image and text blocks; full-width toggle; alt text; title, description, category, tags (with suggestions), optional team |
| Expected behaviour | Validation per BR-64; autosave of drafts every 10 s and on blur; edits of published shots go live on save |
| Required data | Shot, blocks, tags, category, team |
| Business rules | BR-40, BR-59, BR-64, BR-65, BR-76 (`RL-CONTENT`) |
| Dependencies | FR-61, FR-62; P09-11; OQ-05 |
| Success states | Published shot at its canonical URL |
| Failure states | Validation → inline errors, focus to first; autosave failure → "Not saved" indicator with retry |

#### FR-64 — Draft, publish and delete · R2
**Features:** C-05 · **Journeys:** UJ-06 (E2E-51, E2E-56)

| Aspect | Specification |
|---|---|
| Purpose | Manage a shot's lifecycle |
| User interaction | "Save draft", "Publish", "Delete" (with confirmation); drafts listed in the member's dashboard area of the Work tab (owner only) |
| Expected behaviour | Per BR-65; counters per BR-26 |
| Required data | Status, `published_at`, deleted time |
| Business rules | BR-26, BR-65, BR-66 |
| Dependencies | FR-63 |
| Success states | Published shot appears in Recent at once |
| Failure states | Draft limit reached → message; publishing quota reached → 429 |

#### FR-65 — Video and GIF teasers · R3
**Features:** C-03 · **Journeys:** R3 outline (E2E-93)

| Aspect | Specification |
|---|---|
| Purpose | Support animated shots (outputs observed) |
| User interaction | Upload GIF or video blocks in the composer; options loop and autoplay |
| Expected behaviour | Per BR-86; processing off the request path (D-18, OQ-25); autoplay respects reduced motion |
| Required data | Poster, teaser small/large, duration |
| Business rules | BR-86 |
| Dependencies | FR-61; P09-23 |
| Success states | Teaser available on cards (FR-30) |
| Failure states | Processing fails → poster only |

### 4.4 Jobs (R2)

#### FR-67 — Job board · R2
**Features:** J-01 · **Journeys:** UJ-10 (E2E-69, E2E-70)

| Aspect | Specification |
|---|---|
| Purpose | Free board of design jobs (observed `/jobs` with sidebar filters) |
| User interaction | Keyword search; sidebar: 9 specialties, location with "Open to remote", employment type; job rows with company, title, location, Remote tag, posted time, "View job" |
| Expected behaviour | Filters as URL query (GET); semantics per BR-75; only active jobs |
| Required data | Jobs, specialties |
| Business rules | BR-73, BR-75 |
| Dependencies | P09-19 |
| Success states | Results update with the URL |
| Failure states | No results → empty state with "Clear filters" |

#### FR-68 — Job detail · R2
**Features:** J-02 · **Journeys:** UJ-10 (E2E-69, E2E-71)

| Aspect | Specification |
|---|---|
| Purpose | Full job information and the way to apply (observed) |
| User interaction | `/jobs/:id-:slug`: title, sanitised description, share (X, copy link), company card (logo, name, website), Apply button, job type, location, posted date; "All jobs" link |
| Expected behaviour | Apply per BR-74; expired jobs per BR-73; canonical slug redirect as BR-42 |
| Required data | Job, company fields |
| Business rules | BR-72, BR-73, BR-74 |
| Dependencies | FR-67 |
| Success states | Apply opens the employer destination |
| Failure states | Closed or expired → notice without Apply; missing → 404 |

#### FR-69 — Post a free job (wizard) · R2
**Features:** J-03 · **Journeys:** UJ-11 (E2E-72–E2E-76)

| Aspect | Specification |
|---|---|
| Purpose | Let employers publish jobs at no cost (step-1 form observed; later steps and payment not observed) |
| User interaction | `/jobs/new`: step 1 job details (rich-text editor with paragraph, H2/H3, bold, italic, lists, links), step 2 company, step 3 preview and publish; Back/Continue; visitors pressing Continue get the auth gate (`post-job`) with entered data kept in the browser session |
| Expected behaviour | Per BR-71–BR-73 |
| Required data | Job and company fields |
| Business rules | BR-15, BR-71, BR-72, BR-73, BR-76 (`RL-CONTENT`) |
| Dependencies | FR-14, FR-61 (logo); OQ-16 |
| Success states | Job live on the board |
| Failure states | Missing/invalid fields → errors and focus; active-job limit → refused with explanation |

#### FR-70 — Manage own jobs · R2
**Features:** J-03

| Aspect | Specification |
|---|---|
| Purpose | Keep posts accurate |
| User interaction | Settings › Jobs: list with status and expiry; Edit, Close |
| Expected behaviour | Edits re-sanitised; closing removes the job from the board immediately; expiry per BR-73 |
| Required data | Jobs by poster |
| Business rules | BR-72, BR-73 |
| Dependencies | FR-69 |
| Success states | Status changes visible |
| Failure states | Editing another user's job → 403 |

### 4.5 Hiring marketplace (R3, listing only)

#### FR-73 — Hire directory · R3
**Features:** H-01 · **Journeys:** R3 outline (E2E-94)

| Aspect | Specification |
|---|---|
| Purpose | Find designers to hire (observed `/hire` with filters) |
| User interaction | Designer cards (avatar, name, location, services count, 4 work thumbnails, skills, Get in touch); filters: categories, location, available for work, teams only |
| Expected behaviour | Rating and Pro filters are omitted until reviews and Pro exist (Later); no promoted cards; infinite scroll per BR-35 |
| Required data | Profiles, availability, services count, shots |
| Business rules | BR-35, BR-37 |
| Dependencies | FR-54, FR-75; P09-25 |
| Success states | Filters reflected in the URL |
| Failure states | No match → empty state |

#### FR-75 — Services listing (no checkout) · R3
**Features:** M-01 · **Journeys:** R3 outline (E2E-94)

| Aspect | Specification |
|---|---|
| Purpose | Designers advertise packaged services (observed listing and detail) |
| User interaction | Sellers create, edit and delete listings (title, description, cover images, price "from", delivery days, concepts, revisions, category, tags); `/services` with filters (category, tags, price, delivery); detail page with "Request service" |
| Expected behaviour | Per BR-84; "Request service" opens a message (FR-53); no ordering or payment |
| Required data | Service listings |
| Business rules | BR-72 (description sanitising), BR-84 |
| Dependencies | FR-53; P09-26 |
| Success states | Listing visible on `/services` and the profile tab |
| Failure states | Validation errors inline; ordering is never offered |

### 4.6 Platform features of R3

#### FR-84 — Analytics events · R3
**Features:** X-03

| Aspect | Specification |
|---|---|
| Purpose | Understand usage without third-party trackers (reference analytics observed; not copied) |
| User interaction | None; consent per FR-86 where required |
| Expected behaviour | First-party events (page view, search, like, share, sign-up completed) with no personal data; batched |
| Required data | Event name, anonymous session key (after consent), path, timestamp |
| Business rules | BR-79, BR-85 |
| Dependencies | OQ-19; P09-28 |
| Success states | Daily aggregates available to the operator |
| Failure states | Event ingestion failure never affects the page |

#### FR-86 — Cookie consent · R3
**Features:** X-05 · **Journeys:** R3 outline (E2E-96)

| Aspect | Specification |
|---|---|
| Purpose | Lawful use of non-essential cookies |
| User interaction | Banner with Accept, Reject (equal prominence) and Settings; footer link to change the choice |
| Expected behaviour | Per BR-85; shown only once a non-essential cookie exists |
| Required data | Consent choice and date |
| Business rules | BR-85 |
| Dependencies | FR-84 |
| Success states | Choice remembered for 12 months |
| Failure states | Consent storage fails → treated as rejected |

#### FR-87 — Basic SEO metadata · R1
**Features:** D-11 (basic) · **Journeys:** UJ-01 (E2E-08), UJ-02 (E2E-12)

| Aspect | Specification |
|---|---|
| Purpose | Discoverable public pages from launch |
| User interaction | None |
| Expected behaviour | Unique `<title>` and meta description per page; canonical links (BR-42, BR-38); Open Graph and Twitter card tags on shot pages (cover image) and profiles; `noindex` on auth pages, onboarding, zero-result searches and expired jobs; `robots.txt` |
| Required data | Page entities |
| Business rules | BR-38, BR-42 |
| Dependencies | Next.js Metadata API |
| Success states | NFR-33 thresholds |
| Failure states | Missing metadata on any public route is a defect |

#### FR-88 — Sitemaps and structured data · R3
**Features:** D-11 (full)

| Aspect | Specification |
|---|---|
| Purpose | Scale search-engine discovery (reference sitemaps observed) |
| User interaction | None |
| Expected behaviour | XML sitemap index split by type (shots, profiles, tags, jobs) with at most 50,000 URLs per file; JSON-LD `CreativeWork` on shots, `Person`/`Organization` on profiles, `JobPosting` on active jobs |
| Required data | Eligible entities with last-modified dates |
| Business rules | BR-37, BR-73 |
| Dependencies | P09-27 |
| Success states | NFR-34 thresholds |
| Failure states | Generation failure → previous sitemap kept |

### 4.7 Moderation reporting (proposal)

#### FR-90 — Report content and review queue · R2
**Features:** NX-05 · **Journeys:** UJ-14 (E2E-83, E2E-84)

| Aspect | Specification |
|---|---|
| Purpose | Let the community flag problems once user content exists |
| User interaction | "Report" in the menu of shots, comments, profiles, collections and jobs (reason + optional note); moderators use `/admin/reports` to Hide, Dismiss or Suspend |
| Expected behaviour | Per BR-68, BR-69; audit log for every action |
| Required data | Report (reporter, target type/ID, reason, note, status), audit rows |
| Business rules | BR-68, BR-69, BR-76 (`RL-REPORT`, `RL-MODERATION`) |
| Dependencies | FR-09; OQ-04 (approval and new tasks) |
| Success states | Reporter sees "Thanks, we'll review this" |
| Failure states | Duplicate → acknowledged, nothing created; own content → not offered |

### 4.8 Later and candidate features (summary level)

These requirements are recorded for completeness and traceability only. They are **not planned**. Rows marked 💳 need **payment approval** (blocker B-19); the others need a **scope decision**. Each will be specified in full when approved.

| ID | Requirement | Features | Purpose | User interaction | Expected behaviour | Required data | Rules | Dependencies | Success | Failure |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-66 | Rebounds | C-06 | Reply to a shot with a shot | "Rebound" on a shot opens the composer | New shot linked to the original; listed under it | `rebound_of` link | BR-64 | FR-63 | Rebound listed on original | Original deleted → link removed |
| FR-71 | 💳 Paid job tiers | J-04 | Featured/pinned placement | Plan choice in the job wizard | Paid placement for a period | Plan, payment | — | FR-80 | Job highlighted | Payment fails → stays free |
| FR-72 | Job directories (SEO) | J-05 | Location/specialty job pages | Browse `/{specialty}-jobs-in-{place}` | Generated lists of active jobs | Jobs, places | BR-20 pattern | FR-67 | Indexable pages | No jobs → 404 |
| FR-74 | Specialty landing pages | H-02 | SEO pages per specialty | Read guide, browse designers | Directory + editorial content | CMS content | — | FR-73, FR-83 | Pages indexed | Missing content → 404 |
| FR-76 | 💳 Service orders | M-02 | Buy a service | Hire Now → checkout → delivery | Order lifecycle with payments | Orders, payments | — | FR-75, FR-80 | Order completed | Payment or delivery dispute |
| FR-77 | 💳 Reviews and ratings | M-03 | Reputation | Rate after an order | Aggregate rating on profiles | Reviews | — | FR-76 | Rating shown | Review without order refused |
| FR-78 | 💳 Project brief wizard | M-04 | Clients describe projects | Multi-step brief, optional AI draft | Brief published | Briefs | — | LLM provider, FR-80 | Brief live | Generation fails → manual entry |
| FR-79 | 💳 Brief board and proposals | M-05 | Designers find and pitch work | Browse briefs, send proposals | Pro-gated access | Briefs, proposals | — | FR-81 | Proposal sent | Not entitled → upsell |
| FR-80 | 💳 Payments integration | B-01 | Take payments | Checkout | Payment provider with webhooks | Customers, payments | — | Payment approval | Payment recorded | Webhook failure retried |
| FR-81 | 💳 Pro subscriptions | B-02 | Paid membership | Choose plan | Badge and entitlements | Subscriptions | — | FR-80 | Entitlements active | Lapsed → removed |
| FR-82 | 💳 Boosts and ad slots | B-03 | Paid promotion | Boost a shot | Labelled promoted cards in feeds | Boosts | BR-35 | FR-80 | Impressions counted | No eligible boost → none shown |
| FR-83 | Blog and resources | X-01 | Editorial content | Read articles | CMS-driven pages | Articles | BR-88 | CMS choice | Pages indexed | Missing → 404 |
| FR-85 | Marketing pages (pricing pages 💳) | X-04 | Explain offers | Read pages | Static pages | Copy | BR-88 | FR-81 for pricing | Pages live | — (static) |
| FR-89 | Challenges (renamed Playoffs) | D-12 | Design challenges | Respond to a challenge shot | Threaded rebound gallery | Challenges | — | FR-66 | Responses listed | Closed challenge refuses entries |
| FR-91 | Schedule a call (candidate) | NX-01 | Book time with a designer | Pick a slot | Calendar integration | Availability | — | OQ-22 | Booking confirmed | Slot taken → refresh |
| FR-92 | Save a designer (candidate) | NX-02 | Shortlist designers | Save on profile/hire card | Saved-designers list | Saved designers | — | OQ-22 | Listed | — |
| FR-93 | Places page (candidate) | NX-03 | Browse by location | Pick a city or country | Designers by place | Structured locations | — | OQ-22 | Lists shown | Unknown place → 404 |
| FR-94 | Announcement banner management (candidate) | NX-04 | Site-wide notices | Dismiss banner | Admin-configured banner | Banner config | BR-89 | OQ-22 | Banner shown/dismissed | — |

---

## 5. Non-functional requirements

Every NFR has a measurable threshold, a measurement method and the test suite that will verify it (suite IDs from [TESTING_PROGRESS.md](../TESTING_PROGRESS.md)). All are **Test planned**. "In-region" means the app host and the Turso database in the same region (D-14). Lab measurements use Lighthouse mobile emulation (Moto G Power class device, slow 4G throttling) on the seeded dataset; field data, when available, uses the 75th percentile (p75).

### 5.1 Performance

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-01 | Largest Contentful Paint on `/`, feeds, shot detail, profile, search and tag pages | **LCP < 2.5 s at p75 on mobile** | Lighthouse CI (5 runs, median per page) and field p75 when available | R1 | T-29 |
| NFR-02 | Layout stability and responsiveness | **CLS < 0.1** and **INP < 200 ms** at p75 on mobile | Lighthouse CI + Playwright interaction traces | R1 | T-29 |
| NFR-03 | Time to first byte for server-rendered public pages | **TTFB < 800 ms at p75**, in-region, cache miss | Synthetic checks from the host region | R1 | T-29 |
| NFR-04 | Feed page request (page of 24 shots) | **p95 < 300 ms server time** in-region at a sustained **20 requests/s** on the scale dataset (NFR-13) | Load test (tool approval pending, T-29) with server timing headers | R1 | T-29 |
| NFR-05 | Search and colour search | Search page request **p95 < 400 ms** server time; the full-text query itself **p95 < 150 ms** (SPIKE-01 criterion); colour search **p95 < 500 ms** (R3) | Load test + query timing logs | R1 (colour R3) | T-29 |
| NFR-06 | Mutations (like, follow, save, comment) | **p95 < 400 ms** server time; optimistic UI feedback **< 100 ms** after activation | Contract-test timing + Playwright traces | R1 | T-29, T-24 |
| NFR-07 | JavaScript budget | Initial JS for feed and shot routes **≤ 180 KB gzip** | Build output analysis in CI | R1 | T-21, T-29 |
| NFR-08 | Image weight | Feed thumbnails average **≤ 60 KB** (WebP, 1× density); no image served more than 1.5× its displayed width | Lighthouse "properly size images"; asset audit | R1 | T-29 |
| NFR-09 | Database efficiency | **≤ 3 database round trips** per server-rendered page; **≤ 200 rows read** per feed page request; no N+1 queries | Query logging in integration tests (row counters) | R1 | T-23, T-29 |

### 5.2 Scalability within Turso limits

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-10 | Monthly row writes | At a modelled load of **5,000 daily active users** (each: 10 shot views, 3 likes, 1 sign-in per week), projected writes **≤ 50% of the plan quota** (Free: 10 M/month); rate-limiter writes **≤ 10%** of total writes (D-12) | Write-volume model in P11-05 using measured writes per action | R1 | T-29 |
| NFR-11 | Monthly row reads | Same load model: projected reads **≤ 50% of the plan quota** (Free: 500 M/month) | Read-volume model in P11-05 | R1 | T-29 |
| NFR-12 | Storage | Database **≤ 2.5 GB** (50% of the Free plan's 5 GB) after 12 months at the modelled load; no binaries in the database (A-03) | Growth model + `dbstat` sampling | R1 | T-29 |
| NFR-13 | Data volume | NFR-04 and NFR-05 are met with **100,000 shots, 10,000 users and 1,000,000 likes** | Scale dataset (FR-06) in P11-05 | R1 | T-29 |
| NFR-14 | Hot counters | **50 concurrent likes** on one shot complete without error and the counter is exact (BR-26) | Integration concurrency test | R1 | T-23 |

### 5.3 Reliability and recovery

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-15 | Availability | **≥ 99.5% monthly** for public pages and `/api/health` | Uptime check every 5 minutes | R1 | T-31 |
| NFR-16 | Server error rate | **≤ 0.5%** of requests return 5xx per day | Monitoring (D-17) | R1 | T-31 |
| NFR-17 | Scheduled jobs | Popularity recompute completes in **≤ 5 minutes**; any job failure raises an alert within **15 minutes**; counter drift after reconciliation is **0** | Job logs and alerting | R1 | T-23, P12-04 |
| NFR-18 | Graceful degradation | If email sending fails, Google sign-in still works and the page explains the issue; if R2 is unreachable, pages render with dominant-colour placeholders; a failing related-shots query never fails the shot page | Fault-injection integration and E2E tests | R1 | T-23, T-25 |
| NFR-19 | Backup and restore | **RPO ≤ 24 hours** on the Free plan, **≤ 1 hour** after moving to the Developer plan before launch (D-14); **RTO ≤ 4 hours**; restore drill passes | Restore drill (P12-03) | R1 | T-32 |

### 5.4 Security

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-20 | Baseline control set | All **OWASP ASVS 5.0 Level 1** requirements for authentication, session management, access control, input validation and file upload are met; **0 high or critical** findings in the ZAP baseline scan and dependency audit at each G7 | Security test report | R1 | T-28 |
| NFR-21 | Mutation hygiene | **100%** of Server Actions and mutating Route Handlers have Zod validation, an authorization rule and a rate-limit class, each with contract tests for 401/403 and 429 | Contract-test coverage report | R1 | T-14 |
| NFR-22 | Transport and headers | HTTPS only with **HSTS max-age ≥ 31,536,000 s**; CSP with nonces and no `unsafe-inline` scripts; `frame-ancestors 'none'`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; restrictive `Permissions-Policy` | Header test on every route type | R1 | T-28 |
| NFR-23 | Secrets and personal data in logs | **0** secrets in the repository (secret scan in CI); **0** emails, codes, tokens or raw IPs in a sampled 10,000 log lines | CI secret scan; log scan | R1 | T-21, T-28 |
| NFR-24 | Authentication strength | Codes hashed at rest (BR-02); brute force bounded by BR-04/BR-07 (expected success of guessing a code < 0.001% per code); session cookies per BR-13 | Integration tests + review | R1 | T-23, T-28 |
| NFR-25 | Upload safety | **100%** of non-image or disguised files rejected in the fuzzing set; **0** EXIF/GPS fields in served derivatives; SVG never served from user uploads | Upload fuzzing (P11-09) | R2 | T-28 |

### 5.5 Accessibility

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-26 | WCAG 2.2 AA conformance | **0 serious or critical axe violations** on every route and modal state; text contrast **≥ 4.5:1** (large text 3:1); control boundaries and focus indicators **≥ 3:1** (F-10); focus indicator at least 2 px; target size **≥ 24 × 24 CSS px** (2.5.8); `prefers-reduced-motion` and `prefers-reduced-transparency` honoured; all functionality keyboard-operable with no traps (modals close on Escape) | axe in Playwright; manual keyboard pass; screen-reader pass (NVDA + Firefox/Chrome on Windows, VoiceOver + Safari on iOS) on UJ-01…UJ-05 | R1 | T-27 |
| NFR-27 | Accessible infinite lists | A "Load more" button is always available; new items are announced via a polite live region; the footer is reachable by keyboard; focus moves to the first new item when loading via the button | E2E-09; manual check | R1 | T-25, T-27 |

### 5.6 Responsiveness and browser support

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-28 | Responsive layout from **360 px to 1440 px and wider** | **No horizontal page scroll** at 360, 390, 768, 1024, 1280, 1440 and 1920 px; grid columns from a 264 px minimum column (`repeat(auto-fill, minmax(min(100%, 264px), 1fr))`, container max 1680 px; D-24e): 1 at 360/390, 2 at 768, 3 at 1024, 4 at 1280 and 1440, at most 5 on wider screens; text never overflows its container | Playwright viewport projects + visual regression at the 6 gate widths (1440/1280/1024/768/390/360) | R1 | T-18, T-26 |
| NFR-29 | Browser support matrix (below) | All R1 E2E journeys pass on every **Full** browser; **Basic** browsers render all content and allow sign-in and liking, with cosmetic differences allowed (for example no backdrop blur) | Playwright projects (Chromium, Firefox, WebKit) + manual spot checks on real iOS/Android devices before each G7 | R1 | T-25 |

| Browser | Versions | Support |
|---|---|---|
| Chrome (desktop and Android), Edge | Last 2 stable | Full |
| Firefox (desktop) | Last 2 stable + current ESR | Full |
| Safari (macOS and iOS/iPadOS) | 16.4 and later | Full |
| Samsung Internet | Last 2 stable | Basic |
| Firefox for Android | Last 2 stable | Basic |
| Internet Explorer, legacy Edge, Safari < 16.4 | — | Not supported |

### 5.7 Privacy

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-30 | Cookies | **Only essential cookies** in R1–R2 (session, CSRF/OAuth state, Turnstile, UI preference); **0** third-party trackers on any page; consent required before any non-essential cookie (R3, BR-85) | Cookie and network audit per route | R1 | T-28 |
| NFR-31 | Retention | **100%** of the retention periods in BR-79 enforced by scheduled clean-up | Integration tests with a test clock | R1 | T-23 |
| NFR-32 | Data exposure | **0** API responses that contain another user's sign-in email, session data or IP (BR-78) | Contract tests over every response schema | R1 | T-14 |

### 5.8 SEO

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-33 | Search-engine readiness | Lighthouse SEO score **≥ 95** on `/`, feed, shot, profile, search and tag pages; **100%** of public routes with a unique title, meta description and canonical URL; correct `noindex` on the routes listed in FR-87 | Lighthouse CI + route metadata test | R1 | T-29, T-25 |
| NFR-34 | Sitemaps and structured data | **0 errors** in schema validation of JSON-LD samples; every sitemap file ≤ 50,000 URLs and ≤ 50 MB; **100%** of sitemap URLs return 200 | Validator run + crawler check | R3 | T-29 |

### 5.9 Maintainability and observability

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-35 | Code quality gates | TypeScript strict with **0 type errors**; **0 lint errors**; unit + integration coverage **≥ 80%** on services and repositories (workflow §9) | CI | R1 | T-21, T-22, T-23 |
| NFR-36 | Pipeline speed | PR pipeline (lint, typecheck, unit, integration, contract, component, build, E2E smoke) **≤ 15 minutes**; full nightly E2E **≤ 60 minutes** | CI timings | R1 | T-21 |
| NFR-37 | Observability | **100%** of unhandled server errors reported to monitoring (D-17) with a request ID; structured JSON logs; `/api/health` responds in **≤ 500 ms** | Fault injection; health check timing | R1 | T-31 |
| NFR-38 | Configurability | All business-rule numbers marked as defaults in BUSINESS_RULES (limits, TTLs, weights) are read from one typed configuration module; **0** duplicated literals for these values in code | Code review checklist + unit test on the config schema | R1 | T-22 |
| NFR-39 | Dependency hygiene | Every runtime dependency is approved in the DECISION_LOG and pinned to an exact version; **0** known high/critical vulnerabilities at release | Dependency audit in CI | R1 | T-21, T-28 |

### 5.10 Localisation

| ID | Requirement | Threshold | Measurement | Release | Suite |
|---|---|---|---|---|---|
| NFR-40 | Language and formats | English UI; **100%** of dates and numbers formatted with `Intl` in the viewer's locale; prices in USD (R3) (OQ-20) | Unit tests on formatters; review | R1 | T-22 |

---

## 6. Review checkpoint (P01-07)

> **Status: prepared, not approved.** The user walkthrough has not happened yet. Nothing in this section approves the requirements; formal approval happens at **G2**. Suite **T-03** (requirements review) stays **Test planned** until the walkthrough is recorded.

### 6.1 Traceability: R1 feature → FR → journey → planned test

Every doc-08 feature whose first release is R1 ([FEATURE_INVENTORY.md §4](FEATURE_INVENTORY.md#4-counts)), plus the two R1 clone features (NX-05, NX-06). Platform features are exercised by every journey and verified mainly below the E2E layer.

| # | Feature | FR | Journey | Planned tests |
|---|---|---|---|---|
| 1 | F-01 Repo, CI, lint, env | FR-07 | All R1 journeys (UJ-01…UJ-05) | T-21 toolchain smoke; NFR-35, NFR-36 |
| 2 | F-02 Tokens + primitives | FR-03 | All R1 journeys | T-24 component; T-27 accessibility; T-15 contrast |
| 3 | F-03 App shell | FR-01, FR-02 | UJ-01, UJ-02 | E2E-01, E2E-10, E2E-44; T-26 visual |
| 4 | F-04 Schema + seed | FR-06 | UJ-01 | E2E-01; T-11 integrity; seed manifest review (BR-87) |
| 5 | F-05 API skeleton | FR-07 | All R1 journeys | T-14 contract; T-22 unit |
| 6 | A-01 Email OTP | FR-10, FR-11, FR-12, FR-20 | UJ-05 | E2E-29, E2E-30, E2E-34, E2E-35, E2E-36, E2E-37, E2E-38 |
| 7 | A-02 Google sign-in | FR-13 | UJ-05 | E2E-31, E2E-42 |
| 8 | A-03 Sessions, logout | FR-14 | UJ-05 | E2E-33 |
| 9 | A-04 Auth-gate modal | FR-15 | UJ-04, UJ-05 | E2E-24, E2E-32, E2E-39 |
| 10 | A-05 Route guards | FR-16 | UJ-05 | E2E-40 |
| 11 | A-06 Onboarding (minimal) | FR-17 | UJ-05 | E2E-29, E2E-41 |
| 12 | D-01 Feed + infinite scroll | FR-22, FR-23 | UJ-01 | E2E-01, E2E-02, E2E-07, E2E-09 |
| 13 | D-02 Shot card | FR-24 | UJ-01, UJ-04 | E2E-01, E2E-20, E2E-28 |
| 14 | D-03 Filter bar (tag + timeframe) | FR-25 | UJ-01 | E2E-03, E2E-06 |
| 15 | D-04 Popularity (R1 simple score) | FR-27 | UJ-01 | E2E-03; T-22 unit on BR-33 properties |
| 16 | D-06 Search | FR-31, FR-32 | UJ-02 | E2E-10, E2E-12, E2E-13, E2E-14 |
| 17 | D-07 Tags | FR-33, FR-34 | UJ-02 | E2E-11, E2E-15 |
| 18 | D-09 Homepage | FR-21 | UJ-01 | E2E-01 |
| 19 | D-10 View counts | FR-29 | UJ-04 | E2E-23 |
| 20 | D-11 SEO (basic metadata) | FR-87 | UJ-01, UJ-02 | E2E-08, E2E-12; T-29 Lighthouse SEO |
| 21 | SD-01 Shot page | FR-37, FR-38 | UJ-01 | E2E-01, E2E-05, E2E-08 |
| 22 | SD-02 Share + Details | FR-39, FR-40 | UJ-04 | E2E-21, E2E-22 |
| 23 | SD-04 Related shots | FR-41 | UJ-01 | E2E-01 |
| 24 | SD-06 Mobile shot layout | FR-42 | UJ-01, UJ-04 | E2E-01 and E2E-21 at 390 px; T-26 |
| 25 | S-01 Likes | FR-45 | UJ-04, UJ-05 | E2E-20, E2E-24, E2E-25, E2E-26, E2E-27, E2E-32 |
| 26 | P-01 Profile + Work tab | FR-54 | UJ-03 | E2E-16, E2E-17, E2E-18, E2E-19 |
| 27 | P-02 About tab | FR-55 | UJ-03 | E2E-16 |
| 28 | X-02 Simple 404 | FR-05 | UJ-01, UJ-02 | E2E-04, E2E-05, E2E-15 |
| 29 | NX-05 Moderation (minimal, proposal) | FR-09 | UJ-03 | E2E-19 |
| 30 | NX-06 Legal pages | FR-04 | UJ-05 | E2E-44 |

**Result: 30 R1 features traced. Untraced R1 features: 0.** Every R1 feature maps to at least one FR, one journey and one planned test. (R1 journeys: 5; R1 E2E scenarios: 44, E2E-01…E2E-44.)

### 6.2 Consistency check against decision D-02

| Check | Result |
|---|---|
| R1 contains only D-02 R1 scope plus the approved minimal username step | Pass. Additions beyond the D-02 text are the legal pages (FR-04), simple 404 (FR-05) and the minimal moderation proposal (FR-09); all three are launch necessities and are flagged for the walkthrough (OQ-03, OQ-04) |
| Colour filter excluded from R1 (X-4) | Pass: FR-25 tag + timeframe only; colour in FR-26 (R3) |
| No passwords in R1 (D-03, X-7) | Pass: BR-12 |
| Views without Redis (X-3) | Pass: FR-29, BR-29–BR-31 |
| Unreleased actions hidden in R1 (assessment N-4) | Pass: BR-45, E2E-28 |
| Later items flagged | Pass: 8 features marked 💳 needs payment approval, 6 marked scope decision ([FEATURE_INVENTORY.md §4](FEATURE_INVENTORY.md#4-counts)) |
| No reference branding or assets in requirements | Pass: renamed concepts per BR-88; no reference names in FR text except where describing the reference as a source |
| X-6 unlisted features captured | Pass: NX-01…NX-04 (FR-91…FR-94) as Later candidates; OQ-22 |

### 6.3 Open questions blocking R1

Target ≤ 3. **Actual: 3**, each with a needed-by date (details in [OPEN_QUESTIONS.md §2](OPEN_QUESTIONS.md#2-questions-blocking-r1-3)).

| ID | Question | Needed by | Date |
|---|---|---|---|
| OQ-01 | Product name (decision D-01) | P05-04, P06-05 | 2026-11-19 |
| OQ-02 | Profile URL shape `/:username` vs a namespace | P02-03 | 2026-11-26 |
| OQ-03 | R1 legal pages and deletion-on-request baseline | P03-01, P10-03, P12-05 | 2026-12-03 |

The other 24 open questions have default assumptions that let work continue.

### 6.4 Self-check performed before hand-off

| Check | Result |
|---|---|
| Every R1 doc-08 feature maps to ≥ 1 FR | Pass (§6.1) |
| Every doc-08 feature (70) listed with a release | Pass ([FEATURE_INVENTORY.md](FEATURE_INVENTORY.md)) |
| Every NFR has a numeric threshold | Pass (NFR-01…NFR-40) |
| FR, NFR, BR, OQ, UJ and E2E IDs unique | Pass (scripted check) |
| Relative links resolve | Pass (scripted check) |

### 6.5 Items for the user walkthrough

1. Answer OQ-01…OQ-03 (blocking R1).
2. Confirm or change the main clone decisions: OTP values (OQ-06), email-only sign-in (OQ-07), view definition (OQ-08), no self-likes (OQ-09), ranking formula and timeframe meaning (OQ-10, OQ-11).
3. Approve or reject the moderation proposal (OQ-04); if approved, the lead adds tasks to the workflow.
4. Confirm R1 scope stays as D-02 (OQ-12).

After the walkthrough: record the outcome here, set T-03 to its result in TESTING_PROGRESS (lead/TPM), and move P01-01…P01-07 to the agreed status.

### Revision 1 (2026-11-12, lead): user decisions applied

- **A-14:** the user accepted the default for every open question. OQ-01…OQ-27 are resolved (see [OPEN_QUESTIONS](OPEN_QUESTIONS.md)). Open questions blocking R1: **0**.
- **D-24(e):** FR-01 desktop navigation is from 1024 px; NFR-28 columns follow the design-system grid (1/2/3/4, max 5).
- **A-13 additions:**
  - `/search?q=` returns 308 to `/search/:term`.
  - Signed-in visits to `/login`, `/signup` and `/onboarding` redirect to `returnTo` or `/`.
  - Onboarding offers "Not you? Sign out".
  - A hidden-shot info alert is shown to the owner and staff (C39).
  - Labels are neutral: "All", "Recent", "Message", and the timeframe names.
- **Moderation (OQ-04):** tasks P09-29, P10-26 (R1) and P09-30, P10-27 (R2) were added to the workflow.
- **Checkpoint result:** traceability unchanged (0 untraced R1 features), and 0 blocking open questions. Formal approval follows at G2.

