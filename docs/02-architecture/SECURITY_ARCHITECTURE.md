# Security Architecture

| Field | Value |
|---|---|
| Task | P02-05 (feeds G2 via P02-13; input to T-28 security test design) |
| Version | 1.0, for the architecture review (T-04) |
| Date | 2026-11-13 |
| Inputs | [USER_ROLES](../01-requirements/USER_ROLES.md) · [BUSINESS_RULES](../01-requirements/BUSINESS_RULES.md) BR-01…BR-25, BR-61, BR-66…BR-68, BR-76…BR-79 · NFR-20…NFR-24 · D-03, D-04, D-12, D-20 · ADR-003, ADR-004 |
| Companions | [SYSTEM_ARCHITECTURE](SYSTEM_ARCHITECTURE.md) · [BACKEND_ARCHITECTURE](BACKEND_ARCHITECTURE.md) · [DATA_FLOW_DIAGRAM](DATA_FLOW_DIAGRAM.md) (trust boundaries) |

## 1. Scope, assets and trust boundaries

| Asset | Why it matters |
|---|---|
| Accounts and sessions | Account takeover lets an attacker act as a member |
| Sign-in emails | Personal data; never public (BR-78) |
| OTP codes | Short-lived credentials |
| Content integrity (shots, likes, counts, moderation state) | Trust in the product and its rankings |
| Secrets (DB token, auth secret, R2 keys, HMAC secrets) | Full compromise if leaked |
| Availability and quotas (Turso writes, email sends, function time) | Cost and denial of service |

**Trust boundaries** (drawn in every DATA_FLOW_DIAGRAM flow):

- **TB-1 Internet ↔ Vercel edge/proxy:** everything from the browser is untrusted, including cookies, headers, Server Action arguments and hidden fields.
- **TB-2 App ↔ data stores:** Turso and R2 are trusted stores reached with secrets. Data read back is trusted for integrity but still output-encoded.
- **TB-3 App ↔ third parties:** Resend, Google, Turnstile and Sentry. Responses are validated (Google ID token, Turnstile siteverify).
- **TB-4 Operator workstation ↔ production DB:** moderation, deletion and seed scripts run with production credentials.

## 2. Authentication and sessions (D-03, D-04, ADR-003)

| Control | Implementation | Rule |
|---|---|---|
| Methods | Email one-time code (6 digits) and Google OAuth/OIDC. **No passwords** | BR-12, D-03 |
| Code storage | Hashed (`storeOTP: 'hashed'`), 10-minute expiry, single use | BR-02, NFR-24 |
| Brute force | 5 attempts per code, then invalid (BR-04); 30 verifications per IP per 10 min (BR-07). Expected guess success per code ≈ 5 / 10⁶ = 0.0005% (< 0.001%, NFR-24) | BR-04, BR-07 |
| Enumeration | Code-request response is identical whether or not the email has an account (BR-06) | BR-06 |
| Google | Accept only `email_verified = true`; link by normalised email (BR-11). PKCE + `state` handled by Better Auth | BR-11 |
| Session cookie | `HttpOnly`, `Secure` (https `BETTER_AUTH_URL`), `SameSite=Lax`, host-only, `__Secure-` prefix in production. **Lifetime 30 days, renewed after 24 h** (`session.expiresIn = 30 d`, `updateAge = 1 d`). The spike used the library default of 7 days, so this setting is required and tested in P09-03 | BR-13 |
| Sign-out | Server-side session revocation; old cookie rejected (verified in SPIKE-03) | BR-13 |
| Suspension | Revokes all sessions; sign-in returns the generic "This account is unavailable" | BR-25 |
| `returnTo` | Validated as a same-origin relative path (BR-14) in one shared function, used by login, onboarding and the auth gate | BR-14 |
| Pending onboarding | `proxy.ts` reads Better Auth's **signed session-data cookie** (cookie cache, no DB access) and redirects pending users to `/onboarding`. Services re-check the authoritative state for every mutation (`requireMember`). The cookie-cache option is verified in P09-03; fallback: the check runs in each page's `getViewer()` helper | BR-16 |

