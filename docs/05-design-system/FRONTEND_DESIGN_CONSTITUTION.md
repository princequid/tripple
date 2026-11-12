# Frontend Design Constitution

| Field | Value |
|---|---|
| Task | P05-01 (closes into G3 via P05-07) |
| Version | 1.0 — draft for G3 review |
| Date | 2026-11-12 |
| Authority | User design constitution; [DECISION_LOG](../DECISION_LOG.md) A-07 (identity), A-10 (originality), D-05 (palette refinements), D-06 (Inter), F-10 (boundary contrast) |
| Status of this document | **Permanent rule unless a design-system revision is approved** (see §12). Not yet approved: G3 is pending |
| Companion documents | [COLOR_SYSTEM](COLOR_SYSTEM.md) · [TYPOGRAPHY_SYSTEM](TYPOGRAPHY_SYSTEM.md) · [DESIGN_TOKENS](DESIGN_TOKENS.md) · [DESIGN_SYSTEM](DESIGN_SYSTEM.md) · [COMPONENT_GUIDELINES](COMPONENT_GUIDELINES.md) · [T-15 contrast report](../08-testing/design/T-15_CONTRAST_REPORT.md) |

Where this constitution and a companion document disagree, this constitution wins until a revision is recorded. Where a companion document is more specific (for example, an exact token value), the companion document is the implementation reference.

---

## 1. Objective

Build a calm, tactile, light interface whose only job is to make **other people's design work** look its best. The platform UI is soft and quiet (neumorphic controls, glass floating layers); the content is flat, sharp and unframed (minimalism). Every visual decision must also be accessible: WCAG 2.2 AA is a floor, not a goal.

The visual identity is **original** (A-07, A-10). The reference product's layout and behaviour were studied in [the reverse-engineering docs](../reverse-engineering/02-frontend-analysis.md); its look (pink `#EA4C89`, Mona Sans, its spacing, iconography and copy) is **never** reused.

## 2. Principles

