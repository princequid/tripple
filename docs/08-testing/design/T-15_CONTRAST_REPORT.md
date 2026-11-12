# T-15 — Token Contrast Validation Report

| Field | Value |
|---|---|
| Test | T-15 Token contrast validation (P05-02, prep for P05-07) |
| Executed | Run: 2026-11-12T18:39:49.309Z  node v24.13.0 |
| Executed by | Designer agent (P05) |
| Command | `node contrast.mjs > contrast-output.md` (exit code 0 = no failures, 1 = failures) |
| Script location | Throwaway script in the agent scratch area (not a project file); full source reproduced in §5 so it can be re-run or moved into the repo at P10-01 |
| Method | WCAG 2.x relative luminance and contrast ratio; glass surfaces composited in sRGB (browser default) over the page `bg`, white media and black media (worst case); modals over the scrim |
| Thresholds | Text 4.5:1 · large text (≥ 24 px) 3:1 · non-text UI (icons, rings, indicators, control identifiers) 3:1 |
| Result | **130 required pairs checked, 0 failures (run 2026-11-12T18:39:49.309Z  node v24.13.0)** |
| Gate status | Evidence for G3 only. **G3 is not approved** — approval is recorded by the user via the lead (P05-07) |

## 1. Scope

The pairs checked are those **actually used** by components in [DESIGN_SYSTEM](../../05-design-system/DESIGN_SYSTEM.md), per the roles in [COLOR_SYSTEM](../../05-design-system/COLOR_SYSTEM.md): text, secondary text, links, button labels, feedback text, text on tinted fills, text and icons on every glass level, focus and selected rings, icons, control boundaries and state fills. Reference pairs that are decorative, disabled (WCAG 1.4.3 exempt) or explicitly forbidden are reported separately and excluded from pass/fail.

## 2. Summary

