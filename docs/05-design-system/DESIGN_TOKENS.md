# Design Tokens

| Field | Value |
|---|---|
| Task | P05-04 |
| Version | 2.1 — 2026-11-13: revision 2.1 (A-17): primary brightened to `#DF2F4D` (fills), deep `#B3263E` for text and indicators (new `--color-accent-deep`), white background, tints re-derived, no gradients (skeleton pulses between flat colours). Earlier: 2.0 identity v2 (A-16). For review (G3-R2) |
| Date | 2026-11-12 |
| Depends on | [COLOR_SYSTEM](COLOR_SYSTEM.md) v2 (P05-02), [TYPOGRAPHY_SYSTEM](TYPOGRAPHY_SYSTEM.md) (P05-03), A-16, D-06, D-26 |
| Theme | **Light only** for R1. Dark mode is deferred (M-12); semantic names are theme-neutral so a dark set can be added later without renaming |
| Implementation | **Implemented** in [`design-system/styles/design-tokens.css`](../../design-system/styles/design-tokens.css) (A-12, 2026-11-12); the Next.js app imports it in P10-01. That file is the single place raw values live; this document is its specification and must stay in sync |

Tokens are the single source of every colour, shadow, blur, radius, spacing, type and motion value (A-05). Components use **semantic** tokens only; raw palette tokens exist so semantic tokens have something to point at.

---

## 1. Conventions

| Layer | Prefix | Example | Who may use it |
|---|---|---|---|
| Raw palette | `--palette-*` | `--palette-crimson-600` | Only semantic tokens |
| Semantic | `--color-*`, `--shadow-*`, `--radius-*`, `--text-*`, … | `--color-accent-strong` | Components (via Tailwind utilities or `var()`) |
| Component | `--<component>-*` | `--header-h` | One component family |

- Names are kebab-case, describe **role not value** (`text-secondary`, not `grey-600`), and never include a hex or px value.
- Files: `design-system/styles/design-tokens.css` (all raw and semantic tokens, implemented) and, from P10-01, `src/app/globals.css` (Tailwind `@theme` mapping only). Raw hex and px shadow values appear **only** in `design-tokens.css`; CI greps for hex literals elsewhere (rule for P08).

## 2. Colour

Identity v2.1 (A-16, A-17): **Premium Crimson + White + Soft Grey + Charcoal**, no gradients. Contrast evidence: [T-15 v2.1](../08-testing/design/T-15_CONTRAST_REPORT.md) (131 pairs, 0 failures).

### 2.1 Raw palette

| Token | Value | Source |
|---|---|---|
| `--palette-crimson-50` | `#FCEEF1` | Primary light — 8% of crimson-500 (A-17) |
| `--palette-crimson-100` | `#FBE2E6` | Hover tint — 14% of crimson-500 (A-17) |
| `--palette-crimson-200` | `#F5C1CA` | Primary border — 30% of crimson-500 (A-17) |
| `--palette-crimson-500` | `#DF2F4D` | Primary, brightened +24.5% (A-17) |
| `--palette-crimson-600` | `#B3263E` | Primary deep / hover (former primary) |
| `--palette-crimson-700` | `#941D33` | Primary pressed (former hover) |
| `--palette-warm-0` | `#FFFFFF` | Approved (background and surface, A-17) |
| `--palette-warm-50` | `#F2F0F0` | Approved (secondary surface, soft grey) |
| `--palette-warm-100` | `#EAE7E8` | Approved (tertiary surface) |
| `--palette-warm-150` | `#E7E1E3` | Approved (border) |
| `--palette-warm-400` | `#969096` | Approved (muted text) |
| `--palette-warm-600` | `#706A70` | Approved (secondary text) |
| `--palette-warm-900` | `#252326` | Approved (primary text) |
| `--palette-lavender-50` / `-500` | `#EEEBF4` / `#8D7AB8` | Derived tint (D-26) / approved supporting accent |
| `--palette-sage-50` / `-500` / `-700` | `#ECF0ED` / `#829889` / `#556359` | Derived tint (D-26) / approved / derived success text (D-26) |
| `--palette-gold-50` / `-500` | `#F6F0E6` / `#C69A55` | Derived tint (D-26) / approved supporting accent |
| `--palette-sienna-50` / `-700` | `#F8EEEA` / `#9A3412` | **Proposed** danger tint / danger (D-26) |

