# Data Flow Diagrams

| Field | Value |
|---|---|
| Task | P02-06 (feeds G2 via P02-13) |
| Version | 1.0, for the architecture review (T-04) |
| Date | 2026-11-13 |
| Inputs | [FRONTEND_ARCHITECTURE](FRONTEND_ARCHITECTURE.md) · [BACKEND_ARCHITECTURE](BACKEND_ARCHITECTURE.md) · [SECURITY_ARCHITECTURE](SECURITY_ARCHITECTURE.md) · ADR-001…004 |
| Validation | Every diagram is parsed with the Mermaid parser (T-04 check) |

## Conventions

- **Trust boundaries** are drawn as `box` groups. The boundary IDs are defined in [SECURITY_ARCHITECTURE §1](SECURITY_ARCHITECTURE.md#1-scope-assets-and-trust-boundaries):
  - **TB-1** separates the untrusted browser from the app.
  - **TB-2** separates the app from its data stores (Turso, R2).
  - **TB-3** separates the app from third parties.
  - **TB-4** separates the operator workstation from production.
- A note `TB-n` on an arrow marks the place where the data crosses that boundary and is validated.
- "App" means the Next.js functions on Vercel: proxy, Server Components, Server Actions and Route Handlers, plus the module layer.
- Arrows with `-->>` are responses.

| # | Flow | Release | Requirements |
|---|---|---|---|
| DF-1 | Feed read and infinite scroll | R1 | FR-21…FR-25, BR-32…BR-37 |
| DF-2 | Shot detail | R1 | FR-37…FR-42, BR-42, BR-43 |
| DF-3 | Sign-in with an email code, then onboarding | R1 | FR-10…FR-12, FR-17, FR-20 |
| DF-4 | Continue with Google | R1 | FR-13, BR-11 |
| DF-5 | Like / unlike | R1 | FR-45, BR-46, BR-47 |
| DF-6 | View counting (beacon, de-dup, aggregate) | R1 | FR-29, BR-29…BR-31 |
| DF-7 | Upload to R2 and derivative processing | R2 (designed now) | FR-61…FR-64, BR-61, BR-66 |
| DF-8 | Search indexing and query | R1 | FR-31…FR-34, BR-38, BR-39 |
| DF-9 | Scheduled jobs and operator scripts | R1 | FR-09, FR-27, BR-27, BR-79 |

## DF-1 Feed read and infinite scroll

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as Browser
  end
  box Vercel app (trusted)
    participant P as proxy.ts
    participant RSC as Feed page (Server Component)
    participant FS as feed service (use cache, tag feed)
    participant SA as loadMore Server Action
  end
  box TB-2 data stores
    participant DB as Turso
    participant R2 as R2 media domain
  end
  B->>P: GET /shots/popular?timeframe=week
  Note over B,P: TB-1: path and query parsed with Zod, unknown category gives 404
  P->>RSC: request + CSP nonce + request id
  RSC->>FS: list(sort, category, tag, timeframe, no cursor)
  alt data cache hit (life 60 s)
    FS-->>RSC: 24 card DTOs + signed nextCursor
  else miss
    FS->>DB: one batch of selects (eligible shots, authors, counts)
    Note over FS,DB: TB-2: libSQL over HTTPS with token
    DB-->>FS: rows
    FS-->>RSC: card DTOs + nextCursor (HMAC signed)
  end
  RSC->>DB: viewer like state for these 24 IDs (uncached, only if signed in)
  RSC-->>B: HTML stream (cards, LikeButton islands)
  B->>R2: GET feed-400/800 webp derivatives (custom loader)
  B->>SA: loadMore(feedKey, cursor) when the sentinel is visible
  Note over B,SA: TB-1: origin check, cursor signature verified, invalid gives INVALID_CURSOR
  SA->>FS: list(..., cursor)
  FS-->>SA: next 24 DTOs + nextCursor or null
  SA-->>B: ActionResult with items, client drops already rendered IDs
```

## DF-2 Shot detail

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as Browser
  end
  box Vercel app (trusted)
    participant RSC as Shot page (Server Component)
    participant SS as shots service
    participant FD as feed service (moreBy, related)
    participant LS as likes service
  end
  box TB-2 data stores
    participant DB as Turso
    participant R2 as R2 media domain
  end
  B->>RSC: GET /shots/123-old-slug
  Note over B,RSC: TB-1: id must be numeric, else 404
  RSC->>SS: getDetail(123)
  SS->>DB: batch: shot, author, blocks, tags, colours (cache tag shot:123)
  DB-->>SS: rows
  alt not eligible (hidden, deleted, author suspended)
    SS-->>RSC: NOT_FOUND
    RSC-->>B: 404 page
  else slug differs from canonical
    RSC-->>B: 308 to /shots/123-canonical-slug
  else ok
    RSC->>FD: moreBy(123) and related(123) (cached)
    RSC->>LS: isLiked(viewer, 123) (uncached, signed in only)
    RSC-->>B: HTML (detail, action rail, Share and Details dialogs)
    B->>R2: GET detail-1600 webp (priority)
  end
```

## DF-3 Sign-in with an email code, then onboarding

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as Browser
  end
  box Vercel app (trusted)
    participant BA as Better Auth route /api/auth
    participant RL as Rate limiter (DB backed)
    participant OB as Onboarding Server Action
  end
  box TB-2 data store
    participant DB as Turso
  end
  box TB-3 third parties
    participant TS as Turnstile
    participant EM as Resend
  end
  B->>BA: POST send-verification-otp (email, Turnstile token)
  Note over B,BA: TB-1: origin check, email normalised (BR-10)
  BA->>RL: RL-AUTH-SEND by email and by IP
  alt over limit
    RL-->>B: 429 with Retry-After, nothing sent
  else allowed
    BA->>TS: siteverify(token, ip, hostname)
    Note over BA,TS: TB-3: fail closed if unreachable
    TS-->>BA: success
    BA->>DB: store hashed code, expires in 10 min
    BA-->>B: 200 identical response for known and unknown emails
    BA->>EM: send code email (after response)
  end
  B->>BA: POST sign-in email-otp (email, code)
  BA->>RL: RL-AUTH-VERIFY by IP, 5 attempts per code
  BA->>DB: compare hash, consume code, create user if new, create session
  BA-->>B: Set-Cookie session (HttpOnly, Secure, SameSite Lax, 30 d)
  B->>OB: completeOnboarding(username, displayName) if no username yet
  Note over B,OB: TB-1: requirePending, Zod BR-18, reserved list BR-20, RL-ACCOUNT
  OB->>DB: insert profile (unique index decides races)
  OB-->>B: ok, redirect to validated returnTo (BR-14)
```

## DF-4 Continue with Google

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as Browser
  end
  box Vercel app (trusted)
    participant BA as Better Auth route /api/auth
  end
  box TB-2 data store
    participant DB as Turso
  end
  box TB-3 third party
    participant G as Google Identity
  end
  B->>BA: POST sign-in social (provider google, callbackURL)
  Note over B,BA: TB-1: RL-AUTH-OAUTH, callbackURL must be same origin
  BA->>DB: store state and PKCE verifier
  BA-->>B: redirect to Google with state and code_challenge
  B->>G: consent
  G-->>B: redirect to /api/auth/callback/google with code and state
  B->>BA: GET callback
  BA->>DB: load and delete state
  BA->>G: exchange code with PKCE verifier
  Note over BA,G: TB-3: ID token signature, audience and email_verified checked
  G-->>BA: tokens and verified email
  BA->>DB: link to existing user by email or create user, create session
  BA-->>B: Set-Cookie session, redirect to returnTo or /onboarding
```

## DF-5 Like / unlike

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as LikeButton (browser)
  end
  box Vercel app (trusted)
    participant SA as toggleLike Server Action
    participant LS as likes service
    participant RL as Rate limiter (Turso table)
  end
  box TB-2 data store
    participant DB as Turso
  end
  B->>B: useOptimistic flips icon and count within 100 ms
  B->>SA: toggleLike(shotId, liked true or false)
  Note over B,SA: TB-1: origin check, Zod, identity from session only
  SA->>LS: setLike(viewer, shotId, liked)
  LS->>LS: requireMember, shot eligible else 404, not own shot else 403
  LS->>RL: RL-SOCIAL for viewer
  alt over limit
    RL-->>B: ActionResult RATE_LIMITED with retryAfter, UI rolls back and toasts
  else allowed
    LS->>DB: batch: insert like on conflict do nothing, guarded likes_count change
    Note over LS,DB: TB-2: one atomic batch (ADR-002)
    DB-->>LS: new likes_count
    LS-->>SA: liked state and likesCount
    SA->>SA: updateTag shot counts tag
    SA-->>B: ActionResult ok, server count replaces optimistic count
  end
```

## DF-6 View counting

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as ViewBeacon (browser)
  end
  box Vercel app (trusted)
    participant RH as POST /api/views
    participant VS as views service (in after)
    participant RL as Rate limiter (Turso table)
  end
  box TB-2 data store
    participant DB as Turso
  end
  B->>RH: sendBeacon shotId after hydration
  Note over B,RH: TB-1: Zod shotId, UA deny-list, raw IP never stored
  RH-->>B: 204 immediately
  RH->>VS: after(): record(shotId, viewer key)
  VS->>RL: RL-VIEW by IP, excess dropped silently
  VS->>VS: skip if viewer is author or suspended
  VS->>VS: viewer key = user id, or HMAC(ip, ua) with daily secret
  VS->>DB: batch: insert view_dedup(key, shot, utc day) on conflict do nothing, then upsert shot_view_daily and views_count only if inserted
  Note over VS,DB: TB-2: one atomic batch, failure logged without PII and dropped
```

## DF-7 Upload to R2 and derivative processing (R2 release)

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as Composer (browser)
  end
  box Vercel app (trusted)
    participant PR as POST /api/uploads/presign
    participant FN as POST /api/uploads/id/finalise
    participant MS as media service (sharp, Node runtime)
  end
  box TB-2 data stores
    participant DB as Turso
    participant R2 as R2 S3 API
  end
  B->>PR: presign(fileName, contentType, size)
  Note over B,PR: TB-1: requireMember, RL-UPLOAD, quota BR-66, type allow-list
  PR->>DB: insert media row state pending, server-chosen key
  PR->>R2: create presigned PUT, 5 min, fixed content type
  PR-->>B: upload URL and media id
  B->>R2: PUT file bytes directly
  Note over B,R2: TB-1 to TB-2: CORS allows app origin only, size not enforceable here (F-08)
  B->>FN: finalise(media id)
  FN->>MS: finalise(viewer, media id)
  MS->>DB: load row, check owner and state
  MS->>R2: HEAD object, size at most 20 MB else delete
  MS->>R2: GET object
  MS->>MS: magic bytes JPEG PNG WebP only, limitInputPixels 50 MP, re-encode strips metadata
  MS->>R2: PUT feed-400, 800, 1200 and detail-1600 webp (immutable keys)
  MS->>DB: batch: media ready with palette and dominant colour
  MS-->>B: ready with derivative URLs
  Note over MS,R2: on any failure the object is deleted and the row marked rejected
```

## DF-8 Search indexing and query

```mermaid
sequenceDiagram
  autonumber
  box TB-1 untrusted
    participant B as Browser
  end
  box Vercel app (trusted)
    participant W as Writer (seed script R1, composer R2)
    participant RSC as Search page
    participant SS as search service
  end
  box TB-2 data store
    participant DB as Turso shots and shots_fts
  end
  W->>DB: insert or update shots, shot_tags
  Note over W,DB: FTS5 triggers in a custom migration keep shots_fts in sync (ADR-001)
  DB->>DB: trigger writes title, description, tags into shots_fts
  B->>RSC: GET /search/Fintech%20App
  Note over B,RSC: TB-1: normalise term (BR-38), non-canonical form gets 308
  RSC->>SS: shots(term, cursor)
  SS->>SS: tokenise, quote each term, prefix star on last token of 2 or more chars
  SS->>DB: MATCH with bound parameter, bm25 weights, eligibility filter, popularity blend
  DB-->>SS: ranked rows
  SS-->>RSC: DTOs or empty with related tags
  RSC-->>B: HTML, noindex when there are no results
```

## DF-9 Scheduled jobs and operator scripts

```mermaid
sequenceDiagram
  autonumber
  box TB-4 operator workstation
    participant OP as Operator script (moderate, delete-account, seed)
  end
  box Vercel platform
    participant CR as Vercel Cron
  end
  box Vercel app (trusted)
    participant J as /api/cron/job
    participant IR as /api/internal/revalidate
  end
  box TB-2 data store
    participant DB as Turso
  end
  CR->>J: GET with Bearer CRON_SECRET
  Note over CR,J: secret compared in constant time, job name allow-list
  J->>DB: chunked statements: popularity, cleanup BR-79, counter reconcile BR-27, orphan check
  J-->>CR: 200 with counts, Sentry cron check-in
  OP->>DB: service call with actor and reason, change plus audit row in one batch
  Note over OP,DB: TB-4: separate prod credentials, explicit env flag, actor role checked
  OP->>IR: POST tags with Bearer INTERNAL_SECRET
  IR-->>OP: 204, cache tags invalidated
```
