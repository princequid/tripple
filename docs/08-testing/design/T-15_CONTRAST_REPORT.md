# T-15 — Token Contrast Validation Report

| Field | Value |
|---|---|
| Test | T-15 Token contrast validation (P05-02; identity v2.1 revision) |
| Executed | Run: 2026-11-13T03:47:52.754Z  node v24.13.0 |
| Executed by | Lead, 2026-11-13 |
| Command | `node docs/08-testing/design/scripts/t15-contrast.mjs` (exit code 0 = no failures, 1 = failures) |
| Script | [scripts/t15-contrast.mjs](scripts/t15-contrast.mjs) (in the repository) |
| Method | WCAG 2.x relative luminance; glass composited in sRGB over the page `bg`, white media and black media (worst case); modals and the drawer over the charcoal scrim |
| Thresholds | Text 4.5:1 · large text (≥ 24 px) 3:1 · non-text UI (icons, rings, indicators, control boundaries) 3:1 |
| Result | **131 required pairs checked, 0 failures** |
| Version | **2.1** — revision 2.1 (A-17): bright primary `#DF2F4D` for fills, deep `#B3263E` for text and indicators, white background, re-derived tints. Previous: 2.0 (A-16, 128 pairs, 0 failures); 1.1 (lavender, 148 pairs) — in git history |
| Gate status | Evidence for the G3 revision (G3-R2). Remaining derived values (D-26) are pending the user's approval |

## 1. Scope

The pairs checked are those **actually used** by components in [DESIGN_SYSTEM](../../05-design-system/DESIGN_SYSTEM.md), per the roles in [COLOR_SYSTEM](../../05-design-system/COLOR_SYSTEM.md). Decorative, disabled (exempt) and forbidden pairs are listed separately and excluded from pass/fail.

## 2. Summary

| Category | Outcome |
|---|---|
| Required pairs | 131 checked, 0 failures |
| Text on crimson (user §6) | White on bright primary **4.51** (AA) · hover `#B3263E` 6.43 · pressed `#941D33` 8.46 |
| +30% brightness (`#E93151`) | Would give white text 4.18 — fails AA; the user chose +24.5% (`#DF2F4D`) |
| Crimson as text | Deep `#B3263E` only: 6.43 on white, 5.67 on soft grey, 5.24 on tertiary, 5.71 on primary light, 4.87 on panel glass |
| Bright crimson limits | 4.51 on white (heading emphasis, fills); 2.81 on subtle glass and < 4.5 on every tint — never text or a thin indicator there |
| Other limits | Secondary text not on tertiary (4.29) or subtle/panel glass; muted disabled-only (3.12); borders decorative; gold tint-only |
| F-10 (neumorphic shadow edge ~1.3) | Not relied on: every control has a ≥ 3:1 non-shadow cue |

## 3. Limitations

1. Token pairs, not rendered pages; rendered checks are T-33 (axe) and later T-19/T-27.
2. Blur and `saturate(140%)` are not modelled; the uniform black backdrop remains the worst case.
3. WCAG 2.x ratios only (no APCA), as required by WCAG 2.2 AA.

## 4. Full output

Glass: tint #FFFFFF, subtle 0.8, panel 0.88, modal 0.94; scrim #252326 @ 0.48

## Effective glass colours
| Surface / backdrop | Effective colour |
|---|---|
| glass-subtle/bg | `#FFFFFF` |
| glass-panel/bg | `#FFFFFF` |
| scrim/bg | `#969597` |
| glass-modal/bg | `#F9F9F9` |
| drawer/bg | `#F2F2F3` |
| glass-subtle/white media | `#FFFFFF` |
| glass-panel/white media | `#FFFFFF` |
| scrim/white media | `#969597` |
| glass-modal/white media | `#F9F9F9` |
| drawer/white media | `#F2F2F3` |
| glass-subtle/black media (worst) | `#CCCCCC` |
| glass-panel/black media (worst) | `#E0E0E0` |
| scrim/black media (worst) | `#121112` |
| glass-modal/black media (worst) | `#F1F1F1` |
| drawer/black media (worst) | `#E3E2E3` |