### 2.2 Semantic colour

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | warm-0 | Page, content areas, gallery sections; parent of soft-grey controls |
| `--color-bg-2` | warm-50 | Soft grey: neumorphic control fills (via `--neu-fill`), inset fields, filter panel, footer, muted cards, chips |
| `--color-bg-3` | warm-100 | Tertiary: skeletons, pressed fills inside glass — **primary text only** |
| `--color-surface-card` | warm-0 | Content cards (C52), about panel |
| `--color-surface-elevated` | warm-0 | Opaque buttons over media; glass fallback; segmented thumb |
| `--color-border-subtle` | warm-150 | Decorative hairlines and dividers only |
| `--color-primary-border` | crimson-200 | Decorative edge of primary-light elements (accent badge) |
| `--color-text-primary` | warm-900 | Text, headings, labels, icons (all surfaces incl. glass) |
| `--color-text-secondary` | warm-600 | Secondary text, placeholders, helper text, secondary icons — not on `bg-3` or subtle/panel glass |
| `--color-text-secondary-on-card` | warm-600 | Kept for compatibility (same value in v2) |
| `--color-text-disabled` | warm-400 | Disabled labels/icons only |
| `--color-text-link` | crimson-600 | Links (deep crimson) |
| `--color-text-on-accent` | warm-0 | Labels on crimson fills (4.51 / 6.43 / 8.46) |
| `--color-text-on-highlight` | warm-0 | Labels on crimson highlight (notification count) |
| `--color-accent` | crimson-500 | Bright crimson heading emphasis, empty-state icon |
| `--color-accent-strong` | crimson-500 | Bright crimson **fills**: primary button, radio, switch |
| `--color-accent-deep` | crimson-600 | Crimson **text and thin indicators**: selected labels, accent badge, menu check, nav underline, drawer bar, spinner arc |
| `--color-accent-strong-hover` | crimson-600 | Primary button hover |
| `--color-accent-strong-pressed` | crimson-700 | Primary button pressed |
| `--color-accent-subtle` | crimson-50 | Selected fill (pills, segments, chips, rows, controls in glass); accent badge |
| `--color-accent-subtle-hover` | crimson-100 | Hover fill for menu items, ghost buttons, chips |
| `--color-highlight` | crimson-500 | Liked heart fill, notification dot |
| `--color-highlight-strong` | crimson-600 | Liked heart stroke |
| `--color-highlight-subtle` | crimson-50 | Highlight badge background |
| `--color-support` / `-subtle` | lavender-500 / lavender-50 | Supporting accent; avatar initials fill, "Team" badge |
| `--color-support-sage` / `-subtle` | sage-500 / sage-50 | Supporting accent; "New" badge |
| `--color-support-gold` / `-subtle` | gold-500 / gold-50 | Supporting accent; "Featured" badge (tint only) |
| `--color-danger` / `-subtle` | sienna-700 / sienna-50 | Error text, icons, invalid ring / inline error fill |
| `--color-success` / `-subtle` | sage-700 / sage-50 | Success text and icons / inline success fill |
| `--color-control-boundary` | warm-600 | Radio, switch-off boundary (≥ 4.29 on every surface) |
| `--color-focus-ring` | crimson-600 | Focus outline (deep: 4.01 even on subtle glass) |
| `--color-selected-ring` | crimson-600 | Selected-state ring |
| `--color-neu-light` | warm-0 | Neumorphic highlight |
| `--color-neu-dark` | `rgb(84 70 76 / 0.16)` | Neumorphic shadow (warm taupe; distinct from charcoal glass shadows) |
| `--color-neu-deep` | `rgb(84 70 76 / 0.24)` | Pressed shadow |
| `--color-skeleton` / `-shine` | warm-100 / warm-50 | Skeleton: flat pulse between the two (no gradient, A-17) |
| `--color-scrim` | `rgb(37 35 38 / 0.48)` | Modal/drawer backdrop (charcoal at 48%) |

