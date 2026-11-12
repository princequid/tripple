# Responsive Design Specification (P06-09)

| Field | Value |
|---|---|
| Task | P06-09 — Responsive design specification |
| Owner | Designer (UI/UX, information architecture) |
| Version | 1.0 — draft for review |
| Date | 2026-11-12 |
| Status | Awaiting Review (proposed) |
| Depends on | P06-03 [WIREFRAME_SPECIFICATION](WIREFRAME_SPECIFICATION.md) |
| Acceptance criterion | Behaviour is defined for each of 1440 / 1280 / 1024 / 768 / 390 / 360 px |
| Tests / validation | T-18 viewport validation criteria (§10 is the checklist P07-02 runs) |
| Inputs | [DESIGN_TOKENS §10](../05-design-system/DESIGN_TOKENS.md) (breakpoints, gutters, containers, gallery), [TYPOGRAPHY_SYSTEM](../05-design-system/TYPOGRAPHY_SYSTEM.md) (fluid type 360 → 1440), [FRONTEND_DESIGN_CONSTITUTION §8–§9](../05-design-system/FRONTEND_DESIGN_CONSTITUTION.md), [DESIGN_SYSTEM](../05-design-system/DESIGN_SYSTEM.md), NFR-26, NFR-28 in [REQUIREMENTS_SPECIFICATION](../01-requirements/REQUIREMENTS_SPECIFICATION.md), D-24(e) in [DECISION_LOG](../DECISION_LOG.md) (pending) |

---

## 1. Principles

1. **Mobile first.** Base styles target 360 px; breakpoints add layout. Content order on small screens follows the content priority of each wireframe (P1 first).
2. **Tokens only.** Breakpoints, gutters, gaps, containers and control sizes come from DESIGN_TOKENS; this document never invents a pixel value without flagging it as a proposal.
3. **One layout per range, no device detection.** Behaviour changes by viewport width and by input capability (`hover`, `pointer`), never by user-agent.
4. **No horizontal page scroll** at any width (NFR-28, constitution §8). The only horizontal scrollers are deliberate ones (category pills, tag rows, designer strip, A–Z bar, timeframe segmented control) and each has a visible edge affordance.
5. **Reflow at 320 CSS px** (400% zoom) without loss of content or function (WCAG 1.4.10).

---

## 2. Breakpoints and gate widths

| Token | Min width | Role | Gate widths in this range |
|---|---|---|---|
| (base) | 0 | Phone | **360**, **390** |
| `--breakpoint-sm` | 390 px | Large phone (type and spacing only) | 390 |
| `--breakpoint-md` | 768 px | Tablet: 2-column gallery, search field in the mobile header, modals centred (not sheets) | **768** |
| `--breakpoint-lg` | 1024 px | Laptop: **desktop navigation replaces the burger** (D-24(e); FR-01 says 1280 — §11 R-01), 3 columns | **1024** |
| `--breakpoint-xl` | 1280 px | Desktop: 4 columns, vertical shot action rail | **1280** |
| `--breakpoint-2xl` | 1440 px | Wide: fluid type stops growing | **1440** |

The six gate widths are those of workflow §7 and T-18. NFR-28 also names 1920 px; behaviour there is in §3.

---

## 3. Grid and layout

### 3.1 Gutters, gaps and containers

| Width | `--gutter` (side padding) | `--gallery-gap` | Header height | Container |
|---|---|---|---|---|
| 360 | 16 | 16 | 56 | fluid |
| 390 | 16 | 16 | 56 | fluid |
| 768 | 24 | 24 | 56 | fluid |
| 1024 | 32 | 24 | 64 | fluid |
| 1280 | 48 | 32 | 64 | fluid |
| 1440 | 64 | 32 | 64 | fluid up to `--container-max` 1680 |
| 1920 | 64 | 32 | 64 | content capped at 1680 and centred |

Fixed containers: shot media `--container-detail` 1024 · text blocks and legal pages `--container-reading` 720 · auth column `--container-auth` 400 · modals 420 (auth gate) / 560 (share, details).

### 3.2 Gallery columns (D-24(e): min column 264 px)