## Required pairs
| Foreground | Background | Kind | Min | Ratio | Result | Use |
|---|---|---|---|---|---|---|
| text `#252326` | bg `#FFFFFF` | text | 4.5 | 15.59 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | surface `#FFFFFF` | text | 4.5 | 15.59 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | bg2 `#F2F0F0` | text | 4.5 | 13.73 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | primary-light `#FCEEF1` | text | 4.5 | 13.84 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | bg3 `#EAE7E8` | text | 4.5 | 12.69 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | hover-tint `#FBE2E6` | text | 4.5 | 12.71 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | lavender-subtle `#EEEBF4` | text | 4.5 | 13.23 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | sage-subtle `#ECF0ED` | text | 4.5 | 13.55 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | gold-subtle `#F6F0E6` | text | 4.5 | 13.75 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | danger-subtle `#F8EEEA` | text | 4.5 | 13.67 | PASS | Primary text and labels on every surface and tinted fill |
| text `#252326` | success-subtle `#ECF0ED` | text | 4.5 | 13.55 | PASS | Primary text and labels on every surface and tinted fill |
| text-secondary `#706A70` | bg `#FFFFFF` | text | 4.5 | 5.27 | PASS | Secondary text, metadata, placeholders, hints (not on bg3) |
| text-secondary `#706A70` | surface `#FFFFFF` | text | 4.5 | 5.27 | PASS | Secondary text, metadata, placeholders, hints (not on bg3) |
| text-secondary `#706A70` | bg2 `#F2F0F0` | text | 4.5 | 4.64 | PASS | Secondary text, metadata, placeholders, hints (not on bg3) |
| text-secondary `#706A70` | primary-light `#FCEEF1` | text | 4.5 | 4.68 | PASS | Secondary text, metadata, placeholders, hints (not on bg3) |
| primary-deep `#B3263E` | bg `#FFFFFF` | text | 4.5 | 6.43 | PASS | Links, selected labels (pills, segments, chips, accent badge): deep crimson |
| primary-deep `#B3263E` | surface `#FFFFFF` | text | 4.5 | 6.43 | PASS | Links, selected labels (pills, segments, chips, accent badge): deep crimson |
| primary-deep `#B3263E` | bg2 `#F2F0F0` | text | 4.5 | 5.67 | PASS | Links, selected labels (pills, segments, chips, accent badge): deep crimson |
| primary-deep `#B3263E` | bg3 `#EAE7E8` | text | 4.5 | 5.24 | PASS | Links, selected labels (pills, segments, chips, accent badge): deep crimson |
| primary-deep `#B3263E` | primary-light `#FCEEF1` | text | 4.5 | 5.71 | PASS | Links, selected labels (pills, segments, chips, accent badge): deep crimson |
| primary-deep `#B3263E` | hover-tint `#FBE2E6` | text | 4.5 | 5.25 | PASS | Links, selected labels (pills, segments, chips, accent badge): deep crimson |
| primary `#DF2F4D` | bg `#FFFFFF` | text | 4.5 | 4.51 | PASS | Bright crimson heading emphasis on white (4.51) |
| primary `#DF2F4D` | surface `#FFFFFF` | text | 4.5 | 4.51 | PASS | Bright crimson heading emphasis on white (4.51) |
| white `#FFFFFF` | primary `#DF2F4D` | text | 4.5 | 4.51 | PASS | Primary button label default / hover / pressed; skip link; notification count |
| white `#FFFFFF` | primary-hover `#B3263E` | text | 4.5 | 6.43 | PASS | Primary button label default / hover / pressed; skip link; notification count |
| white `#FFFFFF` | primary-pressed `#941D33` | text | 4.5 | 8.46 | PASS | Primary button label default / hover / pressed; skip link; notification count |
| danger `#9A3412` | bg `#FFFFFF` | text | 4.5 | 7.31 | PASS | Error messages and field errors |
| danger `#9A3412` | surface `#FFFFFF` | text | 4.5 | 7.31 | PASS | Error messages and field errors |
| danger `#9A3412` | bg2 `#F2F0F0` | text | 4.5 | 6.44 | PASS | Error messages and field errors |
| danger `#9A3412` | danger-subtle `#F8EEEA` | text | 4.5 | 6.41 | PASS | Error messages and field errors |
| success `#556359` | bg `#FFFFFF` | text | 4.5 | 6.33 | PASS | Success messages |
| success `#556359` | surface `#FFFFFF` | text | 4.5 | 6.33 | PASS | Success messages |
| success `#556359` | bg2 `#F2F0F0` | text | 4.5 | 5.58 | PASS | Success messages |
| success `#556359` | success-subtle `#ECF0ED` | text | 4.5 | 5.51 | PASS | Success messages |
| text `#252326` | glass-subtle/bg `#FFFFFF` | text | 4.5 | 15.59 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-panel/bg `#FFFFFF` | text | 4.5 | 15.59 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-modal/bg `#F9F9F9` | text | 4.5 | 14.81 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | drawer/bg `#F2F2F3` | text | 4.5 | 13.93 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-subtle/white media `#FFFFFF` | text | 4.5 | 15.59 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-panel/white media `#FFFFFF` | text | 4.5 | 15.59 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-modal/white media `#F9F9F9` | text | 4.5 | 14.81 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | drawer/white media `#F2F2F3` | text | 4.5 | 13.93 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-subtle/black media (worst) `#CCCCCC` | text | 4.5 | 9.71 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-panel/black media (worst) `#E0E0E0` | text | 4.5 | 11.81 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 13.80 | PASS | Primary text on every glass level at worst-case backdrops |
| text `#252326` | drawer/black media (worst) `#E3E2E3` | text | 4.5 | 12.07 | PASS | Primary text on every glass level at worst-case backdrops |
| primary-deep `#B3263E` | glass-panel/bg `#FFFFFF` | text | 4.5 | 6.43 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | glass-panel/white media `#FFFFFF` | text | 4.5 | 6.43 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | glass-panel/black media (worst) `#E0E0E0` | text | 4.5 | 4.87 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | glass-modal/bg `#F9F9F9` | text | 4.5 | 6.11 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | glass-modal/white media `#F9F9F9` | text | 4.5 | 6.11 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 5.70 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | drawer/bg `#F2F2F3` | text | 4.5 | 5.75 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | drawer/white media `#F2F2F3` | text | 4.5 | 5.75 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| primary-deep `#B3263E` | drawer/black media (worst) `#E3E2E3` | text | 4.5 | 4.98 | PASS | Deep crimson text allowed on panel, modal and drawer glass |
| text-secondary `#706A70` | glass-modal/bg `#F9F9F9` | text | 4.5 | 5.01 | PASS | Secondary text in modals only |
| text-secondary `#706A70` | glass-modal/white media `#F9F9F9` | text | 4.5 | 5.01 | PASS | Secondary text in modals only |
| text-secondary `#706A70` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 4.67 | PASS | Secondary text in modals only |
| danger `#9A3412` | glass-modal/bg `#F9F9F9` | text | 4.5 | 6.94 | PASS | Field errors in modals (auth gate) |
| danger `#9A3412` | glass-modal/white media `#F9F9F9` | text | 4.5 | 6.94 | PASS | Field errors in modals (auth gate) |
| danger `#9A3412` | glass-modal/black media (worst) `#F1F1F1` | text | 4.5 | 6.47 | PASS | Field errors in modals (auth gate) |
| primary-deep `#B3263E` | bg `#FFFFFF` | ui | 3 | 6.43 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | surface `#FFFFFF` | ui | 3 | 6.43 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | bg2 `#F2F0F0` | ui | 3 | 5.67 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | primary-light `#FCEEF1` | ui | 3 | 5.71 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | bg3 `#EAE7E8` | ui | 3 | 5.24 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-subtle/bg `#FFFFFF` | ui | 3 | 6.43 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-panel/bg `#FFFFFF` | ui | 3 | 6.43 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-modal/bg `#F9F9F9` | ui | 3 | 6.11 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | drawer/bg `#F2F2F3` | ui | 3 | 5.75 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-subtle/white media `#FFFFFF` | ui | 3 | 6.43 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-panel/white media `#FFFFFF` | ui | 3 | 6.43 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-modal/white media `#F9F9F9` | ui | 3 | 6.11 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | drawer/white media `#F2F2F3` | ui | 3 | 5.75 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-subtle/black media (worst) `#CCCCCC` | ui | 3 | 4.01 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 4.87 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 5.70 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary-deep `#B3263E` | drawer/black media (worst) `#E3E2E3` | ui | 3 | 4.98 | PASS | Focus ring, selected ring, nav underline/bar, check icon, spinner arc, liked heart stroke |
| primary `#DF2F4D` | bg `#FFFFFF` | ui | 3 | 4.51 | PASS | Bright fills vs surface: primary button, switch-on track, radio fill, liked heart fill, notification dot, state icon |
| primary `#DF2F4D` | surface `#FFFFFF` | ui | 3 | 4.51 | PASS | Bright fills vs surface: primary button, switch-on track, radio fill, liked heart fill, notification dot, state icon |
| primary `#DF2F4D` | bg2 `#F2F0F0` | ui | 3 | 3.98 | PASS | Bright fills vs surface: primary button, switch-on track, radio fill, liked heart fill, notification dot, state icon |
| primary `#DF2F4D` | primary-light `#FCEEF1` | ui | 3 | 4.01 | PASS | Bright fills vs surface: primary button, switch-on track, radio fill, liked heart fill, notification dot, state icon |
| text-secondary `#706A70` | bg `#FFFFFF` | ui | 3 | 5.27 | PASS | Control boundary (radio, switch-off, checkbox), field icons |
| text-secondary `#706A70` | surface `#FFFFFF` | ui | 3 | 5.27 | PASS | Control boundary (radio, switch-off, checkbox), field icons |
| text-secondary `#706A70` | bg2 `#F2F0F0` | ui | 3 | 4.64 | PASS | Control boundary (radio, switch-off, checkbox), field icons |
| text-secondary `#706A70` | bg3 `#EAE7E8` | ui | 3 | 4.29 | PASS | Control boundary (radio, switch-off, checkbox), field icons |
| text-secondary `#706A70` | glass-panel/bg `#FFFFFF` | ui | 3 | 5.27 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | glass-panel/white media `#FFFFFF` | ui | 3 | 5.27 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 3.99 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | glass-modal/bg `#F9F9F9` | ui | 3 | 5.01 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | glass-modal/white media `#F9F9F9` | ui | 3 | 5.01 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 4.67 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | drawer/bg `#F2F2F3` | ui | 3 | 4.71 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | drawer/white media `#F2F2F3` | ui | 3 | 4.71 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text-secondary `#706A70` | drawer/black media (worst) `#E3E2E3` | ui | 3 | 4.08 | PASS | Secondary icons on panel/modal/drawer glass (not on subtle glass) |
| text `#252326` | glass-subtle/bg `#FFFFFF` | ui | 3 | 15.59 | PASS | Icons on glass |
| text `#252326` | glass-panel/bg `#FFFFFF` | ui | 3 | 15.59 | PASS | Icons on glass |
| text `#252326` | glass-modal/bg `#F9F9F9` | ui | 3 | 14.81 | PASS | Icons on glass |
| text `#252326` | drawer/bg `#F2F2F3` | ui | 3 | 13.93 | PASS | Icons on glass |
| text `#252326` | glass-subtle/white media `#FFFFFF` | ui | 3 | 15.59 | PASS | Icons on glass |
| text `#252326` | glass-panel/white media `#FFFFFF` | ui | 3 | 15.59 | PASS | Icons on glass |
| text `#252326` | glass-modal/white media `#F9F9F9` | ui | 3 | 14.81 | PASS | Icons on glass |
| text `#252326` | drawer/white media `#F2F2F3` | ui | 3 | 13.93 | PASS | Icons on glass |
| text `#252326` | glass-subtle/black media (worst) `#CCCCCC` | ui | 3 | 9.71 | PASS | Icons on glass |
| text `#252326` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 11.81 | PASS | Icons on glass |
| text `#252326` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 13.80 | PASS | Icons on glass |
| text `#252326` | drawer/black media (worst) `#E3E2E3` | ui | 3 | 12.07 | PASS | Icons on glass |
| white `#FFFFFF` | primary `#DF2F4D` | ui | 3 | 4.51 | PASS | Switch thumb, radio dot, white check icon on primary, busy spinner on primary |
| white `#FFFFFF` | primary-hover `#B3263E` | ui | 3 | 6.43 | PASS | Switch thumb, radio dot, white check icon on primary, busy spinner on primary |
| danger `#9A3412` | bg `#FFFFFF` | ui | 3 | 7.31 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | surface `#FFFFFF` | ui | 3 | 7.31 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | bg2 `#F2F0F0` | ui | 3 | 6.44 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | glass-panel/bg `#FFFFFF` | ui | 3 | 7.31 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | glass-panel/white media `#FFFFFF` | ui | 3 | 7.31 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 5.54 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | glass-modal/bg `#F9F9F9` | ui | 3 | 6.94 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | glass-modal/white media `#F9F9F9` | ui | 3 | 6.94 | PASS | Error icon, invalid-field ring |
| danger `#9A3412` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 6.47 | PASS | Error icon, invalid-field ring |
| success `#556359` | bg `#FFFFFF` | ui | 3 | 6.33 | PASS | Success icon (toasts, alerts) |
| success `#556359` | surface `#FFFFFF` | ui | 3 | 6.33 | PASS | Success icon (toasts, alerts) |
| success `#556359` | bg2 `#F2F0F0` | ui | 3 | 5.58 | PASS | Success icon (toasts, alerts) |
| success `#556359` | glass-panel/bg `#FFFFFF` | ui | 3 | 6.33 | PASS | Success icon (toasts, alerts) |
| success `#556359` | glass-panel/white media `#FFFFFF` | ui | 3 | 6.33 | PASS | Success icon (toasts, alerts) |
| success `#556359` | glass-panel/black media (worst) `#E0E0E0` | ui | 3 | 4.80 | PASS | Success icon (toasts, alerts) |
| success `#556359` | glass-modal/bg `#F9F9F9` | ui | 3 | 6.02 | PASS | Success icon (toasts, alerts) |
| success `#556359` | glass-modal/white media `#F9F9F9` | ui | 3 | 6.02 | PASS | Success icon (toasts, alerts) |
| success `#556359` | glass-modal/black media (worst) `#F1F1F1` | ui | 3 | 5.61 | PASS | Success icon (toasts, alerts) |
| lavender `#8D7AB8` | bg `#FFFFFF` | ui | 3 | 3.74 | PASS | Supporting lavender icon/illustration accent (optional) |
| lavender `#8D7AB8` | surface `#FFFFFF` | ui | 3 | 3.74 | PASS | Supporting lavender icon/illustration accent (optional) |
| sage `#829889` | bg `#FFFFFF` | ui | 3 | 3.09 | PASS | Supporting sage icon accent (optional) |
| sage `#829889` | surface `#FFFFFF` | ui | 3 | 3.09 | PASS | Supporting sage icon accent (optional) |