## 3. Authorization model

**Principles:**

1. Authorization is decided **in the service**, never in the entry layer alone and never from client-provided claims.
2. Identity comes **only from the session**. No function accepts `userId` / `authorId` from the client for the acting user.
3. Resource access is checked by loading the resource and comparing ownership/role (`shot.authorId === viewer.id`, `viewer.role in [...]`).
4. Not allowed to see → **404**, not 403, for hidden shots, suspended profiles and owner-only pages (no existence leak). 403 is used only for a visible resource where the action itself is forbidden (`CANNOT_LIKE_OWN`).
5. Roles (`moderator`, `admin`) are a column changed only by an operator script (BR-67).

Guard helpers in `auth` service: `getViewer()` (nullable), `requireMember()` (session + onboarded + not suspended), `requirePending()`, `requireRole('moderator' | 'admin')`.

### 3.1 Every R1 mutation: authorization rule and rate-limit class

| # | Mutation | Entry point | Authorization rule | Rate-limit class (BR-76) | Validation |
|---|---|---|---|---|---|
| M-01 | Request sign-in code | `/api/auth/email-otp/send-verification-otp` | Anyone; Turnstile token required (D-20) | `RL-AUTH-SEND` (per email + per IP) | email per BR-10 |
| M-02 | Resend code | same endpoint | Anyone; 60 s since last send for that email (BR-05) | `RL-AUTH-SEND` | as M-01 |
| M-03 | Verify code / sign in | `/api/auth/sign-in/email-otp` | Anyone holding a valid unexpired code for that email | `RL-AUTH-VERIFY` | email + 6 digits |
| M-04 | Start Google sign-in | `/api/auth/sign-in/social` | Anyone | `RL-AUTH-OAUTH` | provider allow-list |
| M-05 | Google callback | `/api/auth/callback/google` | Valid `state` + PKCE; verified email (BR-11) | `RL-AUTH-OAUTH` | library |
| M-06 | Sign out | `/api/auth/sign-out` | Own session only | none (idempotent, origin-checked) — see note | — |
| M-07 | Check username availability | Server Action `users.checkUsername` | `requirePending` (or member changing name, R2) | `RL-ACCOUNT` (60/min sub-limit) | BR-18 |
| M-08 | Complete onboarding | Server Action `users.completeOnboarding` | `requirePending`; the profile is created for the session's user only | `RL-ACCOUNT` | BR-18…BR-22 |
| M-09 | Like / unlike a shot | Server Action `likes.toggleLike` | `requireMember`; shot eligible (BR-37) else 404; not own shot (403 `CANNOT_LIKE_OWN`) | `RL-SOCIAL` | shot ID |
| M-10 | Record a view | `/api/views` (POST) | Anyone; not counted for the author, suspended accounts or deny-listed bots (BR-29) | `RL-VIEW` (excess → 204) | shot ID |
| M-11 | Load more (read, Server Action) | `feed.loadMore` | Anyone (public data only) | none: anonymous read (BR-76) — host protection | cursor (signed) |
| M-12 | Suspend / unsuspend user, hide / unhide shot | `scripts/moderate.ts` (TB-4) | Operator holds prod credentials **and** passes `--actor <staff username>`; the service checks that actor's role (moderators cannot act on admins, BR-68) | `RL-MODERATION` (per actor) | IDs + reason |
| M-13 | Grant / revoke staff role | `scripts/roles.ts` (TB-4) | Operator only; audit row (BR-67) | `RL-MODERATION` | — |
| M-14 | Delete account on request | `scripts/delete-account.ts` (TB-4) | Operator, after verifying the request came from the account's email (BR-24) | `RL-MODERATION` | — |
| M-15 | Cron jobs | `/api/cron/*` | `Authorization: Bearer CRON_SECRET` (constant-time compare) | n/a (System) | job name allow-list |
| M-16 | Cache revalidation | `/api/internal/revalidate` | `Authorization: Bearer INTERNAL_SECRET` | n/a (System) | tag allow-list |