`grid-template-columns: repeat(auto-fill, minmax(min(100%, 264px), 1fr))`. Columns follow from the content width (viewport − 2 × gutter − scrollbar). Desktop widths assume a 15 px classic scrollbar (worst case); touch devices use overlay scrollbars (0 px).

| Viewport | Content width (no scrollbar / 15 px scrollbar) | Columns | Column width (with scrollbar) | Margin above 264 px |
|---|---|---|---|---|
| 360 | 328 | **1** | 328 | — |
| 390 | 358 | **1** | 358 | — |
| 768 | 720 / 705 | **2** | 340.5 | 76.5 |
| 1024 | 960 / 945 | **3** | 299 | 35 |
| 1280 | 1184 / 1169 | **4** | 268.25 | **4.25** (tight — §11 R-03) |
| 1440 | 1312 / 1297 | **4** | 300.25 | 36.25 |
| 1920 | 1680 (capped) | **5** | 310.4 | 46.4 |

Transition points between gate widths (for T-18 spot checks): 2 columns from ≈ 591 px, 3 from ≈ 903 px, 4 from ≈ 1207 px, 5 from ≈ 1591 px (scrollbar included). These differ from NFR-28's 600 / 1024 / 1440 / 1920 thresholds — §11 R-02.

The same gallery is used by every grid (home, feeds, profile Work, search, tag page, related shots). **Related shots** on the shot page use the page container, so they follow the same counts; "More by" shows at most 4 cards and leaves trailing cells empty rather than stretching.

---

## 4. Per-screen behaviour

Columns: **1440 · 1280 · 1024 · 768 · 390 · 360**. Screen IDs from [APPLICATION_SITEMAP](APPLICATION_SITEMAP.md).

### 4.1 Shell

| Surface | 1440 | 1280 | 1024 | 768 | 390 | 360 |
|---|---|---|---|---|---|---|
| SH-01 header | Brand · search (flex, min 240) · Explore · Tags · auth/avatar | Same | Same (desktop nav starts here) | Burger · brand · **search field** (≥ md) · Log in / avatar | Burger · brand · [Q] · Log in / avatar | Same as 390; Log in may shrink to icon+label sm (40 + hit 44). Budget: 44 + 120 + 44 + 80 + 3 × 8 = 312 ≤ 328 |
| SH-01 homepage variant | No search field | Same | Same | No search field | No [Q] | No [Q] |
| SH-02 Explore menu | Panel 3 category columns | 3 columns | 2 columns | n/a (drawer) | n/a | n/a |
| SH-03 drawer | n/a | n/a | n/a | Right sheet 360 wide over scrim | Full width (`min(100%, 360px)` = 360) | Full width 360 |
| SH-04 account menu | Anchored under avatar, right-aligned | Same | Same | Same (menu, not sheet) | Same; max-width = viewport − 2 × gutter | Same |
| SH-05 footer | Brand + 3 columns in one row | Same | Same | Brand row + 3 columns | Stacked: brand, Explore, Company, Legal, © | Same |
| SH-06 toasts | Bottom-centre, 400 wide | Same | Same | Same | Bottom, full width − 2 × gutter, above FAB | Same |

### 4.2 Pages

