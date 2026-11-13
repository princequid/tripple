# Design QA and Accessibility Checklist

| Field | Value |
|---|---|
| Purpose | One reusable checklist for every design review. Runs recorded here: **foundation v1.2** (lavender, G3, 2026-11-13) , **foundation v2** (identity v2, A-16) and **foundation v2.1** (bright crimson, white background, re-derived tints, no gradients, A-17, 2026-11-13; current). P07-01 re-runs it on the R1 prototypes |
| Applies to | `design-system/` CSS (tokens, neumorphism, glass, base, controls, overlays, content) and `design-system/preview/index.html` (v2.1) |
| Rules checked | User constitution §10 (the 10 questions, verbatim) · 05 constitution §9 (A11Y-01…A11Y-15) and §11 (QC-1…QC-10) · DESIGN_SYSTEM C01–C51 · COMPONENT_GUIDELINES |
| Evidence | [T-15 v2 contrast report](T-15_CONTRAST_REPORT.md) · [T-16 review](T-16_VISUAL_CONSISTENCY_REVIEW.md) · **`screenshots/foundation-v2.1/`** (current), `screenshots/foundation-v2/` and `screenshots/foundation-v1.2/` (previous), each with `preview-checks.json`, `a11y-extra-checks.json` and 7 screenshots · scripts in `scripts/` |
| Result | **v2.1: Pass, 0 open defects** (T-15 v2.1 131/131; T-33 0 issues at 6 widths; 0 gradients). v2: pass (128/128). v1.2: pass after 13 fixes (§4). Changes in the v2 run: §4a. 4 limitations (§5) |

How to re-run (Git Bash, Node 24, Playwright with Chrome, axe-core 4.10.3 installed next to the scripts):

```
node docs/08-testing/design/scripts/t15-contrast.mjs                      # exit 1 on any failing required pair
node docs/08-testing/design/scripts/t33-preview-check.js <outDir> <abs path to design-system>
node docs/08-testing/design/scripts/t33-a11y-extra.js <abs path to design-system>
```

## 1. The ten quality questions (user constitution §10)

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Does it follow the 40/30/30 visual philosophy? | **Yes, with one decision open** | Every surface is in its pillar: controls N, floating layers G, layout/content M (catalogue §1). Automated: 0 raised neumorphic shadows inside glass at all 6 widths. By **family count** the split is N 32.6 / G 30.2 / M 37.2 (DS §1); the neumorphic families are the most repeated controls on every screen. Confirming the counting method is question Q-1 |
| 2 | Is the neumorphic treatment subtle and intentional? | Yes | v2: soft-grey controls lifted off warm white by a warm-neutral token shadow and a 1 px inner highlight (tactile, not embossed); classic neumorphism only inside soft-grey zones; large regions stay flat. Token shadows only (no hex outside `design-tokens.css`); hover is an opacity crossfade + 1 px lift; press is inset with no movement |
| 3 | Is glassmorphism used only where layering adds value? | Yes | Glass only on header, menus, drawer, modals, toasts, tooltip, card action bar and the ≥ 1280 px action rail. Never stacked (menus/tooltips inside modals are opaque). Scrim is flat. Opaque fallbacks verified (§2, A11Y-09/10) |
| 4 | Does minimalism preserve a clean layout and clear hierarchy? | Yes | Inter scale, max weight 600, 4 px spacing grid, flat gallery, footer and profile. Visual review of screenshots at 1440 and 390 |
| 5 | Does the component use the established color palette? | Yes | v2 palette (A-16) only via semantic tokens: crimson for actions, active nav, selected filters, focus, liked and notification; warm white for pages and galleries; soft grey for controls; charcoal for text; lavender/sage/gold as tints only. Artwork untouched. T-15 v2: 128/128 pairs pass |
| 6 | Does it remain consistent with existing components? | Yes | One selected language per context (DS header); new CSS (filter bar/panel, radio rows, drawer, rail, footer, stats, removable chip) composes existing tokens and patterns |
| 7 | Is the content easy to read? | Yes | Body 16 px at 360 px; text contrast ≥ 4.5:1 incl. worst-case glass; text on subtle/panel glass is primary only (automated text-colour check: 0 violations) |
| 8 | Does the design work on mobile and desktop? | Yes | 0 horizontal overflow at 360/390/768/1024/1280/1440; 200% zoom and text-spacing overrides: 0 overflow, 0 clipped text; touch layout for card Like |
| 9 | Does it maintain accessibility? | Yes | §2 below: all 15 A11Y rules pass or are covered, axe 0 violations |
| 10 | Does the interface complement rather than compete with the creative content? | Yes | Thumbnails and shot media: no shadow, glass, tint or frame (`--shadow-elevation-0`); the hover bar sits inside the image edge and only on hover/focus |

