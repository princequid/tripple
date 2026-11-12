# Architecture Decisions (ADRs)

Deliverable of **P02-12**. ADRs for non-spike choices are added when P02-01…P02-06 are written. This first part records the **technical spikes** (P02-07…P02-11), which were executed on 2026-11-12 after gate G1 was approved.

- **Spike code:** `spikes/` (throwaway, outside `src/`, deleted at G5).
- **Raw outputs:** `spikes/*/result-*.json`.
- **Package versions:** pinned exact and at least two weeks old where available: `@libsql/client` 0.18.0, `drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11, `next` 16.4.3, `react`/`react-dom` 19.2.9, `better-auth` 1.7.14, `sharp` 0.35.5. The new Turso engine, `@tursodatabase/database` 0.8.3, was used for comparison only.
- **Environment:** Windows 11, Node 24.13.0, libSQL local file mode (embedded SQLite 3.45.1).

> **Scope caveat:** no Turso Cloud account exists yet (B-15 / D-14). Every result below is from **local file mode**. Remote (HTTP) behaviour is re-checked with the same scripts once the account exists: `TURSO_URL=… TURSO_TOKEN=… node run.mjs`. These ADRs are marked *Accepted (local); remote verification pending* until then.

---

## ADR-001: Full-text search uses SQLite FTS5 on libSQL (SPIKE-01, P02-07)

**Status:** Accepted (local). Remote verification pending (B-15). Implements **D-07**.

**Context.** Turso documents two mechanisms: FTS5 (always-on extension of libSQL) and a newer Tantivy-based `CREATE INDEX … USING fts` on its new engine ([F-02](../DECISION_LOG.md)).

**Evidence** (`spikes/spike-01-fts/`):

| Check | Result |
|---|---|
| FTS5 external-content table + 3 sync triggers on libSQL | ✔ created |
| Seed 10,000 shots through triggers | 3.98 s (batches of 1,000) |
| 200 ranked queries (`bm25`, title ×10, tags ×3), 8 query shapes incl. prefix `fin*`, phrase, `OR` | **p50 12.0 ms · p95 31.2 ms · max 46.4 ms** (local) |
| Prefix index (`prefix='2 3'`), phrase and boolean queries, `snippet()` highlighting | ✔ |
| UPDATE / DELETE keep the index in sync via triggers | ✔ / ✔ |
| Malformed user input (`"unbalanced`) | **Throws** `SQLITE_ERROR: unterminated string` |
| New engine `CREATE INDEX … USING fts` (`@tursodatabase/database` 0.8.3) | ✖ *"index method is an experimental feature. Enable with --experimental-index-method"* |
| FTS5 on the new engine | ✖ *"no such module: fts5"* |

**Critical migration finding:**

| Drizzle Kit operation | Result |
|---|---|
| `drizzle-kit push`, no filter | Proposes **dropping** `shots_fts` and all 4 shadow tables (data loss prompt) |
| `drizzle-kit push` with `tablesFilter: ['!shots_fts*']` | Keeps the FTS tables, **but rebuilt `shots`** (DROP + recreate) for a cosmetic DDL difference, which **silently deleted all three triggers**. New rows were no longer indexed, and `integrity-check` still returned "ok" |
| `drizzle-kit generate` + `--custom` SQL migration (FTS table + triggers) + `drizzle-kit migrate` on a fresh DB | ✔ all objects created; new rows indexed; re-`generate` with no schema change is a no-op and does not touch FTS objects |

**Decision.**
1. Use **FTS5 on libSQL** through a `SearchService`. The Tantivy index is rejected (experimental), and the new engine is not used for the app DB.
2. FTS objects (virtual table and triggers) live in **hand-written custom migrations**. Drizzle schema files never declare them.
3. **`drizzle-kit push` is forbidden** against any shared or persistent database (dev, preview, prod). Only `generate` + `migrate`.
4. **Any migration that rebuilds a table carrying FTS triggers must recreate those triggers in the same migration.** A CI test asserts that the triggers exist and that a freshly inserted row is searchable after migrations run.
5. User queries are **tokenised and escaped by the app** (e.g. each term quoted, with an optional trailing `*`) before reaching `MATCH`. Raw user strings are never passed.
6. Ranking: `bm25(shots_fts, 10.0, 1.0, 3.0)` (title, description, tags), combined with popularity in SQL for the "Popular" sort.