| Screen | 1440 | 1280 | 1024 | 768 | 390 | 360 |
|---|---|---|---|---|---|---|
| **SCR-01 Home** | Hero 2 columns (copy · featured artwork); hero search full container width; tag row wraps on one line; grid 4; designer strip shows ~8 with scroll buttons | Hero 2 cols; grid 4 | Hero 2 cols; grid 3 | Hero 1 col, artwork hidden; grid 2; tag row scrolls | Hero 1 col; CTA buttons side by side if they fit, else stacked full width; search full width; tag row scrolls; grid 1 | As 390; CTAs stacked |
| **SCR-02 Feed** | Filter bar one row: sort · pills (scroll buttons) · Filters; panel 2 columns; grid 4 | Same | Same; grid 3 | Same row; pills scroll with buttons; panel 2 cols; grid 2 | Rows: sort (full width) / pills (scroll, fade edge, no buttons) / Filters (full width); panel stacked, timeframe as segmented control; grid 1; FAB after 2 screens | As 390 |
| **SCR-03 Shot detail** | Sticky header (title · author · Like right); media 1024 centred; **vertical glass rail** fixed right; text 720; related grid 4 | Same (rail fits: 120 px free each side of the media at 1280) | Media fills container (960); **rail becomes a row** under block 1; related 3 | Rail row; related 2 | Title, then author + Like row (FR-42); media full width; rail row; author card stacked; related 1 | As 390 |
| **OV-01/02 modals** | Centred 560, scrim | Same | Same | Same | **Bottom sheet**, full width, top radius, max 90vh, internal scroll | Same |
| **OV-03 auth gate** | Centred 420 | Same | Same | Same | Bottom sheet; OTP cells shrink (§6.3) | Bottom sheet; OTP cells shrink |
| **SCR-04 Profile Work** | Header row: avatar 96 · identity · stats; tabs + sort one row; grid 4 | Same | Same; grid 3 | Header row (avatar 96 left, text wraps); tabs + sort one row; grid 2 | Header stacked and centred; avatar 64 (proposal, §11 R-06); tabs full width; sort full width below; grid 1 | As 390 |
| **SCR-05 Profile About** | 2 columns: panel (bio, skills, languages) · side (contact, links, location, member since) | Same | Same | 1 column, side block below bio | 1 column | 1 column |
| **SCR-06 Search** | H1 + description; related tags wrap; grid 4 | Same | Grid 3 | Related tags scroll; grid 2 | H1 wraps (h1 fluid 32 px); related scroll; grid 1 | As 390 |
| **SCR-07 Tags index** | Most-used chips wrap; A–Z bar one line; letter sections 4 link columns | 4 columns | 3 columns | 2 columns | A–Z bar scrolls and sticks under header; 1 column | As 390 |
| **SCR-08 Tag page** | Headline; grid 4 | Grid 4 | Grid 3 | Grid 2 | Headline wraps; grid 1 | As 390 |
| **SCR-09 Auth** | Column 400 left-centre + artwork panel right | Same | Same (artwork ≥ lg) | Column 400 centred, no artwork | Column = 358 (gutters); buttons full width `--control-h-lg` | Column 328; OTP per §6.3 |
| **SCR-10 Onboarding** | Column 400 centred | Same | Same | Same | Column 358 | Column 328 |
| **SCR-11/12 404, error** | Centred block max 400 (C35) | Same | Same | Same | Full width − gutters; buttons full width | Same |
| **SCR-13 Legal** | Reading column 720 + sticky "On this page" list (left) | Same | Same | Reading column only; "On this page" as disclosure at top | Same | Same |

---

## 5. Navigation collapse rules

| Rule | Behaviour |
|---|---|
| N-1 | **≥ 1024 (lg):** PrimaryNav (Explore, Tags; R2 Jobs; R3 Hire) and auth buttons are inline. Burger hidden |
| N-2 | **< 1024:** burger opens SH-03; every desktop destination is in the drawer, in the same order (IA §3.3) |
| N-3 | **≥ 768 (md):** the header search field is visible inline (not on the homepage). **< 768:** a search icon opens the drawer with the search field focused |
| N-4 | Homepage at every width: no header search; the hero search is the first field |
| N-5 | Drawer and menus close on route change and on crossing to ≥ lg (resize) so no orphaned overlay remains |
| N-6 | Explore menu opens on click/Enter/Space at all widths ≥ lg; hover-open only when `(hover: hover) and (pointer: fine)`, after 150 ms |
| N-7 | ProfileTabs and CategoryPills never collapse into a select; they scroll horizontally if they overflow (pills) or fit (2 R1 tabs) |
| N-8 | Shot action rail: vertical glass rail ≥ 1280 (xl); horizontal neumorphic row below block 1 below 1280 |
| N-9 | Modals: centred ≥ 768; bottom sheets < 768 (FR-42 clone decision) |
| N-10 | Sticky elements: SH-01 always; shot header C19 sticks under SH-01 at every width; A–Z bar sticks < 768. `scroll-padding-top` = header height (+ sticky sub-header when present) so focus is never hidden (A11Y-06) |

---

## 6. Touch targets and input modes

### 6.1 Minimums