Note on M-06: sign-out has no side effect other than ending the caller's own session, so it is exempt from rate limiting. **This is an exception to BR-76 ("every mutation has exactly one class"):** it is recorded as review item SR-1 for G2, with the proposal to assign it `RL-ACCOUNT` if the user prefers strict compliance.

Every row above gets contract tests for 401/403/404 and 429 (NFR-21, T-14/T-23).

## 4. Abuse controls

- **Rate limiting:** BACKEND_ARCHITECTURE §7. Limits are checked before side effects. Client IP comes from the platform's trusted header only (Vercel: `x-forwarded-for` first hop set by Vercel; other headers ignored) (ADR-003 §3).
- **Turnstile (D-20):** verified server-side (`siteverify`, with the remote IP and expected hostname) in the Better Auth `before` hook for the send path. **Fail closed:** if verification cannot be done, no code is sent.
- **Email cost cap:** per-email and per-IP send limits (BR-06) plus a global daily send ceiling alarm (Sentry metric) to catch distributed abuse.
- **Bot views:** user-agent deny-list and `RL-VIEW`; views from bots are not counted (BR-29).

## 5. CSRF and Server Actions

| Mechanism | Protection |
|---|---|
| Server Actions | Next.js accepts Server Actions only via `POST` and compares the `Origin` header with the host; mismatches are rejected. `serverActions.allowedOrigins` stays **empty** (no extra origins). Action IDs are not secrets: every action authenticates and authorizes itself as if it were a public endpoint |
| Better Auth routes | Built-in origin check (SPIKE-03: foreign `Origin` → 403) plus `trustedOrigins` = the app URL only |
| Route Handlers we write | `/api/views` is a public, harmless endpoint (rate-limited, no state change visible to the user). Cron and internal routes need a bearer secret, so a cross-site request cannot authenticate |
| Cookies | `SameSite=Lax` session cookie: not sent on cross-site POSTs |

Server Action hygiene (enforced by review checklist and the NFR-21 coverage report): every exported action starts with `schema.parse(input)` and a guard; no action trusts a closed-over value from render (Next.js encrypts closed-over values, but authorization is still re-checked); actions return `ActionResult` and never raw errors.

## 6. Input handling and output encoding (XSS)

- All rendering goes through React, which escapes text. `dangerouslySetInnerHTML` is **banned by lint** except for the nonce'd JSON-LD script (R3) and MDX legal content compiled at build from repo files.
- R1 user-provided text: display name and username (validated patterns). Seed content is repo-controlled.
- **R2 rich text** (shot text blocks, job descriptions): stored as a restricted structured format or sanitised HTML with an allow-list sanitiser on the server (`sanitize-html` or DOMPurify on the server; choice at R2 planning, TECHNOLOGY_STACK §3). Comments are plain text with auto-linking and `rel="nofollow ugc noopener"` (BR-48).
- URLs from users (R2 social links, job apply URLs) must be `https:` (or `mailto:` where allowed) and are rendered with `rel="noopener noreferrer"` (BR-74).
- Search terms reach FTS5 only after normalisation and quoting (ADR-001 §5); SQL always uses bound parameters (BACKEND §5.4).

## 7. Transport, headers and CSP (NFR-22)

Set in `proxy.ts` for every HTML response (nonce generated per request, 128-bit, base64):

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'nonce-{n}' 'strict-dynamic' https://challenges.cloudflare.com; style-src 'self' 'nonce-{n}'; img-src 'self' data: blob: https://{media-domain} https://lh3.googleusercontent.com; font-src 'self'; connect-src 'self' https://*.ingest.sentry.io https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; form-action 'self' https://accounts.google.com; base-uri 'none'; object-src 'none'; upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (preload after the domain is final, P12) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` (Google sign-in popup fallback) |