| Category | Outcome |
|---|---|
| Required pairs | 130 required pairs checked, 0 failures (run 2026-11-12T18:39:49.309Z  node v24.13.0) |
| D-05 known failures (text2 4.22, white on lavender 3.82, white on pink 2.72, muted 2.39) | Resolved by usage rules: each is now a **forbidden or exempt** pair (see reference table) and replaced by a D-05 colour that passes |
| F-10 (border 1.12, neu shadow 1.34) | Not relied on: every control has a ≥ 3:1 non-shadow cue ([COLOR_SYSTEM §6](../../05-design-system/COLOR_SYSTEM.md#6-control-boundary-strategy-f-10)) |
| Glass | All permitted content passes at the worst-case (black) backdrop; restrictions per level recorded in COLOR_SYSTEM §7 |
| Proposed derived colours (pending approval) | `#624896`, `#503A7A`, `#F6F4FB`, `#EEE9F6`, `#FDF4F8`, `#F9EFF1`, `#EEF4F1` — all pairs that use them pass |

## 3. Limitations

1. Checks token pairs, not rendered pages. Rendered-page checks (axe-core in Playwright) are T-19/T-27.
2. Backdrop blur and `saturate(140%)` are not modelled; blur only averages the backdrop, so the uniform black backdrop remains the worst case. Saturation can shift coloured backdrops slightly; black and white are unaffected.
3. WCAG 2.x ratios only (no APCA), as required by WCAG 2.2 AA.
4. Neumorphic shadows are treated as decorative and excluded (the design never relies on them).

## 4. Full output

Run: 2026-11-12T18:39:49.309Z  node v24.13.0
Glass: tint #FFFFFF, subtle 0.8, panel 0.88, modal 0.94 over scrim #252B36 @ 0.48

### Effective glass colours
| Surface / backdrop | Effective colour |
|---|---|
| glass-subtle/bg | `#FBFBFD` |
| glass-panel/bg | `#FCFDFE` |
| scrim/bg | `#8B9098` |
| glass-modal/bg | `#F8F8F9` |
| glass-subtle/white media | `#FFFFFF` |
| glass-panel/white media | `#FFFFFF` |
| scrim/white media | `#96999F` |
| glass-modal/white media | `#F9F9F9` |
| glass-subtle/black media (worst) | `#CCCCCC` |
| glass-panel/black media (worst) | `#E0E0E0` |
| scrim/black media (worst) | `#12151A` |
| glass-modal/black media (worst) | `#F1F1F1` |

### Required pairs
| Foreground | Background | Kind | Min | Ratio | Result | Use |
|---|---|---|---|---|---|---|
| text `#252B36` | bg `#E9EDF3` | text | 4.5 | 12.10 | PASS | Primary text, headings, control labels |
| text `#252B36` | bg2 `#F1F3F7` | text | 4.5 | 12.79 | PASS | Primary text, headings, control labels |
| text `#252B36` | card `#F8FAFC` | text | 4.5 | 13.58 | PASS | Primary text, headings, control labels |
| text `#252B36` | elevated `#FFFFFF` | text | 4.5 | 14.21 | PASS | Primary text, headings, control labels |
| text-secondary `#5E6A7C` | bg `#E9EDF3` | text | 4.5 | 4.67 | PASS | Secondary text, metadata, placeholders, helper text |
| text-secondary `#5E6A7C` | bg2 `#F1F3F7` | text | 4.5 | 4.94 | PASS | Secondary text, metadata, placeholders, helper text |
| text-secondary `#5E6A7C` | card `#F8FAFC` | text | 4.5 | 5.24 | PASS | Secondary text, metadata, placeholders, helper text |
| text-secondary `#5E6A7C` | elevated `#FFFFFF` | text | 4.5 | 5.49 | PASS | Secondary text, metadata, placeholders, helper text |
| text2 `#647184` | card `#F8FAFC` | text | 4.5 | 4.74 | PASS | Official text2: secondary text on card/elevated only |
| text2 `#647184` | elevated `#FFFFFF` | text | 4.5 | 4.96 | PASS | Official text2: secondary text on card/elevated only |
| accent-strong `#7556B3` | bg `#E9EDF3` | text | 4.5 | 4.78 | PASS | Text links, ghost-button labels, selected labels |
| accent-strong `#7556B3` | bg2 `#F1F3F7` | text | 4.5 | 5.06 | PASS | Text links, ghost-button labels, selected labels |
| accent-strong `#7556B3` | card `#F8FAFC` | text | 4.5 | 5.37 | PASS | Text links, ghost-button labels, selected labels |
| accent-strong `#7556B3` | elevated `#FFFFFF` | text | 4.5 | 5.62 | PASS | Text links, ghost-button labels, selected labels |
| white `#FFFFFF` | accent-strong `#7556B3` | text | 4.5 | 5.62 | PASS | Primary button label (default/hover/pressed), skip link |
| white `#FFFFFF` | accent-strong-hover `#624896` | text | 4.5 | 7.27 | PASS | Primary button label (default/hover/pressed), skip link |
| white `#FFFFFF` | accent-strong-pressed `#503A7A` | text | 4.5 | 9.43 | PASS | Primary button label (default/hover/pressed), skip link |
| text `#252B36` | pink `#EA78A5` | text | 4.5 | 5.23 | PASS | Liked button label/icon on pink fill |
| text `#252B36` | accent-subtle `#F6F4FB` | text | 4.5 | 13.03 | PASS | Text on tinted fills (hover rows, badges, inline alerts) |
| text `#252B36` | accent-subtle-hover `#EEE9F6` | text | 4.5 | 11.93 | PASS | Text on tinted fills (hover rows, badges, inline alerts) |
| text `#252B36` | pink-subtle `#FDF4F8` | text | 4.5 | 13.18 | PASS | Text on tinted fills (hover rows, badges, inline alerts) |
| text `#252B36` | danger-subtle `#F9EFF1` | text | 4.5 | 12.62 | PASS | Text on tinted fills (hover rows, badges, inline alerts) |
| text `#252B36` | success-subtle `#EEF4F1` | text | 4.5 | 12.76 | PASS | Text on tinted fills (hover rows, badges, inline alerts) |
| accent-strong `#7556B3` | accent-subtle `#F6F4FB` | text | 4.5 | 5.15 | PASS | Selected pill/segment label, accent badge, avatar initials |
| accent-strong `#7556B3` | accent-subtle-hover `#EEE9F6` | text | 4.5 | 4.71 | PASS | Selected pill/segment label, accent badge, avatar initials |
| danger `#B3364F` | bg `#E9EDF3` | text | 4.5 | 5.02 | PASS | Error messages, field errors |
| danger `#B3364F` | bg2 `#F1F3F7` | text | 4.5 | 5.31 | PASS | Error messages, field errors |
| danger `#B3364F` | card `#F8FAFC` | text | 4.5 | 5.64 | PASS | Error messages, field errors |
| danger `#B3364F` | elevated `#FFFFFF` | text | 4.5 | 5.90 | PASS | Error messages, field errors |
| danger `#B3364F` | danger-subtle `#F9EFF1` | text | 4.5 | 5.24 | PASS | Error messages, field errors |
| success `#2B7355` | bg `#E9EDF3` | text | 4.5 | 4.85 | PASS | Success messages |
| success `#2B7355` | bg2 `#F1F3F7` | text | 4.5 | 5.13 | PASS | Success messages |
| success `#2B7355` | card `#F8FAFC` | text | 4.5 | 5.44 | PASS | Success messages |
| success `#2B7355` | elevated `#FFFFFF` | text | 4.5 | 5.70 | PASS | Success messages |
| success `#2B7355` | success-subtle `#EEF4F1` | text | 4.5 | 5.11 | PASS | Success messages |
| lavender `#9273C7` | bg `#E9EDF3` | large | 3 | 3.25 | PASS | Official lavender as text: display/h1/h2 emphasis only (>= 24px) |
| lavender `#9273C7` | bg2 `#F1F3F7` | large | 3 | 3.44 | PASS | Official lavender as text: display/h1/h2 emphasis only (>= 24px) |
| lavender `#9273C7` | card `#F8FAFC` | large | 3 | 3.65 | PASS | Official lavender as text: display/h1/h2 emphasis only (>= 24px) |
| lavender `#9273C7` | elevated `#FFFFFF` | large | 3 | 3.82 | PASS | Official lavender as text: display/h1/h2 emphasis only (>= 24px) |
| text `#252B36` | glass-subtle/bg `#FBFBFD` | text | 4.5 | 13.75 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-subtle/white media `#FFFFFF` | text | 4.5 | 14.21 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-subtle/black media (worst) `#CCCCCC` | text | 4.5 | 8.85 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-panel/bg `#FCFDFE` | text | 4.5 | 13.96 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-panel/white media `#FFFFFF` | text | 4.5 | 14.21 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-panel/black media (worst) `#E0E0E0` | text | 4.5 | 10.77 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-modal/bg `#F8F8F9` | text | 4.5 | 13.39 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-modal/white media `#F9F9F9` | text | 4.5 | 13.50 | PASS | Text on glass (all levels, worst-case backdrops) |
| text `#252B36` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 12.58 | PASS | Text on glass (all levels, worst-case backdrops) |
| text-secondary `#5E6A7C` | glass-modal/bg `#F8F8F9` | text | 4.5 | 5.17 | PASS | Secondary text in modals only |
| text-secondary `#5E6A7C` | glass-modal/white media `#F9F9F9` | text | 4.5 | 5.21 | PASS | Secondary text in modals only |
| text-secondary `#5E6A7C` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 4.86 | PASS | Secondary text in modals only |
| accent-strong `#7556B3` | glass-modal/bg `#F8F8F9` | text | 4.5 | 5.29 | PASS | Links in modals only |
| accent-strong `#7556B3` | glass-modal/white media `#F9F9F9` | text | 4.5 | 5.34 | PASS | Links in modals only |
| accent-strong `#7556B3` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 4.97 | PASS | Links in modals only |
| danger `#B3364F` | glass-modal/bg `#F8F8F9` | text | 4.5 | 5.56 | PASS | Field errors in modals (auth gate) |
| danger `#B3364F` | glass-modal/white media `#F9F9F9` | text | 4.5 | 5.61 | PASS | Field errors in modals (auth gate) |
| danger `#B3364F` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 5.23 | PASS | Field errors in modals (auth gate) |
| accent-strong `#7556B3` | bg `#E9EDF3` | ui | 3 | 4.78 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | bg2 `#F1F3F7` | ui | 3 | 5.06 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | card `#F8FAFC` | ui | 3 | 5.37 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | elevated `#FFFFFF` | ui | 3 | 5.62 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-subtle/bg `#FBFBFD` | ui | 3 | 5.44 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-subtle/white media `#FFFFFF` | ui | 3 | 5.62 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-subtle/black media (worst) `#CCCCCC` | ui | 3 | 3.50 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-panel/bg `#FCFDFE` | ui | 3 | 5.52 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-panel/white media `#FFFFFF` | ui | 3 | 5.62 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 4.26 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-modal/bg `#F8F8F9` | ui | 3 | 5.29 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-modal/white media `#F9F9F9` | ui | 3 | 5.34 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 4.97 | PASS | Focus ring (2px outline) and selected-state ring |
| accent-strong `#7556B3` | accent-subtle `#F6F4FB` | ui | 3 | 5.15 | PASS | Focus ring (2px outline) and selected-state ring |
| text-secondary `#5E6A7C` | bg `#E9EDF3` | ui | 3 | 4.67 | PASS | Icons; checkbox/radio/switch-off boundary; input leading icon |
| text-secondary `#5E6A7C` | bg2 `#F1F3F7` | ui | 3 | 4.94 | PASS | Icons; checkbox/radio/switch-off boundary; input leading icon |
| text-secondary `#5E6A7C` | card `#F8FAFC` | ui | 3 | 5.24 | PASS | Icons; checkbox/radio/switch-off boundary; input leading icon |
| text-secondary `#5E6A7C` | elevated `#FFFFFF` | ui | 3 | 5.49 | PASS | Icons; checkbox/radio/switch-off boundary; input leading icon |
| text `#252B36` | glass-subtle/bg `#FBFBFD` | ui | 3 | 13.75 | PASS | Icons on glass |
| text `#252B36` | glass-subtle/white media `#FFFFFF` | ui | 3 | 14.21 | PASS | Icons on glass |
| text `#252B36` | glass-subtle/black media (worst) `#CCCCCC` | ui | 3 | 8.85 | PASS | Icons on glass |
| text `#252B36` | glass-panel/bg `#FCFDFE` | ui | 3 | 13.96 | PASS | Icons on glass |
| text `#252B36` | glass-panel/white media `#FFFFFF` | ui | 3 | 14.21 | PASS | Icons on glass |
| text `#252B36` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 10.77 | PASS | Icons on glass |
| text `#252B36` | glass-modal/bg `#F8F8F9` | ui | 3 | 13.39 | PASS | Icons on glass |
| text `#252B36` | glass-modal/white media `#F9F9F9` | ui | 3 | 13.50 | PASS | Icons on glass |
| text `#252B36` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 12.58 | PASS | Icons on glass |
| text-secondary `#5E6A7C` | glass-panel/bg `#FCFDFE` | ui | 3 | 5.39 | PASS | Secondary icons on panel/modal glass (not on subtle glass) |
| text-secondary `#5E6A7C` | glass-panel/white media `#FFFFFF` | ui | 3 | 5.49 | PASS | Secondary icons on panel/modal glass (not on subtle glass) |
| text-secondary `#5E6A7C` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 4.16 | PASS | Secondary icons on panel/modal glass (not on subtle glass) |
| text-secondary `#5E6A7C` | glass-modal/bg `#F8F8F9` | ui | 3 | 5.17 | PASS | Secondary icons on panel/modal glass (not on subtle glass) |
| text-secondary `#5E6A7C` | glass-modal/white media `#F9F9F9` | ui | 3 | 5.21 | PASS | Secondary icons on panel/modal glass (not on subtle glass) |
| text-secondary `#5E6A7C` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 4.86 | PASS | Secondary icons on panel/modal glass (not on subtle glass) |
| pink-strong `#C2507F` | bg `#E9EDF3` | ui | 3 | 3.76 | PASS | Liked heart icon |
| pink-strong `#C2507F` | bg2 `#F1F3F7` | ui | 3 | 3.98 | PASS | Liked heart icon |
| pink-strong `#C2507F` | card `#F8FAFC` | ui | 3 | 4.23 | PASS | Liked heart icon |
| pink-strong `#C2507F` | elevated `#FFFFFF` | ui | 3 | 4.42 | PASS | Liked heart icon |
| pink-strong `#C2507F` | pink-subtle `#FDF4F8` | ui | 3 | 4.10 | PASS | Liked heart icon |
| pink-strong `#C2507F` | glass-panel/bg `#FCFDFE` | ui | 3 | 4.34 | PASS | Liked heart icon in toasts/menus/modals |
| pink-strong `#C2507F` | glass-panel/white media `#FFFFFF` | ui | 3 | 4.42 | PASS | Liked heart icon in toasts/menus/modals |
| pink-strong `#C2507F` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 3.35 | PASS | Liked heart icon in toasts/menus/modals |
| pink-strong `#C2507F` | glass-modal/bg `#F8F8F9` | ui | 3 | 4.17 | PASS | Liked heart icon in toasts/menus/modals |
| pink-strong `#C2507F` | glass-modal/white media `#F9F9F9` | ui | 3 | 4.20 | PASS | Liked heart icon in toasts/menus/modals |
| pink-strong `#C2507F` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 3.92 | PASS | Liked heart icon in toasts/menus/modals |
| lavender `#9273C7` | bg `#E9EDF3` | ui | 3 | 3.25 | PASS | Lavender icons, active-nav indicator, spinner arc, progress |
| lavender `#9273C7` | bg2 `#F1F3F7` | ui | 3 | 3.44 | PASS | Lavender icons, active-nav indicator, spinner arc, progress |
| lavender `#9273C7` | card `#F8FAFC` | ui | 3 | 3.65 | PASS | Lavender icons, active-nav indicator, spinner arc, progress |
| lavender `#9273C7` | elevated `#FFFFFF` | ui | 3 | 3.82 | PASS | Lavender icons, active-nav indicator, spinner arc, progress |
| accent-strong `#7556B3` | bg `#E9EDF3` | ui | 3 | 4.78 | PASS | Primary button fill / switch-on track vs page |
| accent-strong `#7556B3` | bg2 `#F1F3F7` | ui | 3 | 5.06 | PASS | Primary button fill / switch-on track vs page |
| accent-strong `#7556B3` | card `#F8FAFC` | ui | 3 | 5.37 | PASS | Primary button fill / switch-on track vs page |
| accent-strong `#7556B3` | elevated `#FFFFFF` | ui | 3 | 5.62 | PASS | Primary button fill / switch-on track vs page |
| white `#FFFFFF` | accent-strong `#7556B3` | ui | 3 | 5.62 | PASS | Switch thumb / checkbox tick on accent-strong |
| danger `#B3364F` | bg `#E9EDF3` | ui | 3 | 5.02 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | bg2 `#F1F3F7` | ui | 3 | 5.31 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | card `#F8FAFC` | ui | 3 | 5.64 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | elevated `#FFFFFF` | ui | 3 | 5.90 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | glass-panel/bg `#FCFDFE` | ui | 3 | 5.80 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | glass-panel/white media `#FFFFFF` | ui | 3 | 5.90 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 4.47 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | glass-modal/bg `#F8F8F9` | ui | 3 | 5.56 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | glass-modal/white media `#F9F9F9` | ui | 3 | 5.61 | PASS | Error icon, invalid-field outline |
| danger `#B3364F` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 5.23 | PASS | Error icon, invalid-field outline |
| success `#2B7355` | bg `#E9EDF3` | ui | 3 | 4.85 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | bg2 `#F1F3F7` | ui | 3 | 5.13 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | card `#F8FAFC` | ui | 3 | 5.44 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | elevated `#FFFFFF` | ui | 3 | 5.70 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | glass-panel/bg `#FCFDFE` | ui | 3 | 5.59 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | glass-panel/white media `#FFFFFF` | ui | 3 | 5.70 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 4.32 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | glass-modal/bg `#F8F8F9` | ui | 3 | 5.37 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | glass-modal/white media `#F9F9F9` | ui | 3 | 5.41 | PASS | Success icon (toasts, copy confirmation) |
| success `#2B7355` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 5.04 | PASS | Success icon (toasts, copy confirmation) |

REQUIRED PAIRS CHECKED: 130  FAILURES: 0

### Reference pairs (excluded from pass/fail)
| Foreground | Background | Ratio | Status |
|---|---|---|---|
| border `#DDE1E9` | bg `#E9EDF3` | 1.12 | Decorative divider/hairline (not relied on) |
| neu-shadow `#C5CFDC` | bg `#E9EDF3` | 1.34 | Neumorphic shadow edge (not relied on) |
| neu-deep `#B5C2D1` | bg `#E9EDF3` | 1.54 | Pressed shadow edge (not relied on) |
| muted `#929BA9` | bg `#E9EDF3` | 2.39 | Disabled text only (WCAG 1.4.3 exempt) |
| muted `#929BA9` | card `#F8FAFC` | 2.68 | Disabled text only (exempt) |
| muted-blue `#A5B5CA` | bg `#E9EDF3` | 1.78 | Decorative only |
| pink `#EA78A5` | bg `#E9EDF3` | 2.31 | Pink fill vs page (supplementary; state carried by icon + aria-pressed) |
| text2 `#647184` | bg `#E9EDF3` | 4.22 | FORBIDDEN for text on bg |
| text2 `#647184` | bg2 `#F1F3F7` | 4.46 | FORBIDDEN for text on bg2 |
| white `#FFFFFF` | lavender `#9273C7` | 3.82 | FORBIDDEN (white on official lavender) |
| white `#FFFFFF` | pink `#EA78A5` | 2.72 | FORBIDDEN (white on pink) |
| text-secondary `#5E6A7C` | glass-subtle/black media (worst) `#CCCCCC` | 3.42 | FORBIDDEN (secondary text on subtle glass) |
| text-secondary `#5E6A7C` | glass-panel/black media (worst) `#E0E0E0` | 4.16 | FORBIDDEN as text (allowed as icon, >= 3:1) |
| accent-strong `#7556B3` | glass-panel/black media (worst) `#E0E0E0` | 4.26 | FORBIDDEN as text on panel glass (allowed as indicator) |
| pink-strong `#C2507F` | glass-subtle/black media (worst) `#CCCCCC` | 2.75 | FORBIDDEN (heart must sit in an opaque button) |

### Scales (ratio vs white / vs bg / vs text)

#### lavender
| Step | Hex | vs #FFFFFF | vs bg | vs text |
|---|---|---|---|---|
| 50 | `#F6F4FB` | 1.09 | 1.08 | 13.03 |
| 100 | `#EEE9F6` | 1.19 | 1.01 | 11.93 |
| 200 | `#DCD2ED` | 1.45 | 1.23 | 9.80 |
| 300 | `#C9B9E3` | 1.82 | 1.55 | 7.81 |
| 400 | `#AE97D6` | 2.56 | 2.18 | 5.55 |
| 500 | `#9273C7` | 3.82 | 3.25 | 3.72 |
| 600 | `#7556B3` | 5.62 | 4.78 | 2.53 |
| 700 | `#624896` | 7.27 | 6.19 | 1.95 |
| 800 | `#503A7A` | 9.43 | 8.02 | 1.51 |
| 900 | `#3B2B5A` | 12.51 | 10.64 | 1.14 |

#### pink
| Step | Hex | vs #FFFFFF | vs bg | vs text |
|---|---|---|---|---|
| 50 | `#FDF4F8` | 1.08 | 1.09 | 13.18 |
| 100 | `#FCE9F1` | 1.16 | 1.01 | 12.23 |
| 200 | `#F8D4E2` | 1.35 | 1.15 | 10.50 |
| 300 | `#F5BCD2` | 1.61 | 1.37 | 8.80 |
| 400 | `#EF9BBC` | 2.08 | 1.77 | 6.83 |
| 500 | `#EA78A5` | 2.72 | 2.31 | 5.23 |
| 600 | `#C2507F` | 4.42 | 3.76 | 3.21 |
| 700 | `#A3436B` | 5.88 | 5.00 | 2.42 |
| 800 | `#843656` | 7.95 | 6.76 | 1.79 |
| 900 | `#612840` | 11.14 | 9.48 | 1.28 |

#### neutral
| Step | Hex | vs #FFFFFF | vs bg | vs text |
|---|---|---|---|---|
| 0 | `#FFFFFF` | 1.00 | 1.17 | 14.21 |
| 25 | `#F8FAFC` | 1.05 | 1.12 | 13.58 |
| 50 | `#F1F3F7` | 1.11 | 1.06 | 12.79 |
| 100 | `#E9EDF3` | 1.17 | 1.00 | 12.10 |
| 150 | `#DDE1E9` | 1.31 | 1.12 | 10.84 |
| 200 | `#C5CFDC` | 1.58 | 1.34 | 9.02 |
| 250 | `#B5C2D1` | 1.81 | 1.54 | 7.85 |
| 300 | `#A5B5CA` | 2.09 | 1.78 | 6.81 |
| 400 | `#929BA9` | 2.81 | 2.39 | 5.07 |
| 500 | `#647184` | 4.96 | 4.22 | 2.87 |
| 600 | `#5E6A7C` | 5.49 | 4.67 | 2.59 |
| 700 | `#424B59` | 8.81 | 7.50 | 1.61 |
| 800 | `#303844` | 11.83 | 10.07 | 1.20 |
| 900 | `#252B36` | 14.21 | 12.10 | 1.00 |

### Derived state colours
- accent-strong-hover: `#624896`
- accent-strong-pressed: `#503A7A`
- accent-subtle: `#F6F4FB`
- accent-subtle-hover: `#EEE9F6`
- pink-subtle: `#FDF4F8`
- danger-subtle: `#F9EFF1`
- success-subtle: `#EEF4F1`

### Fluid type (360 -> 1440)
- display: 40px -> 64px  clamp(2.5rem, 2.0000rem + 2.2222vw, 4rem)
- h1: 32px -> 48px  clamp(2rem, 1.6667rem + 1.4815vw, 3rem)
- h2: 26px -> 36px  clamp(1.625rem, 1.4167rem + 0.9259vw, 2.25rem)
- h3: 21px -> 26px  clamp(1.3125rem, 1.2083rem + 0.4630vw, 1.625rem)
- h4: 18px -> 20px  clamp(1.125rem, 1.0833rem + 0.1852vw, 1.25rem)
- body-lg: 17px -> 18px  clamp(1.0625rem, 1.0417rem + 0.0926vw, 1.125rem)

## 5. Script source (`contrast.mjs`)

```js
// T-15 token contrast validation — WCAG 2.x relative luminance.
// Usage: node contrast.mjs   (exit code 1 if any REQUIRED pair fails)
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = rgb => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = rgb => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// sRGB alpha compositing (browser default): fg at alpha a over opaque bg
const over = (fg, a, bg) => fg.map((v, i) => Math.round(a * v + (1 - a) * bg[i]));
const mixHex = (a, b, t) => toHex(over(hex(a), 1 - t, hex(b))); // t = share of b

// ---------- Palette (official + D-05 approved) ----------
const P = {
  'bg': '#E9EDF3', 'bg2': '#F1F3F7', 'card': '#F8FAFC', 'elevated': '#FFFFFF', 'border': '#DDE1E9',
  'text': '#252B36', 'text2': '#647184', 'muted': '#929BA9', 'neu-shadow': '#C5CFDC', 'neu-deep': '#B5C2D1',
  'lavender': '#9273C7', 'pink': '#EA78A5', 'muted-blue': '#A5B5CA',
  // D-05 additions
  'text-secondary': '#5E6A7C', 'accent-strong': '#7556B3', 'pink-strong': '#C2507F', 'danger': '#B3364F', 'success': '#2B7355',
  'white': '#FFFFFF', 'black': '#000000',
};

// ---------- Derived scales (sRGB mixes; anchors are official/approved values) ----------
const tintSteps = { 50: 0.92, 100: 0.84, 200: 0.68, 300: 0.5, 400: 0.26 }; // share of white
const shadeSteps = { 700: 0.16, 800: 0.32, 900: 0.5 };                   // share of black, from the 600 anchor
const scale = (base500, strong600) => {
  const s = {};
  for (const [k, t] of Object.entries(tintSteps)) s[k] = mixHex(base500, '#FFFFFF', t);
  s[500] = base500; s[600] = strong600;
  for (const [k, t] of Object.entries(shadeSteps)) s[k] = mixHex(strong600, '#000000', t);
  return s;
};
const lavender = scale(P.lavender, P['accent-strong']);
const pink = scale(P.pink, P['pink-strong']);
const neutral = {
  0: '#FFFFFF', 25: P.card, 50: P.bg2, 100: P.bg, 150: P.border, 200: P['neu-shadow'], 250: P['neu-deep'],
  300: P['muted-blue'], 400: P.muted, 500: P.text2, 600: P['text-secondary'],
  700: mixHex(P['text-secondary'], P.text, 0.5), 800: mixHex(P['text-secondary'], P.text, 0.8), 900: P.text,
};
// Derived state colours used by components (proposed; see COLOR_SYSTEM)
P['accent-strong-hover'] = lavender[700];
P['accent-strong-pressed'] = lavender[800];
P['accent-subtle'] = lavender[50];
P['accent-subtle-hover'] = lavender[100];
P['pink-subtle'] = pink[50];
P['danger-subtle'] = mixHex(P.danger, '#FFFFFF', 0.92);
P['success-subtle'] = mixHex(P.success, '#FFFFFF', 0.92);

// ---------- Glass surfaces (effective colour = tint at alpha over backdrop) ----------
const G = { tint: hex('#FFFFFF'), subtle: 0.80, panel: 0.88, strong: 0.94, scrim: hex(P.text), scrimA: 0.48 };
const backdrops = { 'bg': hex(P.bg), 'white media': [255, 255, 255], 'black media (worst)': [0, 0, 0] };
const S = {}; // effective surfaces
for (const [n, b] of Object.entries(backdrops)) {
  S[`glass-subtle/${n}`] = over(G.tint, G.subtle, b);
  S[`glass-panel/${n}`] = over(G.tint, G.panel, b);
  const scrimmed = over(G.scrim, G.scrimA, b);
  S[`scrim/${n}`] = scrimmed;
  S[`glass-modal/${n}`] = over(G.tint, G.strong, scrimmed);
}
for (const k of ['bg', 'bg2', 'card', 'elevated', 'accent-strong', 'accent-strong-hover', 'accent-strong-pressed', 'pink',
  'accent-subtle', 'accent-subtle-hover', 'pink-subtle', 'danger-subtle', 'success-subtle', 'text']) S[k] = hex(P[k]);
const glassW = ['glass-subtle', 'glass-panel', 'glass-modal'].flatMap(g => Object.keys(backdrops).map(b => `${g}/${b}`));
const notSubtle = glassW.filter(s => !s.startsWith('glass-subtle'));
const modalOnly = glassW.filter(s => s.startsWith('glass-modal'));
const solid = ['bg', 'bg2', 'card', 'elevated'];

// ---------- Pairs actually used ----------
// kind: text (4.5), large (3: text >= 24px regular or >= 18.66px bold), ui (3: icons / indicators / boundaries)
const pairs = [];
const add = (fg, bgs, kind, use) => bgs.forEach(b => pairs.push({ fg, bg: b, kind, use }));
add('text', solid, 'text', 'Primary text, headings, control labels');
add('text-secondary', solid, 'text', 'Secondary text, metadata, placeholders, helper text');
add('text2', ['card', 'elevated'], 'text', 'Official text2: secondary text on card/elevated only');
add('accent-strong', solid, 'text', 'Text links, ghost-button labels, selected labels');
add('white', ['accent-strong', 'accent-strong-hover', 'accent-strong-pressed'], 'text', 'Primary button label (default/hover/pressed), skip link');
add('text', ['pink'], 'text', 'Liked button label/icon on pink fill');
add('text', ['accent-subtle', 'accent-subtle-hover', 'pink-subtle', 'danger-subtle', 'success-subtle'], 'text', 'Text on tinted fills (hover rows, badges, inline alerts)');
add('accent-strong', ['accent-subtle', 'accent-subtle-hover'], 'text', 'Selected pill/segment label, accent badge, avatar initials');
add('danger', [...solid, 'danger-subtle'], 'text', 'Error messages, field errors');
add('success', [...solid, 'success-subtle'], 'text', 'Success messages');
add('lavender', solid, 'large', 'Official lavender as text: display/h1/h2 emphasis only (>= 24px)');
// Glass
add('text', glassW, 'text', 'Text on glass (all levels, worst-case backdrops)');
add('text-secondary', modalOnly, 'text', 'Secondary text in modals only');
add('accent-strong', modalOnly, 'text', 'Links in modals only');
add('danger', modalOnly, 'text', 'Field errors in modals (auth gate)');
// Non-text (WCAG 1.4.11)
add('accent-strong', [...solid, ...glassW, 'accent-subtle'], 'ui', 'Focus ring (2px outline) and selected-state ring');
add('text-secondary', solid, 'ui', 'Icons; checkbox/radio/switch-off boundary; input leading icon');
add('text', glassW, 'ui', 'Icons on glass');
add('text-secondary', notSubtle, 'ui', 'Secondary icons on panel/modal glass (not on subtle glass)');
add('pink-strong', [...solid, 'pink-subtle'], 'ui', 'Liked heart icon');
add('pink-strong', notSubtle, 'ui', 'Liked heart icon in toasts/menus/modals');
add('lavender', solid, 'ui', 'Lavender icons, active-nav indicator, spinner arc, progress');
add('accent-strong', solid, 'ui', 'Primary button fill / switch-on track vs page');
add('white', ['accent-strong'], 'ui', 'Switch thumb / checkbox tick on accent-strong');
add('danger', [...solid, ...notSubtle], 'ui', 'Error icon, invalid-field outline');
add('success', [...solid, ...notSubtle], 'ui', 'Success icon (toasts, copy confirmation)');

const thr = { text: 4.5, large: 3, ui: 3 };
let fails = 0; const rows = []; const failed = [];
for (const p of pairs) {
  const f = hex(P[p.fg]); const b = S[p.bg];
  const r = ratio(f, b); const ok = r >= thr[p.kind];
  if (!ok) { fails++; failed.push(`${p.fg} on ${p.bg} = ${r.toFixed(2)}`); }
  rows.push(`| ${p.fg} \`${P[p.fg]}\` | ${p.bg} \`${toHex(b)}\` | ${p.kind} | ${thr[p.kind]} | ${r.toFixed(2)} | ${ok ? 'PASS' : 'FAIL'} | ${p.use} |`);
}
// Reference (not relied on for identification; exempt, decorative or forbidden)
const ref = [
  ['border', 'bg', 'Decorative divider/hairline (not relied on)'],
  ['neu-shadow', 'bg', 'Neumorphic shadow edge (not relied on)'],
  ['neu-deep', 'bg', 'Pressed shadow edge (not relied on)'],
  ['muted', 'bg', 'Disabled text only (WCAG 1.4.3 exempt)'],
  ['muted', 'card', 'Disabled text only (exempt)'],
  ['muted-blue', 'bg', 'Decorative only'],
  ['pink', 'bg', 'Pink fill vs page (supplementary; state carried by icon + aria-pressed)'],
  ['text2', 'bg', 'FORBIDDEN for text on bg'],
  ['text2', 'bg2', 'FORBIDDEN for text on bg2'],
  ['white', 'lavender', 'FORBIDDEN (white on official lavender)'],
  ['white', 'pink', 'FORBIDDEN (white on pink)'],
  ['text-secondary', 'glass-subtle/black media (worst)', 'FORBIDDEN (secondary text on subtle glass)'],
  ['text-secondary', 'glass-panel/black media (worst)', 'FORBIDDEN as text (allowed as icon, >= 3:1)'],
  ['accent-strong', 'glass-panel/black media (worst)', 'FORBIDDEN as text on panel glass (allowed as indicator)'],
  ['pink-strong', 'glass-subtle/black media (worst)', 'FORBIDDEN (heart must sit in an opaque button)'],
];
const refRows = ref.map(([f, b, u]) => { const bb = S[b] || hex(P[b]); return `| ${f} \`${P[f]}\` | ${b} \`${toHex(bb)}\` | ${ratio(hex(P[f]), bb).toFixed(2)} | ${u} |`; });