- Every interactive element has a **≥ 44 × 44 CSS px** hit area (`--touch-min`, A11Y-07), with **≥ 8 px** between adjacent targets. Visual size may be 40 px only with the invisible hit-area extension (`--control-h-sm`, `--icon-btn-sm`).
- Exception proposal: **inline text links inside running text** (legal pages, bios, text blocks) cannot be 44 px tall; WCAG 2.5.8 exempts inline targets and NFR-26 sets 24 px. A11Y-07 says "every interactive element" — §11 R-05.

### 6.2 Component target table

| Component | Visual | Hit area | Notes |
|---|---|---|---|
| C02 SkipLink | 44 h | 44 | — |
| C04 BrandSlot link | 120 × 32 | 120 × 44 (padding) | — |
| C05 nav triggers/links | 44 h | 44 | Menu rows 44 |
| C06 drawer rows | 48 h | 48 | Burger 44 |
| C07 avatar trigger | 40 | 44 | Menu items 44 |
| C09 SearchBar | 48 h (`--input-h`); hero 52 (`--control-h-lg`) | ≥ 48 | Clear button 40 + extension |
| C10 pills | 40 | 44 (extension) | 8 px gap; scroll buttons 44 (≥ md) |
| C11 sort trigger | 44 | 44 | Full width < 768 |
| C12 Filters toggle | 44 | 44 | — |
| C13 tag field | 48 | 48 | Suggestion rows 44; chip remove buttons 44 hit |
| C14 timeframe rows | 44 rows | 44 | Segmented segments 40 + extension < 768 |
| C15 tag chips | 40 | 44 | Wrapped rows keep 8 px vertical gap |
| C16 card | Image link = whole thumbnail | ≥ 264 × 198 | Author link row min 44 h (avatar 24 + name) |
| C17 / C20 compact Like | 40 circle | 44 | Touch: Like in footer row, 44 |
| C20 Like (detail) | 48 pill | 48 | — |
| C21 rail buttons | 48 (`--icon-btn-lg`) | 48 | Row < xl keeps 8 px gaps |
| C22 share buttons | 44 icon buttons; Copy 44 | 44 | Field + Copy stack < 390 (§7) |
| C27 tabs | 40 segments | 44 | — |
| C30 text field | 48 | 48 | — |
| C31 OTP | One input across 6 cells | Whole group | Cells 48 × 56 (≥ 390) — §6.3 |
| C40 buttons | sm 40 / md 44 / lg 52 | ≥ 44 | Mobile full-width actions use lg |
| C41 icon buttons | 40 / 44 / 48 | ≥ 44 | — |
| C42 FAB | 56 | 56 | 16 px from edges + safe-area inset |
| C48 modal close | 44 | 44 | — |
| C50 standalone links (footer, "View profile") | text | 44 h row (padding) | Inline links: see §6.1 exception |

### 6.3 OTP cells at narrow widths (proposal)

Six cells of 48 px with 8 px gaps need **328 px**. That fits SCR-09 at 360 exactly (column 328), but **not** the auth-gate bottom sheet at 360 (sheet padding 24 → 312 px) or at 390 with 24 px padding (342 — fits). Proposal: below 390 px, gap 4 px and cell width 44 px (6 × 44 + 5 × 4 = 284 px). This needs a token variant — §11 R-04.

### 6.4 Input modes

| Condition | Behaviour |
|---|---|
| `(hover: hover) and (pointer: fine)` | Card hover bar C17 on hover and focus-within; tooltips on hover after 400 ms |
| `(hover: none)` or `(pointer: coarse)` | No hover bar; Like button in the card footer row; tooltips on focus/long-press only; Explore never hover-opens |
| Keyboard at any width | Focus-within reveals C17; "Load more" always present (NFR-27) |
| `prefers-reduced-motion` | No translate/scale, no shimmer, drawer and sheets fade only (A11Y-08) |
| `prefers-reduced-transparency` / no `backdrop-filter` | Glass becomes opaque `elevated` (A11Y-09, A11Y-10) |
| Landscape phone (e.g. 844 × 390) | Width rules apply (≥ 768 → tablet layout); bottom sheets and modals cap at 90vh with internal scroll; sticky shot header hides on scroll-down below 480 px viewport height (proposal) |

---

## 7. Overflow rules

