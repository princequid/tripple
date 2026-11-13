# Frontend Architecture

| Field | Value |
|---|---|
| Task | P02-03 (feeds G2 via P02-13) |
| Version | 1.0, for the architecture review (T-04) |
| Date | 2026-11-13 |
| Inputs | [SYSTEM_ARCHITECTURE](SYSTEM_ARCHITECTURE.md) · [INFORMATION_ARCHITECTURE §6](../06-ui-ux/INFORMATION_ARCHITECTURE.md) (URL scheme) · [WIREFRAME_SPECIFICATION](../06-ui-ux/WIREFRAME_SPECIFICATION.md) · [REQUIREMENTS](../01-requirements/REQUIREMENTS_SPECIFICATION.md) · [BUSINESS_RULES](../01-requirements/BUSINESS_RULES.md) · D-15, D-21, D-22, A-12 |
| Companions | [BACKEND_ARCHITECTURE](BACKEND_ARCHITECTURE.md) · [SECURITY_ARCHITECTURE](SECURITY_ARCHITECTURE.md) · [DATA_FLOW_DIAGRAM](DATA_FLOW_DIAGRAM.md) |

> **Version note.** Framework APIs named here (`proxy.ts`, `"use cache"`, `cacheTag`, `cacheLife`, `updateTag`, `revalidateTag`, `after()`) are the Next.js 16 names. Exact signatures are re-checked against the version pinned at P08 (TECHNOLOGY_STACK §1). If an API differs, the mechanism stays and only the call changes.

## 1. Principles

1. **Server Components by default.** A component becomes a Client Component only for one of the reasons in §5, and the reason is written next to it.
2. **No client data layer in R1** (D-21). Reads happen in Server Components; writes go through Server Actions; optimistic UI uses `useOptimistic`; lists use one small infinite-scroll hook.
3. **Progressive enhancement for core paths.** Feeds, shot detail, search, tags, profiles and legal pages work without JavaScript: links, `<form method="get">`, and a "Load more" link (FR-23). Like and sign-in need JavaScript (the OTP and Turnstile steps), and say so when it is off.
4. **Visual values come only from `design-system/`** (A-12, §6). Components never hard-code colours, shadows, radii or blur.
5. **One URL = one state.** Filters, sort, timeframe, tag and pagination start position are in the URL (path or query). Modals that represent content (Share, Details) are client state, not routes, in R1.

## 2. Source layout

```
src/
  app/                         App Router (routes only: pages, layouts, route handlers)
    (site)/                    route group: header + footer layout
      page.tsx                 /
      shots/…                  feeds and shot detail
      search/[term]/page.tsx
      tags/…
      (legal)/terms|privacy|cookies|about|contact/page.tsx
      [username]/page.tsx      profile Work tab (see §4 precedence)
      [username]/about/page.tsx
    (auth)/                    route group: minimal centred layout
      login/  signup/  onboarding/
    api/
      auth/[...all]/route.ts   Better Auth handler
      views/route.ts           view beacon
      health/route.ts
      cron/[job]/route.ts      cron entry points (secret-protected)
    not-found.tsx  error.tsx  global-error.tsx  robots.ts
  components/                  shared UI built on design-system classes (no business logic)
  modules/<name>/              server-only services + repositories, actions.ts, schemas.ts, ui/ (module-owned UI)
  server/                      infrastructure: db, auth, storage, email, rate-limit, log, env
  lib/                         isomorphic helpers (formatting BR-28, slug BR-42, cursor types)
proxy.ts                       request proxy (Next 16 name for middleware): nonce + headers + cheap redirects
```

