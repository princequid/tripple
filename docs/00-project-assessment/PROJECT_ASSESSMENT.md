# Project Assessment (P00)

| Field | Value |
|---|---|
| Phase / gate | P00 Assessment & Planning → **G1 Project Understanding** |
| Tasks covered | P00-01 (assessment), feeds P01 Requirements |
| Status | **Awaiting review** (planning only; no code has been written) |
| Date | 2026-11-12 |
| Inputs | [reverse-engineering/00–10](../reverse-engineering/00-executive-summary.md), 144 screenshots in [screenshots/](../reverse-engineering/screenshots/), the confirmed stack (DECISION_LOG A-01…A-11), vendor docs cited in [TECHNOLOGY_EVALUATION.md](TECHNOLOGY_EVALUATION.md) |

**Evidence labels.** I use the same labels as the reverse-engineering study:

- **[OBSERVED]**: seen on the reference product, as recorded in docs 00–10.
- **[INFERRED]**: concluded from evidence but not seen.
- **[UNVERIFIED]**: could not be inspected (auth, payment or robots gated).
- **[DECISION]**: needs the user's choice. Pending decisions use the `D-xx` IDs in [DECISION_LOG.md](../DECISION_LOG.md).

Evidence levels **O / P / U** come from [doc 08](../reverse-engineering/08-feature-breakdown.md):

- **O**: observed working.
- **P**: partially observed (UI only).
- **U**: unverified.

> **Scope of this document.** It describes the product we will build: an independent design-community portfolio and hiring marketplace, functionally modelled on the reference site. Every observation about the reference site describes the *original* only. The clone uses original branding, copy, seed content and visual identity (A-07, A-10).

---

## 1. Executive summary