**Consequences.** Raw SQL is limited to the custom migrations and the `SearchService` query. This is documented and justified under the "no uncontrolled raw SQL" rule. Remote p95 latency is re-measured once Turso Cloud is available.

---

## ADR-002: Foreign keys, atomic writes and the DB client factory (SPIKE-02, P02-08)

**Status:** Accepted (local). Remote verification pending (B-15).

**Evidence** (`spikes/spike-02-tx-fk/result-local.json`):

| Check | Result (local file mode) |
|---|---|
| `PRAGMA foreign_keys` on a fresh `@libsql/client` connection | **1 (ON by default)**. This differs from Turso's server documentation, which says off by default ([F-01](../DECISION_LOG.md)) |
| Orphan insert (unknown `author_id`) | Rejected: `FOREIGN KEY constraint failed` (plain statement and inside `batch()`) |
| After reconnect | Still ON |
| `ON DELETE CASCADE` (delete shot → likes removed) | ✔ (0 likes remaining) |
| Drizzle `db.batch([insert like, counter+1])`, duplicate like | Whole batch rejected; counter unchanged (1) |
| Batch with the counter update **first**, failing insert second | Counter update rolled back (still 1). **Batch is atomic** ([F-03](../DECISION_LOG.md), [F-05](../DECISION_LOG.md)) |
| Drizzle `db.transaction()` that throws | Rolled back (title unchanged) |
| `CHECK (likes_count >= 0)` | Enforced |

**Decision.**
1. **DB client factory** (`src/server/db/client.ts`, `server-only`): create one client per process, then `await client.execute('PRAGMA foreign_keys = ON')` **before first use, never inside a batch**. At startup, assert `PRAGMA foreign_keys` = 1 and fail fast otherwise.
2. **Multi-statement writes use `db.batch()`**, e.g. like + counter, follow + counters, collection item + saves count. Interactive `db.transaction()` is allowed only when a later statement depends on an earlier read, and must stay short because of the 5-second write-lock timeout (F-05).
3. Integrity is **declared in the schema**: FKs with explicit `ON DELETE`, composite primary keys for join tables, CHECK constraints for counters and enums. Integration test **T-11** runs the orphan, duplicate and cascade checks against every environment's connection mode, remote included.
4. Until remote enforcement is proven, a **nightly orphan-check job** (D-11 cron) reports orphans as a safety net.

---

## ADR-003: Authentication with Better Auth (email OTP), Drizzle adapter on libSQL (SPIKE-03, P02-09)

**Status:** Accepted for the email-OTP path. **Google sign-in untested** (B-16: OAuth client not created). Implements **D-03 / D-04**.

**Setup** (`spikes/spike-03-auth/`): Next.js 16.4.3 App Router, Node runtime, `better-auth` 1.7.14 with `drizzleAdapter(db, { provider: 'sqlite', schema })`, `emailOTP` plugin (`otpLength 6`, `expiresIn 600`, `allowedAttempts 5`, `storeOTP: 'hashed'`), `nextCookies()`, `rateLimit.storage: 'database'`, email+password disabled.

The auth tables (`user`, `session`, `account`, `verification`, `rate_limit`) were written as a Drizzle schema derived from `getAuthTables()`, using snake_case columns and `timestamp_ms` dates. They were generated and migrated with **Drizzle Kit** (5 tables, 4 indexes, 2 FKs). `tsc --noEmit` and `next build` succeeded.

**Evidence** (`result-flow-norl.json`, plus `result-flow.json` with the limiter on):

