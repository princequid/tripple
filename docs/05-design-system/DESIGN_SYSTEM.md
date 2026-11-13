# Design System — R1 Component Catalogue

| Field | Value |
|---|---|
| Task | P05-05 |
| Version | 2.1 — 2026-11-13 (A-17): bright crimson `#DF2F4D` for fills (button, radio, switch, heart, dot), deep crimson `#B3263E` (`--color-accent-deep`) for selected labels, checks, underlines, bars, spinners and rings; white background; tints re-derived; skeleton without gradient. 2.0: identity v2 (A-16). v1.2 (lavender) was approved at G3 (A-15). For review (G3-R2) |
| Date | 2026-11-12 |
| Scope | Every component on the R1 screens (D-02: discover, view, auth, likes, profile, search, tags, minimal username step) |
| Sources | D-02; [03 Component inventory](../reverse-engineering/03-component-inventory.md) and [02 Frontend analysis](../reverse-engineering/02-frontend-analysis.md) (layout/behaviour only); [PROJECT_ASSESSMENT §8–9](../00-project-assessment/PROJECT_ASSESSMENT.md#8-navigation-structure-clone-information-architecture) |
| Rules | [FRONTEND_DESIGN_CONSTITUTION](FRONTEND_DESIGN_CONSTITUTION.md) · tokens from [DESIGN_TOKENS](DESIGN_TOKENS.md) · behaviour and ARIA in [COMPONENT_GUIDELINES](COMPONENT_GUIDELINES.md) |
| Implementation | Foundation CSS in `design-system/` (A-12): `styles/design-tokens.css`, `neumorphism.css`, `glassmorphism.css`, `base.css`, `components/controls.css`, `overlays.css`, `content.css`. Class names are given per component; where this catalogue and the CSS differ, see [§11](#11-implementation-alignment-design-system-css) |
| Review | [T-16](../08-testing/design/T-16_VISUAL_CONSISTENCY_REVIEW.md) findings cited as `T16-nn` where a rule changed |

**Pillar key:** **N** = neumorphism · **G** = glassmorphism · **M** = minimalism.
**State key:** Default · Hover · Focus · Active/Pressed · Selected · Disabled · Loading · Error · Empty. A state that can't occur is marked *n/a* with the reason. Focus is always the global ring (`--focus-ring-*`: 2 px `--color-focus-ring` outline, 2 px offset) unless stated. Reduced motion follows the global rule (DESIGN_TOKENS §9): transforms and loops stop; colour/opacity changes stay (≤ `--duration-fast`).
**Selected language** (CONST §7, T16-11; v2 crimson): on `bg`/`bg-2` = `--color-accent-subtle` (primary light) inset well + 1.5 px deep crimson `--color-selected-ring` + deep crimson `--color-accent-deep` 600 label (5.71:1); inside glass = opaque `--color-accent-subtle` fill + ring + `--color-accent-strong` 600 label; segment in an inset track = raised-sm thumb + ring + accent label; navigation current page = `aria-current` + `--color-accent-strong` indicator bar/underline + 600 label in `--color-text-primary`; radio = filled dot; menu option = `--color-accent-strong` check icon + 600 label in `--color-text-primary`.
**Glass rule** (T16-02): raised neumorphism never appears inside glass. Any `.neu-control` inside `.glass-*` is flattened automatically (transparent; hover `--color-accent-subtle-hover`; pressed `--color-bg-2`; selected = glass selected language). Fields inside glass use the `--color-bg-2` fill with the bg-2 inset.

---

## 1. Catalogue index and pillar tally

| ID | Component | Pillar | Release | Screens |
|---|---|---|---|---|
| C01 | AppShell & Container | M (structural) | R1 | All |
| C02 | SkipLink | M (structural) | R1 | All |
| C03 | SiteHeader | G | R1 | All except auth |
| C04 | BrandSlot | M (structural) | R1 | Header, auth, footer |
| C05 | PrimaryNav & ExploreMenu | G | R1 | Header (desktop) |
| C06 | MobileNavDrawer | G | R1 | Header (below the desktop-nav breakpoint) |
| C07 | AccountMenu | G | R1 | Header (signed in) |
| C08 | SiteFooter | M | R1 | All except auth |
| C09 | SearchBar | N | R1 | Header, home hero, search page |
| C10 | CategoryPills | N | R1 | Explore, home |
| C11 | SortDropdown | N (+ G listbox) | R1 | Explore, home, profile |
| C12 | FilterToggle & FilterPanel | N | R1 | Explore, home |
| C13 | TagFilter | N | R1 | Filter panel |
| C14 | TimeframeFilter | N | R1 | Filter panel |
| C15 | TagChip | M | R1 | Details modal, tag pages, about, filter |
| C16 | ShotCard | M | R1 | All feeds |
| C17 | ShotCardActionBar | G | R1 | ShotCard (hover/focus) |
| C18 | ShotGrid & feed loading | M | R1 | All feeds |
| C19 | ShotDetailHeader | M | R1 | Shot detail |
| C20 | LikeButton | N | R1 | Shot detail, card action bar, card footer (touch) |
| C21 | ShotActionRail | G | R1 | Shot detail |
| C22 | ShareModal | G | R1 | Shot detail |
| C23 | ShotDetailsModal | G | R1 | Shot detail |
| C24 | ContentBlock | M | R1 | Shot detail |
| C25 | RelatedShots | M | R1 | Shot detail |
| C26 | ProfileHeader | M | R1 | Profile |
| C27 | ProfileTabs | N | R1 | Profile |
| C28 | ProfileAbout | M | R1 | Profile about |
| C29 | AuthLayout & AuthForm | M | R1 | `/login`, `/signup` |
| C30 | TextField | N | R1 | Auth, username step, filters |
| C31 | OTPCodeInput | N | R1 | Auth (code step) |
| C32 | AuthGateModal | G | R1 | Any gated action |
| C33 | UsernameStep | M | R1 | `/onboarding` |
| C34 | EmptyState | M | R1 | Feeds, search, profile |
| C35 | ErrorState | M | R1 | All (404, 500, inline) |
| C36 | Skeleton | M | R1 | All loading |
| C37 | Spinner | M (structural) | R1 | Buttons, load-more, fields |
| C38 | Toast | G | R1 | Global |
| C39 | InlineAlert | M | R1 | Auth, username step |
| C40 | Button | N (secondary) / M (primary, on-glass, ghost) | R1 | All |
| C41 | IconButton | N | R1 | All |
| C42 | FAB | N | **R2+ (not R1)** | — (no R1 journey needs it: V-11, T16-16) |
| C43 | Toggle (switch) | N | **Reserved (not R1)** | — (R2 settings) |
| C44 | SegmentedControl | N | R1 | Profile tabs, mobile timeframe |
| C45 | Avatar | N (ring at lg/xl on bg/bg-2) / M | R1 | Cards, header, profile |
| C46 | Badge | M | R1 | Cards, filter count, profile |
| C47 | Tooltip | G | R1 | Icon buttons, abbreviated counts |
| C48 | Modal (base) | G | R1 | C22, C23, C32 |
| C49 | Menu / Listbox (base) | G | R1 | C05, C07, C11, C13 |
| C50 | TextLink | M (structural) | R1 | All |
| C51 | Divider | M (structural) | R1 | Auth "or", footer, menus |

**Counting rule (T16-31).** One row = one catalogue family, counted once by the pillar of its *own* surface treatment. Excluded: structural rows with no surface treatment (C01, C02, C04, C37, C50, C51) and reserved primitives with no R1 use (C42, C43). Instances of the modal base (C22, C23, C32) are counted because each has its own content specification; composite rows count by their primary surface (C11 trigger = N; its listbox is C49).

**Tally (R1 only, v1.1): N 14 (32.6%) · G 13 (30.2%) · M 16 (37.2%) of 43.** Changes from v1.0 (38/29/33): FAB and Toggle are no longer counted (not R1, T16-16) and TagChip is minimal, matching the implemented `.ui-chip`. Neumorphism is 7.4 pp under the 40% target by family count. Neumorphic families are the most repeated controls on every screen (search, pills, sort, filters, like, tabs, inputs), so their visual weight is higher than their family count. This figure replaces D-24(b) and needs the user's confirmation at G3. Composing `.ui-chip` with `.neu-control` on `bg`/`bg-2` would restore TagChip to N (N 15 = 34.9%).

---

## 2. App shell

### C01 AppShell & Container
Pillar M. Page = `--color-bg`; header; `<main id="main" tabindex="-1">`; footer. Container `.container`: `max-width: --container-max`, `padding-inline: --gutter`. `html { scroll-padding-top: calc(--header-h + 16px) }` so focused elements clear the sticky header.
States: all *n/a* (not interactive).
**Tokens:** `--color-bg`, `--gutter`, `--container-max`, `--header-h`, `--space-4`.

### C02 SkipLink
Pillar M. "Skip to content", first focusable element (`.skip-link`).

| State | Treatment |
|---|---|
| Default | Off-screen (`translateY(-200%)`), not `display:none` |
| Focus | Slides in top-left at `--z-skip-link`: `--color-surface-elevated` fill, `--color-text-primary` label, `--radius-pill`, padding 12/16 |
| Hover / Active | *n/a* beyond the focus state (visible only while focused) |
| Selected, Disabled, Loading, Error, Empty | *n/a* (single link) |

**Tokens:** `--color-surface-elevated`, `--color-text-primary`, `--radius-pill`, `--space-3`, `--space-4`, `--z-skip-link`.

### C03 SiteHeader
Pillar G (`.glass-subtle.glass-subtle--md`: subtle tint, medium blur). Sticky, `--header-h`, bottom edge only. Left: BrandSlot; centre: SearchBar (≥ md; not on home, where the hero search is used); right: nav (desktop) or burger, then auth actions or AccountMenu.
Auth actions (T16-02): "Log in" = **Secondary-on-glass** (`.ui-btn--on-glass`), "Sign up" = Primary. Secondary actions carry `.ui-header__secondary` and are hidden below md (they move into the drawer) so 360 px never overflows.

| State | Treatment |
|---|---|
| Default | Glass over `--color-bg`; `--glass-hairline` + `--shadow-glass-sm` |
| Hover / Focus / Active | Per contained control (all flattened on glass) |
| Selected | Current section: nav link gets a 2 px `--color-accent-deep` underline indicator (deep crimson ≥ 4.01:1 on worst-case subtle glass; bright crimson would be 2.81) + 600 `--color-text-primary` label + `aria-current="page"` |
| Disabled, Error, Empty | *n/a* |
| Loading | Auth area shows a 32 px avatar skeleton until the session resolves (no layout shift) |
| Reduced transparency / no backdrop-filter | Opaque `--glass-fallback-bg` + `--color-border-subtle` border |

Only `--color-text-primary` text and icons on this surface (`.glass-subtle .text-secondary` is remapped to primary in CSS).
**Tokens:** `--glass-subtle-bg`, `--blur-glass-md`, `--glass-saturate`, `--glass-border`, `--glass-highlight`, `--glass-hairline`, `--shadow-glass-sm`, `--header-h`, `--z-header`, `--gutter`, `--color-text-primary`, `--color-accent-strong`.

### C04 BrandSlot
Pillar M. **Placeholder pending D-01** (`.ui-brand`): wordmark "Trippple" in Inter 600 at `--text-h4`, `--color-text-primary`, link to `/` with `aria-label="Trippple home"`. **120 × 32 visual area with a 44 px hit area** (T16-08), so the D-01 logo drops in without layout change.
States: focus ring; hover `opacity: 0.8`; others *n/a*.
**Tokens:** `--text-h4`, `--font-weight-semibold`, `--color-text-primary`, `--touch-min`.

### C05 PrimaryNav & ExploreMenu
Pillar G. R1 nav: "Explore" (disclosure) and "Tags" (`.ui-header__nav`). ExploreMenu panel = `.glass-panel.ui-menu`, `--radius-card-lg`, padding 8, offset 8 below the trigger; links: Popular, Recent, 8 categories (neutral labels).
Desktop-nav breakpoint: **1024 px** (D-24e, approved 2026-11-12; see §12). Trigger and links use `.ui-btn--ghost.ui-nav-link`; current page = `[aria-current]` underline; open trigger = `[aria-expanded=true]` (accent-subtle + ring, chevron `.ui-chevron` rotated).

| State | Treatment |
|---|---|
| Default | Link/trigger: `--text-label` 500 `--color-text-primary`, 44 px high, no fill |
| Hover | `--color-accent-subtle-hover` pill fill (`--duration-fast`) |
| Focus | Ring |
| Active/Pressed | `--color-bg-2` fill (flattened: no inset on glass, T16-02) |
| Selected | Open trigger: chevron rotated 180°, `aria-expanded="true"`, `--color-accent-subtle` fill + ring. Current page: navigation selected language |
| Menu item hover / focus / active-descendant | `--color-accent-subtle-hover` row, `--radius-control` |
| Disabled | *n/a* (all entries are shipped routes; unshipped features are absent, BR-45) |
| Loading, Error, Empty | *n/a* (static items) |
| Reduced motion | Panel appears without translate |

**Tokens:** `--glass-panel-bg`, `--blur-glass-md`, `--shadow-glass-md`, `--radius-card-lg`, `--radius-control`, `--space-2`, `--color-accent-subtle`, `--color-accent-subtle-hover`, `--color-bg-2`, `--duration-moderate`, `--duration-exit-moderate`, `--ease-enter`, `--ease-exit`, `--motion-offset-sm`, `--z-dropdown`.

### C06 MobileNavDrawer
Pillar G (`.ui-drawer.glass-panel`, over `.glass-scrim`; rows `.ui-drawer__link`, sub-list `.ui-drawer__sub`, actions `.ui-drawer__actions`, enter `.glass-enter-drawer`). Burger IconButton opens a full-height sheet from the right (width `min(100%, 360px)`), `--radius-panel` on the leading corners. Content: search, Explore (accordion), Tags, auth actions (Log in = `.ui-btn--on-glass`, Sign up = primary, both full width).

| State | Treatment |
|---|---|
| Default (closed) | Burger icon `--color-text-primary` |
| Open | Panel slides in 8 px + fades (`--duration-slow`, `--ease-enter`); scrim fades; body scroll locked |
| Hover / Focus / Active | Rows: `--color-accent-subtle-hover` / ring / `--color-bg-2` |
| Selected (current page) | **`--color-text-primary` 600 label + 3 px `--color-accent-strong` leading bar** + `aria-current="page"` (one selected language across glass levels; the deep crimson `--color-accent-deep` bar is 4.98:1 worst case in T-15 v2.1) |
| Disabled, Error, Empty, Loading | *n/a* (static navigation) |
| Reduced motion | Fade only |

**Tokens:** `--glass-panel-bg`, `--blur-glass-md`, `--color-scrim`, `--radius-panel`, `--color-text-primary`, `--color-accent-strong`, `--color-accent-subtle-hover`, `--color-bg-2`, `--z-drawer`, `--z-scrim`, `--duration-slow`, `--duration-exit-slow`, `--ease-enter`, `--ease-exit`.

### C07 AccountMenu
Pillar G. Trigger = **flat** Avatar md (40 px, hit 44) — no neumorphic ring on glass (T16-02). Menu (`.glass-panel.ui-menu`): name + `@username` (both `--color-text-primary`; handle at `--text-body-sm`), **"View profile"** (FR-14, T16-25), divider, "Sign out".

| State | Treatment |
|---|---|
| Default | Flat avatar |
| Hover | `--color-accent-subtle-hover` circle behind the avatar |
| Focus | Ring |
| Active | `--color-bg-2` circle |
| Selected (open) | `aria-expanded="true"`; 1.5 px `--color-selected-ring` around the avatar |
| Loading | "Sign out" shows Spinner while the request runs; item `aria-disabled` |
| Error | Toast (C38) "Couldn't sign out. Try again." |
| Disabled, Empty | *n/a* |

**Tokens:** `--avatar-md`, `--touch-min`, `--glass-panel-bg`, `--radius-card-lg`, `--color-accent-subtle-hover`, `--color-bg-2`, `--color-selected-ring`, `--selected-ring-width`, `--text-body-sm`.

### C08 SiteFooter
Pillar M (`.ui-footer.neu-context-bg2`, links `.ui-footer__link`). `--color-bg-2` band, `--gutter` padding, 3 link columns (Explore, Company, Legal), BrandSlot, © line. Links `--color-text-secondary` (4.64:1 on bg-2) → hover `--color-text-primary` + underline. **Each footer link is a block with min-height 44 px** (T16-08).
States: hover/focus per TextLink; others *n/a*.
**Tokens:** `--color-bg-2`, `--color-text-secondary`, `--color-text-primary`, `--text-body-sm`, `--touch-min`, `--space-3`, `--space-4`, `--gutter`.

---

## 3. Discovery

### C09 SearchBar
Pillar N (inset, `.ui-search` + `.neu-field`). `role="search"` form; pill input `--input-h`, parent fill, `--shadow-neu-inset-sm`, leading 20 px search icon `--color-text-secondary`, placeholder "Search shots", clear button (IconButton sm) when non-empty, submit IconButton at the trailing end. Hero variant (`.ui-search--hero`, home page, FR-21): `--control-h-lg`, `--text-body-lg`. R1 searches shots only (no type dropdown). Inside the header glass the field uses the bg-2 fill and bg-2 inset.

| State | Treatment |
|---|---|
| Default | Inset pill, icon + placeholder |
| Hover | Icon → `--color-text-primary` |
| Focus | Ring (outline); inset stays |
| Active | *n/a* (text field) |
| Selected | *n/a* (no selectable state; the query is a value) |
| Filled | Value `--color-text-primary`; clear button appears |
| Disabled | Flat `--color-bg-2`, `--color-text-disabled` placeholder/icon |
| Loading | On submit, the submit icon becomes Spinner (16 px) until navigation |
| Error | Empty submit is prevented silently; query over 100 chars: caption error `--color-danger` below |
| Empty (no results) | EmptyState (C34) on the results page |

**Tokens:** `--shadow-neu-inset-sm` (`--neu-inset-sm-bg2` in glass/bg-2), `--radius-pill`, `--input-h`, `--control-h-lg`, `--color-text-secondary`, `--color-text-primary`, `--color-text-disabled`, `--color-danger`, `--text-body`, `--text-body-lg`, `--icon-md`, `--space-3`, `--space-4`, `--space-12`.

### C10 CategoryPills
Pillar N (`.ui-pill-row` of `.ui-pill.neu-control` links): **"All"** (the default, BR-89) + the 8 categories. Scrolls horizontally on small screens; 44 px scroll buttons ≥ md. **Pills are `--control-h-md` (44 px)** with an 8 px gap (T16-06). The 40 px `.ui-pill--sm` size is allowed only with a hit-area extension to 44 px and a 12 px gap.

| State | Treatment |
|---|---|
| Default | `--radius-pill`, parent fill, `--shadow-neu-raised-sm`, label `--color-text-primary` 500 |
| Hover | `--shadow-neu-raised` crossfade + `translateY(--motion-lift)` |
| Focus | Ring (row has 8 px block padding, so the offset ring isn't clipped) |
| Active/Pressed | `--shadow-neu-pressed` |
| Selected (current) | Inset well (`--shadow-neu-inset`) + 1.5 px `--color-selected-ring` + `--color-accent-strong` 600 label, `aria-current="page"` |
| Disabled | *n/a* (categories always navigable) |
| Loading | Selected state moves immediately (optimistic); grid shows skeletons |
| Error, Empty | *n/a* (static list) |
| Reduced motion | No lift; shadow crossfade only |

**Tokens:** `--shadow-neu-raised-sm`, `--shadow-neu-raised`, `--shadow-neu-inset`, `--shadow-neu-pressed`, `--radius-pill`, `--control-h-md`, `--space-2`, `--space-4`, `--color-selected-ring`, `--selected-ring-width`, `--color-accent-strong`, `--text-label`, `--duration-base`, `--motion-lift`.

### C11 SortDropdown
Pillar N trigger + G listbox. Trigger: "Popular ▾" (`.ui-btn.neu-control`); listbox `.glass-panel.ui-menu` with Popular / Recent (check icon on the chosen one). **Same custom listbox at every width** (T16-27); below md the trigger is full width.

| State | Treatment |
|---|---|
| Default | Raised-sm trigger, label `--color-text-primary` 500, chevron `--color-text-secondary` |
| Hover | `--shadow-neu-raised` |
| Focus | Ring on trigger; active option: `--color-accent-subtle-hover` row |
| Active/Pressed | `--shadow-neu-pressed` |
| Selected | Open: `aria-expanded`, chevron rotated. Chosen option: menu-option selected language (accent check icon + 600 `--color-text-primary` label) + `aria-selected="true"` |
| Disabled | Flat, `--color-text-disabled`, `aria-disabled` |
| Loading | Trigger label updates immediately; grid skeletons |
| Error, Empty | *n/a* (static options) |

**Tokens:** C10 shadow set + `--glass-panel-bg`, `--blur-glass-md`, `--shadow-glass-md`, `--radius-card-lg`, `--color-accent-subtle-hover`, `--color-accent-strong`, `--z-dropdown`.

### C12 FilterToggle & FilterPanel
Pillar N (`.ui-filter-bar` = sort · pill row · toggle; `.ui-filter-panel.neu-context-bg2` with `.ui-filter-panel__group`; open toggle = `.neu-control.is-selected` + `aria-expanded`). Explore and home feeds only — **search results pages have no explore filter bar** (FR-31: no C10–C14). Toggle: secondary button "Filters" with filter icon and accent Badge count. Panel: inline below the filter bar, `--color-bg-2` surface (`.neu-context-bg2`), `--radius-panel`, padding 24; two columns ≥ md (Tags | Timeframe), stacked below; "Clear" ghost button per group, "Clear all" when any set. URL is the state.

| State | Treatment |
|---|---|
| Default | Toggle raised-sm; panel collapsed |
| Hover / Focus / Pressed | Raised / ring / pressed |
| Selected (open) | Toggle: inset well + ring + accent label, `aria-expanded="true"`; panel expands (grid rows 0fr → 1fr, `--duration-moderate`; reduced motion: instant) |
| Active filters | Badge "2" on the toggle (`.ui-badge--accent`) |
| Disabled | *n/a* (always available on feed pages) |
| Loading | Applying a filter navigates; grid skeletons |
| Error | *n/a* (filters are GET links) |
| Empty | No results → EmptyState with "Clear filters" |

**Tokens:** `--color-bg-2`, `--radius-panel`, `--space-6`, bg-2 shadow set (`--neu-raised-sm-bg2`, `--neu-inset-bg2`, `--neu-pressed-bg2`), `--color-selected-ring`, `--color-accent-strong`, `--duration-moderate`.

### C13 TagFilter
Pillar N (`.ui-search` with tag icon + `.ui-chip--removable` / `.ui-chip__remove`). Combobox: TextField (C30) with tag icon and a suggestions listbox (`.glass-panel.ui-menu`) from popular tags. **R1 allows one tag** (FR-25, single `tag` URL parameter): the chosen tag is shown as one removable TagChip; choosing another tag replaces it.

| State | Treatment |
|---|---|
| Default / Hover / Focus / Filled | As TextField (C30) |
| Active/Pressed | *n/a* for the field; chip remove buttons per IconButton |
| Selected | Active suggestion `--color-accent-subtle-hover`; the chosen tag is rendered as one removable chip |
| Disabled | *n/a* (choosing a new tag replaces the current one, so the field never locks) |
| Loading | 3 skeleton rows in the listbox; `aria-busy` |
| Error | Suggestion fetch fails → "Couldn't load suggestions" row (`--color-text-primary`); free text still works |
| Empty | "No matching tags — press Enter to search for '…'" |

**Tokens:** C30 tokens + `--glass-panel-bg`, `--color-accent-subtle-hover`, `--color-text-secondary`, `--color-skeleton`.

### C14 TimeframeFilter
Pillar N (`.ui-radio-group` / `.ui-radio` / `.ui-radio__dot` ≥ md; `.ui-segmented` below md). Radio group: **Trending now, Past 7 days, Past 30 days, Past 12 months, All time** (neutral labels). ≥ md: vertical radio rows (44 px each); below md: SegmentedControl (C44) scrolling horizontally.

| State | Treatment |
|---|---|
| Default | Radio 20 px circle, 1.5 px `--color-control-boundary` ring, inset-sm; label `--color-text-primary` |
| Hover | Row `--color-accent-subtle-hover` |
| Focus | Ring around the row |
| Active | Circle `--shadow-neu-pressed` |
| Selected | Radio selected language: circle filled `--color-accent-strong` with an 8 px white dot; label 600 |
| Disabled | *n/a* (all options valid) |
| Loading | Navigates; grid skeletons |
| Error, Empty | *n/a* (static options) |

**Tokens:** `--color-control-boundary`, `--color-accent-strong`, `--color-text-on-accent`, `--shadow-neu-inset-sm`, `--shadow-neu-pressed`, `--color-accent-subtle-hover`, `--touch-min`.

### C15 TagChip
Pillar **M** (`.ui-chip`, matches the CSS): flat `--color-bg-2` pill, `--text-caption` `--color-text-primary`, padding 12. Link variant → `/tags/:tag`. **Hit area:** 40 px visual on fine pointers with a 44 px hit extension; 44 px on coarse pointers (T16-07). **Removable variant** (TagFilter): label + trailing remove button with a 44 × 44 transparent hit area and a 16 px × icon; the chip's trailing padding is 0 so the button sits flush. Chips wrap with an 8 px gap between hit areas (12 px visual gap for 40 px chips).

| State | Treatment |
|---|---|
| Default | Flat bg-2, label `--color-text-primary`, optional `#` prefix |
| Hover | `--color-accent-subtle-hover` |
| Focus | Ring (chip link, or the remove button) |
| Active | `--color-accent-subtle` |
| Selected | Current tag page: `--color-accent-subtle` fill + ring + `--color-accent-strong` 600 label + `aria-current` |
| Disabled | *n/a* (tags are always links) |
| Loading, Error, Empty | *n/a* (static content) |

**Tokens:** `--color-bg-2`, `--color-accent-subtle`, `--color-accent-subtle-hover`, `--color-selected-ring`, `--color-accent-strong`, `--radius-pill`, `--control-h-sm`, `--touch-min`, `--text-caption`, `--space-2`, `--space-3`, `--duration-fast`.

### C16 ShotCard
Pillar M — **showcase priority applies** (`.ui-shot-card`). Anatomy: 4:3 media (`.ui-shot-card__media`, `--radius-card`, `object-fit: cover`, dominant-colour placeholder via `--shot-placeholder`, no shadow, frame or tint; the whole media is the link) → meta row: Avatar sm + author name (link, `--text-label` 500) + optional Badge; right: like count and view count (`--text-metadata`, `--color-text-secondary`, 16 px icons).

| State | Treatment |
|---|---|
| Default | Flat image; meta text primary/secondary |
| Hover (fine pointer) | ShotCardActionBar (C17) fades in over the bottom of the image; the image itself is unchanged |
| Focus | Ring drawn by the link's `::after` around the media (offset 2 px onto `--color-bg`); focus-within also reveals C17 |
| Active | *n/a* for the image (navigation) |
| Selected | *n/a* (cards aren't selectable in R1) |
| Liked (by viewer) | Footer heart filled (`--color-highlight` fill, `--color-highlight-strong` stroke) |
| Disabled | *n/a* |
| Loading | Placeholder = dominant colour; image fades in (`--duration-base`; none under reduced motion) |
| Error (image fails) | Placeholder stays; centred 24 px image-off icon `--color-text-secondary` on `--color-bg-2`; alt text still exposed |
| Empty | *n/a* (grid level) |
| Touch (`hover: none`) | No overlay; LikeButton (icon) shown in the meta row |

**Tokens:** `--radius-card`, `--shadow-elevation-0`, `--color-skeleton` (placeholder fallback), `--text-label`, `--text-metadata`, `--color-text-secondary`, `--color-highlight`, `--color-highlight-strong`, `--avatar-sm`, `--icon-sm`, `--space-2`, `--space-3`, `--focus-ring-*`.

### C17 ShotCardActionBar
Pillar G (`.ui-shot-card__bar.glass-subtle`, `--blur-glass-sm`). Bottom strip of the media, inset 8 px, min-height 64 px, `--radius-control-sm` (nearest token to the nested 8 px, T16-24): title (1 line, `--text-label` 500 `--color-text-primary`) + LikeButton compact (opaque `--color-surface-elevated` 44 px circle, `--shadow-elevation-2`). R2/R3 add Save and **Message** here.

| State | Treatment |
|---|---|
| Default | Hidden (opacity 0, translateY 4 px); buttons stay in the tab order and reveal the bar on focus |
| Hover / Focus-within | Opacity 1, translateY 0, `--duration-base`, `--ease-enter` |
| Button hover / focus / pressed | Lift `--motion-lift` / ring / `scale(0.96)` |
| Selected (liked) | Heart filled `--color-highlight` with `--color-highlight-strong` stroke on the opaque button (bright fill 4.51:1, deep stroke 6.43:1) + `aria-pressed="true"` |
| Loading | Like toggles optimistically; no spinner |
| Error | Rollback + Toast |
| Disabled, Empty | *n/a* |
| Reduced motion | Opacity only (no translate, no lift, no scale) |

Only `--color-text-primary` text on this glass (9.71:1 worst case); the heart sits in an opaque button.
**Tokens:** `--glass-subtle-bg`, `--blur-glass-sm`, `--radius-control-sm`, `--space-2`, `--space-3`, `--space-4`, `--color-surface-elevated`, `--shadow-elevation-2`, `--z-raised`, `--duration-base`, `--duration-fast`, `--ease-enter`, `--motion-offset-sm`, `--motion-lift`.

### C18 ShotGrid & feed loading
Pillar M (`.gallery-grid`). `<ol>` grid: `repeat(auto-fill, minmax(min(100%, --gallery-min-col), 1fr))`, gap `--gallery-gap`. Columns 1/2/3/4 at 360/768/1024/1280, max 5 (D-24e, approved 2026-11-12). Feed status rows: `.ui-feed-status` (Load more, error row `--error`, end caption `__caption`). Loading: a sentinel loads the next 24 items automatically; a "Load more" secondary button is always present; a polite live region announces "Loaded 24 more shots".
**Focus (NFR-27, T16-05):** when the user activates **"Load more"**, focus moves to the first new card's link. Automatic (sentinel) loads never move focus.

| State | Treatment |
|---|---|
| Default | Cards |
| Loading (initial) | 12 skeleton cards (C36) |
| Loading (more) | 4 skeleton cards appended + Spinner in "Load more" (`aria-busy`) |
| Error (more) | Inline row: "Couldn't load more shots." + "Try again" button |
| Error (initial) | ErrorState (C35) in place of the grid |
| Empty | EmptyState (C34) with context copy |
| End of feed | Caption "You've reached the end" `--color-text-secondary`; "Load more" removed |
| Hover, Focus, Active, Selected, Disabled | Per card / button |

**Tokens:** `--gallery-min-col`, `--gallery-gap`, `--container-max`, `--gutter`, `--color-text-secondary`, `--text-caption`.

---

## 4. Shot detail

### C19 ShotDetailHeader
Pillar M (`.ui-detail-header`, media `.ui-content-block`; Like uses `.ui-like--labelled`). Title (`<h1>` styled `--text-h3`), author row (author link 44 px high) (Avatar md, name link; "Follow" is R2 and not rendered), right: LikeButton (C20). Below md, actions wrap under the author row.

| State | Treatment |
|---|---|
| Default | Title and author row |
| Hover / Focus | Links underline on hover; focus ring |
| Active | *n/a* (links navigate; LikeButton states in C20) |
| Loading | Skeleton lines for title and author |
| Error | Whole-page ErrorState |
| Selected, Disabled, Empty | *n/a* (static heading) |

**Tokens:** `--text-h3`, `--text-label`, `--avatar-md`, `--space-4`, `--space-6`.

### C20 LikeButton
Pillar N (`.ui-like.neu-control`, toggle). Heart icon + count. Sizes: lg 48 px pill with "Like" label + count (detail); icon-only 44 px (cards; the action-bar variant is an opaque circle, C17). **There is no crimson-filled like button** (T16-12): the liked state uses the shared selected language plus a filled crimson heart.

| State | Treatment |
|---|---|
| Default (not liked) | `--shadow-neu-raised-sm`; outline heart `--color-text-primary`; label and count `--color-text-primary` |
| Hover | `--shadow-neu-raised` + lift |
| Focus | Ring |
| Active | `--shadow-neu-pressed` |
| Selected (liked) | Primary-light inset well + 1.5 px `--color-selected-ring`; heart filled `--color-highlight` (crimson) with deep `--color-highlight-strong` stroke (5.71:1 on the well; bright fill 4.01:1); **label and count stay `--color-text-primary`** so the state is not carried by colour alone; `aria-pressed="true"`. Inside glass: `--color-accent-subtle` fill + ring (heart stroke 5.71:1) |
| Disabled | *n/a* for signed-in users; signed-out users get an enabled button that opens AuthGateModal (C32) |
| Loading | Optimistic (`useOptimistic`): state and count change instantly |
| Error | Rollback + Toast "Couldn't save your like. Try again." |
| Empty (0 likes) | Count hidden; label "Like" only |
| Reduced motion | Icon swap without scale |

**Tokens:** `--shadow-neu-raised-sm`, `--shadow-neu-raised`, `--shadow-neu-inset`, `--shadow-neu-pressed`, `--color-selected-ring`, `--color-highlight`, `--color-highlight-strong`, `--color-text-primary`, `--color-accent-subtle`, `--icon-btn`, `--icon-btn-lg`, `--radius-pill`, `--text-metadata`.

### C21 ShotActionRail
Pillar G ≥ xl only (`.ui-action-rail.ui-action-rail--floating`: the class applies subtle-glass values and flattens its controls from 1280 px; below that it is a plain row, so no glass class is ever on raised controls). ≥ xl: vertical rail at the right edge, vertically centred, `--radius-pill`, padding 8, IconButtons Share and Details (Comments is R2). Below xl: a horizontal row of the same buttons under the media, as neumorphic IconButtons on `--color-bg` (no glass).

| State | Treatment |
|---|---|
| Default | Icons `--color-text-primary` (flat on glass) |
| Hover / Focus / Active | `--color-accent-subtle-hover` / ring / `--color-bg-2` |
| Selected | Button whose modal is open: glass selected language (`--color-accent-subtle` + ring); icon stays `--color-text-primary` |
| Disabled, Loading, Error, Empty | *n/a* (local dialogs, always available) |

**Tokens:** `--glass-subtle-bg`, `--blur-glass-sm`, `--radius-pill`, `--space-2`, `--icon-btn`, `--color-accent-subtle`, `--color-accent-subtle-hover`, `--color-bg-2`, `--color-selected-ring`, `--z-header`.

### C22 ShareModal
Pillar G (Modal C48, `--container-modal-md`; share row `.ui-share-row`, copy row `.ui-copy-row`). Content: preview thumbnail (flat, `--radius-card`), title "Share this shot" `--text-h3`, external share links (X, Pinterest — no email share, FR-39) as **flat** IconButtons on an opaque `--color-bg-2` row (T16-37), "Copy link" read-only TextField + "Copy" primary button.

| State | Treatment |
|---|---|
| Default / Hover / Focus / Pressed | Per contained controls (flat on glass) |
| Selected (copied) | Button label → "Copied" with a **white check icon** (`--color-text-on-accent`, 4.51:1 on bright crimson, T16-09) for 2 s + Toast "Link copied" (success icon in the toast) |
| Loading | *n/a* (local clipboard action) |
| Error | Clipboard denied → field text auto-selected + caption "Press Ctrl+C / ⌘C to copy" (`--color-text-secondary`, 4.67:1 on modal glass) |
| Disabled, Empty | *n/a* |

**Tokens:** C48 tokens + `--radius-card`, `--color-bg-2`, `--color-accent-strong`, `--color-text-on-accent`, `--color-text-secondary`, `--text-h3`.

### C23 ShotDetailsModal
Pillar G (Modal, md; stats `.ui-stat-grid` as a `<dl>`). "Shot details" `--text-h3`; "Posted 12 Nov 2026" `--color-text-secondary`; stats grid (Views, Likes; Saves/Comments in R2): numbers `--text-h4` tabular, labels `--text-caption` `--color-text-secondary`; Tags as TagChips.

| State | Treatment |
|---|---|
| Loading | Stat skeletons if counts are fetched lazily |
| Error | "Couldn't load details" + "Try again" |
| Empty | No tags → "No tags" `--color-text-secondary` |
| Default, Hover, Focus, Active, Selected, Disabled | Per contained controls |

**Tokens:** C48 tokens + `--text-h3`, `--text-h4`, `--text-caption`, `--color-text-secondary`.

### C24 ContentBlock
Pillar M. Ordered blocks: image (≤ `--container-detail`, `--radius-card`, its own aspect ratio), text (`--text-body-lg`, `--container-reading`). Video blocks are R3 (D-18). **No effects on media.**

| State | Treatment |
|---|---|
| Loading | Dominant-colour placeholder at the block's ratio |
| Error | Image-off icon + "Image unavailable" `--color-text-secondary` |
| Default, Hover, Focus, Active, Selected, Disabled, Empty | *n/a* (static content; a shot always has ≥ 1 block) |

**Tokens:** `--container-detail`, `--container-reading`, `--radius-card`, `--text-body-lg`, `--color-text-secondary`, `--shadow-elevation-0`.

### C25 RelatedShots
Pillar M. "More by {name}" (4 cards) and "You might also like" (up to 12), each with an `--text-h4` heading and a "View profile" ghost link; reuses ShotGrid.

| State | Treatment |
|---|---|
| Loading | Skeleton cards |
| Error | Section hidden (non-critical) and logged |
| Empty | Section not rendered |
| Default, Hover, Focus, Active, Selected, Disabled | Per ShotCard / link |

**Tokens:** `--text-h4`, `--gallery-gap`, `--gallery-min-col`, `--space-6`, `--space-12`.

---

## 5. Profile

### C26 ProfileHeader
Pillar M (`.ui-profile`). Avatar **lg (64 px) below 768 px, xl (96 px) from md up**, neumorphic ring on `--color-bg`; name `--text-h2` (matches CSS), headline `--text-body-lg` `--color-text-secondary`, stats (`--text-body-sm`, values `--color-text-primary` 600). Centred below md; three columns from md. **No actions in R1** (FR-54: no "Share profile"; "Edit profile" is R2).

| State | Treatment |
|---|---|
| Loading | Skeleton avatar + 3 lines |
| Error | ErrorState (404 "This profile doesn't exist") |
| Empty | Missing headline/location omitted |
| Default, Hover, Focus, Active, Selected, Disabled | Per contained controls |

**Tokens:** `--avatar-lg`, `--avatar-xl`, `--text-h2`, `--text-body-lg`, `--text-body-sm`, `--color-text-secondary`, `--color-text-primary`, `--measure-reading`, `--space-4`, `--space-6`, `--space-8`, `--space-10`.

### C27 ProfileTabs
Pillar N. SegmentedControl (C44) of route links: **Work** (`/:username`) and **About** (`/:username/about`); "Liked" is R2. SortDropdown sits at the right on Work.

| State | Treatment |
|---|---|
| Default | Label `--color-text-primary` 500 in the inset track |
| Hover | Segment `--color-accent-subtle-hover` |
| Focus | Ring |
| Active | `--shadow-neu-pressed` |
| Selected | Segment selected language: raised-sm thumb + ring + `--color-accent-strong` 600 label, `aria-current="page"` |
| Disabled, Loading, Error, Empty | *n/a* (routes) |

**Tokens:** see C44.

### C28 ProfileAbout
Pillar M. `--color-surface-card` panel, `--radius-card-lg`, `--shadow-elevation-1`, padding 24: Biography (`--text-body-lg`), Location, Member since, Links (TextLinks with external icon), Skills (TagChips). Secondary text may use `--color-text-secondary-on-card`.

| State | Treatment |
|---|---|
| Empty | "{name} hasn't added an about section yet." `--color-text-secondary` |
| Loading | Skeleton lines |
| Error | Inline ErrorState |
| Default, Hover, Focus, Active, Selected, Disabled | Per links and chips |

**Tokens:** `--color-surface-card`, `--radius-card-lg`, `--shadow-elevation-1`, `--space-6`, `--text-body-lg`, `--color-text-secondary-on-card`, `--color-text-secondary`.

---

## 6. Auth

### C29 AuthLayout & AuthForm
Pillar M. Centred column (`--container-auth`) on `--color-bg`; BrandSlot on top; heading `--text-h2` ("Welcome back" / "Create your account"); supporting line `--color-text-secondary`. Form: Google button (secondary, full width, `--control-h-lg`), Divider "or", Email TextField (lg), "Continue with email" primary button (full width, lg), disclaimer `--text-caption` `--color-text-secondary` with links, switch link. Optional artwork panel ≥ lg (original/licensed art only, A-10; flat, `--radius-panel`). Cloudflare Turnstile (D-20) sits above the submit button. Steps: email → OTP code (C31) → UsernameStep (C33, new users).

| State | Treatment |
|---|---|
| Default | As above |
| Loading | Submit shows Spinner; status "Sending code…"; form `aria-busy`; inputs read-only |
| Error (field) | TextField error state + message |
| Error (server / rate limit) | InlineAlert (C39) above the form: "Too many attempts. Try again in 10 minutes." |
| Success (code sent) | Moves to the OTP step; heading "Check your email" |
| Hover, Focus, Active, Disabled | Per controls |
| Selected, Empty | *n/a* (form) |

**Tokens:** `--container-auth`, `--text-h2`, `--text-caption`, `--color-text-secondary`, `--control-h-lg`, `--radius-panel`, `--space-4`, `--space-6`, `--space-8`.

### C30 TextField
Pillar N (`.ui-field` + `.ui-input.neu-field`). Label above (`--text-label` 500, always visible), input `--input-h`, **`--radius-control-lg` (14) for every TextField; `.ui-input--lg` adds `--control-h-lg` for auth** (T16-23, matches the CSS); parent fill + `--shadow-neu-inset-sm` (bg-2 fill + bg-2 inset inside glass); text `--text-body`; placeholder `--color-text-secondary`; hint/error `--text-caption`.

| State | Treatment |
|---|---|
| Default | Inset field + visible label (identifying cue ≥ 3:1) |
| Hover | No change (inset fields don't animate shadows) |
| Focus | Ring (outline) |
| Active | *n/a* (text field) |
| Selected | *n/a* (value, not a choice) |
| Filled | Value `--color-text-primary` |
| Disabled | Value/label `--color-text-disabled`, `disabled` attribute |
| Read-only | Flat `--color-bg-2`, value `--color-text-primary`, no inset |
| Loading | Optional trailing Spinner 16 px (username check) |
| Error | Inset + **1.5 px inset `--color-danger` ring** (matches `.neu-field[aria-invalid]`), error icon + message `--color-danger`, `aria-invalid="true"`, `aria-describedby`; the focus ring is added on focus |
| Success | Trailing check icon `--color-success` + caption |
| Empty | Placeholder shown |

**Tokens:** `--input-h`, `--control-h-lg`, `--radius-control`, `--radius-control-lg`, `--shadow-neu-inset-sm`, `--neu-inset-sm-bg2`, `--text-label`, `--text-body`, `--text-caption`, `--color-text-secondary`, `--color-text-disabled`, `--color-danger`, `--color-success`, `--selected-ring-width`, `--space-1`, `--space-2`, `--space-4`.

### C31 OTPCodeInput
Pillar N (`.ui-otp`). **One** transparent `<input inputmode="numeric" autocomplete="one-time-code" maxlength="6">` over 6 visual inset cells (`--otp-cell-w` × `--otp-cell-h` = 48 × 56; **below 390 px `--otp-cell-w-sm` × `--otp-cell-h-sm` = 44 × 52**, so 6 cells + 5 × 8 px gaps = 304 px fit the 312 px bottom-sheet content width at 360 px; `--radius-control`, digits `--text-h4` 600 tabular). Paste fills all cells. "Resend code" ghost button with a **60 s** countdown (BR-05); "Use a different email" link.

| State | Treatment |
|---|---|
| Default | 6 inset cells; visible label "6-digit code" |
| Hover | No change |
| Focus | The active cell shows the focus ring (`.ui-otp__cell.is-active`) |
| Filled | Digits `--color-text-primary` |
| Loading | Auto-submits at 6 digits; Spinner + "Verifying…"; input read-only |
| Error | Cells get the 1.5 px `--color-danger` inset ring; message "That code didn't work. Check it or request a new one."; input cleared and refocused |
| Expired | "This code has expired." + Resend emphasised (primary) |
| Disabled | Resend disabled during the 60 s countdown: `--color-text-disabled` "Resend in 0:48" (announced once when it becomes available) |
| Active, Selected, Empty | *n/a* (single text input; empty = 6 blank cells) |

**Tokens:** `--otp-cell-w`, `--otp-cell-h`, `--otp-cell-w-sm`, `--otp-cell-h-sm`, `--radius-control`, `--space-2`, `--text-h4`, `--font-weight-semibold`, `--shadow-neu-inset-sm`, `--focus-ring-*`, `--color-danger`, `--color-text-disabled`.

### C32 AuthGateModal
Pillar G (Modal, `--container-modal-sm`; bottom sheet below md with `--radius-panel-lg` top corners). Opened by gated actions (like). Intent heading "Sign in to like this shot"; body `--color-text-secondary`; Google (on-glass button) + email continue; after sign-in the pending action completes once (FR-15) and focus returns to the trigger. Escape, scrim click and the close button all close.
States: as C29 and C48.
**Tokens:** C48 tokens + `--container-modal-sm`, `--radius-panel-lg`, `--color-text-secondary`.

### C33 UsernameStep
Pillar M composition. Heading "Choose your username", TextField with `@` prefix, live availability check (debounced **300 ms**, FR-17), preview "trippple.app/{username}" (domain placeholder until D-01) `--color-text-secondary`, primary "Continue".

| State | Treatment |
|---|---|
| Default | Empty field; Continue `aria-disabled` until valid |
| Loading | Trailing Spinner in the field; live region "Checking availability…" |
| Success | Check icon + "@{name} is available" `--color-success` |
| Error | Taken: "That username is taken" + 2 suggestions as buttons; invalid format: rule text; reserved word: "That username isn't available" |
| Disabled | Continue `aria-disabled` (focusable, reason in its description) until valid and available |
| Hover, Focus, Active | Per controls |
| Selected, Empty | *n/a* (single field) |

**Tokens:** C30 tokens + `--color-success`, `--color-text-secondary`, `--text-h2`.

---

## 7. Feedback

### C34 EmptyState
Pillar M (`.ui-state`). Centred in the content area, padding 64/16: 48 px line icon `--color-accent` (≥ 3:1), title `--text-h4`, one sentence `--color-text-secondary` (max 44ch), optional one action. No people illustrations; no decoration. Variants: no search results ("No shots match '…'" + "Clear filters"), empty profile work, empty tag.
States: action button states only; others *n/a* (static).
**Tokens:** `--color-accent`, `--text-h4`, `--color-text-secondary`, `--space-3`, `--space-4`, `--space-16`.

### C35 ErrorState
Pillar M (`.ui-state.ui-state--error`). Same layout as EmptyState with an alert icon in `--color-danger`; title, explanation, actions "Try again" (primary) and "Go home" (ghost). Variants: 404 page (minimal chrome + BrandSlot), 500/boundary page, inline section error. Never exposes technical details.
States: buttons per C40; others *n/a*.
**Tokens:** `--color-danger`, `--text-h4`, `--color-text-secondary`, `--space-3`, `--space-16`.

### C36 Skeleton
Pillar M (`.ui-skeleton`). Shapes mirror the final layout (card 4:3, text lines 12 px high, avatar circle). `--color-skeleton` flat fill that pulses to `--color-skeleton-shine` (`--duration-shimmer`, ease-in-out, infinite; **no gradient**, A-17); reduced motion: static. Container `aria-busy="true"`; skeletons `aria-hidden`. Decorative: not subject to contrast.
States: loading only; others *n/a*.
**Tokens:** `--color-skeleton`, `--color-skeleton-shine`, `--duration-shimmer`, `--radius-card`, `--radius-pill`.

### C37 Spinner
Pillar M (structural, `.ui-spinner`). 16/20/24 px ring: **arc `--color-accent-strong`, transparent track** (T16-10; ≥ 4.01:1 on every surface incl. worst-case glass); on primary buttons the arc is `--color-text-on-accent`. Rotation `--duration-spin` (900 ms, linear). **Reduced motion: static three-quarter arc** (the global rule stops the loop), always paired with visible or visually hidden text ("Loading").
States: *n/a* (indicator only).
**Tokens:** `--color-accent-strong`, `--color-text-on-accent`, `--duration-spin`, `--icon-sm`, `--icon-md`, `--icon-lg`.

### C38 Toast
Pillar G (`.ui-toast.glass-panel`, `--blur-glass-md`, `--radius-card`, `--shadow-glass-md`). Region bottom-centre, width `min(420px, 100vw − 2 × gutter)`, max 3 stacked with an 8 px gap (separate panels, never overlapping). Anatomy: status icon (success `--color-success`, error `--color-danger`, info `--color-text-secondary`), message `--text-body-sm` `--color-text-primary`, optional action (ghost button, `--color-text-primary` underlined), close IconButton. No FAB exists in R1, so there is no placement conflict (T16-26); if the reserved FAB is used later, the toast region sits above it.

| State | Treatment |
|---|---|
| Enter | Fade + rise from 8 px, `--duration-moderate`, `--ease-enter` |
| Default | Visible ≥ 5 s (errors 8 s; with an action ≥ 10 s); timer pauses on hover/focus |
| Hover / Focus | Timer paused; ring on buttons |
| Exit | Fade, `--duration-exit-moderate` |
| Error variant | Danger icon; `role="alert"` (other toasts `role="status"`) |
| Reduced motion | Fade only, no rise |
| Selected, Disabled, Loading, Empty | *n/a* (transient message) |

**Tokens:** `--glass-panel-bg`, `--blur-glass-md`, `--radius-card`, `--shadow-glass-md`, `--color-success`, `--color-danger`, `--color-text-secondary`, `--color-text-primary`, `--text-body-sm`, `--space-2`, `--space-3`, `--space-4`, `--space-6`, `--z-toast`, `--duration-moderate`, `--duration-exit-moderate`, `--motion-offset-md`.

### C39 InlineAlert
Pillar M (`.ui-alert`). Full-width block, `--radius-control`, padding 12/16, `--shadow-elevation-1`, fill `--color-danger-subtle` / `--color-success-subtle`; icon and text in the matching `--color-danger` (5.24:1) / `--color-success` (5.11:1), matching the CSS. Optional dismiss button.
States: dismiss button states; others *n/a*.
**Tokens:** `--color-danger-subtle`, `--color-danger`, `--color-success-subtle`, `--color-success`, `--radius-control`, `--shadow-elevation-1`, `--text-body-sm`, `--space-3`, `--space-4`.

---

## 8. Primitives

### C40 Button
Variants (`.ui-btn`):

| Variant | Class | Pillar | Default | Hover | Pressed | Disabled | Use |
|---|---|---|---|---|---|---|---|
| Primary | `--primary` | M | `--color-accent-strong` fill, `--color-text-on-accent` 600 | `--color-accent-strong-hover` | `--color-accent-strong-pressed` | `--color-skeleton` fill, `--color-text-disabled` | One main action per region |
| Secondary | `--secondary` + `.neu-control` | N | Parent fill, `--shadow-neu-raised-sm`, `--color-text-primary` 600 | Raised + lift | `--shadow-neu-pressed` | Flat, `--color-text-disabled` | Most actions on `bg`/`bg-2` |
| Secondary-on-glass | `--on-glass` | M | `--color-surface-card` fill, `--glass-hairline`, `--color-text-primary` 600 | `--color-accent-subtle-hover` | `--color-bg-2` | `--color-text-disabled` | Header "Log in", drawer, modals, toasts (T16-02) |
| Ghost | `--ghost` | M | No fill, `--color-text-primary` 600 | `--color-accent-subtle-hover` | `--color-accent-subtle` | `--color-text-disabled` | Low emphasis (Clear, Resend) |

There is no Highlight variant (T16-12; the liked state lives in C20). Sizes: md 44 (default), lg 52 (`--lg`); `--radius-pill`; padding-inline 20 (md) / 24 (lg); icon 20 with an 8 px gap.

| State | Treatment |
|---|---|
| Focus | Ring |
| Selected | Toggle buttons only (C12 toggle, C20): selected language |
| Disabled | Per the table; `cursor: not-allowed`; real `disabled` unless it must stay focusable (then `aria-disabled` + description) |
| Loading | `aria-busy="true"`: label hidden visually (kept in the accessible name), Spinner shown, width locked, clicks ignored; progress text ("Sending code…") is announced by the page status region (T16-36) |
| Error | *n/a* (errors show near the field/region) |
| Empty | *n/a* |
| Reduced motion | No lift |

**Tokens:** `--color-accent-strong`, `--color-accent-strong-hover`, `--color-accent-strong-pressed`, `--color-text-on-accent`, `--color-surface-card`, `--glass-hairline`, `--color-accent-subtle`, `--color-accent-subtle-hover`, `--color-bg-2`, `--color-skeleton`, `--color-text-disabled`, neumorphic shadow set, `--control-h-md`, `--control-h-lg`, `--radius-pill`, `--space-2`, `--space-5`, `--space-6`, `--text-label`, `--duration-fast`, `--duration-base`.

### C41 IconButton
Pillar N (`.ui-icon-btn.neu-control`). Circle `--icon-btn` 44 (sm 40 with a −2 px `::before` hit extension; lg 48), `--radius-pill`, `--shadow-neu-raised-sm` on `bg`/`bg-2`; inside glass it is flattened (transparent, `--color-accent-subtle-hover` hover). Icon 20 px `--color-text-primary`; `--color-text-secondary` allowed for low emphasis **except on `glass-subtle`, where icons are `--color-text-primary` only** (T16-35). Always has an accessible name and a Tooltip.

| State | Treatment |
|---|---|
| Hover | Raised + lift (flat tint on glass) |
| Focus | Ring |
| Pressed | `--shadow-neu-pressed` (`--color-bg-2` on glass) |
| Selected (toggle) | Selected language (inset + ring on bg; accent-subtle + ring on glass) + `aria-pressed` |
| Disabled | Flat, icon `--color-text-disabled` |
| Loading | Icon → Spinner |
| Error, Empty | *n/a* (action control) |
| Reduced motion | No lift |

**Tokens:** `--icon-btn`, `--icon-btn-sm`, `--icon-btn-lg`, `--icon-md`, `--icon-stroke`, `--radius-pill`, neumorphic shadow set, `--color-text-primary`, `--color-text-secondary`, `--color-text-disabled`, `--color-accent-subtle-hover`.

### C42 FAB — R2+ (not R1)
Pillar N (`.ui-fab`). 56 px circle, `--shadow-neu-raised-lg` (the only raised-lg in the system), icon 24 `--color-text-primary`. **Not used in R1**: no R1 journey needs it (UJ-01…UJ-05, V-11; T16-16). The candidate use ("Back to top" on long mobile feeds) is deferred until a journey requires it. If adopted: bottom-right, `--gutter` from the edge plus the safe-area inset, focus moves to `#main` after activation, and the toast region sits above it.
States (when used): hover lift; focus ring; pressed `--shadow-neu-pressed`; selected, disabled, loading, error, empty *n/a* (single action).
**Tokens:** `--fab`, `--shadow-neu-raised-lg`, `--shadow-neu-pressed`, `--radius-pill`, `--icon-lg`, `--z-sticky`, `--gutter`, `--space-6`.

### C43 Toggle (switch) — reserved (not R1)
Pillar N (`.ui-switch`). Track 44 × 26 (hit 44 × 44), `--radius-pill`. **No R1 use**; specified so R2 settings inherit an approved design.

| State | Treatment |
|---|---|
| Off | Track `--shadow-neu-inset-sm` + 1 px inset `--color-control-boundary` ring (4.64:1 on the soft-grey track); thumb 20 px `--color-surface-elevated` raised-sm |
| On (= Selected) | Track bright crimson `--color-accent-strong` fill (4.51:1 vs bg); thumb moves right (4.51:1 vs track) |
| Hover | Thumb raised |
| Focus | Ring around the control |
| Active | Thumb pressed |
| Disabled | Track boundary `--color-text-disabled`; label `--color-text-disabled` |
| Loading | 12 px spinner in the thumb; `aria-busy` |
| Error | Reverts + caption or Toast |
| Empty | *n/a* (binary) |

**Tokens:** `--switch-w`, `--switch-h`, `--touch-min`, `--radius-pill`, `--shadow-neu-inset-sm`, `--shadow-neu-raised-sm`, `--color-control-boundary`, `--color-accent-strong`, `--color-surface-elevated`, `--color-text-disabled`, `--duration-base`, `--space-3`.

### C44 SegmentedControl
Pillar N (`.ui-segmented`). Inset track (`--shadow-neu-inset`, `--radius-pill`, padding 4, 4 px between segments); segments 44 px. **Selected segment = raised-sm thumb in the parent colour + 1.5 px ring + `--color-accent-strong` 600 label** (matches CSS; the sanctioned "segment" form of the selected language because the track is already inset, T16-11). Used as a radio group (mobile timeframe) or as navigation links (profile tabs).

| State | Treatment |
|---|---|
| Default | Labels `--color-text-primary` 500 |
| Hover | `--color-accent-subtle-hover` segment |
| Focus | Ring |
| Pressed | `--shadow-neu-pressed` |
| Selected | Thumb + ring + accent label (`aria-checked` or `aria-current`) |
| Disabled | Segment `--color-text-disabled` |
| Loading, Error, Empty | *n/a* (static options) |

Segments are 44 × 44 targets, so the 4 px gap meets A11Y-07 (spacing applies only to hit-extended targets).
**Tokens:** `--shadow-neu-inset`, `--shadow-neu-raised-sm`, `--shadow-neu-pressed`, `--color-selected-ring`, `--selected-ring-width`, `--color-accent-strong`, `--color-accent-subtle-hover`, `--radius-pill`, `--control-h-md`, `--space-1`, `--space-4`.

### C45 Avatar
Pillar N at lg/xl on `bg`/`bg-2` (raised-sm ring with a 3/4 px parent-colour border) / M at xs–md (flat circle). **Avatars inside glass are always flat** (T16-02). Fallback initials `--color-text-primary` 600 on `--color-support-subtle` (lavender tint, 13.23:1), so crimson stays reserved for actions. Linked avatars take their link's focus ring.

| State | Treatment |
|---|---|
| Loading | Skeleton circle |
| Error (image fails) | Initials fallback |
| Hover (linked) | `--color-accent-subtle-hover` halo (flat) |
| Focus | Ring |
| Active, Selected, Disabled, Empty | *n/a* (image; AccountMenu open state is on C07) |

**Tokens:** `--avatar-xs`…`--avatar-xl`, `--radius-pill`, `--shadow-neu-raised-sm`, `--color-accent-subtle`, `--color-accent-strong`, `--color-accent-subtle-hover`, `--text-metadata`, `--text-h4`, `--text-h3`.

### C46 Badge
Pillar M (`.ui-badge`). Pill, height 20, padding-inline 8, `--text-metadata` 600. Variants: neutral (`--color-bg-2` + `--color-text-primary`), accent (`--color-accent-subtle` + `--color-accent-strong`, e.g. "New", filter count), highlight (`--color-highlight-subtle` + `--color-text-primary`, e.g. "Featured"). Non-interactive; states *n/a*. The word carries the meaning, never the colour alone.
**Tokens:** `--color-bg-2`, `--color-accent-subtle`, `--color-accent-strong`, `--color-highlight-subtle`, `--color-text-primary`, `--radius-pill`, `--text-metadata`, `--space-2`.

### C47 Tooltip
Pillar G (`.ui-tooltip.glass-panel`, `--blur-glass-md`, `--radius-control-sm`, **padding 4/8** (T16-13), `--text-caption` `--color-text-primary`, max width 240). Shows after a 400 ms hover or immediately on focus; hides on Escape, blur or pointer leave; hoverable (WCAG 1.4.13). Never interactive. Inside a modal it is opaque `--color-surface-elevated` (no stacked glass).
States: shown / hidden only; others *n/a*.
**Tokens:** `--glass-panel-bg`, `--blur-glass-md`, `--radius-control-sm`, `--space-1`, `--space-2`, `--text-caption`, `--color-surface-elevated`, `--z-tooltip`.

### C48 Modal (base)
Pillar G (`.ui-modal.glass-modal`, `--blur-glass-lg`, `--radius-panel`, `--shadow-glass-lg`, `--glass-border`, `--glass-highlight`) on `.glass-scrim` (never blurred). Header: title `--text-h3` + close IconButton (flat); body padding 32 (24 below md); footer actions right-aligned (stacked full width below md). Below md: bottom sheet with `--radius-panel-lg` top corners. Max height `100dvh − 40px` with internal scroll.

| State | Treatment |
|---|---|
| Enter | Scrim fade; panel opacity 0 → 1, translateY 8 → 0, scale 0.98 → 1, `--duration-slow`, `--ease-enter` |
| Exit | Reverse, `--duration-exit-slow`, `--ease-exit` |
| Reduced motion | Opacity only |
| Reduced transparency / no backdrop-filter | Opaque `--glass-fallback-bg` |
| Loading | Body skeleton; close always available |
| Error | InlineAlert inside the body |
| Hover, Focus, Active, Selected, Disabled, Empty | Per contained controls |

**Tokens:** `--glass-modal-bg`, `--blur-glass-lg`, `--glass-saturate`, `--glass-border`, `--glass-highlight`, `--glass-hairline`, `--shadow-glass-lg`, `--color-scrim`, `--radius-panel`, `--radius-panel-lg`, `--container-modal-sm`, `--container-modal-md`, `--space-4`, `--space-6`, `--space-8`, `--space-10`, `--z-scrim`, `--z-modal`, `--duration-slow`, `--duration-exit-slow`, `--ease-enter`, `--ease-exit`, `--motion-offset-md`, `--motion-scale-enter`.

### C49 Menu / Listbox (base)
Pillar G (`.ui-menu.glass-panel`, `--radius-card-lg`, **padding 8** (T16-13), `--shadow-glass-md`, min width 220). Items 44 px, `--radius-control`, `--text-label` `--color-text-primary`, optional leading icon `--color-text-secondary`, trailing check for the selected option. Inside modals: opaque `--color-surface-elevated`.

| State | Treatment |
|---|---|
| Default | Items as above |
| Hover | `--color-accent-subtle-hover` row |
| Focus / active descendant | Same row tint (`[data-highlighted]` / `:focus-visible`) + ring for roving-focus menus |
| Active | `--color-accent-subtle` row |
| Selected | Deep crimson check icon `--color-accent-deep` (4.87:1 worst case) + **600 label in `--color-text-primary`** (one selected language; crimson text would also pass here) + `aria-selected`/`aria-checked` |
| Disabled | Item `--color-text-disabled`, `aria-disabled` |
| Loading | 3 skeleton rows |
| Empty | One non-interactive row "No options" |
| Error | Row "Couldn't load" + retry item |

**Tokens:** `--glass-panel-bg`, `--blur-glass-md`, `--radius-card-lg`, `--radius-control`, `--shadow-glass-md`, `--space-2`, `--space-3`, `--touch-min`, `--text-label`, `--color-text-primary`, `--color-text-secondary`, `--color-accent-strong`, `--color-accent-subtle`, `--color-accent-subtle-hover`, `--color-text-disabled`, `--color-border-subtle` (separator), `--z-dropdown`.

### C50 TextLink
Pillar M (structural, `.text-link`). `--color-text-link` on opaque surfaces and modal glass; `--color-text-primary` underlined on subtle/panel glass. Running-text links underlined (offset 0.2em, thickness 1 px → 2 px on hover); nav links underline on hover only. External links add a 16 px external icon + "(opens in new tab)" visually hidden.

| State | Treatment |
|---|---|
| Default / Hover / Focus | As above; focus ring |
| Active | *n/a* (no pressed style; navigation is immediate) |
| Visited | Same colour (no visited state) |
| Disabled | *n/a* (a link that can't be followed is rendered as text) |
| Selected | Navigation current page: see the selected language |
| Loading, Error, Empty | *n/a* |

**Tokens:** `--color-text-link`, `--color-text-primary`, `--icon-sm`.

### C51 Divider
Pillar M (structural, `.ui-divider`). 1 px `--color-border-subtle` line (decorative; `role="separator"` only between menu groups); text divider "or" `--text-caption` `--color-text-secondary` between two lines. States *n/a*.
**Tokens:** `--color-border-subtle`, `--color-text-secondary`, `--text-caption`, `--space-3`.

---


### C52 Card (content container) — v2

Pillar M (`.ui-card`; `.ui-card--muted` on soft grey with `.neu-context-bg2`). White surface on the warm page, `--radius-card-lg`, padding 24, inset 1 px `--color-border-subtle` hairline + `--shadow-elevation-1`; title `--text-h4`, meta `--text-body-sm` `--color-text-secondary`. Used for profile About, author card and grouped settings. **Never wraps showcase media** (C16 stays frameless) and never gets crimson borders (user §3.5).
States: static container; contained controls carry their own states. Muted variant hosts classic neumorphic controls.
**Tokens:** `--color-surface-card`, `--color-bg-2`, `--color-border-subtle`, `--shadow-elevation-1`, `--radius-card-lg`, `--space-6`, `--text-h4`, `--text-body-sm`, `--color-text-secondary`.

### Notification indicator (C41 add-on) — R3, reserved

`.ui-dot`: bright crimson count pill (18 px, white 11 px 600 count, 4.51:1) with a 2 px surface ring, top-right of an IconButton. Always paired with an accessible name ("Notifications, 3 unread"); the dot itself is `aria-hidden`. Not on any R1 screen.

## 9. Screen → component map (R1)

| Screen | Route | Components |
|---|---|---|
| Home / explore feed | `/`, `/shots/popular[/:category]`, `/shots/recent[/:category]` | C01–C08, C09 (hero on `/`), C10, C11, C12–C14, C16–C18, C34–C38 |
| Search results | `/search/:term` | C01–C09, C16–C18, C34–C38 — **no explore filter bar** (no C10–C14, FR-31); C34 no-results variant |
| Tags | `/tags`, `/tags/:tag` | C15, C16–C18, C34 |
| Shot detail | `/shots/:id-:slug` | C19–C25, C32, C38, C45, C46 |
| Profile | `/:username`, `/:username/about` | C26–C28, C11, C16–C18, C34, C44, C45 |
| Log in / sign up | `/login`, `/signup` | C29–C31, C39, C40, C51 |
| Username step | `/onboarding` | C33, C30, C40 |
| Auth gate | modal on any page | C32, C48 |
| 404 / error | system | C35 |

C42 FAB (R2+) and C43 Toggle (reserved) appear on no R1 screen.

## 10. To re-verify against USER_JOURNEYS.md (P01-04)

`docs/01-requirements/USER_JOURNEYS.md` was being written concurrently and did not exist when this catalogue was drafted (2026-11-12). The R1 screen list above was derived from D-02, [PROJECT_ASSESSMENT §8](../00-project-assessment/PROJECT_ASSESSMENT.md#8-navigation-structure-clone-information-architecture) and the reverse-engineering docs. When P01-04 lands, check:

| # | Item to verify | Assumption made here |
|---|---|---|
| V-1 | Profile URL scheme (M-11: `/:username` vs `/@username`) | `/:username`; components are route-agnostic |
| V-2 | Is there a hero search on the home page? | Header search everywhere; hero search optional, would reuse C09 at `--control-h-lg` |
| V-3 | Does R1 include "Liked shots" on profiles? | No (R2 per D-02 IA); C27 has room for a third segment |
| V-4 | Sign-in options and step order (Google + email OTP; username only for new users) | As D-03 + D-02 note |
| V-5 | Signed-out like → auth gate → auto-complete the like after sign-in | Yes (`return_to` + intent) |
| V-6 | Search scope in R1 (shots only? tag search?) | Shots only; no type dropdown |
| V-7 | Sign-out location and account menu items | AccountMenu: Profile, Sign out |
| V-8 | Explore categories list and naming | Discover + categories from seed data (superseded: default pill is "All", BR-89) |
| V-9 | Shot detail prev/next navigation in R1 | Not catalogued; add IconButtons if required |
| V-10 | Empty/error copy per journey | Placeholder copy here; final copy in P06 |
| V-11 | Any journey needing toggle (C43), FAB (C42) or warning colour | None assumed |

### 10.1 Verification result (lead, 2026-11-12, against P01 documents)

| # | Result | Source |
|---|---|---|
| V-1 | Open: profile URL shape is OQ-02 (needed by 2026-11-26). Components stay route-agnostic, so no change needed | [OPEN_QUESTIONS](../01-requirements/OPEN_QUESTIONS.md) |
| V-2 | **Changed:** the homepage hero **does** include a search block in R1 (Shots only; Designers tab R2, Services tab R3). **The hero search is an R1 component**: C09 at `--control-h-lg` (neumorphic inset), no type dropdown in R1 | FR-21 |
| V-3 | Confirmed: Liked shots tab is R2 (owner only) | FR-57 |
| V-4 | Confirmed: Google + email code; username step for new users only | FR-10…FR-13, FR-17 |
| V-5 | Confirmed: after sign-in from the gate, the pending like completes exactly once (idempotent). The gate modal **closes on Escape** | FR-15, UJ-03, BR-15 |
| V-6 | Confirmed: search is Shots only in R1 | FR-21, FEATURE_INVENTORY D-08 |
| V-7 | Confirmed: avatar menu R1 = View profile, Sign out | FR-14 |
| V-8 | Confirmed: 8 category pills; unknown category → 404. **Update (designer v1.1, per BR-89): the default pill is labelled "All", not "Discover"** | FR-22, BR-89 |
| V-9 | Confirmed: prev/next is R2, so not catalogued for R1 | FR-44 |
| V-10 | Unchanged: final copy is written in P06 | — |
| V-11 | Confirmed: no R1 journey needs a toggle, FAB or warning colour | Journeys UJ-01…UJ-05 |

**P05-05 outcome:** catalogue verified against P01-04, with one change (V-2). Ready for review.

**v1.1 follow-up (designer):** V-2 is applied in C09 and §9 (hero variant); V-7 wording "View profile" is applied in C07; V-8 "All" is applied in C10; V-11 is applied by marking C42 as R2+ and C43 as reserved.

**v1.1 requirement alignment (P06 wireframe review; requirements are authoritative within the approved scope):** default pill "All" (BR-89, C10); neutral labels "Recent" (C05, C11), "Trending now / Past 7 days / Past 30 days / Past 12 months / All time" (C14) and "Message" instead of "Get in touch" (C17); OTP resend countdown 60 s (BR-05, C31); username debounce 300 ms (FR-17, C33); one tag in R1 (FR-25, C13); no email share (FR-39, C22); no "Share profile" (FR-54, C26); no explore filter bar on search results (FR-31, §9); FAB not in R1 (V-11, C42); OTP small cells below 390 px (C31); profile avatar 64 px below 768 px (C26).

## 11. Implementation alignment (`design-system/` CSS)

Where v1.0 of this catalogue differed from the implemented foundation CSS, v1.1 follows the CSS: skip-link style (C02), flat avatar and on-glass buttons in glass (C03, C06, C07), 44 px pills (C10), flat TagChip (C15), liked = inset + filled heart (C20), segment thumb (C44), field error ring (C30), OTP cell size/focus (C31), profile name `--text-h2` (C26), state icon 48 px (C34), alert text colours (C39), primary disabled fill and ghost label colour (C40), tooltip/menu padding (C47, C49).

Where the CSS broke a rule in this catalogue or the constitution, the catalogue kept the rule and the CSS was fixed. **All nine items were fixed on 2026-11-13** (X3 earlier, with T16-10) and verified by T-33 v1.2 ([DESIGN_QA_CHECKLIST §4](../08-testing/design/DESIGN_QA_CHECKLIST.md#4-defects-found-and-fixed-in-this-run-2026-11-13)):

| # | CSS location | Issue | Rule | Status |
|---|---|---|---|---|
| X1 | `controls.css` `.ui-chip` | 40 px min-height with no 44 px hit extension on fine pointers | A11Y-07, C15 | Fixed |
| X2 | `controls.css` `.ui-pill--sm` | 40 px with no hit extension, and `.ui-pill-row` keeps an 8 px gap | A11Y-07, C10 | Fixed |
| X3 | `controls.css` `.ui-spinner`, `.ui-btn[aria-busy]::before` | Arc uses `--color-accent` (2.89:1 inside panel glass) and a literal `0.9s` | C37, T-15, tokens-only rule (`--duration-spin`) | Fixed |
| X4 | `overlays.css` `.ui-menu__item[aria-selected/checked]` | Selected label in `--color-accent-strong` on panel glass (4.26:1 < 4.5) | C49, COLOR §7 | Fixed |
| X5 | `controls.css` `.ui-like[aria-pressed="true"]` | Sets the button `color` to `--color-highlight-strong`; any visible "Like/Liked" label becomes pink-strong text (3.76:1 < 4.5). Only the count is overridden | C20 | Fixed |
| X6 | `glassmorphism.css` header comment | States panel glass allows "secondary text" (fails 4.16:1); only `.glass-subtle .text-secondary` is remapped | COLOR §7 | Fixed |
| X7 | `neumorphism.css`, `controls.css` forced-colors | Only `.neu-*` and glass get a forced-colours border; `.ui-btn--primary/--on-glass/--ghost`, `.ui-chip`, `.ui-segmented__item`, `.ui-switch__track` (boundary is an inset shadow) and plain `.ui-input` have none; selected and invalid rings are box-shadows and disappear | A11Y-15 | Fixed |
| X8 | `controls.css` `.ui-btn--primary:active` | `translateY(1px)` on press | CONST §7 (no translate when pressed) | Fixed |
| X9 | `content.css` `.ui-avatar--lg/--xl` | Raised ring is not flattened inside glass | C45, CONST §3.2 | Fixed |

## 12. Gallery columns and desktop-nav breakpoint (D-24e) — resolved

**Outcome (2026-11-12):** the user accepted the defaults, and D-24(e) was resolved to **Option A for both** (the design-system values): 1/2/3/4 columns at 360/768/1024/1280, max 5 (container 1680 px), and the desktop nav from 1024 px. FR-01 and NFR-28 were updated to match (REQUIREMENTS_SPECIFICATION Revision 1). The analysis below is kept for traceability; its "Recommendation: Option B" lines were **not** adopted. Reverse-engineering trace: [RE_TO_DESIGN_MAPPING L-9 and I-1](RE_TO_DESIGN_MAPPING.md#7-inconsistencies-found-and-recommendations).

### 12.1 Gallery columns (T16-03)

| | Option A — keep tokens (proposed today) | Option B — meet NFR-28 |
|---|---|---|
| Rule | `auto-fill`, min column 264 px, gaps 16/24/32, `--container-max` 1680 | Explicit `--gallery-cols`: 1 below 600, 2 at 600–1023, 3 at 1024–1439, 4 at 1440–1919, 6 at ≥ 1920; remove the 1680 cap for the grid |
| Columns at 360/390/768/1024/1280/1440/1920 | 1/1/2/3/4/4/5 (2 from 591, 3 from 903, 4 from 1207, 5 from 1591; never 6) | 1/1/2/3/3/4/6 |
| Card width at 1280 | ≈ 280 px | ≈ 379 px (larger thumbnails) |
| Changes needed | Revise NFR-28 column text (recorded decision); T-18/T-26 assert ranges | Add two layout-only breakpoints (600, 1920) and `--gallery-cols` to `design-tokens.css`/`base.css`; no requirement change |
| Risk | Denser grid at laptop widths; column jumps at non-gate widths are hard to describe in tests | Two extra media queries; at 1920 cards are ≈ 270 px wide |

**Recommendation: Option B (meet NFR-28).** NFR-28 is already approved and was derived from observed behaviour, so keeping it avoids reopening a requirement. Explicit column counts make T-18/T-26 checks exact instead of range-based. Three columns at 1280 gives about 380 px thumbnails, which serves showcase priority better than four at about 280 px. The cost is a two-line token change plus a 600/1920 layout query, and the 1920 px no-scroll width (already in NFR-28) is added to CONST §8 either way.

### 12.2 Desktop-nav breakpoint (T16-04)

| | Option A — 1024 px (proposed today, CSS `64rem`) | Option B — 1280 px (requirement) |
|---|---|---|
| Behaviour | Full nav at 1024+; burger below | Full nav at 1280+; burger and drawer 1024–1279 |
| Changes needed | Revise REQ navigation row (L47) | Change `.ui-header__nav` / burger query from `64rem` to `80rem`; update C05/C06 and CG §1.3 |
| R1 fit | Brand, search, Explore, Tags and auth fit in ≈ 960 px | Fits easily |
| R2/R3 impact | Adding Hire talent, Get hired, Upload and Notifications will not fit at 1024; the breakpoint would move later (visual churn, re-baselined screenshots) | Room for the R2/R3 menus without changing the breakpoint |

**Recommendation: Option B (1280 px).** It keeps the approved requirement and is the stable choice: the R2/R3 menus (Hire talent, Get hired, Upload, Notifications) would not fit beside the search field at 1024 px, which would force a breakpoint change and new screenshot baselines later. Laptop users between 1024 and 1279 px lose nothing important, because the header search stays visible from 768 px and the drawer holds the same links. The implementation is one media-query value in `overlays.css`.