## 3. Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"` | All UI and content (single source; TYPOGRAPHY_SYSTEM quotes it, T16-21) |
| `--font-mono` | `ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace` | Hex values, codes |
| `--font-weight-regular` | 400 | Body |
| `--font-weight-medium` | 500 | Labels, metadata |
| `--font-weight-semibold` | 600 | Headings, buttons, selected |
| `--text-display` | `clamp(2.5rem, 2rem + 2.2222vw, 4rem)` · lh 1.1 · ls −0.025em · 600 | Hero |
| `--text-h1` | `clamp(2rem, 1.6667rem + 1.4815vw, 3rem)` · lh 1.15 · ls −0.02em · 600 | Page titles |
| `--text-h2` | `clamp(1.625rem, 1.4167rem + 0.9259vw, 2.25rem)` · lh 1.2 · ls −0.015em · 600 | Section titles |
| `--text-h3` | `clamp(1.3125rem, 1.2083rem + 0.4630vw, 1.625rem)` · lh 1.3 · ls −0.01em · 600 | Shot title, modal titles |
| `--text-h4` | `clamp(1.125rem, 1.0833rem + 0.1852vw, 1.25rem)` · lh 1.35 · ls −0.005em · 600 | Sub-sections |
| `--text-body-lg` | `clamp(1.0625rem, 1.0417rem + 0.0926vw, 1.125rem)` · lh 1.6 | Descriptions, bios |
| `--text-body` | `1rem` · lh 1.6 | Default |
| `--text-body-sm` | `0.875rem` · lh 1.55 | Dense secondary (desktop) |
| `--text-label` | `0.875rem` · lh 1.25 · ls 0.005em · 500 | Buttons, pills, labels |
| `--text-caption` | `0.8125rem` · lh 1.45 · ls 0.005em | Helper, errors, timestamps |
| `--text-metadata` | `0.75rem` · lh 1.4 · ls 0.02em · 500 | Counts, badges |
| `--measure-reading` | `68ch` | Max line length for running text |

## 4. Spacing

4 px base. Tailwind v4 derives every spacing utility from `--spacing` (`p-4` = 4 × 4 px = 16 px), so the scale below is a **usage vocabulary**, not separate variables.

| Step | Value | Typical use |
|---|---|---|
| 0.5 | 2 px | Icon nudge only (exception to the 4 px grid; optical) |
| 1 | 4 px | Icon–badge gap |
| 2 | 8 px | Icon–label gap, chip gap, min gap between touch targets |
| 3 | 12 px | Control inner padding (vertical), list item gap |
| 4 | 16 px | Control horizontal padding, mobile gutter, mobile gallery gap |
| 5 | 20 px | Card padding (sm) |
| 6 | 24 px | Card padding, section gap (mobile), tablet gutter and gallery gap |
| 8 | 32 px | Modal padding, gallery gap (desktop), section gap |
| 10 | 40 px | Header-to-content gap |
| 12 | 48 px | Section spacing (desktop), xl gutter |
| 16 | 64 px | Large section spacing, 2xl gutter |
| 20 | 80 px | Page top/bottom padding (desktop) |
| 24 | 96 px | Footer top margin |

Token: `--spacing: 0.25rem`.

## 5. Radii

| Token | Value | Usage |
|---|---|---|
| `--radius-control-sm` | 10 px | Badges (non-pill), tooltip, small inputs, checkbox (6 px exception: see below) |
| `--radius-control` | 12 px | OTP cells, menu items, inline alerts |
| `--radius-control-lg` | 14 px | **All text inputs / TextField** (auth, filters, share field; T16-23), card hover bar fallback |
| `--radius-card` | 16 px | Shot thumbnails, minimal cards, toasts |
| `--radius-card-lg` | 20 px | About panel, share preview, dropdown panels |
| `--radius-panel` | 24 px | Modals, filter panel, mobile drawer |
| `--radius-panel-lg` | 28 px | Bottom-sheet modals (top corners), promo overlays |
| `--radius-pill` | 9999 px | Pills, tags, chips, buttons, search field, switches, avatars, icon buttons, FAB |
| `--radius-checkbox` | 6 px | Checkbox box only (a 20 px box at 10 px reads as a radio) |