1. **Content first.** Shots are the hero. Platform UI recedes; it never competes with thumbnails for attention.
2. **Soft, not inflated.** Depth is suggested by small, balanced light/dark shadows. Nothing looks puffy, glossy or cartoonish.
3. **One effect per layer.** A surface is either neumorphic, glass or flat. Effects never stack (no glass on glass, no neumorphic control on a glass panel's raised surface, no shadowed glass inside a neumorphic well).
4. **Shadows are never the only cue.** Every control is identifiable by a ≥ 3:1 cue that is not a shadow (F-10).
5. **Tokens only.** Colour, shadow, blur, radius, spacing, type and motion values come from [DESIGN_TOKENS](DESIGN_TOKENS.md). No raw hex, px shadow or ad-hoc blur in components.
6. **Quiet motion.** Short, smooth, purposeful transitions; no bounce, no spring overshoot, no parallax.

## 3. The three pillars

### 3.1 Allocation

| Pillar | Weight | Job | Typical surfaces |
|---|---|---|---|
| **Neumorphism** | 40% | Make controls tactile and discoverable | Search fields, inputs, filter buttons, category selectors, nav controls, toggles, selection controls, FABs, secondary buttons, selected/active states, small widgets |
| **Glassmorphism** | 30% | Separate floating layers from the page without hiding context | Sticky header, dropdowns, popovers, menus, modals, mobile drawer, toasts, tooltips, card hover action bar, shot action rail, contextual toolbars, promo/featured overlays |
| **Minimalism** | 30% | Structure, typography and content | Page layout, galleries, shot cards, shot detail content, profiles, footer, empty/error/loading states, spacing and hierarchy |

The percentages are a **weighting of platform-UI surface treatments**, not a pixel count. They decide which pillar wins when a component could go either way. The R1 tally (component families with a surface treatment, [DESIGN_SYSTEM §1](DESIGN_SYSTEM.md#1-catalogue-index-and-pillar-tally)) is 38% / 29% / 33%. The small minimalism surplus is deliberate: showcase priority (§4) keeps every gallery component flat. T-16 reviews the balance.

### 3.2 Neumorphism (40%)

**Definition.** A control appears pressed out of (raised) or into (inset) its parent surface, using a light shadow (`#FFFFFF`) toward the top-left and a dark shadow (`#C5CFDC`, deeper `#B5C2D1` for pressed) toward the bottom-right. The control's fill **equals its parent's background**.

**Allowed**

| Use | Treatment | Example |
|---|---|---|
| Search field, text inputs, OTP cells | Inset (`shadow-neu-inset-sm`) + visible label or leading icon | Header search: inset pill with a `text-secondary` magnifier icon |
| Category pills, profile tabs, segmented controls | Raised-sm at rest; inset + accent ring when selected | "Discover · Animation · Branding …" pill row |
| Secondary buttons, icon buttons, FAB | Raised; pressed = inset | "Filters" button; back-to-top FAB |
| Toggles, radios, sort trigger | Inset track/well; raised thumb/knob | Timeframe radio group |
| Selected / active states | Inset + `accent-subtle` fill + `accent-strong` ring and label | Selected category pill |
| Small widgets | Raised-sm container on `bg`/`bg2` | Like button with count on shot detail |
| Avatar ring (profile header only) | Raised-sm ring around the photo | Profile header avatar |

**Forbidden**

| Don't | Why | Instead |
|---|---|---|
| Neumorphic shadows on design thumbnails, shot media or content blocks | Showcase priority (§4) | Flat image, radius only |
| Raised neumorphism on `card`, `elevated` or glass parents | The fill can't match the parent; it reads as a smudge | Flat control (`bg2` fill, inset allowed) or a minimal button |
| Neumorphism for large layout regions (whole sections, page panels, cards) | Inflated, heavy | Minimal card with `elevation-1` |
| Shadow as the only state or boundary cue | Fails WCAG 1.4.11 (border 1.12:1, shadow 1.34:1) | Label/icon in text colour, accent ring, `aria-*` state |
| Large offsets/blur (> 8 px offset, > 20 px blur) or coloured shadows | Looks inflated/cartoonish | Use the token sets only |
| Neumorphic primary (filled) buttons | Accent fills don't emboss cleanly | Flat `accent-strong` fill |

### 3.3 Glassmorphism (30%)

**Definition.** A floating surface of white at a controlled alpha (0.80 / 0.88 / 0.94) with backdrop blur (8 / 16 / 24 px), a 1 px light border, a top highlight and a soft drop shadow.

**Allowed**

| Use | Level | Example |
|---|---|---|
| Sticky site header, shot action rail, card hover action bar, contextual toolbars | `glass-subtle` (0.80) — **primary text and icons only** | Header over a scrolling grid |
| Dropdowns, menus, popovers, tooltips, mobile drawer, toasts, promo/featured overlays | `glass-panel` (0.88) — primary text; secondary/status **icons** allowed | Sort listbox; "Link copied" toast |
| Modals (share, details, auth gate), profile overlays | `glass-modal` (0.94) on a scrim — primary and secondary text, links, errors | Auth-gate modal |

**Forbidden**

| Don't | Why | Instead |
|---|---|---|
| Glass behind body text or long reading content | Legibility | Minimal surface (`bg`, `card`) |
| Glass on glass (e.g. a glass tooltip inside a glass modal sharing a backdrop; a blurred scrim under a glass modal) | Stacked blur is muddy and costly | Inner elements are opaque; scrim is un-blurred |
| Glass as a permanent page section background or card | It isn't floating | Minimal card |
| `text-secondary`, links or pink icons on `glass-subtle`; secondary text or links on `glass-panel` | Fails worst-case contrast ([COLOR_SYSTEM §7](COLOR_SYSTEM.md#7-glass-surfaces)) | Primary text; hierarchy via size/weight |
| Tinting, blurring or covering a thumbnail at rest | Showcase priority | The hover action bar is the only overlay, on hover/focus, covering the bottom strip only |
| Glass without an opaque fallback | Unsupported browsers and `prefers-reduced-transparency` | `@supports` + media query fallback to `elevated` (§9) |
| Blur > 24 px or alpha below the token levels | Unreadable or GPU-heavy | Tokens only |

### 3.4 Minimalism (30%)

**Definition.** Flat surfaces, typographic hierarchy, generous whitespace and strict alignment to the 4 px grid. No decoration that isn't information.

**Allowed / required**

| Use | Example |
|---|---|
| Page layout, gutters, galleries, grids | Shot grid: flat 4:3 thumbnails, radius 16, 16–32 px gaps |
| Typography-led hierarchy | Shot title H1, author line, metadata in `text-secondary` |
| Content blocks, profiles, about sections, footer | Profile header: avatar, name, bio, stats as text |
| Cards when a container is needed | `card` fill, `elevation-1`, radius 16–20 |
| Empty, error and loading states | One icon, one sentence, one action; skeletons mirror layout |

**Forbidden**

| Don't | Instead |
|---|---|
| Decorative gradients, patterns, blobs, illustrations behind content | Whitespace |
| More than one accent per view region | Lavender for interaction, pink only for likes/highlights |
| Borders as the main structuring device | Spacing and alignment; `border` hairlines only as optional dividers |
| Centred long text, justified text, lines over ~75 characters | Left-aligned, 60–72ch measure |

## 4. Showcase priority

1. **No neumorphic, glass or shadow effects on design thumbnails or shot media.** Thumbnails are flat, radius `radius-card` (16 px), on a dominant-colour placeholder while loading.
2. **Minimal framing.** No borders, frames, mats or drop shadows around shots. The only overlay is the hover/focus action bar (glass-subtle, bottom strip, transient). Touch devices show actions below the card, not over it.
3. **No colour casts.** No tint, filter, blend mode or opacity on media.
4. **Effects belong to platform UI only.** Header, controls, menus, modals — never content.
5. **Never crop beyond the agreed ratio.** Feed thumbnails are 4:3 (`object-fit: cover`); detail media is shown at its own ratio.

## 5. Colour usage rules (summary; [COLOR_SYSTEM](COLOR_SYSTEM.md) is authoritative)

| Colour | Role | Rule |
|---|---|---|
| bg `#E9EDF3` | Page | Default page and neumorphic parent |
| bg2 `#F1F3F7` | Section / input fill | Secondary page areas, footer, input fills |
| card `#F8FAFC` / elevated `#FFFFFF` | Containers / topmost opaque | Minimal cards; glass fallback |
| border `#DDE1E9` | Hairline | Decorative only; never the only boundary |
| text `#252B36` | Primary text and icons | Everywhere, including all glass |
| text-secondary `#5E6A7C` | Secondary text | Use instead of `#647184` on `bg`/`bg2` |
| text2 `#647184` | Secondary text | Only on `card`/`elevated` |
| muted `#929BA9` | Disabled | Disabled only |
| lavender `#9273C7` | Primary interaction (non-text) | Icons, indicators, spinners; text only ≥ 24 px |
| accent-strong `#7556B3` | Interactive text and fills | Links, primary buttons (white labels), focus and selected rings |
| pink `#EA78A5` | Likes, highlights, special emphasis | Fill with **dark** text only; never white text |
| pink-strong `#C2507F` | Like icon | Icons ≥ 3:1 |
| muted blue `#A5B5CA` | Supporting | Decorative only |
| danger `#B3364F` / success `#2B7355` | Feedback | Text and icons |

No colour carries meaning alone (WCAG 1.4.1): every state also has an icon, text or ARIA change.

## 6. Typography, spacing and radii

- **Typeface:** Inter (D-06), self-hosted via `next/font`, weights 400/500/600 only. Scale and fluid sizes in [TYPOGRAPHY_SYSTEM](TYPOGRAPHY_SYSTEM.md). Body text is never below 16 px on mobile.
- **Spacing:** 4 px base. All margins, paddings and gaps are multiples of 4 (token scale in [DESIGN_TOKENS §4](DESIGN_TOKENS.md#4-spacing)).
- **Radii:** small controls 10–14 px; standard cards/containers 16–20 px; large panels/modals/drawers 22–28 px; pills and circular controls full. Nested radii shrink by the inner padding (outer 24, padding 8 → inner 16).

## 7. Interaction and animation rules

| Interaction | Rule |
|---|---|
| Hover | Subtle elevation: neumorphic `raised-sm` → `raised` (crossfade, not a shadow tween on large elements) or a tint (`accent-subtle`). Max `translateY(-1px)`. Never scale > 1.02 |
| Pressed | Soft inset (`pressed` shadow), no translate beyond 0 |
| Focus | 2 px solid `accent-strong` **outline** with 2 px offset (outline, not box-shadow, so it never fights neumorphic shadows). Shown for `:focus-visible` |
| Selected | Inset + `accent-subtle` fill + 1.5 px `accent-strong` ring + `accent-strong` label at 600 |
| Modal / dropdown | Opacity + 4–8 px translate (+ scale 0.98 → 1 for modals), 180–280 ms in, 75% of that out, decelerate easing in / accelerate out |
| Toast | Fade + 8 px slide from the bottom; auto-dismiss ≥ 5 s, paused on hover/focus |
| Loading | Skeleton shimmer (1.6 s linear) or a small lavender spinner; never block the whole page for a partial update |
| Forbidden | Bounce, elastic or overshooting easing; parallax; animated box-shadow on cards or grids; auto-playing motion longer than 5 s without a pause control; layout-shifting hover effects |

## 8. Responsiveness

- Supported widths **360 → 1440+**, validated at **360, 390, 768, 1024, 1280, 1440** (T-18 for prototypes in P07, T-26 for the app in P10).
- Mobile-first CSS. Breakpoints and gutters are tokens ([DESIGN_TOKENS §10](DESIGN_TOKENS.md#10-breakpoints-containers-and-layout)).
- No horizontal page scroll at any width; only deliberate horizontal scrollers (category pills) scroll, with visible edge affordance.
- Hover-only affordances must have a touch equivalent (card actions below the card when `(hover: none)`).
- Content reflows at 320 CSS px (400% zoom) without loss (WCAG 1.4.10).

## 9. Accessibility non-negotiables (testable)

| ID | Rule | Threshold / test |
|---|---|---|
| A11Y-01 | Normal text contrast | ≥ 4.5:1 against its effective background (glass computed at worst case). T-15 script; zero failures |
| A11Y-02 | Large text (≥ 24 px, or ≥ 18.66 px at 700) | ≥ 3:1. T-15 |
| A11Y-03 | Non-text contrast: icons, control identifiers, state indicators, focus rings | ≥ 3:1 against adjacent colours (WCAG 1.4.11). T-15 |
| A11Y-04 | Every control has a ≥ 3:1 identifying cue that is **not** a shadow or `border` hairline | Visible label/icon in `text`/`text-secondary`, or `accent-strong` ring/fill. Design review T-16 + component tests |
| A11Y-05 | Focus visible | Every focusable element shows the 2 px `accent-strong` outline, 2 px offset, on `:focus-visible`; never `outline: none` without replacement. Playwright keyboard pass (T-19) |
| A11Y-06 | Focus not obscured | Sticky header and toasts never cover the focused element (`scroll-padding-top` = header height) (WCAG 2.4.11) |
| A11Y-07 | Touch targets | ≥ 44 × 44 CSS px hit area for every interactive element (visual may be smaller only with an invisible hit-area extension); ≥ 8 px between adjacent targets. Playwright bounding-box check |
| A11Y-08 | Reduced motion | Under `prefers-reduced-motion: reduce`: no translate/scale animations, no shimmer, no auto-play; opacity fades ≤ 120 ms allowed. Playwright emulation test |
| A11Y-09 | Reduced transparency | Under `prefers-reduced-transparency: reduce`: glass becomes opaque `elevated` with border; no backdrop-filter. Playwright emulation (Chromium) |
| A11Y-10 | Backdrop-filter fallback | `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` → opaque `elevated` surfaces. Code review + one browser test |
| A11Y-11 | Keyboard | Every interactive component follows its WAI-ARIA APG pattern in [COMPONENT_GUIDELINES](COMPONENT_GUIDELINES.md); Escape closes every overlay; focus is trapped in modals and returned on close |
| A11Y-12 | Text resize and spacing | Usable at 200% zoom and with WCAG 1.4.12 text-spacing overrides; no fixed-height text containers |
| A11Y-13 | Colour not alone | States (liked, selected, error, success) always add an icon, text or weight change |
| A11Y-14 | Mobile body text | Body ≥ 16 px at 360 px; inputs ≥ 16 px (prevents iOS zoom) |
| A11Y-15 | Forced colours | Under `forced-colors: active`, controls keep a system-colour border and focus outline |

## 10. Branding and originality

- **Brand slot.** Product name and logo are pending **D-01**. Every layout reserves a `BrandSlot` (header left, auth layout top, footer, favicon, social-share image). Until D-01, the slot renders the codename **"Trippple"** as a wordmark set in Inter 600 `text-primary` — clearly marked as a placeholder in code and prototypes. No logo or wordmark is designed before D-01.
- No reference-product assets, fonts, icons, copy, colours or screenshots in the product (A-10). Seed and illustration content must be original or licence-cleared.
- Icons come from one open-licence set chosen at P08 (recommendation: Lucide, ISC licence), drawn at 1.75 px stroke, 16/20/24 px.

## 11. Mandatory quality-control checklist

Before implementing any new page or component, evaluate it against these questions (the user's exact wording, constitution §10). Every screen, prototype and component review must answer **all ten with "yes"**. If a design violates these principles, refine it before considering it complete. A deliberate exception needs a recorded revision (§12).

| # | Question (authoritative) | How it is verified (measurable criteria) |
|---|---|---|
| Q1 | Does it follow the 40/30/30 visual philosophy? | **QC-2** **Pillars:** Is every surface in the right pillar — neumorphism for controls, glass for floating layers, minimalism for layout and content — with no stacked effects? |
| Q2 | Is the neumorphic treatment subtle and intentional? | **QC-3** **Neumorphism quality:** Do neumorphic controls match their parent background, using only the token shadow sets, soft and balanced, never inflated or cartoonish? |
| Q3 | Is glassmorphism used only where layering adds value? | **QC-4** **Glass quality:** Is glass used only on floating layers, at a token level, with readable text at the worst-case backdrop and an opaque fallback? |
| Q4 | Does minimalism preserve a clean layout and clear hierarchy? | **QC-6** **Typography and space:** Is hierarchy clear through Inter's scale and weights, with generous whitespace and everything aligned to the 4 px grid? |
| Q5 | Does the component use the established color palette? | **QC-5** **Palette:** Are colours used only by role (lavender = interaction, pink = likes/highlights only, muted blue = decorative), and only through tokens? |
| Q6 | Does it remain consistent with existing components? | **QC-2** **Pillars:** Is every surface in the right pillar — neumorphism for controls, glass for floating layers, minimalism for layout and content — with no stacked effects? **QC-5** **Palette:** Are colours used only by role (lavender = interaction, pink = likes/highlights only, muted blue = decorative), and only through tokens? |
| Q7 | Is the content easy to read? | **QC-6** **Typography and space:** Is hierarchy clear through Inter's scale and weights, with generous whitespace and everything aligned to the 4 px grid? **QC-7** **Contrast:** Do all text pairs meet 4.5:1 (3:1 large), and does every control and state have a ≥ 3:1 non-shadow cue? |
| Q8 | Does the design work on mobile and desktop? | **QC-10** **Responsive:** Does it work and look intentional at 360, 390, 768, 1024, 1280 and 1440 px, with no horizontal scroll and touch equivalents for hover? |
| Q9 | Does it maintain accessibility? | **QC-7** **Contrast:** Do all text pairs meet 4.5:1 (3:1 large), and does every control and state have a ≥ 3:1 non-shadow cue? **QC-8** **Operability:** Is every control keyboard-operable with a visible focus ring, ≥ 44 × 44 px target and the correct ARIA pattern? **QC-9** **Motion:** Are interactions subtle (gentle hover lift, soft press, smooth overlays, no bounce), and do reduced-motion and reduced-transparency modes work? |
| Q10 | Does the interface complement rather than compete with the creative content? | **QC-1** **Showcase:** Is the design content the visual focus, with zero effects (shadow, glass, tint, frame) on thumbnails or shot media? |

The measurable criteria (QC-1…QC-10, written in P05-01) operationalise the questions for reviews and tests (T-16, T-17, T-19). They never replace them.

## 12. Revision process

1. Any change to a rule in this document, to a token value, or to the palette is a **design-system revision**.
2. The proposer writes the change, its rationale and its contrast impact (re-running the T-15 script) and submits it to the lead.
3. The lead records it in [DECISION_LOG](../DECISION_LOG.md) with status `Pending approval`; the user approves or rejects.
4. Only after approval are this document, the companion documents and the token implementation updated, with the version number bumped and the decision ID cited in the changed section.
5. Emergency accessibility fixes (a newly found contrast failure) may be applied immediately using an already-approved token, then logged retroactively.

## 13. References

- [PROJECT_ASSESSMENT §10](../00-project-assessment/PROJECT_ASSESSMENT.md#10-visual-direction-clone-identity-not-the-original) — visual direction and original contrast findings
- [02 Frontend analysis](../reverse-engineering/02-frontend-analysis.md), [03 Component inventory](../reverse-engineering/03-component-inventory.md) — layout and behaviour reference only
- WCAG 2.2: 1.4.1, 1.4.3, 1.4.10, 1.4.11, 1.4.12, 1.4.13, 2.1.1, 2.4.7, 2.4.11, 2.5.8; WAI-ARIA Authoring Practices Guide