- `style-src` uses the nonce, not `'unsafe-inline'`. The design system is plain CSS files, so no inline styles are needed. Inline `style` attributes set by React (e.g. the dominant-colour placeholder) need `style-src-attr`; P08 decides between `'unsafe-hashes'` for a fixed set, or CSS custom properties set through a class per colour bucket. Review item SR-2.
- Google profile photos are **copied to R2** on first sign-in (R2 release) so `lh3.googleusercontent.com` can later be dropped from `img-src`.
- A CSP report endpoint is added in P12 (`report-to`), sampled.
- The exact CSP is validated in T-28 (ZAP baseline + a Playwright check that pages load with zero CSP violations).

## 8. Secrets and configuration

- Secrets live only in the host's encrypted environment variables (Vercel project settings, per environment) and in developers' untracked `.env.local`. `.env*` is git-ignored except `.env.example` (names only, no values).
- **Secret scanning in CI** (gitleaks or GitHub secret scanning) blocks commits containing secrets (NFR-23, T-21).
- `src/server/env.ts` validates required variables at boot (BACKEND §9) and is `server-only`. Only `NEXT_PUBLIC_*` values reach the client, and the env schema marks which names may have that prefix; a test asserts no secret name has it.
- Separate credentials per environment (dev/preview vs prod): Turso tokens scoped per database, R2 API tokens scoped per bucket with object read/write only, Resend keys with send-only permission.
- **Rotation:** `BETTER_AUTH_SECRET` (invalidates sessions), `CURSOR_HMAC_SECRET` (old cursors → 400, harmless), `VIEW_HMAC_SECRET` (rotated daily by deriving the day key from a master secret + UTC date), DB and R2 tokens — documented in the runbook (P12).
- Operator scripts (TB-4) read production credentials from a local, untracked file with OS-level permissions, and refuse to run against prod without an explicit `--env prod` flag and confirmation.

## 9. Uploads (R2 release; design fixed now)

1. Client asks `POST /api/uploads/presign` (`requireMember`, `RL-UPLOAD`, BR-66 quota). The server creates a `media` row in state `pending` and returns a **presigned PUT** for a server-chosen key (`u/<userId>/<uuid>`), short expiry (5 min), fixed `Content-Type` from the allow-list (JPEG/PNG/WebP, BR-61).
2. Browser PUTs directly to R2 (CORS allows only the app origin, method PUT, header `content-type`).
3. Client calls `POST /api/uploads/:id/finalise`. The server checks ownership of the `media` row, `HEAD`s the object (**size ≤ 20 MB**, because presigned PUT cannot enforce size, F-08), downloads it, **sniffs magic bytes** (BR-61; SVG never accepted), runs sharp with `limitInputPixels` 50 MP (ADR-004), strips metadata (EXIF/GPS) by re-encoding, writes derivatives under immutable keys, and marks the row `ready`. Any failure deletes the object and marks the row `rejected`.
4. Only derivatives are ever served; the original is private (not on the public media domain).
5. Unattached uploads are deleted after 24 h (BR-66).

## 10. Privacy and data protection

- Sign-in email is returned only to its owner (BR-78); DTOs exclude it by construction (BACKEND §5.3).
- Views: no cookie, no raw IP stored; HMAC viewer key with a daily rotating secret; de-dup rows deleted after 48 h (BR-30, BR-31).
- Logs and Sentry: no emails, codes, tokens, raw IPs or full UAs (BACKEND §8, NFR-23).
- Retention jobs per BR-79 (BACKEND §6). Account deletion within 30 days (BR-24).
- No third-party trackers in R1–R2 (TECHNOLOGY_STACK §4). Essential cookies only: session, OAuth state, Turnstile, theme preference (BR-85 for R3 consent).

