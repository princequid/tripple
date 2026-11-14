# Frontend API Integration Requirements

| Field | Value |
|---|---|
| Version | 1.0 · 2026-11-14 |
| Contract | [API_SPECIFICATION v2.0](../04-api/API_SPECIFICATION.md) (backend-owned; §6 lists the alignment with the frontend contracts) |
| Frontend contracts | `src/services/contracts.ts` (R2/R3 DTOs) + R1 DTOs in `src/modules/*/types.ts` |
| Source switch | `src/services/config.ts`: a feature is `live` or `mock`; `NEXT_PUBLIC_API_LIVE` overrides the default list (`none` = everything on the mock) |

## 1. How the integration layer works

- Components never call `fetch` for R2/R3 data. They call `src/services/<area>.ts`, and every function returns `ApiResult<T>` (the same shape as `lib/api-client.api()`).
- Each function chooses its branch with `isMock(feature)`. The **live** branch calls the Route Handler and, where needed, adapts the envelope (`{ data: T[], page }` → `Paged<T>`, `null` → `''` in forms). The **mock** branch calls `src/services/mock/*`.
- The mock store (`src/services/mock/db.ts`) uses the real seed people and the real R1 shot pool, and persists to `localStorage` (`trippple.mock.v1`). `?__state=empty|error` forces empty or error reads (mock only). `window.__tripppleMock.reset()` clears it.
- Every screen on a mock feature shows the **Preview data** note (`components/ui/PreviewNote`). The note disappears automatically once the feature is live.

## 2. Status per feature (default sources)

| Feature | Source | Endpoints used (live) | Notes |
|---|---|---|---|
| Feeds, shot detail, likes, views, R1 search, tags, profiles, auth, onboarding username | live (R1) | E-01…E-19 | Unchanged |
| follows | **live** | PUT/DELETE `/api/users/:u/follow`; GET `/followers`, `/following`; `isFollowing` on GET `/api/users/:u` | Profile page loader passes `follows.lookupFor` (fixed 2026-11-13) |
| collections + Liked tab | **live** | `/api/users/:u/collections`, `/api/collections[/:id[/shots[/:shotId]]]`, `/api/me/collections?shotId=`, `/api/users/:u/likes` | "Create and save" = POST then PUT |
| comments | **live** | GET/POST `/api/shots/:id/comments` (paged), PATCH/DELETE `/api/comments/:id`, PUT/DELETE `/like`, PUT `/api/shots/:id/comments-setting` | Bodies are rendered as text; URLs auto-linked (nofollow ugc) |
| reports + moderation | **live** | POST `/api/reports`; GET `/api/moderation/reports?status=`; POST `/api/moderation/reports/:id/decision` | "Resolved" tab merges hidden/suspended/dismissed; reason ≥ 10 chars |
| composer + uploads | **live** | POST `/api/uploads` → file (ImageKit multipart or local PUT, XHR progress) → POST `/complete`; POST/PATCH `/api/shots`, POST `/publish`, GET `/edit`, GET `/api/me/shots?status=draft`, DELETE | Title **and category** required even for drafts |
| settings | **live** | `/api/me/profile`, `/api/me/account`, PUT `/api/me/username`, `/api/me/email/code` + `/api/me/email`, `/api/me/deletion/code` + `/api/me/deletion`, `/api/me/sessions[/:id]`, `/revoke-others` | Avatar upload UI not built yet (see §3) |
| teams | **live** | POST `/api/teams`, `/api/me/teams`, `/api/me/invitations[/:id/accept|decline]`, `/api/teams/:u` (+ `/profile`, `/invitations[/:id]`, `/members/:m`, `/transfer`) | Leave = DELETE own membership |
| onboarding details | **live** | POST `/api/onboarding/details` | |
| jobs | **live** | `/api/jobs` (20/page, `remote=true`), `/api/jobs/:id`, PATCH, POST `/close`, `/api/me/jobs` | `applyUrl` is null on expired/closed jobs |
| search (designers + suggest) | **live** | GET `/api/search/designers`, GET `/api/search/suggest` | Services suggestions stay on the mock |
| notifications | mock | — (R3) | Expected: `GET /api/notifications?filter&cursor`, `POST /api/notifications/read { ids | 'all' }`, `GET /api/me/unread` |
| messages | mock | — (R3) | Expected: `GET /api/messages`, `GET/POST /api/messages/:id`, `POST /api/messages { toUsername, body, context? }`; polling ≤ 15 s |
| blocks | mock | — (R3) | Expected: PUT/DELETE `/api/users/:u/block`, GET `/api/me/blocks` |
| hire directory | mock | — (R3) | Expected: `GET /api/designers?q&skill&location&kind&cursor` → `DesignerCard[]` |
| services | mock | — (R3) | Expected: `/api/services` CRUD + `/api/users/:u/services`; prices in integer cents |

## 3. Unresolved requirements (need a decision or a backend change)

| # | Item | Owner | Detail |
|---|---|---|---|
| U-1 | "Available for work" label | User (A-26) | Removed from the UI (decision D-25d excludes it in R1–R3). Re-add only if A-26 changes that |
| U-2 | Onboarding intents | User (A-24) | UI sends the four values the API accepts |
| U-3 | Avatar and company-logo upload UI | Frontend | Endpoints exist (`purpose: avatar|logo`, `avatarMediaId`, `companyLogoMediaId`). The settings form and job wizard show initials or the company initial until this UI is built |
| U-4 | ImageKit upload path | User (B-11) + backend | Verified only with the local provider; the ImageKit multipart branch is implemented but untested against a real account |
| U-5 | Colour search (`?color=`) and video teasers | Backend R3 | Not rendered (no dead control). Palette swatches on shot detail are display-only |
| U-6 | Mock-created teams | — | A team created on the mock had no real profile page; this is resolved now that teams are live |
