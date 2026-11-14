# Reverse Engineering → Frontend Mapping

Version 1.0 · 2026-11-14. Maps every page in [reverse-engineering/01-page-inventory](../reverse-engineering/01-page-inventory.md) (rows 1–52) and every overlay in [APPLICATION_SITEMAP](../06-ui-ux/APPLICATION_SITEMAP.md) to its implementation.

**Statuses:** Not Started · In Progress · Blocked · Awaiting Review · Approved · Completed. "Completed" means built, wired to its data source, and verified (see [FRONTEND_TESTING_REPORT](../08-testing/FRONTEND_TESTING_REPORT.md)). Every screen is **Awaiting Review** for user sign-off (G4/G6). **Data** says where the data comes from: live = backend API, mock = R3 mock layer.

## 1. Pages (RE page inventory)

| RE # | RE page | Our route | Screen | Data | Status |
|---|---|---|---|---|---|
| 1 | Homepage | `/` | SCR-01 | live | Completed (R1); Awaiting Review |
| 2–5 | Explore popular/recent ± category | `/shots/{popular,recent}[/:category]` | SCR-02 | live | Completed; Awaiting Review |
| 6 | Explore filters (tag, colour, timeframe) | same `?timeframe=` | SCR-02 / SCR-59 | live | Timeframe Completed · **colour Blocked** (backend colour search, R3) |
| 7 | Playoffs | — | L-02 | — | Not Started (Later, scope decision) |
| 8 | Shot detail | `/shots/:id-:slug` | SCR-03 + SCR-22 | live | Completed (Save, comments, share, details, follow, message, report, palette, prev/next, owner menu) |
| 9–10 | Search results / no results | `/search/:term` (`?type=designers`) | SCR-06, SCR-42 | live | Completed |
| 11–12 | Tags index / tag page | `/tags`, `/tags/:tag` | SCR-07/08 | live | Completed (R1) |
| 13 | Places | — | L-17 | — | Not Started (Later candidate) |
| 14 | Profile: Work | `/:username` | SCR-04 + SCR-23 | live | Completed (follow stats, actions, drafts strip) |
| 15 | Profile: Services | `/:username/services` | SCR-57 | mock | Completed (R3 mock) |
| 16 | Profile: Reviews | — | L-07 | — | Not Started (Later, payments) |
| 17–18 | Collections list / detail | `/:username/collections[/:id-:slug]` | SCR-24/25 | live | Completed |
| 19 | Liked shots | `/:username/likes` (owner only) | SCR-26 | live | Completed |
| 20 | Members | `/:username/members` (teams) | SCR-27 | live | Completed |
| 21 | About | `/:username/about` | SCR-05 | live | Completed (R1) |
| — | Followers / following | `/:username/followers`, `/following` | SCR-28 | live | Completed |
| 22–23 | Talent directory / designer search redirect | `/hire` (`?search=` supported) | SCR-53 | mock | Completed (R3 mock) |
| 24–26 | Specialty and agency SEO landings | — | L-05 | — | Not Started (Later) |
| 27–29 | Services marketplace, search, detail | `/services` (`?q=`), `/services/:id-:slug` | SCR-54/55 | mock | Completed (R3 mock); create/edit SCR-56 Completed |
| 30 | Project brief wizard | — | L-08 | — | Not Started (Later, payments) |
| 31 | Post a job | `/jobs/new`, `/jobs/:id/edit` | SCR-39 | live | Completed (3 steps, rich text, gate on Continue) |
| 32, 39, 40, 49, 50 | Pricing / Pro / advertising / marketing | — | L-11, L-12, L-14 | — | Not Started (Later) |
| 33–34 | Brief board / proposals | — | L-09 | — | Not Started (Later, payments) |
| 35–36 | Job board / job detail | `/jobs`, `/jobs/:id-:slug` | SCR-37/38 | live | Completed |
| 37–38 | Job directories | — | L-04 | — | Not Started (Later) |
| 41 | Upload a shot | `/uploads/new`, `/shots/:id/edit` | SCR-20/21 | live | Completed (local uploads verified; ImageKit path untested, B-11) |
| 42–45 | Blog / resources | — | L-13 | — | Not Started (Later) |
| 46–48 | Sign in / sign up / password reset | `/login`, `/signup` (email code, no passwords) | SCR-09 | live | Completed (R1); `/onboarding/details` SCR-29 Completed |
| 51 | About (+ contact, terms, privacy, cookies) | static routes | SCR-13 | static | Completed (R1); legal copy pending OQ-03 |
| 52 | 404 (colour mosaic) | any unmatched | SCR-60 | live | Completed |

## 2. Overlays and shell

| ID | Surface | Status |
|---|---|---|
| SH-01 | Header (Explore/Tags/Jobs/Hire menus, search types, Share work) | Completed |
| SH-02 | Explore menu | Completed |
| SH-03 | Mobile drawer | Completed (z-order bug fixed: the drawer was under its own scrim) |
| SH-04 | Account menu (R1–R3 entries) | Completed |
| SH-05 | Footer | Completed |
| SH-06 | Toast region | Completed |
| OV-01 / OV-02 | Share / details modals | Completed |
| OV-03 | Auth-gate modal | Completed (embedded email-code sign-in) |
| OV-04 | Comments panel | Completed (live) |
| OV-05 | Save picker | Completed (live) |
| OV-06 | Report dialog | Completed (live) |
| OV-07 | Search type switch + autocomplete | Completed (live suggest; services suggestions on mock) |
| OV-08 | Notifications popover | Completed (R3 mock) |
| OV-09 | Message composer | Completed (R3 mock) |
| OV-10 | Cookie consent | Completed (banner disabled until a non-essential cookie exists, BR-85) |

## 3. R2/R3 screens not in the RE page list

SCR-30…36 Settings (profile, account, sessions, teams, team admin, jobs) and `/teams/new`: **Completed (live)**. SCR-41 report queue: **Completed (live)**. SCR-50…52 notifications and messaging: **Completed (R3 mock)**. SCR-58 blocked members: **Completed (R3 mock)**. SCR-61 video teaser: **Blocked** (D-18 video pipeline).

## 4. User journeys

| Journey ([USER_JOURNEYS](../01-requirements/USER_JOURNEYS.md)) | Covered by |
|---|---|
| Browse → filter → shot → tag → profile | J1, FE-01 |
| Search (shots, designers) | J3, FE-30 |
| Like with sign-in intent | J5, J6, FE-02 |
| Save to collection | FE-22 |
| Follow | FE-21 |
| Comment | FE-23 |
| Post a job / apply | FE-05, FE-24 |
| Upload and publish | FE-28 (draft); publish with image not yet automated (see testing report) |
| Settings, teams | FE-27 |
| Moderation | FE-29 |
| Hire / services / message (R3 mock) | FE-06, FE-07, FE-25 |