## 11. Threat model (STRIDE)

Likelihood/impact: H/M/L. Residual risk is after the listed controls.

| ID | Area | STRIDE | Threat | Controls | Residual |
|---|---|---|---|---|---|
| TH-01 | Auth | S | Guessing an OTP for someone's email | 6 digits, 5 attempts, per-IP verify limit, 10-min expiry, hashed storage | L |
| TH-02 | Auth | D / cost | Email bombing a victim or burning the email quota via code requests | Turnstile (fail closed), per-email and per-IP limits, global send alarm | L |
| TH-03 | Auth | I | Account enumeration through code-request responses or timing | Identical responses; send happens in the same code path for both cases (`after()` for the email call) | L |
| TH-04 | Auth | S | OAuth login CSRF / code injection | `state` + PKCE (library), callback origin check, verified-email rule | L |
| TH-05 | Auth | S | Session theft via XSS | HttpOnly cookie, nonce CSP, React escaping, no `dangerouslySetInnerHTML` | L |
| TH-06 | Auth | E | Open redirect via `returnTo` used for phishing after login | BR-14 validator shared by all flows; unit tests with known bypass strings | L |
| TH-07 | Auth | E | Pending or suspended account performing mutations | `requireMember` in every member mutation; suspension revokes sessions | L |
| TH-08 | Server Actions | T / E | Calling an action directly with forged arguments (another user's ID, someone else's shot as "own") | Identity only from session; ownership loaded server-side; Zod parse; contract tests | L |
| TH-09 | Server Actions | S | Cross-site action invocation (CSRF) | Origin check, POST only, SameSite=Lax | L |
| TH-10 | Server Actions | I | Action leaking fields not shown in the UI (e.g. emails in returned DTOs) | DTO mapping in services; `ActionResult` types; test that DTOs have no `email` key | L |
| TH-11 | IDOR | I | Viewing hidden shots or suspended profiles by ID/username | Eligibility check (BR-37) in every read path; 404 for both missing and hidden | L |
| TH-12 | IDOR | T | Unliking or editing another user's like/content by guessing IDs | Like keys are `(session user, shot)`; R2 edit/delete load the row and compare `authorId` | L |
| TH-13 | IDOR | I | Enumerating users or shots by sequential IDs | Shot IDs are public by design (URLs); users are addressed by username; no list endpoints expose private fields | L (accepted) |
| TH-14 | Uploads | E / T | Malicious file (SVG with script, polyglot, decompression bomb) | Magic-byte allow-list, no SVG, `limitInputPixels`, re-encode, originals never served, `nosniff` | L |
| TH-15 | Uploads | D / cost | Oversized uploads or upload flooding | Post-PUT size check + delete, `RL-UPLOAD`, BR-66 quotas, 24 h cleanup | M (R2 storage cost before check) |
| TH-16 | Uploads | T | Overwriting someone else's object | Server-chosen keys, per-request presign, keys are never accepted from the client | L |
| TH-17 | Views / likes | T | Inflating views or likes to game Popular | View de-dup per viewer/day, `RL-VIEW`, bot deny-list, `RL-SOCIAL`, one like per user, nightly reconciliation | M (sock-puppet accounts remain possible; R2 reports) |
| TH-18 | Search | T / D | FTS query syntax injection or expensive queries | Term normalisation + quoting, 100-char cap (BR-38), results paginated | L |
| TH-19 | Data | I | Secrets leaked through the repo, logs, client bundle or error messages | Secret scan, env schema, `server-only`, log redaction test, generic error bodies | L |
| TH-20 | Ops | E | Misuse of operator scripts or a stolen operator credential | Separate prod credentials, explicit `--env prod`, audit rows with actor, role check in service | M (single operator; accepted for R1) |
| TH-21 | Ops | R | A moderator denies having hidden content | Audit log rows (`moderation_actions`), kept 2 years (BR-79) | L |
| TH-22 | Platform | D | Request floods on public pages | Host-level DDoS protection (Vercel), data cache absorbs read load; no app limiter on reads (BR-76) | M (accepted; revisit at P11-05) |
| TH-23 | Cron / internal | E | Unauthenticated call to cron or revalidation endpoints | Bearer secrets, constant-time compare, allow-listed job and tag names | L |
| TH-24 | Supply chain | T | Compromised npm dependency | Exact pins, ≥ 14-day-old versions, lockfile, dependency audit in CI, Renovate PRs reviewed (TECHNOLOGY_STACK §1) | M |