const out = [];
out.push(`Run: ${new Date().toISOString()}  node ${process.version}`);
out.push(`Glass: tint #FFFFFF, subtle ${G.subtle}, panel ${G.panel}, modal ${G.strong} over scrim ${toHex(G.scrim)} @ ${G.scrimA}`);
out.push('\n## Effective glass colours');
out.push('| Surface / backdrop | Effective colour |\n|---|---|');
for (const k of Object.keys(S).filter(k => k.includes('/'))) out.push(`| ${k} | \`${toHex(S[k])}\` |`);
out.push('\n## Required pairs');
out.push('| Foreground | Background | Kind | Min | Ratio | Result | Use |\n|---|---|---|---|---|---|---|');
out.push(...rows);
out.push(`\nREQUIRED PAIRS CHECKED: ${pairs.length}  FAILURES: ${fails}`);
if (failed.length) out.push('FAILED: ' + failed.join('; '));
out.push('\n## Reference pairs (excluded from pass/fail)');
out.push('| Foreground | Background | Ratio | Status |\n|---|---|---|---|');
out.push(...refRows);
out.push('\n## Scales (ratio vs white / vs bg / vs text)');
for (const [name, sc] of [['lavender', lavender], ['pink', pink], ['neutral', neutral]]) {
  out.push(`\n### ${name}\n| Step | Hex | vs #FFFFFF | vs bg | vs text |\n|---|---|---|---|---|`);
  for (const [k, v] of Object.entries(sc)) out.push(`| ${k} | \`${v}\` | ${ratio(hex(v), [255, 255, 255]).toFixed(2)} | ${ratio(hex(v), hex(P.bg)).toFixed(2)} | ${ratio(hex(v), hex(P.text)).toFixed(2)} |`);
}
out.push('\n## Derived state colours');
for (const k of ['accent-strong-hover', 'accent-strong-pressed', 'accent-subtle', 'accent-subtle-hover', 'pink-subtle', 'danger-subtle', 'success-subtle']) out.push(`- ${k}: \`${P[k]}\``);

// Fluid type clamp() between 360 and 1440
const clamp = (minPx, maxPx, vmin = 360, vmax = 1440) => {
  const slope = (maxPx - minPx) / (vmax - vmin); const icpt = minPx - slope * vmin;
  return `clamp(${minPx / 16}rem, ${(icpt / 16).toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxPx / 16}rem)`;
};
out.push('\n## Fluid type (360 -> 1440)');
for (const [n, a, b] of [['display', 40, 64], ['h1', 32, 48], ['h2', 26, 36], ['h3', 21, 26], ['h4', 18, 20], ['body-lg', 17, 18]]) out.push(`- ${n}: ${a}px -> ${b}px  ${clamp(a, b)}`);
console.log(out.join('\n'));
process.exit(fails ? 1 : 0);
```
