# Business Rules (P01-05)

**Task:** P01-05 · **Owner:** TPM / QA Lead (Product Manager / Requirements Analyst role) · **Last updated:** 2026-11-12 · **Status:** Awaiting Review (user walkthrough at P01-07)
**Companion documents:** [REQUIREMENTS_SPECIFICATION.md](REQUIREMENTS_SPECIFICATION.md) · [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) · [USER_ROLES.md](USER_ROLES.md) · [USER_JOURNEYS.md](USER_JOURNEYS.md) · [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)
**Sources:** [DECISION_LOG.md](../DECISION_LOG.md) (D-02, D-03, D-04, D-11, D-12, D-15, D-18, D-20), [PROJECT_ASSESSMENT.md §6](../00-project-assessment/PROJECT_ASSESSMENT.md#6-business-logic-rules-to-specify-in-p01), [TECHNOLOGY_EVALUATION.md](../00-project-assessment/TECHNOLOGY_EVALUATION.md), reverse-engineering [04](../reverse-engineering/04-user-journeys.md), [05](../reverse-engineering/05-api-inventory.md), [06](../reverse-engineering/06-database-design.md), [10](../reverse-engineering/10-unknowns-and-limitations.md).

---

## 1. How to read this document

- Each rule has a unique ID (**BR-xx**), a **testable statement**, the release it applies from (R1, R2, R3), its **basis** and the test layer that will verify it.
- **Basis** values:
  - **Observed**: seen on the reference product (logged-out visitor, see doc 10).
  - **Inferred**: concluded from observed evidence, not directly seen.
  - **Clone decision**: chosen for this product. It was **not** observed on the reference product, and nothing here claims the reference product behaves this way. Every clone decision can be changed by the user at the P01-07 walkthrough; the main ones are also listed in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
- **Verified by** names the planned test layer: `U` unit (Vitest), `I` integration (services + libSQL), `C` API contract, `E2E-xx` Playwright scenario from [USER_JOURNEYS.md](USER_JOURNEYS.md). No test has been executed; all are **Test planned**.
- Numbers (limits, durations) are configuration values with the stated defaults. Changing a default after G2 needs a DECISION_LOG entry from the lead.
- Times are UTC. "Day" means a UTC calendar day.

---

## 2. Authentication and sessions (decision D-03: email OTP + Google, no passwords in R1)

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-01 | A sign-in code is exactly **6 numeric digits** (`000000`–`999999`), generated with a cryptographically secure random generator. | R1 | Clone decision (doc 10 §2: code length not observed) | U, I |
| BR-02 | Codes are stored **only as a hash** (Better Auth `storeOTP: "hashed"`, fact F-07). The plain code appears only in the outgoing email. It is never written to logs, analytics, error reports or API responses. | R1 | Clone decision | I, C, log scan in T-28 |
| BR-03 | A code expires **10 minutes** after issue and is **single-use**. Issuing a new code for the same email invalidates every earlier unused code for that email. The email states the expiry time and contains no sign-in link. | R1 | Clone decision (library default is 300 s; see OQ-06) | I, E2E-36 |
| BR-04 | A code accepts at most **5 verification attempts**. The 5th wrong attempt invalidates the code, and the user must request a new one. The error message after each wrong attempt states the number of attempts left. | R1 | Clone decision (library default is 3; see OQ-06) | I, E2E-35 |
| BR-05 | "Resend code" is available **60 seconds** after the previous send for the same email. Before that the control is disabled and shows a countdown; a server request inside the window returns 429 with `Retry-After`. | R1 | Clone decision | I, E2E-37 |
| BR-06 | Code sends are limited **per email: 5 per hour and 10 per 24 h**, and **per IP: 20 per hour**. Over the limit the server returns 429 with `Retry-After` and sends nothing. The send response is identical whether or not an account exists for the email (no account enumeration). | R1 | Clone decision (D-12) | I, C, E2E-37 |
| BR-07 | Code verification is limited **per IP to 30 attempts per 10 minutes**, in addition to BR-04. | R1 | Clone decision | I, C |
| BR-08 | Every code request carries a **Cloudflare Turnstile** token that is verified server-side before any email is sent. A missing, invalid or expired token returns 400 and no email is sent. | R1 | Clone decision (D-20; the reference product used invisible reCAPTCHA, observed) | C, E2E-38 |
| BR-09 | Sign-in and sign-up use **one email-code flow**. Verifying a valid code for an unknown email creates the account; for a known email it signs the user in. The identifier is the **email address only**; signing in with a username is not supported in R1–R3. | R1 | Clone decision (the reference form accepts "email or username", observed; see OQ-07) | I, E2E-29, E2E-30 |
| BR-10 | Emails are trimmed and lower-cased before any lookup, limit or storage, must be at most 254 characters and must match the HTML `type=email` syntax. Plus-addressing and dots are preserved (no provider-specific folding). An empty or malformed email is rejected client-side with no request sent, and server-side with 400. | R1 | Observed (client validation messages) + clone decision (normalisation) | U, E2E-34 |
| BR-11 | Google sign-in accepts only accounts whose email Google reports as **verified**. If the normalised email matches an existing account, the Google identity is linked to it; otherwise a new account is created and sent to onboarding. Google profile photos are not imported. | R1 | Clone decision | I, E2E-31 |
| BR-12 | **No passwords** exist in R1–R3: no password field, no password-reset page, no password storage. Adding email + password later needs a new decision (D-03 alternative). This resolves discrepancy X-7. | R1 | Clone decision (D-03) | C (no such routes), review |
| BR-13 | The session cookie is `HttpOnly`, `Secure` (except on `localhost`), `SameSite=Lax` and host-only. A session lasts **30 days** and is renewed when used more than 24 h after its last renewal. Sign-out revokes the session server-side; the old cookie is then rejected. Suspension or deletion revokes all of the account's sessions (BR-24, BR-25). | R1 | Clone decision (cookie flags match the reference, observed) | I, C, E2E-33 |
| BR-14 | `returnTo` is accepted only if it is a **same-origin relative path**: it starts with a single `/`, does not start with `//` or `/\`, contains no scheme, no backslash and no control characters, is at most 512 characters after one URL-decode, and does not point to `/login`, `/signup`, `/onboarding` or the auth API (to avoid loops). Any other value is replaced with `/`. | R1 | Clone decision (the reference sends an absolute `return_to`, observed) | U, E2E-39 |
| BR-15 | Auth-gate `intent` values come from an allow-list: `like-shot` (R1); `save-shot`, `follow-user`, `comment-shot`, `post-job` (R2); `message-user` (R3). Unknown intents are ignored. After authentication the intent is applied **at most once** and as an **idempotent "set" operation** (for example "make liked"), never as a toggle, so an already-liked shot stays liked. If the target no longer exists or the action is not allowed (for example liking one's own shot), the user lands on `returnTo` with an explanatory toast and nothing is changed. | R1 | Observed (`intent` + `return_to` on the gate) + clone decision (completion semantics) | U, E2E-32 |
| BR-16 | A signed-in account without a username is in **pending onboarding**. Every page request except `/onboarding`, the auth routes, legal pages and sign-out redirects to `/onboarding?returnTo=<original path>`. Every mutation except onboarding and sign-out returns 403 with code `ONBOARDING_REQUIRED`. | R1 | Clone decision (D-02 minimal username step, X-2) | I, C, E2E-40 |
| BR-17 | An anonymous request for a protected page redirects (303/307) to `/login?returnTo=<path>`; an anonymous API mutation returns 401. Protected pages: `/onboarding` (R1); `/:username/likes`, `/uploads/new`, `/shots/:id/edit`, `/settings/*`, `/jobs/new` submission (R2); `/messages`, `/notifications` (R3). | R1 | Observed (302 to login for `/:u/likes`, `/uploads/new`) | C, E2E-40 |

---

## 3. Usernames, display names and account lifecycle

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-18 | A username is **3–30 characters** from `a–z`, `0–9`, `_` and `-`; it starts and ends with a letter or digit, contains no two consecutive `_`/`-` characters, and is not all digits. Regex: `^(?!\d+$)[a-z0-9](?:[a-z0-9]\|[_-](?=[a-z0-9])){1,28}[a-z0-9]$`. | R1 | Clone decision (doc 06 proposed `^[A-Za-z0-9_-]{2,30}$`) | U, E2E-41 |
| BR-19 | Usernames are **case-insensitively unique**. Input is lower-cased before validation and storage; the stored and displayed form is lower case. Uniqueness is enforced by a unique index, so two concurrent claims of the same name result in one success and one 409 `USERNAME_TAKEN`. | R1 | Clone decision | I, E2E-41 |
| BR-20 | A username may not equal any **reserved word** in [§13](#13-reserved-usernames), nor match the pattern `*-jobs-in-*` (job-directory URLs). The check is applied at onboarding, at username change and when a team is created. Reserved names return 422 `USERNAME_RESERVED`. | R1 | Inferred (root-level `/:username`, doc 01 §B) | U, E2E-41 |
| BR-21 | Onboarding pre-fills a **suggested username** derived from the email local part: lower-cased, invalid characters removed, truncated to 26 characters, and suffixed with 2–4 random digits if taken or reserved. The suggestion must itself satisfy BR-18–BR-20. | R1 | Clone decision | U |
| BR-22 | The **display name** is 1–50 characters after trimming, contains no control characters, and is required at onboarding (pre-filled from Google when available). | R1 | Clone decision | U, E2E-41 |
| BR-23 | (R2) A user can change their username **at most once every 30 days**. The old username is held for the same user for 30 days, during which nobody else can claim it, and is then released. Old profile URLs return 404; there are no redirects. | R2 | Clone decision (see OQ-26) | I, E2E-81 |
| BR-24 | **Account deletion.** R1: a user can request deletion through the contact address on the Privacy page, and the operator completes it with an admin script within **30 days**. R2: self-service in Settings, confirmed by a fresh email code. In both cases the account is soft-deleted at once (sessions revoked, profile 404, shots removed from feeds, search and counters) and personal data is purged after **30 days**. Likes, follows, saves and comments by the account are removed and the affected counters decremented. A **team owner** must transfer ownership or delete the team first. The username is released after the purge. | R1 (on request) / R2 (self-service) | Clone decision (see OQ-03) | I, E2E-82 |
| BR-25 | **Suspension** (by an admin or moderator, BR-68) revokes every session of the account, blocks sign-in with a generic "This account is unavailable" message, returns 404 for the profile, and removes the account's shots from feeds, search, tag pages and related lists. Content is not deleted; unsuspending restores it. Likes already given by the account remain counted. | R1 | Clone decision (moderation proposal, OQ-04) | I, E2E-19, E2E-43 |

---

## 4. Counters

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-26 | Every counter cache (`likes_count`, `saves_count`, `comments_count`, `views_count`, `shots_count`, `followers_count`, `following_count`, `likes_received_count`, tag `shots_count`) changes **in the same atomic batch** as the row that causes it (fact F-03/F-05: `db.batch()`). Inserts use `ON CONFLICT DO NOTHING` and the counter changes only if a row was actually inserted or deleted, so repeating a request never double-counts. | R1 | Clone decision (doc 06 §7, TECH-EVAL T-03) | I (concurrency test: 50 parallel likes from 50 users → exactly +50) |
| BR-27 | Counters are **never negative** (a database `CHECK (col >= 0)` plus guarded decrements). A **nightly reconciliation job** recomputes every counter from its source rows and corrects drift; after it runs, drift is 0. | R1 | Clone decision | I |
| BR-28 | Counts are displayed **abbreviated, truncated (never rounded up)**: `0–999` as is; `1,000–9,999` with one decimal and `k` (`1,999` → `1.9k`, `7,000` → `7k`); `10,000–999,999` as whole `k` (`12,345` → `12k`); `1,000,000–9,999,999` with one decimal and `m` (`2,040,000` → `2m`, `2,150,000` → `2.1m`); above that whole `m`. The full number is available to assistive technology (`aria-label`) and in the Details modal. Tag-page headlines show the full number with thousands separators. | R1 | Observed (`7.7k`, `2m`, "17,157 … designs") + clone decision (truncation) | U |

---

## 5. Views

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-29 | A **view** is counted when a shot detail page is opened and rendered in a browser (client beacon after hydration). Feed card impressions are **not** views. Views by the shot's author, by suspended accounts and by user agents on the bot deny-list are not counted. | R1 | Clone decision (the reference batches viewport IDs, observed; see OQ-08) | I, E2E-23 |
| BR-30 | Views are **de-duplicated per viewer, per shot, per UTC day**. The viewer key is the user ID when signed in, otherwise an HMAC of (IP address, user agent) with a secret that rotates daily. No cookie is set for view counting, and the raw IP is not stored. | R1 | Inferred (doc 10 §4.8) + clone decision (key) — resolves X-3 | U, I, E2E-23 |
| BR-31 | View writes run after the response (`after()`, D-11), update a daily aggregate (`shot, day, views`) and `views_count` in one batch, and never block page rendering. De-duplication keys are deleted after **48 hours**. A failed view write is dropped silently (logged without personal data). | R1 | Clone decision | I |

---

## 6. Discovery, ranking and feeds

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-32 | **Recent** feeds order eligible shots by `published_at` descending, ties by `id` descending. | R1 | Observed (New & Noteworthy) + clone decision (tie-break) | I |
| BR-33 | **Popular** feeds order by a stored `popularity_score`, ties by `published_at` desc then `id` desc. **R1 formula:** `(L + 0.02·V + 1) / (H + 2)^1.5`, where L = likes, V = views, H = hours since publication. **R2 formula:** `(L + 2·S + 3·C + 0.02·V + 1) / (H + 2)^1.5`, adding S = saves and C = comments by users other than the author. Scores are **recomputed on a schedule**, not per request: daily in R1 (Vercel Hobby cron), hourly from R2 when the host plan allows it (D-09, D-11); a newly published shot gets its score at publish time. Weights live in configuration; changing them needs a DECISION_LOG entry. Test properties: same age and more likes ⇒ ranked higher; same engagement and newer ⇒ ranked higher. | R1 | Clone decision (formula on the reference unknown, doc 10 §2; see OQ-10) | U, I |
| BR-34 | **Timeframe** applies to the Popular sort only: `now` (default, uses BR-33), `week` (7 days), `month` (30 days), `year` (365 days), `ever`. For week/month/year the feed contains eligible shots **published within the window**, ordered by `likes_count` desc, then `published_at` desc. `ever` orders all eligible shots by `likes_count` desc. An unknown value is ignored (default used) and omitted from the canonical URL. On the Recent sort the timeframe control is hidden and the parameter ignored. | R1 | Observed (values now/week/month/year/ever) + clone decision (semantics; see OQ-11) | I, E2E-03 |
| BR-35 | Feeds use **cursor pagination**: 24 items per page by default; an API `limit` of 1–48; an opaque, tamper-evident cursor (an invalid cursor returns 400). The last page returns `nextCursor: null` and the UI shows an end-of-list message. The client discards any shot ID already rendered. List endpoints use one parameter naming convention (fixed in P04-01). | R1 | Clone decision (the reference uses `page` + 404 end signal, observed; not copied) | C, E2E-02 |
| BR-36 | There are exactly **8 categories** with fixed slugs: `product-design`, `web-design`, `animation`, `branding`, `illustration`, `mobile`, `typography`, `print`. An unknown category slug returns the 404 page. | R1 | Observed (slugs) + clone decision (404) | C, E2E-04 |
| BR-37 | A shot is **eligible** for feeds, search, tag pages, related lists and public counts only when it is published, `published_at ≤ now`, not hidden by moderation, not deleted, and its author (and team, if any) is neither suspended nor deleted. | R1 | Clone decision | I, E2E-19 |

---

## 7. Search and tags

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-38 | The search term comes from the path `/search/:term`. It is URL-decoded, trimmed, has whitespace collapsed and is lower-cased; the canonical URL uses that normalised form, and other forms redirect to it. The term is 1–100 characters; longer terms are truncated to 100. Full-text operator syntax (quotes, `*`, `^`, `:`, parentheses, leading `-`/`+`, and the words `AND`, `OR`, `NOT`, `NEAR`) is treated as plain text, so no input causes a server error. A term that is empty after sanitising shows the empty state. Submitting an empty search box does not navigate. | R1 | Observed (path-based search) + clone decision | U, C, E2E-13, E2E-14 |
| BR-39 | Search matches eligible shots on title (weight 3), tags (2), description (1) and author display name/username (1), with prefix matching on the last token when it has at least 2 characters. Results are ordered by relevance blended with popularity (initial blend 0.7 relevance / 0.3 normalised popularity, tuned in SPIKE-01, D-07). Test property: at equal popularity, a title match ranks above a description-only match. "Related" shows up to 8 tags that occur most often in the top 50 results, excluding the term itself. | R1 | Clone decision (ranking unknown on the reference) | I, E2E-10 |
| BR-40 | A tag name is trimmed and lower-cased, 2–30 characters of letters, digits, spaces and hyphens. Its slug replaces spaces with hyphens and collapses repeats. Tags are unique by slug. | R1 (seed) / R2 (user entry) | Clone decision | U |
| BR-41 | `/tags/:tag` exists only while the tag has **at least 1 eligible shot**; otherwise it returns 404. The headline count is the number of eligible shots with the tag. `/tags` lists the 50 tags with the most eligible shots, followed by an A–Z index (digits under `#`). | R1 | Observed (pages) + clone decision (404 rule) | I, E2E-11, E2E-15 |

---

## 8. Shot detail, sharing and likes

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-42 | A shot's canonical URL is `/shots/{id}-{slug}`, where the slug is the title lower-cased, with non-alphanumeric runs turned into `-`, trimmed and capped at 80 characters. A request with a missing or outdated slug redirects permanently (308) to the canonical URL. A non-numeric ID or an ineligible shot (BR-37) returns 404; moderators and admins can still open hidden shots. | R1 | Observed (URL shape) + clone decision (redirect) | C, E2E-05, E2E-08 |
| BR-43 | "More by {author}" shows up to **4** of the most recent eligible shots by the same author (by the team when the shot is team-attributed), excluding the current shot. "You might also like" shows up to **12** eligible shots ordered by number of shared tags, then same category, then popularity, excluding the current shot and those already in "More by"; it is filled with popular shots from the same category when fewer than 12 match. An empty section is not rendered. | R1 | Observed (sections and sizes) + clone decision (selection) | I |
| BR-44 | Share links use the canonical absolute URL plus `utm_source=share`, `utm_medium={copy_link\|x\|pinterest}` and `utm_campaign=shot`. Sharing loads **no third-party scripts**: X and Pinterest use plain intent URLs opened in a new tab. "Copy link" uses the Clipboard API, falls back to selecting the text, and confirms with a "Link copied" toast. | R1 | Observed (Pinterest, X, copy link with UTMs) + clone decision (parameter values) | E2E-21 |
| BR-45 | Actions whose feature has not shipped in the current release are **not rendered** (no dead buttons). In R1 this hides Save, Follow, Comments, Get in touch, Upload and the related stats (saves, comments, followers). | R1 | Clone decision (assessment N-4) | Component test, E2E-28 |
| BR-46 | A user has at most **one like per shot**. Like and unlike are idempotent "set" operations. Authors **cannot like their own shots** (control hidden; the server returns 403 `CANNOT_LIKE_OWN`). Users in pending onboarding or suspension cannot like. Liking an ineligible shot returns 404. Like timestamps are stored. | R1 | Inferred (`isLiked`, one like per user) + clone decision (own-shot rule; see OQ-09) | I, C, E2E-20, E2E-27 |
| BR-47 | Like/unlike is **optimistic**: the icon and count change within 100 ms of activation. On any failure the previous state is restored and an error toast is shown; on 429 the toast says when the user can try again. The server response is the source of truth for the final count. | R1 | Clone decision (behaviour on the reference unverified) | Component test, E2E-25, E2E-26 |

---

## 9. Comments, collections, follows (R2)

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-48 | A comment body is 1–2,000 characters after trimming, plain text only (no HTML rendered). Line breaks are preserved, with at most 2 consecutive blank lines. URLs are auto-linked with `rel="nofollow ugc noopener noreferrer"`. | R2 | Clone decision (doc 06 proposed ≤ 2,000) | U, E2E-65 |
| BR-49 | Comments have **one level of replies**. A reply to a reply is attached to the top-level comment and prefixed with the replied-to user's `@username`. Top-level comments are ordered oldest first; replies oldest first under their parent. | R2 | Inferred (doc 10 §4.2: assumed, not observed) | I, E2E-64 |
| BR-50 | The author can **edit** a comment within 15 minutes of posting (it then shows "edited") and **delete** it at any time. The shot's author (and the team owner/admin for a team shot) can delete any comment on that shot. A deleted comment that has replies becomes a "Comment removed" placeholder; one without replies disappears. `comments_count` counts visible comments, replies included. | R2 | Clone decision | I, E2E-67 |
| BR-51 | The shot's author (or the team owner/admin for a team shot) can **disable comments** per shot. When disabled, the composer is hidden, creating a comment returns 403 `COMMENTS_DISABLED`, and existing comments stay visible. | R2 | Observed (`commentsDisabled` flag) + clone decision (existing stay visible) | C, E2E-66 |
| BR-52 | A user can like a comment once and cannot like their own comment. | R2 | Clone decision (comment likes inferred from robots path `/comments/*/likes`) | I |
| BR-53 | A collection name is 1–60 characters and unique per owner (case-insensitive); the description is at most 300 characters. A user can own at most **100 collections**, and a collection holds at most **1,000 shots**. | R2 | Clone decision | I, E2E-60 |
| BR-54 | Collections are **public by default** and can be made **private**. A private collection is visible only to its owner: anyone else gets 404, and it is not listed on the profile or counted in public collection counts. A privacy change takes effect immediately. | R2 | Inferred (doc 10 §4.3: private is an assumption) | I, E2E-58 |
| BR-55 | A shot appears at most once per collection; saving it again is a no-op. `saves_count` is the number of collection items that reference the shot (private ones included), and the identity of private savers is never disclosed. Users can save their own shots. Deleting a collection removes its items and decrements the counts. Saving an ineligible shot returns 404. | R2 | Clone decision | I, E2E-57, E2E-60 |
| BR-56 | A user **cannot follow themselves** (control hidden; server 400 `CANNOT_FOLLOW_SELF`). Follow and unfollow are idempotent. Members can follow teams; team accounts never follow, because they have no session (BR-57). Follower and following lists are public, newest first, 24 per page. | R2 | Inferred (doc 04 J2) + clone decision | I, E2E-61, E2E-62 |

---

## 10. Teams, uploads and shot composition (R2)

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-57 | A **team** is an account of type `team` with its own username (BR-18–BR-20) and profile. It has **no sign-in credentials**; members act on its behalf. It always has exactly one owner, at most 100 members, and a user can belong to at most 10 teams. | R2 | Inferred (doc 10 §4.1, `isTeam`) + clone decision (limits) | I |
| BR-58 | **Team roles.** The **owner** can do everything, including transferring ownership and deleting the team. **Admins** invite and remove members, edit the team profile and manage team shots (BR-60). **Members** publish shots for the team and can leave it. Invitations go to a username, expire after 14 days and are accepted or declined in Settings › Teams. The owner cannot leave without first transferring ownership. | R2 | Clone decision (roles inferred in doc 06; team administration never observed; see OQ-15) | I, E2E-77, E2E-79 |
| BR-59 | A shot always has one **individual author**. It can optionally be attributed to **one team** of which the author is a current member; it is then shown as "{Author} for {Team}" and appears on both the author's and the team's Work tabs. Attributing to a team the author does not belong to returns 403. | R2 | Observed ("X for Team") + clone decision | I, E2E-77, E2E-78 |
| BR-60 | When a member leaves or is removed, their existing team shots keep the team attribution and their authorship, but they cannot publish new shots for that team. The team owner or an admin can remove the team attribution from any team shot (the shot stays on the author's profile) and can disable comments on it. | R2 | Clone decision | I, E2E-78 |
| BR-61 | R2 accepts **JPEG, PNG and WebP** still images only, verified by **magic bytes** (not the extension or declared MIME type). SVG is never accepted. GIF and video arrive in R3 (BR-86, D-18). | R2 | Clone decision (D-18) | U, I, E2E-52 |
| BR-62 | An image is at most **20 MB**, at least **400 × 300 px**, at most **8,000 px** on either side and at most **40 megapixels**. Files outside these limits are rejected with a message stating the limit. Because R2 presigned PUT cannot enforce size (fact F-08), the server checks size and type after upload and deletes rejected objects. | R2 | Clone decision (M-16; see OQ-14) | I, E2E-53 |
| BR-63 | **Processing** (D-15) strips all EXIF/XMP/GPS metadata from every served derivative; converts to sRGB; produces WebP widths 400/800/1200/1600 and 4:3 centre-cropped covers 400×300 and 800×600; and extracts a dominant colour plus a 7-colour palette (stored in Lab). Media status moves `pending → ready` or `failed`. Processing that takes more than 30 s marks the media `failed`, and the composer offers retry or remove. Originals are kept private and never served. | R2 | Observed (outputs: 4:3 crops, palettes) + clone decision (sizes) | I, E2E-54 |
| BR-64 | **Shot composition.** Title 1–100 characters (required); description at most 5,000 characters of plain text with links; **exactly one category** (required); 0–20 tags (BR-40); 1–20 content blocks with at least one image block. A text block is 1–5,000 characters. The first image block is the cover. Each image has alt text of at most 250 characters, defaulting to "{title}, image {n}" when left blank. | R2 | Observed (block model in `shotData`) + clone decision (limits) | U, C, E2E-55 |
| BR-65 | **Shot lifecycle.** A **draft** is visible only to its author. **Publishing** sets `published_at` once; later edits do not change it, and a changed title changes the slug (BR-42 redirects). **Deleting** is a soft delete: the shot returns 404 at once, its likes, saves and comments are removed with counter updates, and after 30 days the row and its R2 objects are purged. Published shots cannot go back to draft. | R2 | Clone decision (doc 10 §2: lifecycle not observed) | I, E2E-51, E2E-56 |
| BR-66 | **Upload quotas:** 30 files per hour and 200 per day; 10 published shots per day; at most 50 drafts. Uploads not attached to a shot within 24 hours are deleted from R2 and the database. | R2 | Clone decision | I |

---

## 11. Moderation (proposal, see [USER_ROLES.md §5](USER_ROLES.md#5-moderation-proposal) and OQ-04)

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-67 | The **admin** and **moderator** roles are granted and revoked only by the operator running a server-side script; there is no UI for this in R1–R2. Every grant and revocation is written to the audit log. | R1 | Clone decision (proposal) | I |
| BR-68 | Moderators and admins can **suspend/unsuspend a user** (BR-25) and **hide/unhide a shot** (from R2 also comments, collections and jobs). A hidden item returns 404 to everyone except moderators and admins and is excluded from feeds, search, tags, related lists and public counts. Every action writes an audit row (actor, target, action, reason of at least 10 characters, timestamp) that cannot be edited or deleted through the application. In R1 these actions run as an admin-only script or Server Action with no public UI. | R1 | Clone decision (proposal) | I, E2E-19 |
| BR-69 | (R2) Signed-in members can **report** a shot, comment, profile, collection or job, once per target per reporter (a second report returns 200 "already reported" and creates nothing). Reasons: spam, harassment, intellectual-property infringement, explicit content, other (with a note of at most 500 characters). Reports appear in a moderator queue, oldest first. Members cannot report their own content. | R2 | Clone decision (proposal) | I, E2E-83, E2E-84 |
| BR-70 | Content that breaks the content policy (draft baseline: no illegal content, no sexually explicit content, no harassment, no content infringing third-party rights) is hidden under BR-68. The final policy text, including the position on AI-generated work and the takedown contact, is decided by the user (OQ-05) and published on the Terms page before R2. | R2 | Clone decision (proposal) | Review |

---

## 12. Jobs, rate limits, privacy and later releases

### 12.1 Jobs (R2, free posting only)

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-71 | **Required fields:** title (5–100 characters), description (50–20,000 characters of text after stripping markup), workplace type (`remote`, `on-site`, `hybrid`), specialty (exactly 1 of 9), employment type (`full-time`, `freelance-contract`), apply destination (`https://` URL or `mailto:` address, at most 512 characters), company name (1–80 characters) and company website (`https://` URL). **Optional:** location (at most 120 characters; blank is displayed as "Remote") and a company logo (BR-61, at most 5 MB). | R2 | Observed (required labels on step 1) + clone decision (company name required; lengths) | U, C, E2E-73, E2E-74 |
| BR-72 | Job descriptions are **sanitised server-side** with an allow-list: `p`, `br`, `h2`, `h3`, `strong`, `em`, `ul`, `ol`, `li`, `a` (`href` limited to `https:`/`mailto:`; `rel="nofollow noopener noreferrer"` and `target="_blank"` forced). Everything else is removed. The editor's "H1" maps to `h2`, because the page has a single `h1`. Sanitising runs again on every edit. | R2 | Observed (rich-text editor) + clone decision | U, E2E-74 |
| BR-73 | Posting requires a signed-in, onboarded member. A free job is **published immediately**, stays **active for 30 days** and then **expires**: it is removed from the board, and its detail page stays reachable with a "No longer accepting applications" notice, no apply button and `noindex`. The poster can edit an active job (the posted date does not change) or close it early. Limits: **3 active free jobs** per user and 5 job posts per day. Paid tiers (featured, pinned, highlight) are Later (X-5, payment approval). | R2 | Clone decision (the reference's steps 2–4 and payment were not observed) | I, E2E-71, E2E-75 |
| BR-74 | "Apply for this position" opens the employer's apply destination in a new tab (`rel="noopener noreferrer"`). The platform collects no application data. | R2 | Inferred (doc 10 §4.6) | E2E-69 |
| BR-75 | **Job filters:** specialties are multi-select and combined with OR; location is a case-insensitive substring match; "Open to remote" adds remote jobs; employment types are multi-select; the keyword searches title, company name and description. Active jobs are listed newest first, 20 per page. | R2 | Observed (filter form fields) + clone decision (semantics) | I, E2E-69, E2E-70 |

### 12.2 Rate limits (decision D-12)

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-76 | Every mutation has exactly one **rate-limit class** (table below). Auth classes use Better Auth's database-backed limiter; the others use the Turso-table limiter. Anonymous reads (feeds, search, pages) have no application limiter in R1–R2; host-level protection only. | R1 | Clone decision (D-12) | C (one 429 case per class) |
| BR-77 | Over a limit, the server returns **429** with a `Retry-After` header (seconds) and a problem-details body with code `RATE_LIMITED`. It performs no side effect and reveals no other user's data. UIs show a non-blocking message that includes the retry time. | R1 | Clone decision | C, E2E-26, E2E-37, E2E-68 |

| Class | Applies to | Default limits | From |
|---|---|---|---|
| `RL-AUTH-SEND` | Code request and resend | Per email 1 per 60 s, 5 per hour, 10 per 24 h; per IP 20 per hour (BR-05, BR-06) | R1 |
| `RL-AUTH-VERIFY` | Code verification | 5 per code (BR-04); per IP 30 per 10 min (BR-07) | R1 |
| `RL-AUTH-OAUTH` | Google sign-in start and callback | Per IP 30 per 10 min | R1 |
| `RL-ACCOUNT` | Onboarding, username check, profile edit, settings | Per user 30 per hour; username availability checks 60 per minute | R1 |
| `RL-SOCIAL` | Like/unlike; follow/unfollow, save/unsave (R2) | Per user 60 per minute and 1,000 per 24 h | R1 |
| `RL-VIEW` | View beacon | Per IP 120 per minute; excess silently dropped (204) | R1 |
| `RL-MODERATION` | Admin/moderator actions | Per actor 300 per hour | R1 |
| `RL-COMMENT` | Create, edit and delete comment; like comment | Per user 10 per minute and 200 per 24 h | R2 |
| `RL-CONTENT` | Create/edit/delete shot, collection, team, job | Per user 30 per hour; plus BR-66 and BR-73 quotas | R2 |
| `RL-UPLOAD` | Presign and finalise upload | Per user 30 files per hour, 200 per day (BR-66) | R2 |
| `RL-REPORT` | Report content | Per user 20 per 24 h | R2 |
| `RL-MESSAGE` | Start a conversation; send a message | Per user 20 new conversations per 24 h; 60 messages per hour | R3 |

### 12.3 Privacy

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-78 | A user's sign-in email is **never** shown publicly or returned by any API to anyone but that user. A **public contact email** appears on the About tab only if the user sets one (R2 profile edit; seed data in R1). Copying it shows an "Email copied" toast. | R1 | Observed (copy-email toast) + inferred (assessment B-19) | C, E2E-16 |
| BR-79 | **Retention:** OTP records are deleted within 24 h of expiry or use; rate-limit rows within 24 h after their window; view de-duplication keys after 48 h (BR-31); session rows 7 days after expiry or revocation; application logs after 30 days; personal data of deleted accounts within 30 days (BR-24); moderation audit rows after 2 years (proposal). Logs contain no emails, codes, tokens or raw IPs. | R1 | Clone decision (M-08) | I, log scan in T-28 |

### 12.4 R3 rules (recorded now so that R3 scope is testable; refined before G4-R3)

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-80 | **Colour search** accepts `#RGB` or `#RRGGBB` (case-insensitive, `#` optional). The colour is converted to CIELAB. A shot matches when any of its palette colours is within ΔE76 ≤ 20 (configurable). Results are ordered by smallest distance, then popularity. An invalid hex shows an inline error and no results. | R3 | Clone decision (doc 10 §4.5 assumption) | U, I, E2E-95 |
| BR-81 | **Blocking:** a blocked user cannot follow, comment on the blocker's shots, message or mention the blocker. Existing follows in both directions are removed. Blocking is private (the blocked user is not told) and public content stays publicly visible. A user cannot block themselves. | R3 | Observed ("Blocked" markup) + clone decision (semantics) | I, E2E-91 |
| BR-82 | **Messaging:** only signed-in, onboarded members can message; nobody can message a user who has blocked them; a message is 1–5,000 characters of plain text; new messages are fetched by polling (M-13) at most every 15 s while the thread is open. | R3 | Clone decision | I, E2E-92 |
| BR-83 | **Notifications** are created for likes, comments, replies, follows, saves and team invitations. There are none for one's own actions, and repeated likes of the same shot within 1 hour are grouped. Read state is per notification; unread count capped in display at "99+". | R3 | Clone decision | I, E2E-90 |
| BR-84 | **Service listings** (no checkout) store prices as integer US-cent amounts and display them in USD; delivery is 1–90 days; "Hire Now" / "Request service" opens a message to the seller (BR-82), because orders are Later (payment approval). | R3 | Observed (fields) + clone decision (no checkout) | I, E2E-94 |
| BR-85 | **Cookie consent:** no non-essential cookie or analytics identifier is set before consent. Essential cookies are the session, CSRF/state, Turnstile and UI-preference cookies. Consent can be withdrawn from the footer at any time. | R3 | Clone decision (X-05, M-10) | E2E-96 |
| BR-86 | **Animated media (R3, D-18):** GIF at most 20 MB; MP4/WebM at most 100 MB and 60 s. A poster still is mandatory; teasers are generated asynchronously; if processing fails the shot shows the poster only. Exact limits are confirmed when D-18 is implemented. | R3 | Observed (teaser outputs) + clone decision | I, E2E-93 |

### 12.5 Content and branding

| ID | Rule (testable statement) | From | Basis | Verified by |
|---|---|---|---|---|
| BR-87 | Seed content uses only **licence-free or generated** images, and each seed image has a recorded source and licence (D-19, A-10). Seed users and names are fictional. | R1 | Clone decision | Review of the seed manifest |
| BR-88 | No reference-product name, logo, artwork, copy, screenshots or fonts appear in the product, seed data, schema or code. Branded concepts are renamed: "Select" → **Featured Studio**, "Playoffs" → **Challenges**, "buckets" → **collections**. "Shot" is used as a generic term for a design post. | R1 | Decision A-10, X-10 | Review, T-28 asset scan |
| BR-89 | Feeds are **not personalised** in R1–R3: every visitor sees the same ordering for the same URL. There is no "Discover" tab and no announcement banner or promo toast in R1–R3. | R1 | Clone decision (doc 10 §3 open items; see OQ-23, OQ-22) | E2E-01 |

---

## 13. Reserved usernames

BR-20 applies this list to usernames and team names. It contains **every top-level route of R1–R3 and Later** plus system and impersonation words, and it is case-insensitive. P02-03 (frontend architecture) must keep it in sync with the route tree, and a unit test fails if a top-level route segment is missing from the list.

| Group | Reserved words |
|---|---|
| R1 routes | `shots`, `search`, `tags`, `login`, `signup`, `logout`, `onboarding`, `auth`, `api`, `terms`, `privacy`, `cookies`, `about`, `contact` |
| R2 routes | `uploads`, `settings`, `account`, `jobs`, `collections`, `teams`, `likes`, `followers`, `following`, `admin`, `moderation`, `reports` |
| R3 routes | `notifications`, `messages`, `hire`, `designers`, `services`, `sitemap`, `sitemaps` |
| Later routes | `pro`, `hiring`, `advertise`, `challenges`, `rebounds`, `briefs`, `proposals`, `stories`, `blog`, `resources`, `places`, `directories`, `billing`, `checkout`, `payments`, `orders`, `reviews`, `featured`, `for-designers`, `design-agency` |
| Framework and files | `_next`, `static`, `assets`, `media`, `images`, `img`, `cdn`, `fonts`, `favicon-ico`, `robots-txt`, `sitemap-xml`, `manifest`, `health`, `well-known` |
| Auth and account words | `signin`, `sign-in`, `sign-up`, `register`, `join`, `verify`, `callback`, `oauth`, `reset`, `password`, `session`, `sessions`, `me`, `self`, `user`, `users`, `profile`, `dashboard` |
| Generic and impersonation | `www`, `mail`, `email`, `root`, `system`, `support`, `help`, `security`, `status`, `staff`, `team`, `official`, `moderator`, `administrator`, `null`, `undefined`, `home`, `index`, `feed`, `explore`, `popular`, `recent`, `new`, `edit`, `delete`, `app`, the product name once D-01 is decided, and the working codename `trippple` |
| Pattern | Any name matching `*-jobs-in-*` (Later job-directory URLs) |

Dotted file names (`favicon.ico`, `robots.txt`, `sitemap.xml`, `.well-known`) cannot be usernames anyway because `.` is not allowed (BR-18). Their hyphenated forms are listed so that lookalikes are refused too.

---

## 14. Resolution of UNVERIFIED items from reverse-engineering doc 10

Every unverified or not-understood behaviour in [doc 10](../reverse-engineering/10-unknowns-and-limitations.md) §2–§4 is resolved below as a rule or an open question. "N/A" means the item has no counterpart in the clone.

| Doc 10 item | Resolution |
|---|---|
| §2 Logged-in header (avatar menu, notifications, upload) | FR-01 (signed-in header per release); BR-45 hides unreleased entries |
| §2 Like / save / follow success behaviour | BR-26, BR-46, BR-47 (like); BR-53–BR-55 (save); BR-56 (follow) |
| §2 Collections save picker | FR-47; BR-53–BR-55 |
| §2 Comments read and write | BR-48–BR-52 |
| §2 Messaging / "Get in touch" | BR-82 (R3); realtime approach OQ-17 |
| §2 OTP length, expiry, resend cooldown, error copy | BR-01–BR-07; values confirmed through OQ-06 |
| §2 Google OAuth callback | BR-11 |
| §2 Password reset and its relation to OTP | BR-12 (no passwords; X-7) |
| §2 Onboarding after sign-up | BR-16, BR-18–BR-22 (R1 minimal); FR-18 (R2 full) |
| §2 Shot upload/composer | BR-61–BR-66 |
| §2 Rebounds | Later (FEATURE_INVENTORY C-06); no rule needed for R1–R3 |
| §2 Header search autocomplete | FR-35 (R2): suggestions start at 2 characters, at most 8, from tags and usernames by prefix |
| §2 Services checkout, order lifecycle | Later (payment approval, B-19); R3 listing rule BR-84 |
| §2 Project brief wizard, brief board, proposals | Later (payment approval) |
| §2 Job-post steps 2–4, plan selection, payment | BR-71–BR-73 (free wizard); paid tiers Later |
| §2 Pro checkout and entitlements | Later (payment approval) |
| §2 Followers / following lists | BR-56 |
| §2 Notifications, settings, account deletion | BR-83 (R3); BR-23, BR-24 (settings, deletion) |
| §2 Liked Shots tab | BR-17; FR-57 (owner-only, R2) |
| §2 Team admin (inviting members) | BR-57–BR-60; flow OQ-15 |
| §2 Email templates | BR-03 (OTP email content); other templates in R3 with notifications (OQ-18) |
| §2 Rate limits and thresholds | BR-76, BR-77 |
| §2 Ranking and popularity formula | BR-33, BR-34; OQ-10, OQ-11 |
| §3 `/signup/new` redirects to an agency page | N/A: not replicated; the clone's sign-up route is `/signup` |
| §3 Sign-up modal does not close on Escape | FR-15: the clone's auth-gate modal **closes on Escape** and traps focus (WCAG 2.1.2) |
| §3 Two shot-card generations | FR-24: one card component |
| §3 Inconsistent pagination parameters and formats | BR-35: one convention, fixed in P04-01 |
| §3 Infinite-scroll end signal (404) | BR-35: `nextCursor: null`, no 404 |
| §3 Announcement banner dismissal persistence | BR-89: no banner in R1–R3; candidate NX-04 (OQ-22) |
| §3 Jobs hero serif font | N/A: typography is set by the clone's design system (P05, D-06) |
| §3 "Discover" pill personalisation | BR-89 (not personalised); OQ-23 |
| §4.1 Teams are users with `account_type = team` | BR-57 |
| §4.2 One level of comment replies | BR-49 |
| §4.3 Private collections | BR-54 |
| §4.4 Time-decayed popularity | BR-33 |
| §4.5 CIELAB colour search | BR-80 |
| §4.6 External apply URL | BR-74 |
| §4.7 Pro affects ranking and brief access | Later (payment approval); no ranking boost in R1–R3 (BR-33 has no Pro term) |
| §4.8 View de-duplication | BR-29–BR-31; OQ-08 |
| §1 Region-dependent pricing | N/A in R1–R3 (no payments); R3 prices in USD (BR-84); locale question OQ-20 |
| §1 AWS WAF challenge | N/A: not replicated; bot protection by Turnstile (BR-08) and host firewall |