## 2. Accessibility rules (A11Y-01…A11Y-15)

| ID | Rule | Method | Result |
|---|---|---|---|
| A11Y-01 | Text ≥ 4.5:1 | T-15 v2.1 script (glass at worst-case black media); text on crimson: white 4.51 / 6.43 / 8.46 (bright / hover / pressed); crimson text uses deep `#B3263E` | **Pass** 131/131 required pairs |
| A11Y-02 | Large text ≥ 3:1 | T-15 | **Pass** |
| A11Y-03 | Non-text ≥ 3:1 (icons, rings, indicators) | T-15 v2.1 (deep crimson focus/selected ring 4.01:1 worst case on subtle glass; sage icon 3.09 lowest) | **Pass** |
| A11Y-04 | Every control has a ≥ 3:1 non-shadow cue | Review: label/icon in text colour or accent ring; radio boundary ring `control-boundary`; chips on bg-2 now use the elevated fill | **Pass** |
| A11Y-05 | Visible focus | Keyboard run: `solid 2px rgb(179, 38, 62)` (crimson) on `:focus-visible`; card action bar opens on keyboard focus (opacity 1) | **Pass** |
| A11Y-06 | Focus not obscured | 140 Tab stops at 1440 px: 0 focused elements under the sticky header (`scroll-padding-top`) | **Pass** |
| A11Y-07 | Targets ≥ 44 px (or hit-area extension) | Bounding-box check incl. `::before` extensions at 6 widths | **Pass** 0 undersized (X1/X2 fixed; account trigger and author link fixed) |
| A11Y-08 | Reduced motion | Emulation: skeleton duration 0.01 ms, spinner 1 iteration; no lift | **Pass** |
| A11Y-09 | Reduced transparency | CDP media emulation: header, menu, modal, drawer, toast → opaque `#FFFFFF`, no backdrop-filter | **Pass** |
| A11Y-10 | No backdrop-filter fallback | Code review of the `@supports not (...)` rule (all three glass levels + the rail) | **Pass** (review; no browser without support available) |
| A11Y-11 | Keyboard / APG patterns | Static review of preview markup against COMPONENT_GUIDELINES; full interactive patterns (focus trap, Escape) are component behaviour, tested in P10 (T-19) | **Pass for the foundation scope** |
| A11Y-12 | 200% zoom and text spacing | 720 px @2x and WCAG 1.4.12 overrides at 390/1440: 0 overflow, 0 clipped text | **Pass** |
| A11Y-13 | Colour not alone | Liked = filled heart + inset + ring; selected = ring + weight; error = icon + text + ring; success = icon + text | **Pass** |
| A11Y-14 | Mobile body/input ≥ 16 px | Token review (`--text-body` 1rem, `.ui-input` 16 px) | **Pass** |
| A11Y-15 | Forced colours | Emulation: 1 px borders on all control families; 2 px `Highlight` on selected (incl. `.is-selected`); 2 px dashed on invalid (X7 fixed) | **Pass** (see limitation L-2) |
| axe | WCAG 2.0/2.1/2.2 A+AA rules | axe-core 4.10.3 at 1440, 1024, 390 | **0 violations** (35–36 rules pass); "incomplete": `color-contrast` over gradients (covered by T-15) and one `aria-controls` reference (target exists, verified) |

## 3. Visual consistency and responsiveness