## 6. Neumorphic shadows

**Model (v2).** Two contexts, set by the parent:

| Context | `--neu-parent` | `--neu-fill` | Look |
|---|---|---|---|
| Default (warm-white page, white cards) | `--color-bg` | `--color-bg-2` (soft grey) | Soft-grey control lifted by a warm shadow + inner top highlight: tactile, not embossed |
| `.neu-context-bg2` (filter panel, footer, muted card) | `--color-bg-2` | `--color-bg-2` | Classic neumorphism (fill = parent) |
| Inside glass | `--color-bg-2` | `--color-bg-2` | Raised sets are flattened automatically; inset fields allowed |

Light source: top-left. Inset sets render inside the element, so they work in both contexts.

| Token | Value (default context) | Usage |
|---|---|---|
| `--shadow-neu-raised-sm` | `inset 1px 1px 0 rgb(255 255 255 / .85), -2px -2px 5px #FFFFFF, 2px 3px 7px neu-dark` | Pills, small widgets, avatar ring, secondary buttons at rest |
| `--shadow-neu-raised` | `inset 1px 1px 0 rgb(255 255 255 / .85), -3px -3px 8px #FFFFFF, 4px 6px 14px neu-dark` | Hover depth (crossfaded), filter toggle, sort trigger |
| `--shadow-neu-raised-lg` | `inset 1px 1px 0 rgb(255 255 255 / .85), -5px -5px 12px #FFFFFF, 6px 9px 22px neu-dark` | FAB (max depth in the system) |
| `--shadow-neu-inset-sm` | `inset 2px 2px 4px neu-dark, inset -2px -2px 4px rgb(255 255 255 / .9)` | Inputs, search, OTP cells, switch track, radio |
| `--shadow-neu-inset` | `inset 3px 3px 7px neu-dark, inset -3px -3px 7px rgb(255 255 255 / .9)` | Selected well, segmented-control track |
| `--shadow-neu-pressed` | `inset 3px 3px 6px neu-deep, inset -2px -2px 5px rgb(255 255 255 / .8)` | `:active` of any neumorphic control |

| Token (`.neu-context-bg2`) | Value |
|---|---|
| `--shadow-neu-raised-sm-bg2` | `-3px -3px 6px #FFFFFF, 3px 3px 6px neu-dark` |
| `--shadow-neu-raised-bg2` | `-5px -5px 12px #FFFFFF, 5px 5px 12px neu-dark` |
| `--shadow-neu-inset-sm-bg2` | `inset 2px 2px 4px neu-dark, inset -2px -2px 4px #FFFFFF` |
| `--shadow-neu-inset-bg2` | `inset 4px 4px 8px neu-dark, inset -4px -4px 8px #FFFFFF` |
| `--shadow-neu-pressed-bg2` | `inset 3px 3px 6px neu-deep, inset -3px -3px 6px #FFFFFF` |

`neu-dark` = `rgb(84 70 76 / 0.16)`, `neu-deep` = `rgb(84 70 76 / 0.24)`. Limits: no offset > 9 px, no blur > 22 px, no coloured (crimson or accent) shadows. Selected state adds `--color-accent-subtle` fill + 1.5 px `--color-selected-ring`.

## 7. Glass