| Element | Rule |
|---|---|
| Page | `overflow-x: clip` is **not** used to hide bugs; any horizontal overflow at a gate width is a defect (FR-42, NFR-28) |
| Shot titles (card bar, related, header) | Card bar: 1 line with ellipsis, full title in the link's accessible name; shot header H1: wraps, max 3 lines visible ≥ md, no truncation < md |
| Display names, usernames, tags, URLs | `overflow-wrap: anywhere` in headers and About; 1-line ellipsis in card footers with full text in the accessible name |
| Search term in H1 | Wraps; term already capped at 100 characters (BR-38) |
| Counts | Abbreviated (BR-28) in cards; tabular numerals so width does not jump on like |
| Category pills / tag rows / designer strip / A–Z bar / timeframe segmented | Deliberate horizontal scroll with fade edges (decorative) and, ≥ 768, 44 px scroll buttons; scroll-snap optional; scrollbar hidden only when buttons are present |
| Copy-link field (OV-01) | Read-only field scrolls internally; < 390 the Copy button stacks below the field |
| Modals, drawer | Max height 90vh (modals) / 100dvh (drawer) with internal scroll; header with close button stays visible |
| Filter panel | Expands inline (pushes content); never overlays the grid |
| Content blocks | Image width ≤ container; text blocks ≤ 720 measure; long unbroken strings in text blocks wrap anywhere |
| Legal pages | Reading measure 720; tables (if any in approved text) scroll inside their own wrapper |
| Toasts | Max 3; message wraps to 3 lines then ellipsis with full text announced |

---

## 8. Images: ratios, `srcset` and `sizes`

### 8.1 Ratios

| Image | Ratio | Fit | Placeholder |
|---|---|---|---|
| Card thumbnail (all grids, share preview, featured hero artwork) | **4:3** | `object-fit: cover`, centred crop (D-15) | Dominant colour (C16) |
| Shot detail content block | **Own ratio** (stored width × height) | Contain within ≤ 1024 wide; never cropped | Dominant colour at the block's ratio |
| Avatar | **1:1** | cover, circle | Initials on `accent-subtle` |
| Social share (OG) image | 1.91:1 (1200 × 630) | Derived from the cover | — (not displayed in UI) |

Every image has explicit `width`/`height` (or `aspect-ratio`) so there is no layout shift (NFR-02). Media get no effects (showcase priority).

### 8.2 `srcset` and `sizes` (proposal — derivative widths are fixed by P02/P09 under D-15)

| Image | Proposed derivative widths (WebP) | `sizes` |
|---|---|---|
| Card 4:3 | 400, 600, 800, 1200 | `(min-width: 1280px) 25vw, (min-width: 904px) 33vw, (min-width: 592px) 50vw, 100vw` (upper bound per §3.2; DPR handled by `w` descriptors) |
| Detail block | 640, 1024, 1600, 2048 | `(min-width: 1088px) 1024px, calc(100vw - 2 * var(--gutter))` |
| Featured hero artwork | Card set | `(min-width: 1024px) 40vw, 0px` (hidden < md; not requested there) |
| Avatar | 48, 96, 192 | Fixed per size token (24/32/40/64/96 px) |

Rules: first row of a feed and block 1 of a shot get `fetchpriority="high"` and no lazy-loading; everything else lazy-loads. NFR-08: feed thumbnails average ≤ 60 KB and are never served at more than 1.5 × their displayed width — the 25vw/33vw/50vw `sizes` overestimate by at most ≈ 1.2 × at the gate widths (worst case 1280 px: 25vw = 320 px for a 268 px column).

---

## 9. Typography and spacing across widths

- Fluid sizes interpolate between 360 and 1440 px and stop growing above 1440 ([TYPOGRAPHY_SYSTEM](../05-design-system/TYPOGRAPHY_SYSTEM.md)); body and inputs are ≥ 16 px at every width (A11Y-14).
- Section spacing: 24 px (< 768) → 32 (md–lg) → 48 (≥ xl), per spacing tokens.
- Line length: reading text ≤ 72ch at every width (constitution §3.4).

---

## 10. T-18 viewport validation criteria (for P07-02)

For every R1 prototype page and overlay (22 surfaces in [WIREFRAME_SPECIFICATION §17](WIREFRAME_SPECIFICATION.md)) at 1440 / 1280 / 1024 / 768 / 390 / 360:

