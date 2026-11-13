# Design system: Hybrid Soft UI

The reusable foundation of the platform's visual identity: **40% neumorphism · 30% glassmorphism · 30% minimalism**. It is governed by the permanent [Frontend Design Constitution](../docs/FRONTEND_DESIGN_CONSTITUTION.md) (user-authored, verbatim) and specified in [`docs/05-design-system/`](../docs/05-design-system/DESIGN_TOKENS.md).

Plain CSS, **zero dependencies**, framework-agnostic. The Next.js app imports it in P10-01 (`src/app/globals.css` → `@import` + Tailwind v4 `@theme` mapping per DESIGN_TOKENS §14). Values are never redefined in the app.

```text
design-system/
├── index.css                 single entry point (import order matters)
├── styles/
│   ├── design-tokens.css     colours, type, spacing, radii, shadows, glass, motion, layout, z-index, control sizes
│   ├── neumorphism.css       parent-matched raised/inset surfaces + .neu-control behaviour (40%)
│   ├── glassmorphism.css     glass levels subtle/panel/modal, scrim, fallbacks, glass-context rules (30%)
│   └── base.css              typography scale, layout, gallery grid, focus ring, reduced motion (30%)
├── components/
│   ├── controls.css          C40 Button, C41 IconButton, C20 Like, C42 FAB, C09 Search, C30 TextField,
│   │                         C31 OTP, C10 Pills, C15 TagChip (+ removable), C44 Segmented, C43 Toggle,
│   │                         C37 Spinner, C12 Filter bar/panel, C14 Timeframe radios, forced colours
│   ├── overlays.css          C03 Header (+ search, nav links, account trigger), C04 Brand, C05/C49 Menu,
│   │                         C06 Drawer, C48 Modal, C38 Toast, C47 Tooltip, C17 Card bar, C21 Action rail,
│   │                         C22 Share rows, C23 Stats
│   └── content.css           C16 ShotCard, C45 Avatar, C46 Badge, C26 Profile, C34/35 States, C36 Skeleton,
│                             C39 InlineAlert, C51 Divider, C18 Feed status, C19 Detail header, C24 Content
│                             block, C08 Footer
└── preview/index.html        living reference page (every component, key states)
```

## Rules enforced by the CSS itself

| Rule | How |
|---|---|
| Raw colour/shadow values only in tokens | Every other file uses `var(--…)` (preview art excepted) |
| Neumorphism matches its parent | `--neu-parent` + shadow sets switch with `.neu-context-bg2` and inside glass |
| No raised neumorphism on glass | Any `.neu-control` inside `.glass-*` is flattened automatically; selected = accent-subtle + ring |
| No effects on showcase media | `.ui-shot-card__media` uses `--shadow-elevation-0`; only the dominant-colour placeholder is data-driven |
| Hover depth is never a shadow tween | Deeper shadow on `::after`, crossfaded by opacity; press is an instant inset swap |
| Shadows are never the only cue | Selected = inset + 1.5 px accent ring + accent label; errors = ring + icon + text |
| Focus always visible | `outline` (not box-shadow) ring, `forced-colors` support |
| Reduced motion / transparency | Animations collapse; glass falls back to opaque surfaces; same for no `backdrop-filter` support |
| Touch targets ≥ 44 px | Control tokens; 40 px desktop sizes extend their hit area; brand link 44 px tall |

## Verification

**Latest: T-33 v2.1 (2026-11-13, identity v2.1: bright crimson `#DF2F4D` + white + soft grey + charcoal, no gradients, A-16/A-17)** — same checks, 0 issues; screenshots in [`foundation-v2.1/`](../docs/08-testing/design/screenshots/foundation-v2.1/); contrast T-15 v2.1 131/131.

Previous: T-33 v2 in [`foundation-v2/`](../docs/08-testing/design/screenshots/foundation-v2/).

Previous: T-33 v1.2 (2026-11-13) on preview v1.2 at 360 / 390 / 768 / 1024 / 1280 / 1440 px: 0 overflow, 0 undersized targets, 0 raised neumorphism inside glass, 0 glass text-colour violations, axe 0 violations, plus forced colours, reduced motion/transparency, 200% zoom, text spacing and focus-not-obscured. Full results: [DESIGN_QA_CHECKLIST](../docs/08-testing/design/DESIGN_QA_CHECKLIST.md); screenshots in [`foundation-v1.2/`](../docs/08-testing/design/screenshots/foundation-v1.2/). Every component's origin in the reference product is traced in [RE_TO_DESIGN_MAPPING](../docs/05-design-system/RE_TO_DESIGN_MAPPING.md).

First run (2026-11-12, see [TESTING_PROGRESS](../docs/TESTING_PROGRESS.md) T-33)

Preview rendered with headless Chrome at 360 / 390 / 768 / 1024 / 1440 px, served over local HTTP:

- **Horizontal overflow:** 0 px at every width.
- **Hit targets:** 0 interactive elements under 44 px. Exceptions by design: inline text links, and the OTP field's hidden input.
- **axe-core 4.10.3** (WCAG 2.0/2.1/2.2 A + AA): **0 violations** at 1440 and 390. `color-contrast` is "incomplete" because axe cannot evaluate gradients and glass. Contrast is proven mathematically by T-15 instead.
- **Computed values match the tokens:** bg `#E9EDF3`, primary `#7556B3` with a white label, glass α .80/.88/.94 with blur 16/16/24, thumbnails with no shadow.
- **Reduced motion:** animations collapse (`animation-duration` ≈ 0).

Screenshots: [`docs/08-testing/design/screenshots/foundation/`](../docs/08-testing/design/screenshots/foundation/).

## Open items

- D-23 (derived tints) and D-24(e) (columns 1/2/3/4 max 5; desktop nav from 1024 px) were approved on 2026-11-12 and are what the CSS implements.
- Identity v2 (A-16) is implemented; derived values (pressed, hover tint, danger, success, tints, warm shadow) are pending **D-26**. D-23 is superseded.
- React wrappers (`src/components/ui/`) are built in **P10-02** on top of these classes. Behaviour such as focus management, menus and dialogs comes with them.