| Token | Value | Usage |
|---|---|---|
| `--glass-subtle-bg` | `rgb(255 255 255 / 0.80)` | Header, action rail, card hover bar, contextual toolbar — `text-primary` only |
| `--glass-panel-bg` | `rgb(255 255 255 / 0.88)` | Dropdowns, menus, popovers, tooltips, drawer, toasts |
| `--glass-modal-bg` | `rgb(255 255 255 / 0.94)` | Modals (on `--color-scrim`) |
| `--glass-fallback-bg` | `var(--color-surface-elevated)` | Reduced transparency / no backdrop-filter |
| `--blur-glass-sm` | 8 px | Card hover bar, action rail |
| `--blur-glass-md` | 16 px | Header, dropdowns, drawer, toasts, tooltips |
| `--blur-glass-lg` | 24 px | Modals |
| `--glass-saturate` | 140% | Applied with blur: `backdrop-filter: blur(…) saturate(140%)` |
| `--glass-border` | `1px solid rgb(255 255 255 / 0.70)` | Edge definition on all glass |
| `--glass-hairline` | `0 0 0 1px rgb(37 35 38 / 0.08)` | Outer hairline (box-shadow) so glass separates on white media |
| `--glass-highlight` | `inset 0 1px 0 rgb(255 255 255 / 0.90)` | Top inner highlight |
| `--shadow-glass-sm` | `0 4px 16px rgb(37 35 38 / 0.08)` | Header (when scrolled), action bar |
| `--shadow-glass-md` | `0 12px 32px rgb(37 35 38 / 0.12)` | Dropdowns, toasts, drawer |
| `--shadow-glass-lg` | `0 24px 56px rgb(37 35 38 / 0.18)` | Modals |
| `--color-scrim` | `rgb(37 35 38 / 0.48)` | Modal/drawer backdrop; **never blurred** (no stacked glass) |

Fallback contract (applies to **all three levels**, T16-30; implemented in `design-system/styles/glassmorphism.css`). Blur pairing: subtle → `--blur-glass-sm` (header: `--blur-glass-md`), panel → `--blur-glass-md`, modal → `--blur-glass-lg` (T16-39):

```css
.glass-panel {
  background: var(--glass-panel-bg);
  -webkit-backdrop-filter: blur(var(--blur-glass-md)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--blur-glass-md)) saturate(var(--glass-saturate));
  border: var(--glass-border);
  box-shadow: var(--glass-highlight), var(--glass-hairline), var(--shadow-glass-md);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-subtle, .glass-panel, .glass-modal { background: var(--glass-fallback-bg); }
}
@media (prefers-reduced-transparency: reduce) {
  .glass-subtle, .glass-panel, .glass-modal {
    background: var(--glass-fallback-bg);
    -webkit-backdrop-filter: none; backdrop-filter: none;
    border: 1px solid var(--color-border-subtle);
  }
}
```

## 8. Elevation (minimal cards)

| Token | Value | Usage |
|---|---|---|
| `--shadow-elevation-0` | `none` | Shot cards, thumbnails, content (always) |
| `--shadow-elevation-1` | `0 1px 2px rgb(37 35 38 / 0.05), 0 2px 8px rgb(37 35 38 / 0.04)` | About panel, author card, inline alerts |
| `--shadow-elevation-2` | `0 2px 4px rgb(37 35 38 / 0.06), 0 8px 24px rgb(37 35 38 / 0.08)` | Opaque buttons on media (card action bar) |

## 9. Motion

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 120 ms | Colour/opacity hover, icon swaps |
| `--duration-base` | 180 ms | Press, shadow crossfade, switch thumb, hover bar fade |
| `--duration-moderate` | 220 ms | Dropdown/popover/toast enter |
| `--duration-slow` | 280 ms | Modal/drawer enter |
| `--duration-exit-moderate` | 160 ms | Dropdown/popover/toast exit |
| `--duration-exit-slow` | 200 ms | Modal/drawer exit |
| `--duration-shimmer` | 1600 ms | Skeleton pulse loop (flat colours, no gradient) |
| `--duration-spin` | 900 ms | Spinner rotation (T16-40) |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entering overlays (decelerate, no overshoot) |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Leaving overlays (accelerate) |
| `--motion-lift` | `-1px` | Max hover translateY |
| `--motion-offset-sm` | 4 px | Dropdown/popover enter offset |
| `--motion-offset-md` | 8 px | Modal/toast enter offset |
| `--motion-scale-enter` | 0.98 | Modal start scale |