| Check | Result |
|---|---|
| Anonymous session in a Server Component | `null` |
| Send OTP | 200; 6-digit code |
| OTP stored hashed (DB value ≠ code) | ✔ |
| 5 wrong codes, then a 6th | 400 ×5 `INVALID_OTP`, then **403 `TOO_MANY_ATTEMPTS`**. The original code is then also rejected |
| Fresh code, then sign-in | **200**; user created with `email_verified = 1` |
| Session cookie | `better-auth.session_token`, **HttpOnly; SameSite=Lax; Max-Age=604800 (7 d)**. `Secure` is absent only because the test ran over plain HTTP on localhost. Production must use an https `baseURL`; P09 verifies |
| Session readable in a Server Component (`auth.api.getSession({ headers })`) | ✔ |
| Reuse of a consumed code | 400 |
| POST from a foreign `Origin` | **403** (`Invalid origin`), built-in CSRF/origin protection |
| Sign-out, then old cookie | 200, then session `null` |
| Database-backed rate limiter | ✔ rows in `rate_limit`; **3 requests per 60 s** on `/email-otp/send-verification-otp` and `/sign-in/email-otp`, then 429 |
| Rate-limit key | `0000:0000:…\|path`: every local request mapped to one IP key |

**Decision.**
1. **Better Auth is confirmed** for email OTP sessions on Drizzle/libSQL (D-04).
2. Configuration baseline: hashed OTP, 6 digits, 10-minute expiry, 5 attempts, database rate limiting, password auth off (D-03), `nextCookies()`, Node runtime for the auth route.
3. **The client-IP source must be configured** for the production host (trusted proxy header such as `x-forwarded-for` on Vercel). Otherwise every user shares one rate-limit bucket. P09-03 includes a test for this.
4. The OTP `sendVerificationOTP` hook calls the `EmailService` (Resend, D-08). OTPs are **never logged** (the spike logged them to a file only as a stand-in).
5. **Turnstile (D-20)** guards the send-OTP form on top of the rate limit.
6. **Google sign-in** is re-tested when B-16 is resolved; the ADR is amended then.

---

## ADR-004: Image processing with sharp in a Node-runtime handler (SPIKE-04, local half, P02-10)

**Status:** Accepted for the processing half (D-15). **The R2 presigned-upload half is blocked** (D-10 account / B-11).

**Evidence** (`spikes/spike-04-media/result-local.json`): `sharp` 0.35.5, `sharp.concurrency(1)` to approximate a single-vCPU function. A synthetic **55 MB PNG, 4800×3600** (worse than the 20 MB target):

| Output | Size |
|---|---|
| feed-400.webp (4:3 cover crop) | 6 KB |
| feed-800.webp | 41 KB |
| feed-1200.webp | 137 KB |
| detail-1600.webp | 376 KB |
| Dominant colour (`stats().dominant`) and 7-colour palette (k-means on 64×64) | ✔ |
| **Total time** | **~2.0 s** |
| **Peak RSS** | **~316 MB** (start 156 MB) |
| Non-image buffer | Rejected (`unsupported image format`) |
| `limitInputPixels` cap | Enforced |

(Synthetic noise compresses poorly, so real artwork will generally produce smaller derivatives.)

**Decision.**
1. Derivatives are produced at upload completion in a **Node-runtime Route Handler**, or in `after()` (D-11): 400/800/1200 4:3 crops + 1600 detail, WebP; dominant colour; palette stored as hex + Lab (for R3 colour search).
2. Limits: input ≤ 20 MB (checked server-side after the presigned PUT; F-08), `limitInputPixels` 50 MP, MIME sniffed by sharp, not by the client.
3. Size the function at ≥ 1 GB memory and a ≥ 30 s timeout, giving headroom over 316 MB / 2 s.
4. Remaining for the R2 half: presigned PUT, CORS, and post-upload size verification (needs the account).

---

## ADR-005: Deployment build (SPIKE-05, P02-11)

**Status:** Not run. Blocked on the host account (D-09 Vercel / B-10). Partial evidence: `next build` of the SPIKE-03 app (Next 16.4.3 + `@libsql/client` + Better Auth, with `serverExternalPackages: ['@libsql/client', 'libsql']`) succeeds locally on Windows.