| # | Check | Pass condition |
|---|---|---|
| V-01 | No horizontal page scroll | `document.documentElement.scrollWidth ≤ innerWidth` |
| V-02 | Gallery columns | Match §3.2 (1 / 1 / 2 / 3 / 4 / 4 for 360 → 1440) |
| V-03 | Navigation mode | Desktop nav ≥ 1024, burger < 1024 (§5, pending R-01) |
| V-04 | Header search visibility | Visible ≥ 768 except on the homepage (§5 N-3, N-4) |
| V-05 | Shot rail mode | Vertical ≥ 1280, row < 1280 |
| V-06 | Modal mode | Centred ≥ 768, bottom sheet < 768 |
| V-07 | Touch targets | Every interactive bounding box (incl. hit extension) ≥ 44 × 44 except declared inline links; ≥ 8 px spacing |
| V-08 | Text overflow | No text escapes its container; ellipsis only where §7 allows |
| V-09 | Images | Correct ratio (§8.1); no CLS from images |
| V-10 | Deliberate scrollers | Have fade edges; have buttons ≥ 768; keyboard reachable |
| V-11 | Focus not obscured | Focused element never hidden by sticky header, shot header or toasts |
| V-12 | Reflow | At 320 px (400% zoom of 1280) all content and functions available |

Screenshots: `docs/08-testing/design/screenshots/<release>/<screen>/<width>.png` (workflow §7 step 6).

---

## 11. Gaps, contradictions and risks

| ID | Finding | Documents | Proposal |
|---|---|---|---|
| R-01 | Desktop nav breakpoint 1024 (tokens, D-24(e)) vs ≥ 1280 (FR-01) | FR-01; DESIGN_TOKENS §10; D-24 pending | 1024 here; align FR-01 when D-24 is approved (IA G-01) |
| R-02 | Column thresholds: NFR-28 = 1 col < 600, 2 at 600–1023, 3 at 1024–1439, 4 at 1440–1919, up to 6 ≥ 1920; tokens give 2 from ≈ 591, 3 from ≈ 903, **4 at 1280**, 5 from ≈ 1591, max 5 (1680 cap) | NFR-28; DESIGN_TOKENS §10; D-24 | Tokens here; NFR-28 to be re-stated as "per D-24 arithmetic" or the min column changed (IA G-02) |
| R-03 | At 1280 with a 15 px scrollbar, 4 columns are only 4.25 px above the 264 px minimum; a 17 px scrollbar or browser zoom of 101% drops to 3 columns | DESIGN_TOKENS §10 | Accept, or set min column 256 px (needs a token revision, constitution §12) |
| R-04 | OTP group (328 px) overflows the auth-gate bottom sheet at 360 px | C31, C32, `--otp-cell-w` | Narrow variant below 390 px (§6.3) |
| R-05 | A11Y-07 requires 44 px for every interactive element; inline links in running text can't comply; NFR-26 says 24 px | Constitution A11Y-07 vs NFR-26 / WCAG 2.5.8 | Exempt inline links (≥ 24 px line box) |
| R-06 | Profile avatar 96 px at 360 px takes 30% of the width; C26 fixes xl 96 | DESIGN_SYSTEM C26 | 64 px (`--avatar-lg`) below 768 |
| R-07 | Derivative widths for `srcset` are not fixed anywhere (D-15 says "fixed derivatives, webp widths"; SPIKE-04 produced 4) | D-15, ADR-004 | §8.2 sets proposed widths for P02/P09 to confirm |
| R-08 | C21 says the rail is a row below xl; FR-42 only specifies "below 768". Not a contradiction — the row is also used at 768–1279 | FR-42, C21 | Documented here (§5 N-8) |

---

## 12. Self-check

| Check | Result |
|---|---|
| Behaviour defined for each of 1440 / 1280 / 1024 / 768 / 390 / 360 for every R1 surface | Pass (§4.1, §4.2) |
| Grid columns per D-24 / tokens (min 264 px → 1/2/3/4) with gutters | Pass (§3) |
| Desktop nav from 1024 px; collapse rules | Pass (§5), conflict logged (R-01) |
| Touch targets ≥ 44 px | Pass (§6), exception proposed (R-05) |
| Overflow rules and image ratios | Pass (§7, §8) |
| T-18 criteria listed | Pass (§10) |