Import rules between these folders are in [BACKEND_ARCHITECTURE §2.3](BACKEND_ARCHITECTURE.md#23-lintable-import-rules).

## 3. R1 route map, rendering mode and data source

All HTML routes are **dynamic** because the CSP nonce is per request ([ADR-006](ARCHITECTURE_DECISIONS.md#adr-006-dynamic-rendering-with-a-tagged-data-cache-nonce-csp)). No R1 route uses static generation or ISR. Speed comes from the tagged **data cache** around service reads (§7.2). "Cache" below means the data-cache entry used by the page, not the HTML.

| # | Route | Layout | Rendering | Data source (service call) | Data cache (tag · life) | Client islands (§5) | FR |
|---|---|---|---|---|---|---|---|
| 1 | `/` | site | Dynamic | `feed.homepage()`: hero copy (static) + popular feed page 1 + category list | `feed:popular` · 60 s | SearchForm, InfiniteFeed, FilterBar, LikeButton (per card) | FR-21 |
| 2 | `/shots/popular` | site | Dynamic | `feed.list({ sort: 'popular', timeframe, tag, cursor })` | `feed:popular` · 60 s | InfiniteFeed, FilterBar, LikeButton | FR-22, FR-25 |
| 3 | `/shots/popular/:category` | site | Dynamic | as #2 with `category` (unknown slug → 404, BR-36) | `feed:popular`, `feed:cat:<slug>` · 60 s | as #2 | FR-22 |
| 4 | `/shots/recent` | site | Dynamic | `feed.list({ sort: 'recent', tag, cursor })` (timeframe ignored, BR-34) | `feed:recent` · 60 s | as #2 | FR-22 |
| 5 | `/shots/recent/:category` | site | Dynamic | as #4 with `category` | `feed:recent`, `feed:cat:<slug>` · 60 s | as #2 | FR-22 |
| 6 | `/shots/:id-:slug` | site | Dynamic | `shots.getDetail(id)` (308 to canonical slug, BR-42; ineligible → 404, BR-37), `feed.moreBy`, `feed.related`, viewer's like state `likes.isLiked(viewer, id)` | `shot:<id>` · 300 s; counts via `shot:<id>:counts` · 30 s; like state **uncached** | LikeButton, ShareModal, DetailsModal, ViewBeacon, CopyLinkButton | FR-37…FR-42 |
| 7 | `/search/:term` | site | Dynamic | `search.shots(term, cursor)` (term normalised, non-canonical → 308, BR-38); related tags when empty | `search` · 120 s | SearchForm, InfiniteFeed, LikeButton | FR-31, FR-32 |
| 8 | `/tags` | site | Dynamic | `search.tagIndex()` (top 50 + A–Z, BR-41) | `tags` · 600 s | none | FR-33 |
| 9 | `/tags/:tag` | site | Dynamic | `search.tagPage(tag, cursor)` (no eligible shots → 404, BR-41) | `tags`, `tag:<slug>` · 120 s | InfiniteFeed, LikeButton | FR-34 |
| 10 | `/:username` | site | Dynamic | `users.getPublicProfile(username)` (suspended/unknown → 404, BR-25) + `shots.listByAuthor(userId, sort, cursor)` | `user:<id>` · 300 s | InfiniteFeed, LikeButton | FR-54 |
| 11 | `/:username/about` | site | Dynamic | `users.getPublicProfile(username)` | `user:<id>` · 300 s | CopyEmailButton (only if a public email exists, BR-78) | FR-55 |
| 12 | `/login` | auth | Dynamic, `no-store` | session check (signed in → redirect to `returnTo`) | none | SignInFlow (email step, Turnstile, OtpInput, ResendButton), GoogleButton | FR-10…FR-13, FR-16, FR-20 |
| 13 | `/signup` | auth | Dynamic, `no-store` | as #12 (sign-up copy) | none | as #12 | FR-10…FR-13 |
| 14 | `/onboarding` | auth | Dynamic, `no-store` | session (visitor → `/login`; onboarded → `returnTo` or `/`), suggested username (BR-21) | none | OnboardingForm (debounced availability check, 300 ms) | FR-17 |
| 15–19 | `/terms`, `/privacy`, `/cookies`, `/about`, `/contact` | site | Dynamic shell; content is MDX compiled at build | files in `src/content/legal/` | n/a (build-time content) | none | FR-04 |
| 20 | *(unmatched)* → `not-found.tsx` | site | Dynamic, status 404 | none (search box + "Go home") | none | SearchForm | FR-05 |
| 21 | *(server error)* → `error.tsx` / `global-error.tsx` | site / bare | Client (Next.js requires error boundaries to be Client Components) | none | none | ErrorBoundary | FR-05 |
| 22 | `/api/health` | — | Route Handler, `no-store` | `platform.health()` (DB `SELECT 1`, storage HEAD with timeout) | none | — | FR-07 |
| 23 | `/api/auth/*` | — | Route Handler (Better Auth `toNextJsHandler`) | `auth` | none | — | FR-10…FR-14 |
| 24 | `/robots.txt` | — | `robots.ts` (static output allowed: no HTML, no nonce) | config | build | — | FR-87 |
| — | `/api/views` | — | Route Handler, `POST`, returns 204 | `views.record()` in `after()` | none | — | FR-29 |
| — | `/api/cron/:job` | — | Route Handler, `GET` with `CRON_SECRET` | `feed.recomputePopularity`, `platform.cleanup`, `platform.reconcileCounters`, `platform.orphanCheck` | none | — | FR-27, BR-27, BR-79 |
| — | `/api/internal/revalidate` | — | Route Handler, `POST` with `INTERNAL_SECRET` | invalidates the given cache tags after operator scripts change data | none | — | FR-09 |

The last three rows are system endpoints that INFORMATION_ARCHITECTURE §6.2 does not list (it lists user-facing URLs). They are added to the API inventory in P04-02. `api` is already reserved, so they cannot collide with usernames.

Every R1 route from INFORMATION_ARCHITECTURE §6.2 (#1–#24) appears above with a rendering mode and a data source (P02-03 acceptance criterion 1). The header and footer (FR-01, FR-02) are in the `(site)` layout. The session read for the header is **uncached** and happens in a small Server Component (`HeaderSession`) wrapped in `<Suspense>`, so the rest of the page can stream before it.

### 3.1 Metadata and SEO (FR-87)

- `generateMetadata` per route uses the same cached service call as the page (one fetch, deduplicated with React `cache()`).
- Canonical URLs follow BR-38 and BR-42. Zero-result search pages and all `(auth)` pages are `noindex`.
- Open Graph images use the shot's 1200 derivative (no runtime OG generation in R1).

## 4. Layouts and route precedence

**Layouts:** root (`<html>`, font, theme attribute, nonce-bearing scripts) → `(site)` (header, footer, toast region) or `(auth)` (centred card, no footer links except legal).

**Root-level profiles (`/:username`, A-14).** Static segments always win over the dynamic `[username]` segment in the App Router. On top of that:

1. Every first-level static segment (`shots`, `search`, `tags`, `login`, `signup`, `onboarding`, `terms`, `privacy`, `cookies`, `about`, `contact`, `api`, plus all R2/R3 segments such as `uploads`, `settings`, `jobs`, `teams`, `admin`, `notifications`, `messages`, `hire`, `services`, `sitemaps`) is in the **reserved-username list** (BUSINESS_RULES §13, BR-20). A test (T-22) fails if a folder under `src/app/(site)` or `src/app/(auth)` has a name missing from that list.
2. `[username]/page.tsx` validates the segment against the username pattern before any DB call. A pattern mismatch → `notFound()` without a query.
3. Names that will become routes later are reserved **now**, so no R1 user can take them.

## 5. Server/Client boundaries

### 5.1 Client components in R1 (with their reason)

| Component | Where | Reason it is a Client Component | Server fallback without JS |
|---|---|---|---|
| `SearchForm` | header, home hero, 404 | Builds the path URL `/search/:term` on submit (BR-38) | `<form method="get" action="/search">`; `/search?q=` 308-redirects to `/search/:term` |
| `MobileNavDrawer` | header < 1024 px | Open/close state, focus trap, Escape, scroll lock | Links rendered in the footer |
| `AvatarMenu` | header (signed in) | Menu button pattern (keyboard, outside click) | Link to the profile |
| `AuthGateModal` | any gated action | Opens a dialog on a gated click with `intent` + `returnTo` (FR-15) | The gated control is a link to `/login?returnTo=…&intent=…` |
| `SignInFlow` (+ `OtpInput`, `ResendButton`, `TurnstileWidget`) | `/login`, `/signup`, auth modal | Multi-step form, 6-cell OTP with paste, 60 s resend countdown (BR-05), Turnstile widget | Message: "Signing in needs JavaScript" |
| `GoogleButton` | auth surfaces | Starts the OAuth redirect through the auth client | A plain link to the auth start endpoint |
| `OnboardingForm` | `/onboarding` | Debounced username availability (300 ms, A-13) and inline errors via `useActionState` | Plain form post; the server validates and re-renders errors |
| `InfiniteFeed` | feeds, search, tag, profile | `IntersectionObserver` to load the next page; de-duplicates IDs (BR-35); focus and announcement management | "Load more" link to `?cursor=…` (FR-23) |
| `FilterBar` (segmented control, timeframe popover, tag input) | feeds | Popover and keyboard handling; the tag input commits on Enter | Every option is a link; tag filter is a GET form |
| `LikeButton` | cards, shot detail | `useOptimistic` toggle within 100 ms (BR-47), rollback and toast | Visitors (and no-JS) get a link to `/login?intent=like&target=<id>`; authors see no control (BR-46) |
| `ShareModal`, `CopyLinkButton` | shot detail | Dialog, Clipboard API with select-text fallback (BR-44) | Intent links (X, Pinterest) are plain links |
| `DetailsModal` | shot detail | Dialog state | Details are also in the page body below the shot on small screens (FR-42) |
| `ViewBeacon` | shot detail | Sends the view beacon after hydration (BR-29) | No view is counted without JS (by design) |
| `CopyEmailButton` | About tab | Clipboard + "Email copied" toast (BR-78) | `mailto:` link |
| `ToastRegion` | `(site)` layout | Live region (`aria-live="polite"`) fed by client events | — |
| `ThemeToggle` (if shipped in R1) | footer | Writes the `data-theme` attribute and a preference cookie | System preference |
| `ErrorBoundary` (`error.tsx`) | route segments | Framework requirement | — |

No other component is a Client Component in R1 (P02-03 acceptance criterion 2). A lint check in P08 lists files with `"use client"` and compares them with this table; additions need a row here.

### 5.2 Boundary rules

- A Client Component receives **serialisable props only**: IDs, display strings, numbers, booleans. Never a DB row, a session object or a function from `src/modules/*/service`.
- Client Components may import **Server Actions** (`actions.ts` files marked `"use server"`) and `src/lib/*`. They may not import `src/server/*` or a module's `service`/`repository` (enforced by `server-only` and lint, BACKEND §2.3).
- Cards are Server Components. Only the `LikeButton` inside a card is a client island, so a 24-card page ships one small component definition, not 24 client trees.

## 6. Styling

- **Source of truth:** `design-system/styles/*.css` and `design-system/components/*.css` are imported once in the root layout. They provide the tokens, the neumorphic, glass and minimal layers, and the component classes.
- **Tailwind 4** is used for layout utilities (grid, flex, gap, spacing). Its theme is mapped to the design tokens with `@theme` (colour, radius, spacing, font, shadow names resolve to `var(--…)`), so a utility can never introduce an off-palette value. Arbitrary values (`bg-[#…]`, `shadow-[…]`) are banned by lint.
- Component styling uses the design-system classes (for example the card, button and field classes). React components only compose those classes.
- **Showcase thumbnails** get no effects (no neumorphism, no glass), per the constitution and A-12.
- **Glass** is only used where the design system allows it (header on scroll, modals, drawer), always with its solid fallback for `prefers-reduced-transparency` and no `backdrop-filter` support.
- **Fonts:** Inter through `next/font/local` or `next/font/google` (self-hosted at build), `display: swap`, exposed as the font token.
- Dark theme: `data-theme` on `<html>` set by the server from the preference cookie, so the first paint is correct (no flash).

## 7. Data, mutations, caching and media

### 7.1 Server Actions vs Route Handlers

| Use | Mechanism | Why |
|---|---|---|
| Internal mutations from our own UI: like/unlike, onboarding, username check, (R2) follow, save, comment, profile edit | **Server Action** in `src/modules/<m>/actions.ts` | Typed end to end, built-in origin check, works with `useActionState` / `useOptimistic`, progressive form posts |
| Third-party or URL-contract endpoints: Better Auth (incl. OAuth callback), view beacon (`sendBeacon` needs a URL), health, cron, (R2) upload presign/finalise | **Route Handler** under `src/app/api/` | Needs a stable URL, a specific method or status code, or is called by something other than our React tree |

Both call the **same service functions**; neither contains business logic. Details: [ADR-007](ARCHITECTURE_DECISIONS.md#adr-007-server-actions-for-internal-mutations-route-handlers-for-url-contracts).

### 7.2 Caching and revalidation

- Service read functions used by pages are wrapped with `"use cache"` + `cacheTag(...)` + `cacheLife(...)` at the **module service boundary** (one place, not in pages). Tags and lifetimes are the ones in §3.
- Per-viewer data (session, like state, ownership flags) is **never** inside a cached function. It is fetched separately and merged in the page.
- **Mutations invalidate by tag** in the Server Action after the write succeeds: `updateTag` for read-your-own-write (the actor sees the new value immediately), `revalidateTag` for others (stale-while-revalidate).

| Event | Tags invalidated |
|---|---|
| Like / unlike | `shot:<id>:counts` (feed tags are **not** invalidated per like; the 60 s life and the daily popularity recompute bound staleness) |
| Popularity recompute (cron) | `feed:popular`, `feed:cat:*` (via a single `feed` parent tag) |
| Shot hidden / unhidden, user suspended (moderation scripts) | `shot:<id>`, `user:<id>`, `feed`, `search`, `tags` (scripts call the internal revalidation endpoint, BACKEND §6) |
| Onboarding complete | `user:<id>` |
| Seed / re-seed | all (deploy-time) |

- Route Handlers send `Cache-Control: no-store`. HTML responses are `private, no-store` from the CDN's point of view, because they carry a nonce.

### 7.3 Pagination and infinite scroll (FR-23, BR-35)

- Server renders page 1 (24 items) inline. `InfiniteFeed` loads the next page by calling a **Server Action** `loadMore({ feedKey, cursor })`, which returns `{ items: CardDTO[], nextCursor }`. The client renders the items with the same `ShotCard` markup (a client-renderable card variant sharing the card's CSS classes).
- Cursors are opaque, HMAC-signed (BR-35); an invalid cursor returns `INVALID_CURSOR` and the UI shows the "Load more" link again.
- The hook keeps a `Set` of rendered IDs and drops duplicates; after 5 automatic loads it switches to a "Load more" button (keeps the footer reachable, a11y).
- New items are announced politely ("24 more shots loaded"). Focus does not move.

### 7.4 Optimistic updates (BR-47)

`LikeButton` uses `useOptimistic` for `{ liked, count }`. On success the server's count replaces the optimistic one. On `RATE_LIMITED` the toast shows the retry time from `retryAfter`; on any other error the previous state is restored and an error toast appears. Double-clicks are coalesced: the latest desired state wins and only one request is in flight per shot.

### 7.5 Image strategy (D-15)

- Images are pre-generated derivatives on R2: feed 400/800/1200 (4:3) and detail 1600, WebP (ADR-004).
- `next/image` with a **custom loader** that maps the requested width to the nearest derivative key: `https://<media-domain>/<key>/feed-<w>.webp`. Vercel image optimisation is **off** (`images.loader: 'custom'`).
- `sizes` per context: feed card `(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw`; shot detail `min(100vw, 1600px)`.
- First row of a feed and the shot detail hero get `priority` (LCP, NFR-01); the rest lazy-load. Every image has explicit `width`/`height` (CLS, NFR-02) and the dominant colour as a placeholder background.
- `alt`: the shot title by default, or the author's alt text when present (R2 composer).

## 8. Degradation and error states

| Failure | User-visible behaviour | Mechanism |
|---|---|---|
| DB unavailable on a read | Error page with retry (FR-05); cached data is served while it is still valid | `error.tsx`; data cache entries outlive a brief outage |
| Media domain unavailable | Card shows the dominant-colour block with the title; layout does not shift | Placeholder background + fixed aspect ratio |
| Like action fails | Rollback + toast (BR-47) | §7.4 |
| View beacon fails | Nothing visible; dropped silently (BR-31) | `sendBeacon`, fire and forget |
| Email provider down | "We couldn't send a code. Try again in a minute." No code is created | `EmailService` error mapped to `EMAIL_UNAVAILABLE` |
| Turnstile unavailable | Code request blocked with a retry message; rate limits still apply | Fail closed (SECURITY §4) |
| Google sign-in error | Back on `/login` with a generic error banner; email sign-in still works | Better Auth error redirect |
| JavaScript off | Core browsing works (§1.3); sign-in explains it needs JS | Progressive enhancement |

## 9. Performance budget (NFR-01…03)

- Initial JS on a feed page ≤ **180 KB gzip** (framework + islands). Measured by the build output check in CI (P08) and Lighthouse in T-29.
- No client-side fetch on first render of any public page. Page 1 of every list is server-rendered.
- ≤ 3 DB round trips per page (NFR-09): each page's service call composes its reads into one `db.batch` where they are independent. The header session read is the auth library's single session lookup.

## 10. Testability hooks

- Every interactive component has a stable accessible name; tests query by role and name (RTL, Playwright), not by test IDs.
- Server Actions and services are tested without the browser (T-23); Client Components are tested with mocked actions (T-24).
- Viewport validation (360, 390, 768, 1024, 1280, 1440) uses the same breakpoints as RESPONSIVE_DESIGN (T-26).