REQUIRED PAIRS CHECKED: 131  FAILURES: 0

## Reference pairs (excluded from pass/fail)
| Foreground | Background | Ratio | Status |
|---|---|---|---|
| border `#E7E1E3` | bg `#FFFFFF` | 1.29 | Decorative hairline only |
| primary-border `#F5C1CA` | bg `#FFFFFF` | 1.57 | Decorative edge of primary-light elements only |
| primary-border `#F5C1CA` | primary-light `#FCEEF1` | 1.39 | Decorative edge (badge outline) |
| muted `#969096` | bg `#FFFFFF` | 3.12 | Disabled text only (WCAG 1.4.3 exempt) |
| muted `#969096` | bg2 `#F2F0F0` | 2.75 | Disabled text only (exempt) |
| gold `#C69A55` | bg `#FFFFFF` | 2.58 | FORBIDDEN as text or lone icon: tinted fills only |
| gold `#C69A55` | surface `#FFFFFF` | 2.58 | FORBIDDEN as text or lone icon |
| lavender `#8D7AB8` | bg `#FFFFFF` | 3.74 | FORBIDDEN as text (3.67): decorative / icon only |
| sage `#829889` | bg `#FFFFFF` | 3.09 | FORBIDDEN as text (3.02): use success for text |
| text-secondary `#706A70` | bg3 `#EAE7E8` | 4.29 | FORBIDDEN: no secondary text on the tertiary surface |
| text-secondary `#706A70` | glass-subtle/black media (worst) `#CCCCCC` | 3.28 | FORBIDDEN: no secondary text on subtle glass |
| text-secondary `#706A70` | glass-panel/black media (worst) `#E0E0E0` | 3.99 | FORBIDDEN as text on panel glass (allowed as icon ≥ 3) |
| text-secondary `#706A70` | drawer/black media (worst) `#E3E2E3` | 4.08 | FORBIDDEN as text in the drawer (allowed as icon ≥ 3) |
| primary-deep `#B3263E` | glass-subtle/black media (worst) `#CCCCCC` | 4.01 | Deep crimson on subtle glass: indicator only (≥ 3), not text |
| primary `#DF2F4D` | glass-subtle/black media (worst) `#CCCCCC` | 2.81 | FORBIDDEN: bright crimson on subtle glass (2.81) — indicators use deep crimson |
| primary `#DF2F4D` | primary-light `#FCEEF1` | 4.01 | FORBIDDEN as text: bright crimson on its tint (selected labels use deep crimson) |
| primary `#DF2F4D` | bg2 `#F2F0F0` | 3.98 | FORBIDDEN as text on soft grey (use deep crimson) |
| white `#FFFFFF` | lavender `#8D7AB8` | 3.74 | FORBIDDEN: white text on lavender |
| white `#FFFFFF` | gold `#C69A55` | 2.58 | FORBIDDEN: white text on gold |
| white `#FFFFFF` | sage `#829889` | 3.09 | FORBIDDEN: white text on sage |
| danger `#9A3412` | primary `#DF2F4D` | 1.62 | Danger vs crimson: never adjacent as the only difference (icons and wording carry errors) |