Rules: animate `opacity` and `transform` only; neumorphic hover depth is a **crossfade** between two pseudo-element shadow layers (opacity), not a `box-shadow` tween. Reduced motion (specification):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-property: opacity, color, background-color, border-color !important;
    transition-duration: var(--duration-fast) !important;
    scroll-behavior: auto !important;
  }
}
```

## 10. Breakpoints, containers and layout

| Token | Value | Notes |
|---|---|---|
| (base) | 360 px minimum supported | Mobile-first; no query |
| `--breakpoint-sm` | 24.375rem (390 px) | Large phones |
| `--breakpoint-md` | 48rem (768 px) | Tablet: 2-column gallery |
| `--breakpoint-lg` | 64rem (1024 px) | Laptop: desktop nav replaces burger; 3 columns |
| `--breakpoint-xl` | 80rem (1280 px) | Desktop: 4 columns |
| `--breakpoint-2xl` | 90rem (1440 px) | Wide: fluid type stops growing |
| `--gutter` | 16 px → md 24 → lg 32 → xl 48 → 2xl 64 | Page side padding |
| `--gallery-gap` | 16 px → md 24 → xl 32 | Row and column gap |
| `--gallery-min-col` | 264 px | `grid-template-columns: repeat(auto-fill, minmax(min(100%, 264px), 1fr))` |
| `--container-max` | 1680 px | Feed and profile max content width |
| `--container-detail` | 1024 px | Shot detail media column |
| `--container-reading` | 720 px | Text content blocks |
| `--container-auth` | 400 px | Auth form column |
| `--container-modal-sm` | 420 px | Auth gate |
| `--container-modal-md` | 560 px | Share, details |
| `--container-modal-lg` | 720 px | Reserved |
| `--header-h` | 56 px → lg 64 px | Sticky header; also `scroll-padding-top` |

Resulting gallery columns (verified arithmetic with a 15 px classic scrollbar), **approved as final by D-24(e)** and matched by FR-01/NFR-28: 1 column at 360/390, 2 at 768, 3 at 1024, 4 at 1280 and 1440, 5 from ≈ 1600 px (max 5 with the 1680 px container). Desktop navigation from `lg` (1024 px).

## 11. Z-index

| Token | Value | Layer |
|---|---|---|
| `--z-base` | 0 | Content |
| `--z-raised` | 10 | Card hover bar, sticky filter bar contents |
| `--z-sticky` | 100 | Sticky filter bar |
| `--z-header` | 200 | Site header, shot action rail |
| `--z-dropdown` | 300 | Menus, listboxes, popovers outside modals |
| `--z-drawer` | 400 | Mobile drawer |
| `--z-scrim` | 500 | Scrim |
| `--z-modal` | 510 | Modals |
| `--z-popover` | 600 | Menus/tooltips opened inside a modal |
| `--z-toast` | 700 | Toasts |
| `--z-tooltip` | 800 | Tooltips |
| `--z-skip-link` | 900 | Skip link when focused |

## 12. Focus ring

| Token | Value |
|---|---|
| `--focus-ring-width` | 2 px |
| `--focus-ring-offset` | 2 px |
| `--focus-ring-color` | `var(--color-focus-ring)` (accent-strong) |
| `--selected-ring-width` | 1.5 px |

```css
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
@media (forced-colors: active) { :focus-visible { outline-color: Highlight; } }
/* T16-15: shadows disappear in forced colours, so every control and glass layer gets a system border */
@media (forced-colors: active) {
  .neu-control, .neu-field, .neu-raised-sm, .neu-raised, .neu-raised-lg, .neu-inset-sm, .neu-inset { border: 1px solid ButtonText; }
  .glass-subtle, .glass-panel, .glass-modal { border: 1px solid CanvasText; }
}
```

The ring is an `outline`, so it never combines with or is hidden by neumorphic `box-shadow`. Horizontal scrollers get `padding-block: 4px` so the offset ring isn't clipped. Measured ≥ 4.01:1 (crimson, T-15 v2) on every surface ([COLOR_SYSTEM §8](COLOR_SYSTEM.md#8-contrast-matrix-pairs-used-by-components)).

## 13. Control sizes

| Token | Value | Usage |
|---|---|---|
| `--touch-min` | 44 px | Minimum hit area (all pointers) |
| `--touch-gap` | 8 px | Minimum space between adjacent targets |
| `--control-h-sm` | 40 px | Desktop-dense pills/buttons — **requires** a hit-area extension to 44 px (`::before`, inset −2 px) |
| `--control-h-md` | 44 px | Default buttons, pills, tabs, sort trigger |
| `--control-h-lg` | 52 px | Auth primary actions, mobile full-width buttons |
| `--input-h` | 48 px | Text inputs, search field |
| `--otp-cell-w` / `--otp-cell-h` | 48 px / 56 px | OTP cells |
| `--otp-cell-w-sm` / `--otp-cell-h-sm` | 44 px / 52 px | OTP cells below 390 px (6 × 44 + 5 × 8 = 304 px fits the 312 px bottom sheet at 360; A-13) |
| `--icon-btn-sm` | 40 px | Desktop icon buttons (with hit extension) |
| `--icon-btn` | 44 px | Default icon button |
| `--icon-btn-lg` | 48 px | Shot detail like/share |
| `--fab` | 56 px | FAB |
| `--switch-w` / `--switch-h` | 44 px / 26 px (hit area 44 × 44) | Toggle |
| `--icon-sm` / `--icon-md` / `--icon-lg` | 16 / 20 / 24 px | Icons |
| `--icon-stroke` | 1.75 px | Icon stroke |
| `--avatar-xs/sm/md/lg/xl` | 24 / 32 / 40 / 64 / 96 px | Avatars |

Under `(pointer: coarse)` the `sm` sizes switch to `md`.

## 14. Tailwind v4 mapping (specification)

All variables referenced below (`--scrim`, `--neu-raised-sm`, `--neu-raised`, `--neu-raised-lg`, `--neu-inset-sm`, `--neu-inset`, `--neu-pressed`, the `-bg2` sets, glass, elevation and every text step) are **defined** in `design-system/styles/design-tokens.css` (T16-14). The mapping file only aliases them into Tailwind namespaces; it never introduces a value.

```css
/* src/app/globals.css — specification for P10-01 */
@import "tailwindcss";
@import "../styles/tokens.css";   /* :root raw palette + motion, z-index, glass, control tokens */

