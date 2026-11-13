# API Response Conventions

| Field | Value |
|---|---|
| Task | P04-01 (feeds G2) |
| Version | 1.0, for the API spec review (T-13) |
| Date | 2026-11-13 |
| Inputs | [BACKEND_ARCHITECTURE §4](../02-architecture/BACKEND_ARCHITECTURE.md#4-validation-and-error-model) · [ADR-007](../02-architecture/ARCHITECTURE_DECISIONS.md#adr-007-server-actions-for-internal-mutations-route-handlers-for-url-contracts) · [BUSINESS_RULES](../01-requirements/BUSINESS_RULES.md) BR-35, BR-46, BR-76, BR-77 · D-22 |
| Applies to | Every Route Handler under `/api/*` that we write, and every Server Action. Better Auth's own routes keep the library's formats ([§8](#8-better-auth-routes)) |

## 1. Principles

1. **One error vocabulary.** Route Handlers and Server Actions use the same `ErrorCode` list (§3). Only the transport differs:
   - A Route Handler sends an HTTP status plus a problem-details body.
   - A Server Action returns an `ActionResult`.
2. **The code is the contract.** Clients branch on `code`, never on `title`, `detail` or the HTTP status alone. Human-readable text may change without a version bump.
3. **No leaks.** Error bodies never contain stack traces, SQL, internal IDs of other users, emails or secrets. An unexpected failure is always `INTERNAL` with a `requestId`.
4. **JSON only** for our Route Handlers: `application/json` for success, `application/problem+json` for errors. Field names are `camelCase`, timestamps are ISO 8601 UTC strings, and IDs of numeric entities are JSON numbers.

## 2. Success responses

### 2.1 Route Handlers

| Kind | Status | Body |
|---|---|---|
| Single resource | 200 | `{ "data": { … } }` |
| Created | 201 | `{ "data": { … } }` plus a `Location` header |
| List | 200 | `{ "data": [ … ], "page": { "nextCursor": "…" \| null, "limit": 24 } }` |
| Accepted, nothing to return (view beacon, revalidate) | 204 | empty |

Every response carries `x-request-id`. Every response sends `Cache-Control: no-store`, unless an endpoint's spec says otherwise (none in R1).

### 2.2 Server Actions

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message?: string; fields?: Record<string, string>; retryAfter?: number; requestId?: string };
```

- `message` is safe to show to the user (already localised copy from the module).
- `fields` maps form field names to an error message, for `VALIDATION`, `USERNAME_TAKEN` and `USERNAME_RESERVED`.
- `retryAfter` is in seconds and is present only with `RATE_LIMITED`.
- Actions **never throw to the client** for expected errors. Only redirects (`redirect()`) and `notFound()` use Next.js control-flow exceptions.

## 3. Error vocabulary

### 3.1 Problem-details body (Route Handlers)

Based on RFC 9457:

```json
{
  "type": "https://{app-domain}/problems/rate-limited",
  "title": "Too many requests",
  "status": 429,
  "code": "RATE_LIMITED",
  "detail": "Try again in 42 seconds.",
  "retryAfter": 42,
  "fields": { "username": "This username is taken" },
  "requestId": "01JC…"
}
```

`type` is `https://<app-domain>/problems/<code in kebab case>`. The domain is a placeholder until the production domain is chosen (P12). `fields` and `retryAfter` appear only when they are relevant.

### 3.2 Error classes → HTTP status → code

Every error class has exactly one HTTP status. Codes are grouped by class (P04-01 acceptance criterion 1).

| Class | HTTP status | Codes | Meaning / when | Rules |
|---|---|---|---|---|
| Validation | **400** | `VALIDATION` | Input fails the Zod schema (shape, type, length) | D-22 |
| | 400 | `INVALID_CURSOR` | Cursor signature, encoding or feed key does not match | BR-35 |
| | 400 | `INVALID_OTP` | Wrong sign-in code; the message states the attempts left | BR-04 |
| | 400 | `OTP_EXPIRED` | Code older than 10 minutes or already used | BR-02 |
| Unauthenticated | **401** | `UNAUTHENTICATED` | No valid session for a member-only mutation | BR-17 |
| Forbidden | **403** | `FORBIDDEN` | Visible resource, but the action is not allowed for this actor | USER_ROLES §3 |
| | 403 | `ONBOARDING_REQUIRED` | Signed in, but onboarding is not complete | BR-16 |
| | 403 | `TOO_MANY_ATTEMPTS` | 5th wrong code; the code is now invalid and a new one must be requested | BR-04 |
| | 403 | `ACCOUNT_SUSPENDED` | The actor's account is suspended (sessions are revoked as well; this is the fallback) | BR-25 |
| | 403 | `CANNOT_LIKE_OWN` | Liking one's own shot | BR-46 |
| | 403 | `CANNOT_FOLLOW_SELF` (R2) | Following oneself | R2 rule |
| | 403 | `COMMENTS_DISABLED` (R2) | The author has turned comments off | R2 rule |
| | 403 | `ORIGIN_REJECTED` | Cross-origin request to an origin-checked endpoint | SECURITY §5 |
| Not found | **404** | `NOT_FOUND` | Missing, hidden, ineligible or not visible to this actor. Never distinguishes "hidden" from "missing" | BR-37, SECURITY §3 |
| Conflict | **409** | `CONFLICT` | State changed between read and write (R2 transactions, e.g. invitation already accepted) | BACKEND §5.2 |
| Business rule | **422** | `USERNAME_TAKEN` | Username claimed by someone else (including a lost race on the unique index) | BR-19 |
| | 422 | `USERNAME_RESERVED` | Reserved word or `*-jobs-in-*` | BR-20 |
| | 422 | `QUOTA_EXCEEDED` (R2) | Upload, publish or job quota reached | BR-66, BR-73 |
| | 422 | `UNSUPPORTED_MEDIA` (R2) | File is not JPEG, PNG or WebP by magic bytes, or exceeds the size or pixel limit | BR-61 |
| Rate limited | **429** | `RATE_LIMITED` | Over a rate-limit class; no side effect. `Retry-After` header + `retryAfter` | BR-76, BR-77 |
| Internal | **500** | `INTERNAL` | Any unexpected failure; logged with `requestId`, reported to Sentry | BACKEND §8 |
| Dependency unavailable | **503** | `EMAIL_UNAVAILABLE` | Email provider failed; no code was created | FRONTEND §8 |
| | 503 | `BOT_CHECK_UNAVAILABLE` | Turnstile verification could not be completed (fail closed) | SECURITY §4 |
| | 503 | `SERVICE_UNAVAILABLE` | Database or storage unavailable (health check, degraded mode) | FR-07 |

Rules for adding codes:
- A new code needs a row here (class, status, rule) before it is used. The `ErrorCode` TypeScript union is generated from this table's code list in P09-01, and a unit test compares the two.
- `422` is used **only** for business-rule rejections of well-formed input. Malformed input is `400`.

### 3.3 Same vocabulary in Server Actions

A Server Action returns `{ ok: false, code }` with the **same code** a Route Handler would use. The HTTP status column then serves only as the class: the response itself is a normal 200 RSC payload (ADR-007, review item AR-1). Pages map codes as follows:

- `NOT_FOUND` → `notFound()`.
- `UNAUTHENTICATED` → redirect to `/login?returnTo=…`.
- `ONBOARDING_REQUIRED` → redirect to `/onboarding?returnTo=…`.

## 4. Pagination, filtering and sorting

### 4.1 Cursor pagination (BR-35)

| Parameter | Type | Default | Rules |
|---|---|---|---|
| `cursor` | opaque string | absent (first page) | base64url of `{ v, feedKey, after: [sortValue, id] }` + HMAC-SHA-256 (`CURSOR_HMAC_SECRET`). A cursor is valid only for the feed key (sort + filters) that produced it. Any mismatch → `400 INVALID_CURSOR` |
| `limit` | integer | **24** | 1–48; out of range → `400 VALIDATION` |

Response: `page.nextCursor` is `null` on the last page. There is no total count (it is expensive on large feeds and not needed by the UI). Ordering is always total, because the tie-break is `id` desc (BR-32…BR-34), so keyset pagination is stable.

### 4.2 Parameter naming (one convention, BR-35)

- Query parameters are lower-case single words or `camelCase`: `sort`, `timeframe`, `tag`, `category`, `cursor`, `limit`; R2 `q`, `specialty`, `location`, `remote`, `type`; R3 `color`.
- **Enumerations** use fixed lower-case values:
  - `sort=popular|recent`
  - `timeframe=now|week|month|year|ever` (BR-34)
  - `category` = one of the 8 slugs (BR-36)
- **Multi-value filters** repeat the parameter (`specialty=ui&specialty=ux`), never comma lists.
- Pages and Server Actions use the **same names**. The `loadMore` action receives `{ feedKey, cursor, limit? }`, where `feedKey` is a canonical serialisation of these parameters.
- Unknown parameters are ignored. Invalid values of a known parameter → `400 VALIDATION` for APIs, or 404 for page paths (unknown category) per BR-36.

## 5. Idempotency and toggles

| Operation | Contract | Why |
|---|---|---|
| Like / unlike (R1) | **Set semantics**, not a toggle. `toggleLike({ shotId, liked: true \| false })` sets the desired state and returns `{ liked, likesCount }`. Repeating the call is a no-op (`ON CONFLICT DO NOTHING` / delete of a missing row) | BR-46; safe retries and double clicks |
| Follow, save, comment-like (R2) | Same set semantics. As Route Handlers (if ever exposed): `PUT /…/like` = on, `DELETE /…/like` = off, both 200 with the resulting state | Consistent with R1 |
| View beacon | Always 204. De-duplication happens server-side per viewer per day (BR-30) | Beacons may be resent by the browser |
| Create operations (R2: shot, job, comment) | Client sends an `idempotencyKey` (UUID v4) for creates that the user might double-submit. The server stores `(actor, key)` for 24 h and returns the first result for a repeat | Network retries on slow connections |
| Onboarding | Naturally idempotent for the same name: a repeat by the same user returns ok. Another user's claim → `USERNAME_TAKEN` | BR-19 |

## 6. Rate-limit signalling (BR-77)

- **Over the limit:** `429`, `Retry-After: <seconds>` (integer, rounded up), and a problem body with `code: "RATE_LIMITED"` and `retryAfter`. No side effect.
- **Under the limit:** no rate-limit headers in R1. The IETF `RateLimit` header fields are still a draft, and exposing the remaining budget helps attackers tune abuse. This can be revisited in R3.
- **Server Actions:** `{ ok: false, code: "RATE_LIMITED", retryAfter }`.
- **View beacon (`RL-VIEW`):** excess requests get `204`, not 429 (BR-76), so the browser never retries.
- **Better Auth routes:** the library sends its own `429` with `X-Retry-After`. The auth client wrapper normalises this to `retryAfter` for the UI (§8).

## 7. Headers

| Header | Where | Value |
|---|---|---|
| `x-request-id` | every response | Set in `proxy.ts`; echoed in error bodies |
| `Cache-Control` | `/api/*` | `no-store` |
| `Content-Type` | JSON | `application/json; charset=utf-8`, errors `application/problem+json` |
| `Retry-After` | 429 | seconds |
| `Location` | 201, 308 | canonical URL |
| Security headers | every response | [SECURITY_ARCHITECTURE §7](../02-architecture/SECURITY_ARCHITECTURE.md#7-transport-headers-and-csp-nfr-22) |

## 8. Better Auth routes

`/api/auth/*` is served by Better Auth (ADR-003). Its request and response formats are the library's, and they are **not** rewritten, so library upgrades stay safe.

- The thin client module `src/modules/auth/client.ts` maps library error codes to our vocabulary before the UI sees them:

  | Library code | Our code |
  |---|---|
  | `INVALID_OTP` | `INVALID_OTP` |
  | `TOO_MANY_ATTEMPTS` | `TOO_MANY_ATTEMPTS` |
  | `OTP_EXPIRED` | `OTP_EXPIRED` |
  | 429 | `RATE_LIMITED` |
  | Origin failure | `ORIGIN_REJECTED` |
  | anything else | `INTERNAL` |

- Our own `before` hooks (Turnstile, per-email limits) throw library `APIError`s whose `code` is one of our codes (`BOT_CHECK_UNAVAILABLE`, `RATE_LIMITED`), so they pass through the same mapping.
- The exact library code names are verified against the pinned version in P09-03. The spike observed `INVALID_OTP` and `TOO_MANY_ATTEMPTS`.

All codes in this mapping are rows of the §3.2 table.

## 9. Versioning

- There is no `/v1` prefix in R1. The only consumers are our own pages and Server Actions, deployed atomically with the server.
- A public API, if one is ever added (Later), gets `/api/v1/` and its own stability policy (new decision).
- Breaking changes to a Route Handler used by browsers that may hold an old bundle (view beacon, uploads) must stay backward compatible for one deploy cycle.

## 10. Self-check (acceptance criteria)

| Criterion | Evidence |
|---|---|
| Every error class maps to an HTTP status and a code | §3.2: 9 classes, each with one status and ≥ 1 code (24 codes in total, including the auth codes mapped in §8) |
| Server Actions and Route Handlers share one error vocabulary | §2.2 and §3.3 use `ErrorCode` from §3.2; §8 maps library codes into it |