## Neumorphic shadow edge (reference; never the only cue, F-10)
- warm shadow over bg: `#E4E1E2` = 1.30:1
- warm shadow over bg2: `#D9D5D6` = 1.28:1

## Palette
- primary: `#DF2F4D` (vs bg 4.51, vs white 4.51)
- primary-deep: `#B3263E` (vs bg 6.43, vs white 6.43)
- primary-hover: `#B3263E` (vs bg 6.43, vs white 6.43)
- primary-light: `#FCEEF1` (vs bg 1.13, vs white 1.13)
- primary-border: `#F5C1CA` (vs bg 1.57, vs white 1.57)
- bg: `#FFFFFF` (vs bg 1.00, vs white 1.00)
- surface: `#FFFFFF` (vs bg 1.00, vs white 1.00)
- bg2: `#F2F0F0` (vs bg 1.14, vs white 1.14)
- bg3: `#EAE7E8` (vs bg 1.23, vs white 1.23)
- text: `#252326` (vs bg 15.59, vs white 15.59)
- text-secondary: `#706A70` (vs bg 5.27, vs white 5.27)
- muted: `#969096` (vs bg 3.12, vs white 3.12)
- border: `#E7E1E3` (vs bg 1.29, vs white 1.29)
- lavender: `#8D7AB8` (vs bg 3.74, vs white 3.74)
- sage: `#829889` (vs bg 3.09, vs white 3.09)
- gold: `#C69A55` (vs bg 2.58, vs white 2.58)
- primary-pressed: `#941D33` (vs bg 8.46, vs white 8.46)
- hover-tint: `#FBE2E6` (vs bg 1.23, vs white 1.23)
- lavender-subtle: `#EEEBF4` (vs bg 1.18, vs white 1.18)
- sage-subtle: `#ECF0ED` (vs bg 1.15, vs white 1.15)
- gold-subtle: `#F6F0E6` (vs bg 1.13, vs white 1.13)
- danger: `#9A3412` (vs bg 7.31, vs white 7.31)
- danger-subtle: `#F8EEEA` (vs bg 1.14, vs white 1.14)
- success: `#556359` (vs bg 6.33, vs white 6.33)
- success-subtle: `#ECF0ED` (vs bg 1.15, vs white 1.15)
- white: `#FFFFFF` (vs bg 1.00, vs white 1.00)
