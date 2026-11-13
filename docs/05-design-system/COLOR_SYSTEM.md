# Colour System

| Field | Value |
|---|---|
| Task | P05-02 |
| Version | **2.1** (2026-11-13) — identity v2 (A-16) + revision 2.1 (A-17): primary brightened to `#DF2F4D`, white background, tints re-derived from the new red, **no gradients**. v2.0 and v1.0 are in git history ([§11](#11-superseded-palettes)) |
| Inputs | User constitution §3 revisions 2 and 2.1 ([FRONTEND_DESIGN_CONSTITUTION](../FRONTEND_DESIGN_CONSTITUTION.md#3-official-color-system)); F-10 boundary finding |
| Validation | T-15 v2.1 — [T-15_CONTRAST_REPORT](../08-testing/design/T-15_CONTRAST_REPORT.md), script [t15-contrast.mjs](../08-testing/design/scripts/t15-contrast.mjs) |
| Result | **131 required pairs checked, 0 failures** |
| Pending | Derived and proposed values in §3 (**D-26**) |

Every colour reaches components through a token ([DESIGN_TOKENS](DESIGN_TOKENS.md)). Semantic names are unchanged except one addition, `--color-accent-deep`.

---

## 1. Approved palette (A-16, A-17)

| Role | Hex | Token (raw → semantic) | Contrast notes (T-15 v2.1) |
|---|---|---|---|
| Primary (bright) | `#DF2F4D` | `--palette-crimson-500` → `--color-accent`, `--color-accent-strong`, `--color-highlight` | **Fills and large marks.** White text on it **4.51** (passes AA); vs white page 4.51, vs soft grey 3.98 |
| Primary deep / hover | `#B3263E` | `--palette-crimson-600` → `--color-accent-strong-hover`, `--color-accent-deep`, `--color-text-link`, `--color-focus-ring`, `--color-selected-ring`, `--color-highlight-strong` | **Crimson text and thin indicators.** White text 6.43; as text 6.43 on white, 5.67 on soft grey, 5.24 on tertiary |
| Primary pressed | `#941D33` | `--palette-crimson-700` → `--color-accent-strong-pressed` | White text 8.46 |
| Primary light | `#FCEEF1` | `--palette-crimson-50` → `--color-accent-subtle`, `--color-highlight-subtle` | 8% of primary. Deep crimson text 5.71; primary text 13.84; secondary text 4.68 |
| Primary border | `#F5C1CA` | `--palette-crimson-200` → `--color-primary-border` | 30% of primary. Decorative only (1.57) |
| Background / surface | `#FFFFFF` | `--palette-warm-0` → `--color-bg`, `--color-surface-card`, `--color-surface-elevated`, glass tint | — |
| Secondary surface | `#F2F0F0` | `--palette-warm-50` → `--color-bg-2` (soft grey) | Secondary text 4.64 |
| Tertiary surface | `#EAE7E8` | `--palette-warm-100` → `--color-bg-3`, `--color-skeleton` | Secondary text **4.29 — not allowed**; primary text 12.69 |
| Primary text | `#252326` | `--palette-warm-900` → `--color-text-primary` | 15.59 on white; ≥ 9.71 on every glass level |
| Secondary text | `#706A70` | `--palette-warm-600` → `--color-text-secondary`, `--color-control-boundary` | 5.27 on white |
| Muted text | `#969096` | `--palette-warm-400` → `--color-text-disabled` | 3.12 — **disabled only** |
| Border | `#E7E1E3` | `--palette-warm-150` → `--color-border-subtle` | Decorative only |

**Why two crimsons.** The user asked for a 30% brighter red. At +30% (`#E93151`) white text drops to 4.18:1 and fails WCAG AA, so the user chose +24.5% (`#DF2F4D`, 4.51:1), the brightest red that still passes. No light tint can carry the bright red as *text* at 4.5:1, and on the glass header it reaches only 2.81:1. So the bright red fills buttons, radios, switches, the liked heart and the notification dot, and marks heading emphasis on white, while text and thin indicators use the deeper `#B3263E`.

## 2. Supporting accents (approved; secondary to crimson)

| Accent | Hex | Use | Never |
|---|---|---|---|
| Muted lavender | `#8D7AB8` | Avatar initials fill (tint `#EEEBF4`), "Team" badge; optional icon (3.74) | Text; white text on it |
| Muted sage | `#829889` | Success family (tint `#ECF0ED`, text `#556359`), "New" badge; optional icon (3.09) | Text in raw form |
| Antique gold | `#C69A55` | "Featured" badge via tint `#F6F0E6` with primary text | Text or a lone icon |

## 3. Derived and proposed values (D-26, pending approval)

| Token | Hex | Derivation | Contrast |
|---|---|---|---|
| `--palette-crimson-100` (hover tint) | `#FBE2E6` | 14% of primary on white | Primary text 12.71, deep crimson 5.25 |
| `--palette-sienna-700` / `-50` (danger) | `#9A3412` / `#F8EEEA` | **Proposed new hue**: errors must not look like brand or selection | 7.15 on white; 6.41 on its tint; 6.47 on modal glass |
| `--palette-sage-700` / `-50` (success) | `#556359` / `#ECF0ED` | Sage + 35% black / tint | 6.20 on white; 5.67 on its tint |
| `--palette-lavender-50`, `--palette-gold-50` | `#EEEBF4`, `#F6F0E6` | 85% white tints | Primary text ≥ 13.2 |
| `--color-neu-dark` / `--color-neu-deep` | `rgb(84 70 76 / .16)` / `.24` | Warm taupe shadow | Decorative (F-10) |

Primary light, primary border, pressed and hover tint are now derived directly from the user-approved bright red (A-17), and approved with it.

## 4. Usage limits found by T-15

| Finding | Rule |
|---|---|
| Bright crimson as text: 4.51 on white, below 4.5 on every tint and on soft grey | Crimson **text** always uses deep `#B3263E`; bright is for fills and large marks |
| Bright crimson on subtle glass is 2.81 | Rings and indicators use deep crimson (4.01 worst case) |
| Secondary text fails on tertiary surface (4.29) and on subtle/panel glass and the drawer | Primary text there; secondary text only in modals (4.67) |
| Muted text is 3.12; borders are decorative | Disabled only; never the only boundary (§6) |
| Gold is 2.52 | Tinted fills with primary text only |

## 5. Semantic roles

| Need | Token | Value |
|---|---|---|
| Page, content, gallery, cards | `--color-bg`, `--color-surface-card`, `--color-surface-elevated` | `#FFFFFF` |
| Neumorphic control fills, inset fields, panels, footer | `--color-bg-2` (via `--neu-fill`) | `#F2F0F0` |
| Skeletons, pressed fills on glass | `--color-bg-3` | `#EAE7E8` |
| Primary action fill / hover / pressed | `--color-accent-strong`, `-hover`, `-pressed` | `#DF2F4D` / `#B3263E` / `#941D33` |
| Crimson text and thin indicators | `--color-accent-deep`, `--color-text-link` | `#B3263E` |
| Selected fill / hover fill | `--color-accent-subtle` / `--color-accent-subtle-hover` | `#FCEEF1` / `#FBE2E6` |
| Focus and selected rings | `--color-focus-ring`, `--color-selected-ring` | `#B3263E` |
| Liked heart fill (stroke), notification dot | `--color-highlight` (`-strong`) | `#DF2F4D` (`#B3263E`) |
| Avatar initials fill | `--color-support-subtle` | `#EEEBF4` |
| Errors / success | `--color-danger(-subtle)` / `--color-success(-subtle)` | `#9A3412` (`#F8EEEA`) / `#556359` (`#ECF0ED`) |
| Scrim | `--color-scrim` | `rgb(37 35 38 / .48)` |

## 6. Control-boundary strategy (F-10)

| Control | Identifying cue (≥ 3:1) |
|---|---|
| Secondary (neumorphic) buttons, pills, sort, icon buttons | Label or icon in primary text (13.73 on soft grey) |
| Primary button | Bright crimson fill vs page (4.51) + white label (4.51) |
| Text input, search, OTP | Persistent label or secondary-text leading icon (4.64) + inset; focus adds the deep crimson ring; error adds the danger ring + icon + message |
| Radio, switch (off) | 1.5 px secondary-text boundary (≥ 4.29) |
| Radio (checked), switch (on) | Bright crimson fill (≥ 3.98 vs surface) + white dot/thumb (4.51) |
| Pills, tabs, segments, chips (selected) | Primary-light fill + 1.5 px deep crimson ring + deep crimson 600 label (5.71) |
| Like (toggle) | Outline heart in primary text when off; bright crimson heart with deep stroke when on, plus the selected well; `aria-pressed` |
| Focus (all) | 2 px deep crimson outline, 2 px offset (≥ 4.01 everywhere incl. worst-case glass) |

## 7. Glass surfaces

White tint over the backdrop; modals and the drawer over the charcoal scrim; checked at the worst-case black backdrop.

| Level | Alpha / blur | Worst case | Permitted content |
|---|---|---|---|
| glass-subtle (header, card bar, rail) | 0.80 / 8–16 px | `#CCCCCC` | Primary text and icons (9.71); deep crimson as indicator only (4.01); **no bright crimson** (2.81) |
| glass-panel (menus, toasts, tooltips) | 0.88 / 16 px | `#E0E0E0` | Primary text (11.81); deep crimson text (4.87); secondary icons (3.99); danger (5.54) and success (4.80) icons |
| drawer | 0.88 on scrim | `#E3E2E3` | Primary text (12.07); deep crimson text or bar (4.98); secondary icons (4.08) |
| glass-modal | 0.94 on scrim | `#F1F1F1` | Primary (13.80), secondary (4.67), deep crimson links (5.70), danger (6.47); bright crimson buttons are opaque fills |
| Fallback | opaque | `#FFFFFF` | Everything permitted on surface |

## 8. Contrast matrix (pairs used by components)

All 131 required pairs and the reference pairs are in [T-15 §4](../08-testing/design/T-15_CONTRAST_REPORT.md#4-full-output). Highlights: white on crimson 4.51 / 6.43 / 8.46 (default / hover / pressed); deep crimson text ≥ 5.24 on every page surface and tint; primary text ≥ 12.69 on every page surface and tint, ≥ 9.71 on glass.

## 9. Originality

`#DF2F4D` (hue ≈ 350°) is a true crimson-red, still distinct from the reference product's hot pink `#EA4C89` (hue ≈ 337°, much bluer), and it is paired with Inter, soft neumorphism and glass layers that the reference does not use (A-07, A-10).

## 10. Usage rules

1. **Neutrals dominate.** White and soft grey cover most of every screen; crimson marks what is actionable, selected or important.
2. **One interaction colour, two weights.** Bright crimson fills; deep crimson writes and outlines. Supporting accents never mark interactivity.
3. **No gradients** (A-17). Every surface, control, skeleton, backdrop and placeholder is a flat colour.
4. **Artwork is independent.** No crimson borders, backgrounds, overlays or filters on thumbnails or media.
5. **Soft grey for controls.** Neumorphic controls and inset fields use `--neu-fill` (`#F2F0F0`); large regions stay flat.
6. **Text on crimson is white only.** Charcoal on crimson fails.
7. **Errors are not crimson.** Danger token with an icon and wording (D-26).
8. **Colour is never alone** (WCAG 1.4.1). **Tokens only**: hex values exist only in `design-tokens.css`.

## 11. Superseded palettes

- v2.0 (A-16, 2026-11-13): primary `#B3263E`, hover `#941D33`, pressed `#761729`, light `#FBECEF`, border `#E9C5CC`, hover tint `#F5DEE3`, background `#FFFCFA`; gradient skeleton shimmer.
- v1 (A-07, approved at G3 via A-15): background `#E9EDF3`, lavender `#9273C7`, pink `#EA78A5`, muted blue `#A5B5CA`. See the user constitution's [Appendix A](../FRONTEND_DESIGN_CONSTITUTION.md#appendix-a--superseded-colour-system-revision-1-2026-11-12).