@custom-variant reduced-transparency (@media (prefers-reduced-transparency: reduce));

@theme inline {
  /* remove Tailwind defaults so only system tokens exist */
  --color-*: initial;
  --shadow-*: initial;
  --radius-*: initial;
  --breakpoint-*: initial;
  --font-weight-*: initial;

  --spacing: 0.25rem;

  --color-bg: var(--palette-warm-0);
  --color-bg-2: var(--palette-warm-50);
  --color-bg-3: var(--palette-warm-100);
  --color-surface-card: var(--palette-warm-0);
  --color-surface-elevated: var(--palette-warm-0);
  --color-border-subtle: var(--palette-warm-150);
  --color-primary-border: var(--palette-crimson-200);
  --color-text-primary: var(--palette-warm-900);
  --color-text-secondary: var(--palette-warm-600);
  --color-text-secondary-on-card: var(--palette-warm-600);
  --color-text-disabled: var(--palette-warm-400);
  --color-text-link: var(--palette-crimson-600);
  --color-text-on-accent: var(--palette-warm-0);
  --color-text-on-highlight: var(--palette-warm-0);
  --color-accent: var(--palette-crimson-500);
  --color-accent-strong: var(--palette-crimson-500);
  --color-accent-strong-hover: var(--palette-crimson-600);
  --color-accent-strong-pressed: var(--palette-crimson-700);
  --color-accent-deep: var(--palette-crimson-600);
  --color-accent-subtle: var(--palette-crimson-50);
  --color-accent-subtle-hover: var(--palette-crimson-100);
  --color-highlight: var(--palette-crimson-500);
  --color-highlight-strong: var(--palette-crimson-600);
  --color-highlight-subtle: var(--palette-crimson-50);
  --color-support: var(--palette-lavender-500);
  --color-support-subtle: var(--palette-lavender-50);
  --color-support-sage: var(--palette-sage-500);
  --color-support-sage-subtle: var(--palette-sage-50);
  --color-support-gold: var(--palette-gold-500);
  --color-support-gold-subtle: var(--palette-gold-50);
  --color-danger: var(--palette-sienna-700);
  --color-danger-subtle: var(--palette-sienna-50);
  --color-success: var(--palette-sage-700);
  --color-success-subtle: var(--palette-sage-50);
  --color-control-boundary: var(--palette-warm-600);
  --color-focus-ring: var(--palette-crimson-600);
  --color-selected-ring: var(--palette-crimson-600);
  --color-skeleton: var(--palette-warm-100);
  --color-skeleton-shine: var(--palette-warm-50);
  --color-scrim: var(--scrim);

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  --text-display: clamp(2.5rem, 2rem + 2.2222vw, 4rem);
  --text-display--line-height: 1.1;
  --text-display--letter-spacing: -0.025em;
  --text-display--font-weight: 600;
  --text-h1: clamp(2rem, 1.6667rem + 1.4815vw, 3rem);
  --text-h1--line-height: 1.15;
  --text-h1--letter-spacing: -0.02em;
  --text-h1--font-weight: 600;
  /* h2, h3, h4, body-lg, body, body-sm, label, caption, metadata follow §3 */

  --radius-control-sm: 10px;
  --radius-control: 12px;
  --radius-control-lg: 14px;
  --radius-card: 16px;
  --radius-card-lg: 20px;
  --radius-panel: 24px;
  --radius-panel-lg: 28px;
  --radius-pill: 9999px;
  --radius-checkbox: 6px;

  --shadow-neu-raised-sm: var(--neu-raised-sm);
  --shadow-neu-raised: var(--neu-raised);
  --shadow-neu-raised-lg: var(--neu-raised-lg);
  --shadow-neu-inset-sm: var(--neu-inset-sm);
  --shadow-neu-inset: var(--neu-inset);
  --shadow-neu-pressed: var(--neu-pressed);
  /* …-bg2 variants, glass-sm/md/lg, elevation-1/2 likewise */

  --blur-glass-sm: 8px;
  --blur-glass-md: 16px;
  --blur-glass-lg: 24px;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);

  --breakpoint-sm: 24.375rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 90rem;

  --container-detail: 64rem;
  --container-reading: 45rem;
  --container-auth: 25rem;
  --container-max: 105rem;

  --animate-pulse-skeleton: pulse-skeleton 1.6s ease-in-out infinite;
  @keyframes pulse-skeleton { 0%, 100% { background-color: var(--color-skeleton); } 50% { background-color: var(--color-skeleton-shine); } }
}
```

Tokens with no Tailwind namespace (durations, z-index, control sizes, gutters, glass backgrounds) stay as plain `:root` variables and are used with Tailwind's variable shorthand: `duration-(--duration-base)`, `z-(--z-modal)`, `h-(--control-h-md)`, `px-(--gutter)`, `bg-(--glass-panel-bg)`. Resulting utility examples: `bg-bg`, `text-text-secondary`, `shadow-neu-raised-sm`, `rounded-pill`, `backdrop-blur-glass-md`, `ease-enter`, `text-h3`.

## 15. Token governance

1. Adding, removing or changing a token value is a design-system revision ([constitution §12](FRONTEND_DESIGN_CONSTITUTION.md#12-revision-process)).
2. Any new colour pair a token enables must be added to the T-15 script and pass.
3. Components never use `--palette-*` directly, never use Tailwind arbitrary colour/shadow values (`bg-[#…]`, `shadow-[…]`), and never inline styles with raw values. The only data-driven style is the shot's dominant-colour placeholder ([COLOR_SYSTEM §10](COLOR_SYSTEM.md#10-usage-rules)).