| Check | Result |
|---|---|
| Widths 360, 390, 768, 1024, 1280, 1440: horizontal overflow | 0 at all |
| Raised neumorphism inside glass (automated) | 0 at all widths |
| Text colours on glass levels (subtle/panel: primary only; modal: + secondary, links, errors) | 0 violations |
| Hex literals outside `design-tokens.css` | 0 |
| Page errors / failed requests | 0 (axe's own stylesheet preloader re-requests `@import`s relative to the page; logged and ignored, not a page defect) |
| Interaction smoke: Like toggles `aria-pressed`; Filters toggle hides the panel | Pass |
| Preview content is R1-accurate (nav, sort, search placeholder, card actions, profile tabs) | Pass after I-7 fixes; non-R1 primitives labelled "Reserved" |

## 4. Defects found and fixed in this run (2026-11-13)

| # | Defect | Fix |
|---|---|---|
| 1 | X1 TagChip 40 px with no hit extension | `::before` extension to 44 px; 12 px chip-row gap |
| 2 | X2 small pills without extension; 8 px gap | Same extension; row gap 12 px when small pills are present |
| 3 | X4 menu selected label in accent (4.26:1 on panel glass) | Primary 600 label + accent check icon |
| 4 | X5 liked button text turned pink-strong / accent | Label and count stay primary |
| 5 | X6 glass comment allowed secondary text on panel glass | Comment corrected; panel `.text-secondary` remapped to primary |
| 6 | X7 forced-colours borders missing on many controls | Borders for all control families + selected/invalid states |
| 7 | X8 primary button moved 1 px on press | Removed |
| 8 | X9 avatar raised ring not flattened in glass | Flattened |
| 9 | Filter bar and panel grids overflowed by up to 546 px at 360 px | `minmax(0, 1fr)` columns |
| 10 | Action rail left raised controls inside a glass class below 1280 px | Glass applied only ≥ 1280 px, controls flattened there |
| 11 | Account trigger shrank to 40 px; detail-header author link 22 px tall | `flex: none`; 44 px link row |
| 12 | Removable chip invisible on the bg-2 filter panel | Elevated fill on bg-2 surfaces |
| 13 | Filters toggle stretched to full width on mobile | Only the sort trigger is full width (C11) |

## 4a. Changes in the v2 run (identity v2, 2026-11-13)

| # | Change | Verification |
|---|---|---|
| 1 | Palette and semantic mapping replaced (A-16); derived values proposed (D-26) | T-15 v2: 128 pairs, 0 failures |
| 2 | Neumorphism split into `--neu-parent` (surface below) and `--neu-fill` (soft grey) | Visual review at 1440 and 390; classic set inside `.neu-context-bg2` |
| 3 | Selected language gains the primary-light fill; liked heart is crimson; avatar initials use the lavender tint | Visual review; glass text-colour check 0 violations |
| 4 | Danger moved off crimson to sienna `#9A3412` (proposed) | 7.15 on background, 6.47 on modal glass |
| 5 | Test harness constants updated: the raised-on-glass check now looks for the warm shadow `84, 70, 76`, and the glass text-colour check uses the v2 colours | Probe: the detector flags a raised pill's shadow and does not flag glass shadows |
| 6 | New: C52 Card, notification dot, support badges, palette section in the preview | T-33: 0 issues; axe 0 violations |
| 7 | Visual-review fixes: bell icon for the notification demo; stale navigation note | Re-run clean |

## 4b. Changes in the v2.1 run (A-17, 2026-11-13)

| # | Change | Verification |
|---|---|---|
| 1 | Primary brightened to `#DF2F4D` (+24.5%, the brightest step with white text ≥ 4.5:1; +30% would be 4.18) | White label 4.51 |
| 2 | Crimson text and thin indicators moved to deep `#B3263E` (`--color-accent-deep`), because bright crimson is 2.81 on subtle glass and below 4.5 on every tint | 131/131 pairs pass; glass text-colour check 0 violations |
| 3 | Background `#FFFFFF`; primary light `#FCEEF1`, hover tint `#FBE2E6`, primary border `#F5C1CA`, pressed `#941D33` re-derived from the new red | T-15 v2.1 |
| 4 | All gradients removed: skeleton pulses between two flat colours; preview artwork and stage backdrops are flat | `grep "gradient("` over `design-system/` and `prototypes/`: 0 |

## 5. Limitations

| # | Limitation | Consequence |
|---|---|---|
| L-1 | Chromium only (Chrome channel). Safari/Firefox not run | Cross-browser check moves to P07-02 / P11 |
| L-2 | Forced-colours emulation applies the media query but does not remap colours to a system palette | Borders are verified; the real Windows High Contrast look needs a manual check in P07-03 |
| L-3 | The no-`backdrop-filter` fallback is verified by code review only | One check in an engine without support in P07-02 |
| L-4 | The preview is static; focus trapping, Escape-to-close and roving focus are component behaviours | Tested in P10 component tests and T-19 |

## 6. Checklist template for P07-01 (prototypes)

Run per screen: the 10 questions (§1) · A11Y-01…A11Y-15 (§2) · overflow at 6 widths · no raised neumorphism in glass · glass text colours · targets · axe · reduced motion/transparency · forced colours · 200% zoom and text spacing · showcase rule (no effects on media) · copy and labels match requirements (no reference wording).
