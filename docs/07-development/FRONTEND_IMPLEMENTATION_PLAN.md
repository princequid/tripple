# Frontend Implementation Plan

| Field | Value |
|---|---|
| Phase | P10 Frontend Implementation (all releases R1–R3) |
| Version | 1.0 · 2026-11-13 |
| Source of truth | [reverse-engineering/01-page-inventory](../reverse-engineering/01-page-inventory.md), [FEATURE_INVENTORY](../01-requirements/FEATURE_INVENTORY.md), [APPLICATION_SITEMAP](../06-ui-ux/APPLICATION_SITEMAP.md), [INFORMATION_ARCHITECTURE](../06-ui-ux/INFORMATION_ARCHITECTURE.md), [USER_JOURNEYS](../01-requirements/USER_JOURNEYS.md) |
| Companions | [FRONTEND_PROGRESS_REPORT](FRONTEND_PROGRESS_REPORT.md) · [FRONTEND_COMPONENT_INVENTORY](FRONTEND_COMPONENT_INVENTORY.md) · [FRONTEND_API_INTEGRATION_REQUIREMENTS](FRONTEND_API_INTEGRATION_REQUIREMENTS.md) · [FRONTEND_TESTING_REPORT](../08-testing/FRONTEND_TESTING_REPORT.md) · [REVERSE_ENGINEERING_TO_FRONTEND_MAPPING](REVERSE_ENGINEERING_TO_FRONTEND_MAPPING.md) |

## 1. Starting point (inspected 2026-11-13)

- **Foundation (kept as is).** Next.js 16 App Router, React 19, TypeScript strict. Styling is the plain-CSS design system in `design-system/` (tokens → neumorphism → glass → base → components), plus `src/app/app.css` for page structure (A-21: no Tailwind yet). Identity v2.1 (A-16/A-17).
- **R1 vertical slices already built with the real backend** (A-20): home, explore feeds, shot detail, profile Work/About, search, tags, login/signup/OTP, onboarding (username), legal pages, 404/error. There is a real API under `/api/*`.
- **R1 gaps found:** mobile navigation drawer (SH-03), Explore menu (SH-02), toast region (SH-06), Share modal (OV-01), Details modal (OV-02), auth-gate modal (OV-03).
- **Not built:** every R2 and R3 screen (SCR-20…SCR-61, OV-04…OV-10).

## 2. Approach

1. **Reverse-engineering scope only.** Build the screens in APPLICATION_SITEMAP §1–§3 (R1–R3). "Later" items (payments, Pro, briefs, rebounds, challenges, blog, marketing pages) are excluded by decision D-02 and BR-45.
2. **Build on the foundation.** Reuse the design-system classes. Add only page-structure CSS in `src/app/features.css`, which uses tokens only (no new raw colour, shadow or radius values).
3. **Backend readiness through a service layer** (`src/services/`):
   - Every R2/R3 data need is a typed function that returns the same `ApiResult<T>` as `lib/api-client.api()`.
   - Each feature has a source switch (`src/services/config.ts`): `live` calls the documented Route Handler, `mock` uses the in-browser mock store.
   - The mock store (`src/services/mock/`) is seeded from fixtures. It reuses the **real R1 seed people and shots** from the live API, so the visuals are real. It persists mutations to `localStorage`, so follows, saves, comments, posted jobs and sent messages survive navigation. It simulates latency (loading states), and `?__state=empty|error` forces those states for testing.
   - Mock data never appears in presentation components. Components import services and contracts only.
4. **Real guards.** Auth-only pages redirect visitors to `/login?returnTo=` on the server (BR-17). Staff pages return 404 to non-staff. Gated actions open the auth-gate modal.
5. **No dead controls.** Every rendered control works, against the live API or the mock. An action that needs an absent backend capability (for example, colour search ranking) is not rendered, and it is listed as **Blocked** in the mapping.

## 3. Roadmap (dependency order)

| Step | Work | Depends on | Screens / IDs | Status |
|---|---|---|---|---|
| FE-01 | Shared primitives: Modal, Menu/Popover, Toast, Tabs, Field set, Stepper, State views, hooks (`useResource`, `useDismiss`, `useFocusTrap`) | foundation | C48, C49, C38, C27, C30, C34–C36 | Completed |
| FE-02 | Client session context + auth-gate modal | FE-01 | OV-03 | Completed |
| FE-03 | Service layer + contracts + mock store | — | all R2/R3 | Completed |
| FE-04 | App shell v2: Explore menu, Jobs/Hire menus, Share work, bell popover, account menu (R2/R3 entries), mobile drawer, footer, search type switch + autocomplete | FE-01..03 | SH-01…SH-06, OV-07, OV-08 | Completed |
| FE-05 | Shot detail v2: Share/Details modals, Save picker, Follow, Comments panel, Report, palette, prev/next, owner menu | FE-03, FE-04 | OV-01, OV-02, OV-04, OV-05, OV-06, SCR-22 | Completed |
| FE-06 | Profile v2: tabs, Follow/Message, Collections, Collection detail, Liked, Members, Followers/Following, Services tab | FE-05 | SCR-23…SCR-28, SCR-57 | Completed |
| FE-07 | Composer: new and edit shot | FE-03 | SCR-20, SCR-21 | Completed |
| FE-08 | Settings: profile, account, sessions, teams, team admin, jobs, blocked; create team | FE-03 | SCR-30…SCR-36, SCR-58 | Completed |
| FE-09 | Jobs: board, detail, post/edit wizard | FE-03 | SCR-37…SCR-39 | Completed |
| FE-10 | Designer search results + report queue | FE-03 | SCR-42, SCR-41 | Completed |
| FE-11 | Notifications + messaging | FE-03 | SCR-50…SCR-52, OV-09 | Completed |
| FE-12 | Hire directory + services (list, detail, create/edit) | FE-03 | SCR-53…SCR-56 | Completed |
| FE-13 | Cookie consent, colour-mosaic 404 | FE-01 | OV-10, SCR-60 | Completed |
| FE-14 | Full onboarding steps | FE-03 | SCR-29 | Completed |
| FE-15 | Responsive verification at 6 widths, E2E, docs | all | — | Completed (see testing report) |
| — | Colour filter on feeds, video teasers | backend colour search (P09-24), video pipeline (D-18) | SCR-59, SCR-61 | Blocked |

## 4. Folder conventions added

```
src/
  services/            API integration layer (client-safe; no server imports)
    config.ts          per-feature source switch (live | mock)
    contracts/         request/response DTOs for R2/R3 (types only)
    mock/              fixtures + in-browser store (never imported by components)
    <feature>.ts       one module per feature, each function → Promise<ApiResult<T>>
  hooks/               useResource, useDismiss, useFocusTrap, useMediaQuery
  components/ui/       generic primitives (Modal, Menu, Toast, Tabs, Field, Stepper, StateViews)
  components/<area>/   feature components (shell, shot, profile, jobs, settings, messages, hire, composer)
  app/features.css     page structure for R2/R3 screens (tokens only)
```

## 5. Definition of done (per screen)

The screen renders at all 6 widths without horizontal scroll. Every control works. Loading, empty and error states exist where data loads. The screen is keyboard-operable: focus is trapped in modals and returned on close. Gated actions use the auth gate. The screen is covered by at least one Playwright test and listed in the mapping document.
