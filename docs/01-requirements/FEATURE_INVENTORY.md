# Feature Inventory with Release Mapping (P01-02)

**Task:** P01-02 · **Owner:** TPM / QA Lead (Product Manager / Requirements Analyst role) · **Last updated:** 2026-11-12 · **Status:** Awaiting Review (user walkthrough at P01-07)
**Companion documents:** [REQUIREMENTS_SPECIFICATION.md](REQUIREMENTS_SPECIFICATION.md) · [BUSINESS_RULES.md](BUSINESS_RULES.md) · [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
**Sources:** [reverse-engineering/08-feature-breakdown.md](../reverse-engineering/08-feature-breakdown.md) (all 70 feature IDs), [PROJECT_ASSESSMENT.md §5](../00-project-assessment/PROJECT_ASSESSMENT.md#5-confirmed-features-and-proposed-releases), [DECISION_LOG.md](../DECISION_LOG.md) (D-02 release scope, X-1…X-11).

---

## 1. Conventions

- **Feature IDs** are the doc-08 IDs, unchanged. Some collide with other ID families (doc-08 feature `D-01` "feed" vs decision **D-01** "product name"; feature `A-01` vs approved decision **A-01**). In this folder, an ID in a "Feature" column is always a doc-08 feature; decisions are always written as "decision D-xx" or linked to the DECISION_LOG.
- **NX-xx** are clone-candidate features that are not in doc 08: the four unlisted reference features from discrepancy X-6 (NX-01…NX-04) plus two clone necessities (NX-05 moderation, NX-06 legal pages).
- **Evidence** (from doc 08): **O** observed working · **P** partially observed (UI only, logged-out gate) · **U** unverified · **—** not applicable (platform work).
- **Release** (decision D-02): **R1** MVP · **R2** creators, social and free job board · **R3** marketplace I and polish · **Later** = not planned. Later items marked **💳 needs payment approval** cannot start without the payment decision (blocker B-19). Later items marked **scope decision** do not involve payments but still need a new scope decision.
- **Platform** features (F-01, F-04, F-05) are not user-visible. They are R1 prerequisites delivered in P03/P08/P09.

---

## 2. Inventory (all doc-08 features)

### 2.1 Platform foundation

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| F-01 | Repo, CI, lint, env | — | 0 | R1 (platform, P08) | Single Next.js app; no Docker Compose/Postgres/Redis/MinIO (A-01, A-09, S-02). Local libSQL file DB | FR-07 |
| F-02 | Design tokens + base primitives | O | 0 | R1 | Tokens from the clone's 40/30/30 constitution, not the reference look (A-07, X-9) | FR-03 |
| F-03 | App shell: header, mega-menu, mobile drawer, footer, banner | O | 0 | R1 | No announcement banner (BR-89); menu entries only for shipped features (BR-45) | FR-01, FR-02 |
| F-04 | DB schema, migrations, seed | — | 0 | R1 (platform, P03/P09) | Drizzle + Turso instead of Prisma/Postgres (X-11); licence-free seed (BR-87) | FR-06 |
| F-05 | API skeleton (validation, errors, logging, rate limits) | — | 0 | R1 (platform, P09) | Route Handlers + Server Actions, Zod (D-22), Turso/Better Auth limiters (D-12); no Express (X-11) | FR-07 |

### 2.2 Identity and access

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| A-01 | Email OTP sign-up / sign-in (request, verify, resend, throttle) | P | 1 | R1 | One unified flow, email only (BR-09); hashed codes, 10 min, 5 attempts (BR-01–BR-07); Turnstile instead of reCAPTCHA (D-20) | FR-10, FR-11, FR-12, FR-20 |
| A-02 | Google sign-in | P | 1 | R1 | Button only, no One Tap prompt; verified emails only; account linking (BR-11) | FR-13 |
| A-03 | Sessions, CSRF, current user, logout | O | 1 | R1 | Better Auth sessions (D-04); Server Actions origin check | FR-14 |
| A-04 | Auth-gate modal with `intent` + `returnTo` | O | 1 | R1 | Closes on Escape (the reference did not); returnTo allow-list (BR-14); intent completion (BR-15) | FR-15 |
| A-05 | Auth-only route guards | O | 1 | R1 | Redirect to `/login?returnTo=` (BR-17) | FR-16 |
| A-06 | Onboarding (username, name, avatar, intent) | U | 2 | **R1 minimal** (username + display name) / R2 full | Moved partly into R1 (X-2, D-02) | FR-17, FR-18 |
| A-07 | Account settings (profile, email, delete) | U | 2 | R2 (R1: deletion on request, BR-24) | Deletion confirmed by a fresh email code | FR-19 |

### 2.3 Content and media

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| C-01 | Presigned upload + media records | U | 2 | R2 | R2 presigned PUT; size/type checked after upload (D-16, F-08) | FR-61 |
| C-02 | Image pipeline (derivatives, dominant colour, palette) | O | 2 | R2 | sharp in a Node handler (D-15); EXIF stripped (BR-63) | FR-62 |
| C-03 | Video/GIF pipeline (poster + teasers) | O | 3 | R3 | Processing approach open (D-18, OQ-25); poster-only fallback | FR-65 |
| C-04 | Shot create/edit with ordered content blocks | U | 2 | R2 | Images and text blocks only in R2; limits BR-64 | FR-63 |
| C-05 | Shot delete / draft / publish | U | 2 | R2 | Soft delete with 30-day purge (BR-65) | FR-64 |
| C-06 | Rebounds | P | 4 | Later (scope decision) | — | FR-66 |

### 2.4 Discovery and search

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| D-01 | Shot feed (popular/recent, category) + grid + infinite scroll | O | 1 | R1 | Cursor pagination with "Load more" fallback (BR-35); no ad or boosted cards | FR-22, FR-23 |
| D-02 | Shot card | O | 1 | R1 (video teaser R3) | One card component; touch devices show actions below the image; unreleased actions hidden (BR-45) | FR-24, FR-30 |
| D-03 | Filter bar (sort, category pills, Filters panel) | O | 1 | R1 (tag + timeframe); colour control R3 | Colour hidden until R3 (X-4) | FR-25, FR-26 |
| D-04 | Popularity scoring + timeframe ranking | P | 2 | R1 simple daily score; R2 full ranking job | Clone-defined formula (BR-33, BR-34) | FR-27, FR-28 |
| D-05 | Colour search (hex → CIELAB) | O | 3 | R3 | Lab columns + arithmetic distance; no Postgres cube (BR-80) | FR-26, FR-36 |
| D-06 | Full-text shot search `/search/:term` | O | 1 | R1 | Turso FTS behind a SearchService (D-07); safe operator handling (BR-38) | FR-31, FR-32 |
| D-07 | Tag pages `/tags`, `/tags/:tag` | O | 1 | R1 | 404 for tags with no eligible shots (BR-41) | FR-33, FR-34 |
| D-08 | Header search type switch + autocomplete | O / P | 2 | R2 (Services type R3) | Own autocomplete (no Algolia) | FR-35 |
| D-09 | Homepage | O | 1 | R1 | Original copy; no hire/get-hired toggle until R3; no promo toast | FR-21 |
| D-10 | View logging + counts | O | 1 | R1 | No Redis; detail-page views only, daily de-dup in Turso (X-3, BR-29–BR-31) | FR-29 |
| D-11 | SEO: metadata, OG, JSON-LD, sitemaps | O | 3 | R1 basic metadata; R3 sitemaps/JSON-LD | Next.js Metadata API | FR-87, FR-88 |
| D-12 | Playoffs (challenges) | O | 4 | Later (scope decision) | Renamed **Challenges** (BR-88) | FR-89 |

### 2.5 Shot detail

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| SD-01 | Shot page: sticky header, content blocks, author card | O | 1 | R1 | Canonical slug redirect (BR-42); no service-upsell links until R3 | FR-37, FR-38 |
| SD-02 | Action rail + Share modal + Details modal | O | 1 | R1 | No third-party share scripts (BR-44); comments entry hidden until R2 | FR-39, FR-40 |
| SD-03 | Colour palette display (+ .aco/.ase download) | O | 2 | R2 (download Later) | Palette shown from R2 when the pipeline exists | FR-43 |
| SD-04 | "More by" + "You might also like" | O | 1 | R1 | Selection rules BR-43 | FR-41 |
| SD-05 | Prev/next shot navigation | O | 2 | R2 | — | FR-44 |
| SD-06 | Mobile shot layout | O | 1 | R1 | Rail becomes a row below the media | FR-42 |

### 2.6 Social graph

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| S-01 | Like / unlike shots | P | 1 | R1 | Optimistic with rollback (BR-47); no self-likes (BR-46, OQ-09) | FR-45 |
| S-02 | Collections (create, save picker, list, detail, privacy) | P | 2 | R2 | "Buckets" renamed collections; private collections (BR-54) | FR-46, FR-47 |
| S-03 | Follow / unfollow + lists | P | 2 | R2 | — | FR-48 |
| S-04 | Comments (list, create, reply, delete, like, disable) | P | 2 | R2 | One reply level (BR-49); moderation via reports (BR-69) | FR-49, FR-50 |
| S-05 | Notifications | U | 3 | R3 | In-app only (OQ-18) | FR-51 |
| S-06 | Block user | P | 3 | R3 | Semantics BR-81 | FR-52 |
| S-07 | Messaging ("Get in touch") | U | 3 | R3 | Polling (OQ-17) | FR-53 |

### 2.7 Profiles and teams

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| P-01 | Profile header + Work tab | O | 1 | R1 | Badge renamed **Featured Studio** (X-10); R1 header shows only shots and likes-received stats | FR-54 |
| P-02 | About tab | O | 1 | R1 | Public email only if set (BR-78) | FR-55 |
| P-03 | Collections tab + collection detail | O | 2 | R2 | Private collections excluded (BR-54) | FR-56 |
| P-04 | Liked Shots tab (owner only) | O (redirect) | 2 | R2 (R1 inclusion is OQ-12) | Owner-only; others 404 | FR-57 |
| P-05 | Teams: members tab, "X for Team", team badge | O | 2 | R2 | Teams have no credentials (BR-57) | FR-58 |
| P-06 | Profile edit | U | 2 | R2 | — | FR-59 |
| P-07 | Services tab | O | 3 | R3 (Reviews tab Later) | Listing only | FR-60 |

### 2.8 Hiring marketplace

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| H-01 | Talent directory `/hire` with filters | O | 3 | R3 | Rating and "Pro" filters removed until reviews/Pro exist (Later) | FR-73 |
| H-02 | Specialty SEO landing pages | O | 4 | Later (scope decision) | Needs CMS content | FR-74 |
| M-01 | Services: CRUD, listing, filters, detail | O | 3 | R3 | No checkout; "Hire Now" opens a message (BR-84) | FR-75 |
| M-02 | Service ordering / checkout | U | 4 | Later 💳 needs payment approval | — | FR-76 |
| M-03 | Reviews and ratings | O (display) | 4 | Later 💳 needs payment approval (reviews depend on orders) | — | FR-77 |
| M-04 | Project brief wizard (AI option) | P | 4 | Later 💳 needs payment approval (also a paid LLM provider) | — | FR-78 |
| M-05 | Brief board (Pro) + proposals | P | 4 | Later 💳 needs payment approval | — | FR-79 |

### 2.9 Jobs

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| J-01 | Job board + filters + keyword | O | 2 | R2 | Free posts only | FR-67 |
| J-02 | Job detail | O | 2 | R2 | Expired notice instead of removal (BR-73) | FR-68 |
| J-03 | Post-a-job wizard with rich text | P | 2 | R2 | Free only; sign-in required; sanitised HTML (BR-71–BR-73) | FR-69, FR-70 |
| J-04 | Paid job tiers (featured, pinned, 7-day highlight) | P | 4 | Later 💳 needs payment approval | "7-day highlight" treated as unverified copy (X-5) | FR-71 |
| J-05 | Job directories (SEO) | O | 4 | Later (scope decision) | `*-jobs-in-*` reserved now (BR-20) | FR-72 |

### 2.10 Monetisation and other

| Feature | Name | Evidence | Doc-08 phase | Release | Clone-specific changes | FR |
|---|---|---|---|---|---|---|
| B-01 | Payments integration (Stripe) | U | 4 | Later 💳 needs payment approval | — | FR-80 |
| B-02 | Pro subscriptions + badges + ranking boost | O (pricing) | 4 | Later 💳 needs payment approval | No ranking boost in R1–R3 | FR-81 |
| B-03 | Boosted shots + ad slots | O | 5 | Later 💳 needs payment approval | — | FR-82 |
| X-01 | Blog / resources (CMS) | O | 5 | Later (scope decision) | — | FR-83 |
| X-02 | Custom 404 (colour mosaic) | O | 3 | R1 simple 404; R3 mosaic | Mosaic built from the clone's own shots | FR-05, FR-08 |
| X-03 | Analytics events pipeline | O | 3 | R3 | First-party, no third-party trackers (OQ-19) | FR-84 |
| X-04 | Marketing pages (Pro, hiring, for designers, advertise) | O | 5 | Later (scope decision; Pro/hiring pricing pages 💳) | About page is in R1 as a legal/static page (FR-04) | FR-85 |
| X-05 | Cookie consent | O | 3 | R3 (with the first non-essential cookie) | Not needed while only essential cookies exist (BR-85) | FR-86 |

---

## 3. Clone-candidate features not in doc 08

| ID | Name | Evidence | Release | Notes | FR |
|---|---|---|---|---|---|
| NX-01 | "Schedule a call" profile action | O (button, X-6) | Later candidate (OQ-22) | Would need calendar integration | FR-91 |
| NX-02 | Save a designer (profile/hire-card Save) | O (button, X-6) | Later candidate (OQ-22) | No entity in doc 06 | FR-92 |
| NX-03 | Places page `/places` | O (page, X-6) | Later candidate (OQ-22) | Depends on structured locations | FR-93 |
| NX-04 | Announcement banner / promo toast management | O (banner, X-6) | Later candidate (OQ-22) | Not rendered in R1–R3 (BR-89) | FR-94 |
| NX-05 | Moderation (suspend, hide, audit log; reports in R2) | Not observed (proposal) | R1 minimal / R2 reports (OQ-04) | [USER_ROLES.md §5](USER_ROLES.md#5-moderation-proposal) | FR-09, FR-90 |
| NX-06 | Legal and static pages (Terms, Privacy, Cookies, About, Contact) | Links observed; pages not visited | R1 | Text supplied or approved by the user (OQ-03) | FR-04 |

---

## 4. Counts

Each feature is counted once, at the **first** release in which any part of it ships.

| Release | Count | Features |
|---|---|---|
| R1 | 28 | F-01…F-05, A-01…A-05, A-06 (minimal), D-01, D-02, D-03, D-04 (simple score), D-06, D-07, D-09, D-10, D-11 (basic metadata), SD-01, SD-02, SD-04, SD-06, S-01, P-01, P-02, X-02 (simple 404) |
| R2 | 18 | A-07, C-01, C-02, C-04, C-05, D-08, SD-03, SD-05, S-02, S-03, S-04, P-03, P-04, P-05, P-06, J-01, J-02, J-03 |
| R3 | 10 | C-03, D-05, S-05, S-06, S-07, P-07, H-01, M-01, X-03, X-05 |
| Later 💳 needs payment approval | 8 | M-02, M-03, M-04, M-05, J-04, B-01, B-02, B-03 |
| Later (scope decision) | 6 | C-06, D-12, H-02, J-05, X-01, X-04 (its Pro/hiring pricing pages also need payment approval) |
| **Total** | **70** | All doc-08 feature IDs (100%) |

Features that continue in a later release: A-06 (full onboarding R2), D-02 (video teaser R3), D-03 (colour filter R3), D-04 (full ranking job R2), D-11 (sitemaps/JSON-LD R3), X-02 (colour mosaic R3).
The 6 clone candidates (§3): NX-05 and NX-06 in R1; NX-01…NX-04 Later candidates.
