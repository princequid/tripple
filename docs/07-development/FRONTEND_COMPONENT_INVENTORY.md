# Frontend Component Inventory

Version 1.0 · 2026-11-14. All components use the `design-system/` classes and tokens. Page-structure CSS lives in `src/app/app.css` (R1) and `src/app/features.css` (P10, tokens only). Pillars: **N** = neumorphism (controls), **G** = glass (floating layers), **M** = minimal (layout, content).

## Primitives (`src/components/ui/`, `src/hooks/`)

| Component | File | Pillar | Behaviour |
|---|---|---|---|
| Modal / ConfirmDialog (C48) | `ui/Modal.tsx` | G | Portal, unblurred scrim, focus trap and return, Escape, scroll lock, bottom sheet < md, sizes sm/md/lg, `side` panel variant |
| Menu (C49) | `ui/Menu.tsx` | G | Menu-button pattern: arrow keys, Home/End, Escape returns focus, outside click; `kind="dialog"` for popovers |
| Toast region (C38) | `ui/Toast.tsx` | G | Polite live region, 5 s / 8 s (errors), optional action button, dismiss |
| TextField, TextArea, SelectField, Checkbox, Switch, ChipInput (C30, C43) | `ui/Field.tsx` | N | Label, hint, error with `aria-describedby`, character counters, chip add/remove by keyboard |
| LinkTabs, Stepper (C27) | `ui/Tabs.tsx` | N | URL-driven tabs with `aria-current`; stepper with done/current states |
| EmptyState, ErrorState, GridSkeleton, ListSkeleton (C34–C36) | `ui/States.tsx` | M | Test ids `empty-state`, `error-state`, `loading`; retry action |
| PreviewNote | `ui/PreviewNote.tsx` | M | Shown only while a feature runs on the mock layer |
| Hooks | `hooks/useResource`, `useDismiss`, `useFocusTrap`, `useMediaQuery`, `useUrlState` | — | Load state machine with reload/mutate; dismiss; trap; URL filter state |

## Shell

| Component | File | Notes |
|---|---|---|
| SiteHeader (C03) | `SiteChrome.tsx` | Explore ▾ / Tags / Jobs ▾ / Hire ▾; search hidden on home; Share work + bell + account (member) |
| HeaderSearch (C09 v2, OV-07) | `shell/HeaderSearch.tsx` | Type switch Shots/Designers/Services; ARIA combobox autocomplete |
| MobileDrawer (C06, SH-03) | `shell/MobileDrawer.tsx` | Accordions, account block, legal links; closes on route change |
| NotificationsBell (OV-08) | `shell/NotificationsBell.tsx` | Unread badge, latest 5, mark all read |
| AccountMenu (C07) | `AccountMenu.tsx` | R1–R3 entries + staff Report queue, unread counts |
| SiteFooter (C08) | `SiteChrome.tsx` | Explore, Hire, Company + Cookie settings |
| CookieBanner / settings (OV-10) | `shell/CookieConsent.tsx` | Banner gated by `NEXT_PUBLIC_NONESSENTIAL_COOKIES`; settings dialog always available |
| AppProviders (OV-03) | `providers/AppProviders.tsx` | Session context, `requireMember()` → auth-gate modal embedding SignInFlow |

## Feature components

| Area | Components |
|---|---|
| Shot | `shot/ShotActions` (rail: Save, Comments, Share, Details, More; PrevNext), `shot/SavePicker` (+ `SaveButton` on cards), `shot/ShareModal`, `shot/CommentsPanel` |
| Social | `social/FollowButton`, `social/MessageButton` (OV-09), `social/ReportDialog` (OV-06) |
| Profile | `ProfileHeader` v2, `profile/ProfileActions` + `ProfileTabs`, `profile/CollectionsGrid` + `CollectionCard`, `profile/CollectionView`, `profile/CollectionFormModal`, `profile/PeopleList` + `PersonRow` + `LikedShots`, `profile/ClientShotGrid`, `profile/DesignerResults` |
| Composer | `composer/Composer` (drop zone, blocks, reorder, alt text, progress), `composer/DraftsStrip` |
| Jobs | `jobs/JobBoard` + `JobRow`, `jobs/JobDetailView`, `jobs/JobWizard`, `jobs/RichTextEditor` (BR-72 allow-list) |
| Hire / services | `hire/HireDirectory`, `hire/ServicesBrowser`, `hire/ServiceCard` + `DesignerCard` + `SellerServices`, `hire/ServiceDetailView`, `hire/ServiceForm` |
| Inbox | `inbox/NotificationsView`, `inbox/NotificationText`, `inbox/Messages` (`ThreadList`, `Conversation`) |
| Settings | `settings/SettingsNav`, `ProfileSettingsForm`, `AccountSettings` (`AccountSettingsView`, `SessionsView`), `TeamsSettings` (`TeamsView`, `TeamAdminView`, `CreateTeamForm`, `MyJobsView`, `BlockedView`) |
| Admin | `admin/ReportQueue` |
| System | `NotFoundMosaic` (SCR-60), `OnboardingDetails` (SCR-29) |

## Library helpers added

`lib/sanitize.ts` (BR-72 HTML allow-list), `services/reference.ts` (specialties, service categories, labels, `validateJob`, `validateService`, `formatPrice`, `timeAgo`).