1. **The reference is large.** It has 52 documented route patterns, 58 reusable components, 9 user journeys and about 70 feature IDs ([01](../reverse-engineering/01-page-inventory.md), [03](../reverse-engineering/03-component-inventory.md), [08](../reverse-engineering/08-feature-breakdown.md)). A credible clone has to ship in releases.
2. **What is evidenced and what is not.** The public, logged-out half of the product is well evidenced: feeds, shot detail, profiles, search, tags, hire directory, services, jobs and auth screens. Everything behind login or payment is **[UNVERIFIED]**: liking, saving, following, commenting, uploading, messaging, notifications, checkout, onboarding and settings. Our designs for those features are original specifications, not reproductions.
3. **The confirmed stack changes the architecture, not the product.** The stack is Next.js full-stack, Turso/libSQL, Drizzle, R2 and Tailwind. The entity model in [doc 06](../reverse-engineering/06-database-design.md) is still valid as a *functional* model. Its PostgreSQL types, its indexes (GIN, trigram, tsvector) and the Redis/BullMQ pipeline in [doc 07](../reverse-engineering/07-technology-recommendation.md) must be re-expressed for SQLite and serverless (§13).
4. **Four Turso behaviours drive architecture decisions:**
   - Foreign keys are off by default (F-01).
   - The full-text search mechanism is ambiguous (F-02).
   - Atomic writes should use batches (F-03).
   - Embedded replicas cannot run on serverless hosts without a filesystem.

   Five spikes (SPIKE-01…05) must pass before G5 Development Readiness. See [TECHNOLOGY_EVALUATION §11](TECHNOLOGY_EVALUATION.md#11-required-technical-spikes).
5. **R1 has a gap: no uploads.** Doc 08 Phase 1 (= R1) ships no uploads. R1 content must therefore come from licence-free **seed data**, and seed images still need a storage location. Either R2 is set up for R1 (D-10), or seed images are served statically. This must be decided.
6. **R1 needs minimal onboarding.** Doc 08 puts onboarding (A-06) in Phase 2. Passwordless sign-up still has to capture a **username** before a profile URL exists, so a minimal username step must move into R1 (§5, note N-2).
7. **The palette needs accessibility adjustments.** Several official palette colours fail WCAG AA for text or controls (§10.3). The constitution can be kept by *adding* stronger accent and text tokens (D-05). Neumorphic borders and shadows also fail the 3:1 non-text contrast rule, so focus and boundary treatment needs explicit design (§10.4).

---

## 2. What the application does

A **design-community portfolio and hiring marketplace** with four pillars. These match the original's four top-level menus [OBSERVED, [00 §1](../reverse-engineering/00-executive-summary.md)]:

| Pillar | User value | Representative clone routes (proposed) |
|---|---|---|
| **Explore** (inspiration) | Browse design posts ("shots") by popularity, recency, category, tag, colour and timeframe. Open a shot and see its content blocks, palette, author and related work | `/`, `/shots/popular[/:category]`, `/shots/recent[/:category]`, `/shots/:id-:slug`, `/search/:term`, `/tags`, `/tags/:tag` |
| **Profiles and community** | Designers and teams keep a portfolio, collections, likes, followers and an About page | `/:username` (+ `/collections`, `/likes`, `/members`, `/about`) |
| **Hire talent** (client side) | Find designers and agencies, buy packaged services, post a project brief or a job | `/hire`, `/services`, `/services/:id-:slug`, `/jobs/new` |
| **Get hired** (designer side) | Browse jobs, offer services, send proposals, upgrade to Pro | `/jobs`, `/jobs/:id-:slug`, `/pro` |

Profiles tie the pillars together. One profile is at once a portfolio (Work), a storefront (Services), a reputation page (Reviews), a curator page (Collections) and a team page (Members) [OBSERVED].

---

## 3. User roles

| Role | Description | Can do (clone target) | Evidence |
|---|---|---|---|
| **Anonymous visitor** | Not signed in | Browse feeds, shots, profiles, search, tags, hire directory, services, jobs, collections. Share and view details. Any social action opens the auth-gate modal with `intent` and `returnTo` | **[OBSERVED]** ([04 J1–J3](../reverse-engineering/04-user-journeys.md), [05 §2](../reverse-engineering/05-api-inventory.md)) |
| **Registered member** | Signed in via email OTP and/or Google | Like, save to collections, follow, comment, message; edit own profile; see own Liked tab | Auth screens and gating **[OBSERVED]**. Post-login behaviour **[UNVERIFIED]** |
| **Designer (creator)** | A member who publishes shots and may be "available for work" | Upload and publish shots (content blocks, tags, category); offer services; set availability | Profile and shot data `forHire` **[OBSERVED]**. Uploader **[UNVERIFIED]** (`/uploads/new` → 302 login) |
| **Hirer / client** | A member looking for talent | Search designers, "Get in touch", request or buy services, post briefs | CTAs **[OBSERVED]**. Flows **[UNVERIFIED]** |
| **Employer / job poster** | Posts full-time or freelance jobs | 4-step job wizard; free and paid tiers on the original | Step 1 form and pricing **[OBSERVED]**. Steps 2–4 and payment **[UNVERIFIED]** |
| **Team / agency account** | An account that represents a studio, with member users | Team profile with Members tab; shots attributed "Member **for** Team" | `shotUser.isTeam`, `/:username/members` **[OBSERVED]** |
| ↳ Team roles: owner / admin / member | Who can manage members and publish for the team | Invite and remove members, publish for the team | **[INFERRED]** (doc 06 proposal). Team administration was never seen |
| **Pro subscriber** | Paid tier (Lite / Standard / Plus on the original) | Badge, ranking boost, brief-board access | Pricing and badges **[OBSERVED]**. Entitlement enforcement **[UNVERIFIED]** |
| **Vetted designer ("Select")** | Curated quality badge | Badge only | Badge **[OBSERVED]**. The vetting process is **[UNVERIFIED]**. The clone must use its own name |
| **Advertiser** | Buys boosted shots or ad slots | — | Marketing pages and ad cards **[OBSERVED]**. Deferred to "Later" |
| **Admin / moderator** | Platform staff | Moderate content and users, handle reports, manage categories and featured content | **[INFERRED]**: never observed, but required by any UGC platform. Scope is a **[DECISION]** (§15, M-05) |

Designer and hirer are **not separate account types** on the original. One account does both, and the homepage toggles "Hire talent / Get hired" content [OBSERVED]. The clone should keep a **single account model** with optional `intent` captured at onboarding [INFERRED].

---

## 4. Core features by subsystem

| Subsystem | Core features | Key docs |
|---|---|---|
| Identity | Email OTP sign-in and sign-up, Google sign-in, sessions, auth-gate modal, protected routes, onboarding, settings | [04 J4](../reverse-engineering/04-user-journeys.md), [08 §2](../reverse-engineering/08-feature-breakdown.md) |
| Content and media | Shots made of ordered content blocks (image, video, text, full-width flag); uploads; derivatives (4:3 crops, webp, srcset); dominant colour; 7-colour palette; video teasers | [02 §1.5](../reverse-engineering/02-frontend-analysis.md), [05 §7](../reverse-engineering/05-api-inventory.md) |
| Discovery | Popular and recent feeds, 8 categories, filter panel (tag, colour, timeframe), infinite scroll, search, tags, related shots | [02 §4.2](../reverse-engineering/02-frontend-analysis.md) |
| Social graph | Likes, collections (saves), follows, comments, views, blocks, notifications | [04 J3](../reverse-engineering/04-user-journeys.md) |
| Profiles and teams | Header, tabs, About, team members, "for Team" attribution | [02 §4.5](../reverse-engineering/02-frontend-analysis.md) |
| Marketplace | Hire directory, services, reviews, messaging, briefs, proposals, orders | [02 §4.6–4.7](../reverse-engineering/02-frontend-analysis.md) |
| Jobs | Board, filters, detail, post wizard, paid tiers, SEO directories | [02 §4.8](../reverse-engineering/02-frontend-analysis.md) |
| Monetisation | Pro, paid jobs, boosts, ads, service fees | [00 §2](../reverse-engineering/00-executive-summary.md) |
| SEO and content | Programmatic search, tag, hire and job pages; sitemaps; blog; marketing pages | [01 sitemap families](../reverse-engineering/01-page-inventory.md) |

---

## 5. Confirmed features and proposed releases

Release basis (D-02, pending):

- **R1 MVP**: discover, view, auth, like, profile, search, tags.
- **R2**: upload, collections, follow, comments, teams, jobs.
- **R3**: notifications, messaging, hire directory, services, colour search.
- **Later**: payments, Pro, orders, reviews, briefs, proposals, ads, playoffs, rebounds.

Platform items F-01…F-05 are not releases. They map to P08 (dev environment) and P09/P10.

| ID | Feature | Evidence | Doc-08 phase | Proposed release | Notes for the confirmed stack |
|---|---|---|---|---|---|
| F-01 | Repo, CI, lint, env | — | 0 | P08 | Single Next.js app instead of a Turborepo monorepo (S-01, S-02) |
| F-02 | Design tokens + primitives | O | 0 | P05/P10 | Tokens come from the 40/30/30 constitution, **not** doc 02 §1 |
| F-03 | App shell (header, mega-menu, drawer, footer) | O | 0 | R1 | |
| F-04 | DB schema + seed | — | 0 | P03/P09 | Drizzle + Drizzle Kit (not Prisma). Licence-free seed images |
| F-05 | API skeleton | — | 0 | P09 | Route Handlers + Server Actions, Zod, problem+json (not Express) |
| A-01 | Email OTP sign-up / sign-in | P | 1 | R1 | Better Auth emailOTP candidate (D-03, D-04) |
| A-02 | Google sign-in | P | 1 | R1 (if D-03 approves) | Needs a Google Cloud OAuth client (free) |
| A-03 | Sessions, CSRF, `/me`, logout | O | 1 | R1 | |
| A-04 | Auth-gate modal (`intent`, `returnTo`) | O | 1 | R1 | |
| A-05 | Auth-only route guards | O | 1 | R1 | |
| A-06 | Onboarding | U | 2 | **R1 (minimal: username + name)**, full in R2 | See N-2 |
| A-07 | Account settings | U | 2 | R2 (account deletion R1 if a legal requirement; see M-08) | |
| C-01 | Presigned upload + media records | U | 2 | R2 | R2 presigned PUT (SPIKE-04) |
| C-02 | Image pipeline (derivatives, dominant colour, palette) | O (outputs) | 2 | R2 | sharp in a Node runtime handler (SPIKE-04, SPIKE-05) |
| C-03 | Video/GIF teasers | O (outputs) | 3 | R3 | Needs ffmpeg, which serverless hosts do not provide by default. A queue or external service is likely; open question |
| C-04 | Shot composer (content blocks) | U | 2 | R2 | |
| C-05 | Draft / publish / delete | U | 2 | R2 | |
| C-06 | Rebounds | P | 4 | Later | |
| D-01 | Feed + grid + infinite scroll | O | 1 | R1 | Cursor pagination |
| D-02 | Shot card | O | 1 | R1 | |
| D-03 | Filter bar + panel | O | 1 | R1 (colour control hidden until R3) | See N-3 |
| D-04 | Popularity scoring + timeframe | P | 2 | R2 (R1 uses a simple likes/recency score on seed data) | Scheduled job (§6, B-07) |
| D-05 | Colour search | O | 3 | R3 | No cube/earthdistance in SQLite. Use Lab columns and arithmetic distance |
| D-06 | Full-text shot search | O | 1 | R1 | SPIKE-01 |
| D-07 | Tag pages | O | 1 | R1 | |
| D-08 | Header search type switch + autocomplete | O/P | 2 | R2 | |
| D-09 | Homepage | O | 1 | R1 | Original copy and layout |
| D-10 | Batched view logging | O | 1 | R1 | No Redis. Daily aggregate table + `after()` (TECH-EVAL §3) |
| D-11 | SEO: metadata, OG, JSON-LD, sitemaps | O | 3 | **Basic metadata R1**, sitemaps/JSON-LD R3 | Next.js Metadata API makes basic metadata cheap |
| D-12 | Playoffs | O | 4 | Later | |
| SD-01 | Shot page SSR | O | 1 | R1 | |
| SD-02 | Action rail, Share, Details modals | O | 1 | R1 | |
| SD-03 | Palette display | O | 2 | R2 (seed palettes could show in R1) | |
| SD-04 | More by / You might also like | O | 1 | R1 | |
| SD-05 | Prev/next navigation | O | 2 | R2 | |
| SD-06 | Mobile shot layout | O | 1 | R1 | |
| S-01 | Likes | P | 1 | R1 | `db.batch()`: insert like + counter update |
| S-02 | Collections | P | 2 | R2 | |
| S-03 | Follow | P | 2 | R2 | |
| S-04 | Comments | P | 2 | R2 | Content moderation needed (M-05) |
| S-05 | Notifications | U | 3 | R3 | |
| S-06 | Block user | P | 3 | R3 | |
| S-07 | Messaging | U | 3 | R3 | Polling first; realtime is a later decision |
| P-01 | Profile header + Work tab | O | 1 | R1 | |
| P-02 | About tab | O | 1 | R1 | |
| P-03 | Collections tab | O | 2 | R2 | |
| P-04 | Liked tab (owner only) | O | 2 | R2 | |
| P-05 | Teams and members | O | 2 | R2 | |
| P-06 | Profile edit | U | 2 | R2 (name/username/bio edit in R1 if A-06 minimal ships) | |
| P-07 | Services tab | O | 3 | R3 | |
| H-01 | Hire directory | O | 3 | R3 | |
| H-02 | Specialty SEO landings | O | 4 | Later | |
| M-01 | Services CRUD + listing | O | 3 | R3 | Listing without checkout |
| M-02 | Service orders / checkout | U | 4 | Later | Payments, out of scope until decided (M-04) |
| M-03 | Reviews | O (display) | 4 | Later | |
| M-04 | Project brief wizard (AI option) | P | 4 | Later | Would need an LLM provider (paid) |
| M-05 | Brief board + proposals | P | 4 | Later | |
| J-01 | Job board + filters | O | 2 | R2 | |
| J-02 | Job detail | O | 2 | R2 | |
| J-03 | Post-a-job wizard (free) | P | 2 | R2 | Rich text must be sanitised |
| J-04 | Paid job tiers | P | 4 | Later | |
| J-05 | Job directories (SEO) | O | 4 | Later | |
| B-01 | Payments integration | U | 4 | Later | |
| B-02 | Pro subscriptions | O (pricing) | 4 | Later | |
| B-03 | Boosts + ads | O | 5 | Later (optional) | |
| X-01 | Blog / resources | O | 5 | Later (optional) | |
| X-02 | Custom 404 (colour mosaic) | O | 3 | R1 simple 404, mosaic R3 | |
| X-03 | Analytics events | O | 3 | R3 (privacy decision M-10) | |
| X-04 | Marketing pages | O | 5 | Later | |
| X-05 | Cookie consent | O | 3 | **With first non-essential cookie/analytics** | Legal (M-08) |

**Release notes:**

- **N-1: R1 content source.** R1 has no uploader, so feeds, profiles and search run on seed data. Seed images need a home: R2 (requires D-10 before R1) or static files in the repo/CDN. The second option keeps R1 free of paid or unconfigured services.
- **N-2: Username before profile.** Profiles live at a root-level `/:username` [OBSERVED], and OTP sign-up collects only an email [OBSERVED]. A username and display-name step is therefore needed in R1, or a generated username that the user can edit.
- **N-3: Colour control.** Doc 09 wires the colour filter UI in Phase 1 while colour search arrives in Phase 3. Showing a control that does nothing is poor UX. Hide it until R3.
- **N-4: Shots in R1.** R1 includes "like" but not "save" or "follow". The shot header shows Like, Save, Follow and Get in touch [OBSERVED]. Unbuilt actions should be hidden in R1, not left as dead buttons.

**Observed on the original but missing from doc 08** (add to P01 backlog as "Later" unless re-prioritised):

- "Schedule a call" profile action [OBSERVED, [02 §4.5](../reverse-engineering/02-frontend-analysis.md)].
- **Saving a designer** (Save button on the profile and hire cards) [OBSERVED]. Doc 06 has no entity for it.
- **Places** page `/places` [OBSERVED, 01 #13].
- Announcement banner and floating promo toast management (admin-configured) [OBSERVED].

---

## 6. Business logic (rules to specify in P01)

| # | Rule | Evidence |
|---|---|---|
| B-01 | Every social or transactional action by an anonymous user opens the auth-gate modal. After authentication the user returns to `returnTo`, and the action should complete or re-prompt | [OBSERVED] gate. Post-auth behaviour [INFERRED] |
| B-02 | Usernames are root-level URLs. A reserved-word list (all top-level routes + future ones) is enforced at sign-up and rename. Uniqueness is case-insensitive | Route shape [OBSERVED]. List [INFERRED] |
| B-03 | Like, save and follow are idempotent toggles. One like per (user, shot). One follow per pair. No self-follow | [INFERRED] from counters and flags (`isLiked`, `isSaved`) |
| B-04 | Counters (likes, saves, comments, views, followers) are cached columns updated atomically with the join row and reconciled periodically. The UI shows abbreviated counts (`7.7k`, `2m`) | Abbreviation [OBSERVED]. Mechanism [INFERRED] |
| B-05 | Views are logged in batches when cards enter the viewport, deduplicated per visitor per day, and stored as daily aggregates | `/shots/log_views` batching [OBSERVED]. Dedupe [INFERRED] |
| B-06 | Popular feed = time-decayed engagement score. Timeframe filters (week, month, year, all) rank by engagement within the window. Recent = `published_at DESC` | Outputs [OBSERVED]. Formula [UNVERIFIED]. The clone defines its own, made configurable |
| B-07 | Popularity is recomputed on a schedule, not per request | [INFERRED] |
| B-08 | A shot belongs to one author and optionally one team ("X for Team"). A team is an account of type `team` with member relations | [OBSERVED] `isTeam`, attribution |
| B-09 | A shot has 1..N ordered content blocks. The first media block is the cover. Feed thumbnails use a fixed 4:3 centre crop | [OBSERVED] |
| B-10 | Shots carry a dominant colour (placeholder) and a 7-colour palette | [OBSERVED] |
| B-11 | Comments can be disabled per shot. The owner sees edit actions instead of like or contact | Flags [OBSERVED]. UI [UNVERIFIED] |
| B-12 | Collections are owned by a user. The original's collections are public. Private collections are an assumption | Public pages [OBSERVED]. Private [INFERRED] (doc 10 §4) |
| B-13 | Liked Shots tab is visible only to the signed-in owner | 302 to login [OBSERVED]. Owner-only [INFERRED] |
| B-14 | Job post: required fields are title, description, workplace type, specialty, employment type, apply URL and company website. A blank location means "Remote". Apply links go to the employer's URL | [OBSERVED] form. External apply [INFERRED] |
| B-15 | Jobs have a lifecycle (draft → active → expired/closed). Paid tiers change placement | Tiers [OBSERVED]. Lifecycle [INFERRED] |
| B-16 | Pro status affects ranking and unlocks the brief board | Stated on `/pro` [OBSERVED]. Enforcement [UNVERIFIED] |
| B-17 | Blocking hides interaction between two users | "Blocked" markup [OBSERVED]. Semantics [UNVERIFIED] |
| B-18 | OTP: 6 digits, short TTL, limited attempts, throttled sends | Doc 07 proposed 10 min / 5 attempts. Better Auth defaults are 300 s / 3 attempts (TECH-EVAL §1). Final values are a P01 decision |
| B-19 | Email addresses are never public unless the profile sets a public email | Original copies a public contact email [OBSERVED]. Rule [INFERRED] |

---

## 7. Data requirements

**Entities.** The functional model in [doc 06 §1](../reverse-engineering/06-database-design.md) is retained (A-09):

- **R1:** users, accounts and sessions (auth library schema), verification tokens, categories, shots, content_blocks, media (seed), shot_colors, tags, shot_tags, likes, shot_view_daily, reserved_usernames.
- **R2:** collections, collection_items, follows, comments, comment_likes, team_memberships, companies, jobs, job_specialties, specialties, user_social_links, user_skills.
- **R3:** notifications, blocks, message threads/participants/messages, services, service_tags.
- **Later:** reviews, orders, briefs, proposals, subscriptions, boosts.

**Re-expression for SQLite/libSQL** (detailed in [TECHNOLOGY_EVALUATION §10](TECHNOLOGY_EVALUATION.md#10-turso-capabilities-and-limitations)). P03 will produce the binding schema:

| PostgreSQL construct in doc 06 | SQLite/libSQL replacement |
|---|---|
| `bigint identity` | `INTEGER PRIMARY KEY` (rowid alias) for URL-visible numeric IDs (`/shots/{id}-{slug}`) |
| `uuid` | `TEXT` (UUIDv7 or ULID generated in the app) for media |
| `citext` (username, email, tag name) | A lower-cased normalised column with a `UNIQUE` index. `COLLATE NOCASE` folds ASCII only |
| `enum(...)` | `TEXT` + `CHECK (col IN (...))`. Drizzle's `text({ enum })` is a TypeScript-only constraint |
| `timestamptz` | `INTEGER` UTC epoch milliseconds (Drizzle `mode: 'timestamp_ms'`) |
| `boolean` | `INTEGER` 0/1 (Drizzle `mode: 'boolean'`) |
| `tsvector` + GIN | FTS5 external-content table or a Turso `USING fts` index (SPIKE-01) |
| `pg_trgm` designer search | Prefix `LIKE 'q%'` on normalised name/username indexes, then FTS |
| `cube`/`earthdistance` colour index | `lab_l/lab_a/lab_b REAL` + bounding-box `WHERE` + squared-distance `ORDER BY` |
| `inet` | `TEXT` |
| Arrays | Join tables (already used) or JSON `TEXT` for non-queried lists |

**Media.** Binaries live only in R2 (A-03). The DB stores keys, dimensions, MIME type, bytes, status, dominant colour and palette.

**PII.** Email, IP and user agent (sessions), OTP records and messages. A retention policy is needed (M-08).

**Seed data.** About 40 users (including 5 teams) and about 600 shots with licence-free images, tags, categories and engagement (doc 09 Phase 0). No Dribbble content (A-10).

**Volume and quotas.** Feed and counter design must respect Turso's monthly row read and row write quotas. On the free plan these are 500 M reads and 10 M writes (TECH-EVAL §10).

---

## 8. Navigation structure (clone information architecture)

```text
Header (all standard pages; homepage variant has no header search)
├── Logo → /
├── Search (type: Shots | Designers[R3] | Services[R3])
├── Explore ▾  Popular · New & Noteworthy · categories · Tags · (Playoffs: Later)
├── Hire talent ▾ [R3]  Designers (/hire) · Services · Post a job[R2]
├── Get hired ▾ [R2]  Jobs · (Pro, briefs: Later)
├── Community ▾ [Later]  Blog · Resources
└── Auth: Sign up · Log in   |   signed in: Upload[R2] · Notifications[R3] · Avatar menu

Public:  / · /shots/popular[/:cat] · /shots/recent[/:cat] · /shots/:id-:slug
         /search/:term · /tags · /tags/:tag · /:username[/about|/collections[R2]|/members[R2]]
         /jobs[R2] · /jobs/:id-:slug[R2] · /hire[R3] · /services[R3] · legal pages
Auth:    /login · /signup · (modal: auth gate) · /onboarding[R1 minimal]
Private: /:username/likes[R2] · /uploads/new[R2] · /settings[R2] · /messages[R3]
System:  custom 404 · error boundary pages
```

**Root-level usernames are a design decision (M-11).** Keep `/:username` like the original [OBSERVED], with a reserved-word list, or namespace profiles (for example `/@username` or `/u/username`). The namespace removes collision risk. With the App Router, a root dynamic segment also needs care with static route precedence [INFERRED].

**Mobile.** A burger drawer with accordion sections [OBSERVED, 02 §3]. Bottom-sheet modals are a clone design choice for P06.

---

## 9. Interaction patterns (to carry into P06)

| Pattern | Original behaviour [OBSERVED] | Clone direction |
|---|---|---|
| Card hover | Gradient overlay fades in, with title and 3 circular actions. Video teaser plays | Keep the interaction. Overlay uses the glass treatment. Touch devices show actions below the card |
| Infinite scroll | Appends 24 items; "Loading…" | Cursor-based Route Handler, skeleton cards, `aria-live` status, "Load more" fallback |
| Auth gate | Modal with intent copy | Same, plus Escape closes (the original did not, [10 §3](../reverse-engineering/10-unknowns-and-limitations.md)) and focus is trapped |
| Optimistic toggles | [UNVERIFIED] | `useOptimistic` + Server Action, with rollback toast on failure |
| Filters | GET navigation, URL is the state | Keep URL-driven state (shareable, SSR-friendly) |
| Modals | Share, Details, Sign-up | Glass surface on a dimmed scrim. Consistent close affordance |
| Toasts | "Email copied!" | Shared toast primitive |
| Empty / error / loading | Illustration empty state, inline field errors, dominant-colour image placeholder | Required for every screen (P06 state matrix) |
| Responsive grid | 1/2/3/4/6 columns at 360/768/1024/1440/2400 | Re-derive for the clone's spacing. Validate at 390/768/1280/1440 |

---

## 10. Visual direction (clone identity, not the original)

### 10.1 Constitution

**40% Neumorphism / 30% Glassmorphism / 30% Minimalism** (A-07). Dribbble's pink `#EA4C89`, Mona Sans and its spacing are documented in [doc 02](../reverse-engineering/02-frontend-analysis.md) for the **original only** and are not used.

Proposed allocation, for P05 to formalise:

| Style | Where | Guardrails |
|---|---|---|
| **Neumorphism (40%)** | Controls and containers: buttons, icon buttons, pill tabs, inputs, filter panel, cards' frames, stat tiles, avatars' rings | Soft dual shadows (highlight `#FFFFFF`, shadow `#C5CFDC` / deep `#B5C2D1`) on `bg #E9EDF3`. Pressed state = inset. **Must** add a visible focus ring and non-shadow boundary cues (§10.4) |
| **Glassmorphism (30%)** | Floating layers: sticky header, mega-menu, modals, popovers, toasts, card hover overlay, mobile drawer | Translucent `#FFFFFF` / `#F8FAFC` with backdrop blur. Respect `prefers-reduced-transparency` with an opaque fallback. Never blur behind long scrolling grids of images (GPU cost; [INFERRED]) |
| **Minimalism (30%)** | Content: typography, shot imagery, profile text, job descriptions, whitespace | Shot images are never tinted, blurred or embossed. Content stays flat and high-contrast |

### 10.2 Palette (official)

bg `#E9EDF3` · bg2 `#F1F3F7` · card `#F8FAFC` · elevated `#FFFFFF` · border `#DDE1E9` · text `#252B36` · text2 `#647184` · muted `#929BA9` · neu highlight `#FFFFFF` · neu shadow `#C5CFDC` (deeper `#B5C2D1`) · accent lavender `#9273C7` · pink `#EA78A5` · muted blue `#A5B5CA`.

### 10.3 Contrast check (computed with the WCAG 2.x relative-luminance formula; re-run for this document)

| Pair | Ratio | WCAG use |
|---|---|---|
| text `#252B36` on bg / card | 12.10 / 13.58 | Passes AAA |
| text2 `#647184` on bg / bg2 / card | **4.22** / 4.46 / 4.74 | Fails AA body text on bg and bg2. Passes on card |
| muted `#929BA9` on bg | **2.39** | Disabled or decorative only |
| lavender `#9273C7` on bg | **3.25** | Large text and icons only |
| white on lavender | **3.82** | Fails for normal-size button labels |
| white on pink `#EA78A5` | **2.72** | Fails |
| text on pink | 5.23 | Passes. Pink buttons need dark labels |
| muted blue `#A5B5CA` on bg | **1.78** | Decorative only |
| border `#DDE1E9` on bg | **1.12** | Fails 3:1 non-text contrast for input boundaries |
| neu shadow `#C5CFDC` on bg | **1.34** | Shadow edges alone cannot convey a boundary |

**Proposed additions (D-05, pending approval; the official colours stay):**

| Token | Value | Result |
|---|---|---|
| text-secondary | `#5E6A7C` | 4.67 on bg, 5.24 on card |
| accent-strong | `#7556B3` | White text 5.62; 4.78 on bg |
| pink-strong | `#C2507F` | 3.76 on bg; icons and large text |
| danger | `#B3364F` | 5.02 on bg |
| success | `#2B7355` | 4.85 on bg |

### 10.4 Accessibility implications of neumorphism (must be solved in P05)

WCAG 2.2 SC 1.4.11 requires 3:1 for UI component boundaries and states. SC 2.4.11/2.4.13 cover focus appearance. Soft shadows on a near-identical background fail this (1.12–1.34:1). So:

- Inputs need a darker outline or underline token.
- Selected and pressed states need a colour or icon change in addition to the inset shadow.
- Focus rings use `accent-strong`.

**Open design decisions:** typeface (D-06, Inter proposed); dark mode (M-12; the palette is light-only today); logo and name (D-01).

---

## 11. External dependencies

| Dependency | Purpose | Release | Cost / approval | Status |
|---|---|---|---|---|
| Turso | Primary DB | R1 | Free tier available (TECH-EVAL §10) | Approved (A-02). Account setup needed |
| Cloudflare R2 | Media storage | R2 (R1 if seed images use R2) | 10 GB-month free, zero egress (TECH-EVAL §6) | Approved (A-03). Account not created (D-10) |
| Hosting (Vercel or Cloudflare) | Run Next.js | R1 | Vercel Hobby is **non-commercial only** | D-09 pending |
| Auth library (Better Auth) | Sessions, OTP, OAuth | R1 | OSS | D-04 pending |
| Google OAuth client | Google sign-in | R1 (if D-03) | Free | Pending D-03 |
| Email provider (Resend) | OTP and notification email | R1 | 3,000/month and 100/day free | D-08 pending |
| sharp | Image derivatives and palette | R2 | OSS | Node runtime only (SPIKE-04/05) |
| Error monitoring (Sentry) | Errors and traces | R1 | Free developer plan | Pending |
| Bot protection (e.g. Turnstile) | Protect OTP sending | R1 | [UNVERIFIED] pricing | Proposed |
| Queue (Inngest / QStash) | Background jobs | R3 (video, fan-out) | Free tiers | D-11 pending |
| Payments (e.g. Stripe) | Pro, jobs, orders | Later | Fees | Out of scope until M-04 |
| LLM provider | AI brief generation | Later | Paid | Out of scope |
| ffmpeg-capable service | Video teasers | R3 | Unknown | Open question (TECH-EVAL §5) |

---

## 12. Technical (non-functional) requirements

| Area | Requirement (proposed, P01 to confirm) |
|---|---|
| Rendering and SEO | Public pages server-rendered. Per-page metadata and canonical URLs in R1. Sitemaps and JSON-LD (CreativeWork, JobPosting) by R3. Lighthouse SEO ≥ 95 on shot, search and tag pages (doc 09 target) |
| Performance | LCP < 2.5 s and CLS < 0.1 on the seeded feed (mid-range mobile). Feed Route Handler **p95 < 300 ms** server time, measured from the deployment region (see note below). Images served from pre-generated derivatives with `srcset` and dominant-colour placeholders |
| Accessibility | WCAG 2.2 AA. Keyboard access for menus, modals and tabs. `prefers-reduced-motion` and `prefers-reduced-transparency`. axe checks in Playwright |
| Responsive | Validate at 390 / 768 / 1280 / 1440 px (the original's breakpoints are 768/1024/1200/1280, [02 §3](../reverse-engineering/02-frontend-analysis.md)) |
| Security | HttpOnly Secure SameSite=Lax cookies. Server Actions' built-in origin check plus CSRF protection on Route Handlers that mutate. Zod on every input. Rate limits on auth and social writes. Upload MIME sniffing, size and dimension caps, EXIF stripping. Rich text sanitised. CSP and security headers ([07 §5](../reverse-engineering/07-technology-recommendation.md) checklist still applies) |
| Data integrity | FK enforcement verified per connection (SPIKE-02). App-level checks for invariants. Counter reconciliation job |
| Privacy and legal | Terms, Privacy, Cookies pages. Account deletion. Cookie consent before non-essential cookies (M-08) |
| Observability | Structured server logs, error monitoring, health route |
| Testing | Vitest, React Testing Library, Playwright (A-06). Integration tests against a local libSQL file DB |
| Browsers | Last 2 versions of evergreen browsers, iOS Safari 16+ [proposal] |
| Dev environment | Windows 11 is the primary dev OS. Toolchain choices must work on Windows. OpenNext states Windows support is not guaranteed (TECH-EVAL §8) |

> Note on the performance row: the target is **p95 < 300 ms** server time for feed requests measured in-region. The doc-09 target (p95 < 200 ms at 50 rps) assumed co-located PostgreSQL. Remote libSQL over HTTP adds network latency, so P02 should confirm the target after SPIKE-05.

---

## 13. Stack reconciliation (reverse-engineering recommendations vs confirmed stack)

| Doc 07/06 recommendation | Confirmed replacement | Why | Consequence |
|---|---|---|---|
| Next.js 15 + separate **Express 5** API | **Next.js only** (App Router, current stable 16.x; Route Handlers + Server Actions) | User directive A-01. Fewer deployables | Business logic lives in `src/modules` / `src/server` services so Route Handlers and Server Actions share it. A public REST surface exists only where needed (infinite scroll, uploads, future mobile) |
| pnpm + Turborepo monorepo (`apps/*`, `packages/*`) | Single Next.js app | Simpler with one deployable (S-02) | Shared Zod schemas live in `src/server/validation` |
| **PostgreSQL 16 + Prisma 6** | **Turso (libSQL) + Drizzle ORM + Drizzle Kit** | A-02 | Types, indexes and search re-expressed (§7). No `tsvector`, citext, enums, arrays or GIN |
| Postgres FTS + `pg_trgm`, later Meilisearch/OpenSearch | Turso FTS (FTS5 or `USING fts`) behind a `SearchService` | Avoid extra infrastructure | SPIKE-01 decides the syntax |
| **Redis 7** (view dedupe, rate limits, cache, OTP throttle) | Turso tables + Next.js caching. Upstash Redis only if needed | No Redis in the stack (D-12) | Writes count against Turso quotas. View logging aggregated daily |
| **BullMQ workers** (images, popularity, email, fan-out) | `after()` for post-response work. Host cron for schedules. Optional managed queue later | Serverless has no long-lived worker (D-11) | Image derivatives in-request with caps. Video deferred to R3 with a queue decision |
| S3/MinIO presigned uploads | **Cloudflare R2** presigned PUT (S3 API) | A-03 | R2 has no POST-policy uploads, so size checks happen after upload (TECH-EVAL §6). Local dev needs either a dev bucket or a local S3 emulator |
| Docker Compose (PG, Redis, MinIO, Mailpit) | Local libSQL file DB (`file:`), optional local S3 emulator, email preview | Fewer services on Windows | P08 defines this |
| TanStack Query v5 for all client state | Server Components + Server Actions + `useOptimistic`. TanStack Query only if infinite lists or caching need it | Less client JS | Evaluated in TECH-EVAL §14 |
| Supertest + Testcontainers Postgres | Vitest integration tests on a local libSQL DB; Playwright | No Postgres | Same test layers (A-06) |
| Auth implemented directly or "Auth.js / Lucia patterns" | Better Auth (recommended, D-04) | Maintained, has Drizzle-SQLite and email-OTP support | SPIKE-03 |
| Design tokens from doc 02 (pink, Mona Sans) | 40/30/30 constitution and palette | A-07, IP risk | Doc 02 kept for *layout and behaviour* reference only |
| Tailwind v4, Radix, Lucide, React Hook Form, Zod | **Kept** (Tailwind and Zod confirmed; Radix, Lucide and RHF to be confirmed in P02) | Compatible | — |
| Security checklist (doc 07 §5) | **Kept** | Stack-independent | Redis-based items move to Turso/Upstash |

---

## 14. Verified vs assumed register

| # | Statement | Status | Source |
|---|---|---|---|
| V-01 | The original is SSR (Rails-like) with Vue islands; the clone does not copy this | Verified (observed) | [00 §4](../reverse-engineering/00-executive-summary.md) |
| V-02 | Auth is passwordless email OTP + Google; a legacy password-reset page exists | Verified (UI) / OTP screen unverified | [01 F](../reverse-engineering/01-page-inventory.md), [04 J4](../reverse-engineering/04-user-journeys.md) |
| V-03 | 8 fixed categories; 4:3 thumbnails; 7-colour palettes; dominant-colour placeholders | Verified | [02](../reverse-engineering/02-frontend-analysis.md) |
| V-04 | Like, save, follow, comment and message APIs and behaviour | **Assumed** | [10 §2](../reverse-engineering/10-unknowns-and-limitations.md) |
| V-05 | Comments have one reply level; collections can be private | **Assumed** | [10 §4](../reverse-engineering/10-unknowns-and-limitations.md) |
| V-06 | Popularity formula | **Unknown**; the clone defines its own | [10 §2](../reverse-engineering/10-unknowns-and-limitations.md) |
| V-07 | Team roles (owner/admin/member) | **Assumed** | doc 06 |
| V-08 | Admin/moderation tools exist | **Assumed** (not observed) | — |
| V-09 | Turso FK enforcement is off by default | Verified (vendor doc) | docs.turso.tech/sql-reference/pragmas |
| V-10 | FK pragma is per-connection, and how that interacts with HTTP streams and batches | **Unverified for Turso** (standard SQLite behaviour) | SPIKE-02 |
| V-11 | Turso FTS: FTS5 listed always-on; Tantivy `USING fts` documented separately | Verified (both docs exist). **Which applies to our Turso Cloud DB is unverified** | SPIKE-01 |
| V-12 | `@libsql/client` `batch()` is an implicit transaction (all-or-nothing) | Verified | docs.turso.tech/sdk/ts/reference |
| V-13 | Drizzle `db.batch()` supports libSQL | Verified (Drizzle docs via search; the doc page itself rendered partially) | orm.drizzle.team/docs/batch-api |
| V-14 | Better Auth Drizzle adapter supports `provider: "sqlite"`; emailOTP plugin exists | Verified | better-auth.com docs |
| V-15 | Better Auth works with libSQL through Drizzle end to end (incl. transactions) | **Unverified** | SPIKE-03 |
| V-16 | R2 supports presigned PUT and does not support POST form uploads | Verified | developers.cloudflare.com/r2/api/s3/presigned-urls |
| V-17 | sharp runs in a Next.js Node runtime function on the chosen host | **Unverified** for our build | SPIKE-04/05 |
| V-18 | Vercel Hobby is non-commercial only | Verified | vercel.com/docs/limits/fair-use-guidelines |
| V-19 | Palette contrast ratios in §10.3 | Verified (computed) | this document |
| V-20 | Pricing and currency on the original are region-dependent | Unverified | [10 §1](../reverse-engineering/10-unknowns-and-limitations.md) |

---

## 15. Missing requirements (user decisions needed)

| ID | Question | Why it matters | Linked decision | Suggested default |
|---|---|---|---|---|
| M-01 | **Product name, logo, domain** | Copy, metadata, email sender domain (email DNS records need a domain) | D-01 | Working codename until decided |
| M-02 | **MVP scope cut** (R1 as in §5?) | Drives P01 baseline | D-02 | R1 as listed. Uploads in R2 |
| M-03 | **Auth methods**: email OTP (like the original), email + password, or both; Google? Username login? | Library config, email volume, UX | D-03 | OTP + Google in R1; password optional later |
| M-04 | **Are marketplace and payments in scope at all?** (services checkout, Pro, paid jobs) | Determines whether a payments provider, tax and KYC are needed | — | Listing-only marketplace through R3; payments "Later" and a separate approval |
| M-05 | **Moderation and admin**: reporting, takedown, user bans, featured content, category management, admin UI vs DB scripts | UGC liability and abuse | — | R1: admin role + report button + manual DB tooling. R2: minimal admin pages |
| M-06 | **Content policy**: allowed content, NSFW, AI-generated work, copyright/DMCA process | Terms of service, moderation | — | Draft in P01 for review |
| M-07 | **Locales and currency** | i18n framework, date and number formatting | — | English only, USD display; i18n-ready strings |
| M-08 | **Legal pages and data handling**: Terms, Privacy, Cookies, account deletion, data export, retention, jurisdiction | Required before public launch | — | Templates reviewed by the user. Deletion in R1/R2 |
| M-09 | **R1 seed image hosting** (R2 vs static) | R1 critical path | D-10 | Static seed assets for local dev; R2 once approved |
| M-10 | **Analytics**: none, privacy-friendly, or GA-style; consent | Cookie banner need, X-03 | — | Server-side counts only in R1 |
| M-11 | **Profile URL shape**: `/:username` vs `/@username` | Routing and reserved words | — | `/:username` with a reserved list (parity), decided in P02 |
| M-12 | **Dark mode** | The palette is light-only | — | Light only in R1 |
| M-13 | **Messaging realtime**: polling vs websockets | R3 infrastructure | — | Polling |
| M-14 | **Email notifications**: which events, digest frequency | Email volume vs free-tier limits | D-08 | Transactional only until R3 |
| M-15 | **Deployment budget**: willingness to pay for Vercel Pro, Turso Developer or other services | Commercial use on Vercel requires Pro | D-09 | Hobby for private previews only |
| M-16 | **Upload limits**: max image and video size; video in scope at all | Serverless body and time limits | D-11 | Images ≤ 10–20 MB in R2; video R3 |
| M-17 | Features missing from doc 08 ("Schedule a call", save designer, Places, banner admin) | Backlog completeness | — | Later |

---

## 16. Discrepancies found in the reverse-engineering docs

| # | Discrepancy | Docs | Resolution proposed |
|---|---|---|---|
| X-1 | Doc 00 §5 calls Explore, shot, profiles, auth, likes, saves, follows, comments, search, collections **and jobs** the "MVP". Doc 08/09 Phase 1 contains only discover, view, auth and likes. Collections, follow, comments and jobs are Phase 2 | 00 vs 08/09 | Use doc 08 phases (R1/R2) as the basis; "MVP" means R1 |
| X-2 | Onboarding (A-06) is Phase 2, but root-level usernames and OTP sign-up need a username in Phase 1 | 06, 08 | Minimal onboarding in R1 (N-2) |
| X-3 | D-10 view logging (Phase 1) depends on Redis, which the confirmed stack does not have | 08 | Turso daily aggregate + `after()` |
| X-4 | Colour filter UI wired in Phase 1 while colour search ships in Phase 3 | 09 | Hide until R3 (N-3) |
| X-5 | J-04 mentions a "7-day highlight". No other doc records it (01/02 only record $150/$300 per month tiers) | 08 | Treat as unverified |
| X-6 | Observed features with no feature ID or entity: "Schedule a call", saving designers (profile and hire-card Save), `/places`, banner and promo management | 02, 01 vs 06/08 | Added as M-17 |
| X-7 | Doc 06 `otp_codes.purpose` covers sign-in and sign-up only, yet a password-reset page exists (legacy password accounts). Doc 07 says "No password storage needed" | 01, 06, 07 | Decide in D-03 |
| X-8 | Doc 07 recommends "Next.js 15" and "Prisma 6". Current stable is Next.js 16.x (npm 16.4.6 at assessment time) | 07 | Superseded by A-01/A-02 |
| X-9 | Doc 02 tokens and doc 09 Phase 0 exit criteria ("header/footer match the screenshots") would reproduce the original's look | 02, 09 | Superseded by A-07: match *layout and behaviour*, not visuals |
| X-10 | Doc 06 `users.is_select` and comments mention "Dribbble Select" | 06 | Rename to an original concept (e.g. `is_featured`) in P03 |
| X-11 | Doc 08 F-04/F-05 name Prisma and Express explicitly | 08 | Superseded (S-01) |

No discrepancies were found in counts: 58 components add up per category, 144 screenshots exist on disk, and 52 route rows are listed.

---

## 17. G1 readiness checklist

- [x] All reverse-engineering docs (00–10) reviewed; screenshots inventoried (144 files in 15 folders).
- [x] Roles, features, business rules, data, navigation, interactions, visual direction and NFRs documented with evidence labels.
- [x] Confirmed stack reconciled with the reverse-engineering recommendations.
- [x] Technology options evaluated with sources ([TECHNOLOGY_EVALUATION.md](TECHNOLOGY_EVALUATION.md)).
- [ ] User decisions D-01…D-13 and M-01…M-17 answered.
- [ ] Spikes SPIKE-01…05 scheduled (P02/P08) and passed before G5.