The model covers **auth** (TH-01…07), **uploads** (TH-14…16), **Server Actions** (TH-08…10) and **IDOR** (TH-11…13), as required by P02-05.

## 12. OWASP ASVS 5.0 Level 1 mapping (NFR-20)

Mapped by chapter. The requirement-by-requirement checklist with test links is produced in T-28 design (P07/P11); the ASVS 5.0 numbering is re-checked then against the published standard.

| ASVS 5.0 chapter (L1 scope) | How it is met | Section |
|---|---|---|
| V1 Encoding and sanitization | React escaping, banned `dangerouslySetInnerHTML`, bound SQL parameters, FTS quoting, R2 allow-list sanitiser | §6 |
| V2 Validation and business logic | Zod on every entry point; BR rules in services; rate limits; anti-automation (Turnstile) | §3, §4 |
| V3 Web frontend security | CSP with nonces, `frame-ancestors 'none'`, `nosniff`, cookie flags, no inline scripts | §7 |
| V4 API and web service | Problem-details errors, method restrictions, no-store, origin checks | §5, BACKEND §4 |
| V5 File handling | Upload pipeline: allow-list by magic bytes, size checks, re-encoding, server keys, no execution path | §9 |
| V6 Authentication | OTP strength, attempt limits, no passwords, Google verified email, generic errors | §2 |
| V7 Session management | HttpOnly/Secure/SameSite cookie, server-side revocation, lifetime and renewal, revoke on suspension | §2 |
| V8 Authorization | Session-derived identity, service-level checks, 404 for hidden resources, role changes by script only | §3 |
| V9 Self-contained tokens | Not used for sessions (DB sessions). Signed cursors carry no authority | §2, FRONTEND §7.3 |
| V10 OAuth and OIDC | Library-managed `state`, PKCE, verified email, exact redirect URI | §2 |
| V11 Cryptography | Library hashing for OTP; HMAC-SHA-256 for view keys and cursors; secrets ≥ 32 bytes from a CSPRNG | §8, §10 |
| V12 Secure communication | HTTPS only, HSTS, TLS to Turso/R2/third parties | §7 |
| V13 Configuration | Env validation, secret scanning, separate per-environment credentials, no debug output in prod | §8 |
| V14 Data protection | Email privacy, retention jobs, log redaction, no trackers | §10 |
| V15 Secure coding and architecture | Layering and lint rules, dependency policy, threat model | BACKEND §2, §11 |
| V16 Security logging and error handling | Structured logs without PII, Sentry, request IDs, generic client errors, audit log for staff actions | BACKEND §8 |
| V17 WebRTC | Not applicable | — |

## 13. Review items for G2

| ID | Item | Proposal |
|---|---|---|
| SR-1 | Sign-out has no rate-limit class (strict reading of BR-76 requires one) | Keep exempt (idempotent, own-session only); or assign `RL-ACCOUNT` |
| SR-2 | Inline `style` attributes vs a strict `style-src` | Decide at P08: colour-bucket classes (preferred, no CSP relaxation) or hashed attributes |
| SR-3 | Session lifetime must be set to 30 days (library default 7 days) | Configure and test in P09-03 (BR-13) |
| SR-4 | Proxy reading the signed session-data cookie for BR-16 redirects | Verify the Better Auth cookie-cache API in P09-03; fallback is a per-page check |
