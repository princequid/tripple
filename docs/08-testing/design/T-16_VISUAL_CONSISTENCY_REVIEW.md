# T-16 — Visual Consistency Review

| Field | Value |
|---|---|
| Test | T-16 Visual consistency review (P05-07 prep, gate G3) |
| Executed | 2026-11-12 (script run `2026-11-12T19:04:02.603Z`, node v24.13.0) |
| Executed by | QA Lead (documentation review only: no code, no installs, no edits to the reviewed documents) |
| Documents reviewed | [FRONTEND_DESIGN_CONSTITUTION](../../05-design-system/FRONTEND_DESIGN_CONSTITUTION.md) (CONST) · [COLOR_SYSTEM](../../05-design-system/COLOR_SYSTEM.md) (COLOR) · [TYPOGRAPHY_SYSTEM](../../05-design-system/TYPOGRAPHY_SYSTEM.md) (TYPO) · [DESIGN_TOKENS](../../05-design-system/DESIGN_TOKENS.md) (TOKENS) · [DESIGN_SYSTEM](../../05-design-system/DESIGN_SYSTEM.md) (DS) · [COMPONENT_GUIDELINES](../../05-design-system/COMPONENT_GUIDELINES.md) (CG) · [T-15_CONTRAST_REPORT](T-15_CONTRAST_REPORT.md) (T15) |
| Reviewed against | User design-constitution intent (40/30/30, showcase priority, palette + D-05, pending D-23/D-24, Inter D-06, 4 px grid, radii 10–14 / 16–20 / 22–28 / full, subtle motion, accessibility); [MASTER_PROJECT_WORKFLOW](../../MASTER_PROJECT_WORKFLOW.md) §7 and P05-01…P05-07; [TESTING_PROGRESS](../../TESTING_PROGRESS.md) T-15/T-16; [REQUIREMENTS_SPECIFICATION](../../01-requirements/REQUIREMENTS_SPECIFICATION.md) NFR-02, NFR-26…NFR-29 and the navigation row (L47); [DECISION_LOG](../../DECISION_LOG.md) A-05, A-07, A-10, D-01, D-05, D-06, D-23, D-24, F-10 |
| Verdict | **Pass with findings** (0 critical · 5 high · 12 medium · 23 low). G3 should not be approved until the 5 high findings are fixed or explicitly accepted by the user |

Line references (`L123`) are to the files as read on 2026-11-12.

---

## 1. Method

1. Full read of all seven design documents plus the workflow P05 section, TESTING_PROGRESS T-15/T-16, NFRs 26–29 and the decision log.
2. Automated cross-reference with a throwaway Node script (§2): token definitions vs references, hex literals per file, glass alpha mentions, non-multiple-of-4 px values, duration literals, catalogue pillar tally, per-section token naming and state keywords, guideline coverage of catalogue IDs, a gallery-column sweep from the token values, and WCAG contrast for pairs that the catalogue implies but T-15 does not contain.
3. Manual review per check 2–7 of the brief: pillar assignment vs the constitution's allowed/forbidden tables, radii/spacing/type usage, state and keyboard/ARIA completeness, testability of A11Y-01…A11Y-15, cross-document contradictions, and the P05 acceptance criteria.
4. Each finding cites file and section/line and recommends a fix. The lead applies the fixes; this review edits no other file.

**Limitations.** The script uses regular expressions over Markdown. Its token resolution accepts the documents' shorthand role names (for example `glass-panel` → `--glass-panel-bg`, `blur-md` → `--blur-glass-md`, `bg-2` → `--color-bg-2`) through an explicit alias table in the script; anything outside that table is reported as unresolved. The state-keyword check is a coverage aid only; state gaps in §4 were confirmed by reading. Contrast checks use the same WCAG 2.x formula and sRGB compositing as T-15.

## 2. Scripts run

All scripts live outside the repository in the session scratchpad: `C:\Users\princ\AppData\Local\Temp\claude\79945e56ab248939\4548b493-394f-46cf-bd05-20edf506d193\scratchpad\t16\`.

| # | Command (Git Bash, from the scratch `t16` folder) | Date | Exit | Output file |
|---|---|---|---|---|
| S1 | `node t16-check.mjs "/c/Users/princ/Desktop/CODE_IT/Trippple/docs" > t16-output.txt` | 2026-11-12T19:04:02.603Z | 0 | `t16-output.txt` |
| S2 | `node t16-section-tokens.mjs ".../docs/05-design-system/DESIGN_SYSTEM.md"` | 2026-11-12 | 0 | `t16-section-tokens.txt` |
| S3 | `node -e` one-liner: contrast of fix options (accent-strong vs `#DDE1E9`, white vs accent-strong, accent vs bg2) | 2026-11-12 | 0 | console |

### 2.1 S1 results (verbatim excerpts)

| Check | Result |
|---|---|
| Token names defined in DESIGN_TOKENS | 185 |
| `var()` references inside DESIGN_TOKENS that are not defined there | `--scrim, --neu-raised-sm, --neu-raised, --neu-raised-lg, --neu-inset-sm, --neu-inset, --neu-pressed` → T16-14 |
| Token-like references in DESIGN_SYSTEM | 140 found, 134 resolved; the 2 "unresolved" are the parsing artefacts `translateY` / `translateY(--motion-lift)` (`--motion-lift` exists). **No undefined token is referenced** |
| Token-like references in COMPONENT_GUIDELINES | 3 found, 0 unresolved |
| Token-like references in CONSTITUTION | 15 found, the 3 "unresolved" are CSS (`prefers-reduced-transparency`, `translateY(-1px)`), not tokens |
| Raw hex in DESIGN_SYSTEM / COMPONENT_GUIDELINES | **0 / 0** (meets "tokens only") |
| Raw hex elsewhere | CONST 19 (all palette/D-05 colours in the §5 summary table, plus `#EA4C89` = the forbidden reference-product pink, named as forbidden, L20); TYPO 1 (`#9273C7`, L116); T15 49 (palette, D-23 derived colours, computed effective glass colours, reserved scale steps, `#000000` test backdrop); DECISION_LOG 21. Every hex outside COLOR/TOKENS is either a palette colour, a computed effective colour or a test backdrop: **no stray colour** |
| Glass alphas | CONST {0.80, 0.88, 0.94}; TOKENS {0.80, 0.88, 0.94, scrim 0.48}; T15 "subtle 0.8, panel 0.88, modal 0.94 over scrim @ 0.48"; DECISION_LOG D-23 {0.80, 0.88, 0.94}. **Consistent across all files** |
| Non-multiple-of-4 px values in DS/CG | Spacing: tooltip padding 6/10 (DS L556), menu padding 6 (DS L572) → T16-13. Others are stroke/ring/offset widths (1, 1.5, 2, 3 px), not spacing |
| Duration literals not mapped to motion tokens | Spinner rotation 800 ms (DS L478) is the only *animation* value without a token → T16-40. The rest are behaviour timings (2 s, 30 s, 150/300/400 ms delays, 5/8/10 s toast) |
| Pillar tally recomputed from the DS index | 51 rows, 6 structural excluded: **N 17 (37.8%) · G 13 (28.9%) · M 15 (33.3%) of 45**: matches DS §1 and D-24(b). Excluding C42 FAB and C43 Toggle (no confirmed R1 journey): N 34.9% · G 30.2% · M 34.9% → T16-16 |
| Sections with an explicit `Tokens:` line | 11 of 51 (S2: all sections except C25 and C35 name at least two tokens inline) → T16-32 |
| Catalogue IDs mentioned in COMPONENT_GUIDELINES | 49/51; not mentioned: C35 ErrorState, C36 Skeleton (both non-interactive except C35's buttons, covered generically by CG §6.1) |
| Gallery column sweep (`--gallery-min-col` 264, gutters, gaps, container 1680, 15 px scrollbar) | 1 col → **2 from 591 px → 3 from 903 px → 4 from 1207 px → 5 from 1591 px**; never 6 (container-max caps at 5). At the six gate widths: 1/1/2/3/4/4, matching TOKENS §10 and D-24(e). Mismatches with NFR-28 at 1023, 1279, 1280, 1600 and 1920 px → T16-03 |
| Contrast of implied pairs absent from T-15 | accent-strong text on glass-panel over scrim over black media (C06 drawer selected label): **4.38:1 FAIL** (min 4.5) · text-primary on the same: 11.08 PASS · success check icon on accent-strong button (C22 "Copied"): **1.01:1 FAIL** (min 3) · lavender spinner arc vs skeleton track (C37): **2.91:1 FAIL** (min 3) · text-secondary icon on glass-subtle worst: 3.42 PASS (as icon) |

### 2.2 S3 results

accent-strong vs `#DDE1E9` = 4.29 · white vs accent-strong = 5.62 · lavender vs bg2 = 3.44 (used to validate the recommended fixes in T16-09 and T16-10).

## 3. Findings

Severity: **critical** = blocks G3 and breaks a non-negotiable everywhere · **high** = violates a constitution "Forbidden" rule, an AA threshold, or contradicts an approved requirement · **medium** = a rule is untestable, inconsistent or unmet for some components · **low** = wording, naming or minor inconsistency.

| ID | Severity | File + location | Description | Recommended fix |
|---|---|---|---|---|
| T16-01 | High | DS §2 C06 (L138) | MobileNavDrawer (glass-panel, over the scrim) marks the current page with an **`accent-strong` label** with no opaque fill. CONST §3.3 (L89) and COLOR §10.2 forbid accent text on glass-panel; computed worst case (panel 0.88 over scrim over black media, `#E3E3E4`) is **4.38:1 < 4.5** (S1). The pair is not in T-15 | Use `text-primary` 600 + the 3 px `accent-strong` bar (indicator 3:1 allowed), **or** give the current row an opaque `accent-subtle` fill (accent-strong on it 5.15). Add "glass-panel over scrim" backdrops to T-15 (see T16-17) |
| T16-02 | High | DS C03 (L96), C07 (L149–152), C05 (L121), C06 (L131 "auth actions"); CONST §3.2 Forbidden (L64); CG §7 (L330) | Raised neumorphism on glass: the header (glass-subtle) contains the "Log in" **secondary** button, which C40 (L505) defines as raised neu with fill = parent; the AccountMenu avatar has a `shadow-neu-raised-sm` ring, hover `raised`, pressed `pressed`; the Explore trigger presses with `shadow-neu-pressed` "on `bg`" although its parent is glass. The drawer's auth actions have the same issue. Also contradicts C45 (L549), where a 40 px (md) avatar is flat M | Header and drawer use **Secondary-on-glass** (C40) for "Log in"; AccountMenu trigger = flat avatar with `accent-subtle-hover` hover and `selected-ring` when open; Explore trigger pressed = `accent-subtle` fill (no inset on a fill-less control) |
| T16-03 | High | TOKENS §10 (L268–L284); D-24(e); REQ NFR-28 (L1222) | Gallery columns contradict an approved R1 requirement. NFR-28: 2 at 600–1023, 3 at 1024–1439, 4 at 1440–1919, up to 6 at ≥ 1920. Tokens give **4 at 1280** (NFR: 3), **3 from 903 px** (NFR: 2), **5 from 1591 px** (NFR: 4) and **never 6** (container-max 1680). NFR-28 also adds 1920 px to the no-scroll widths, which CONST §8 omits | Resolve through D-24(e) at G3: either revise NFR-28 to the token behaviour (with a recorded decision) or change `--gallery-min-col`/gutters/`--container-max` to meet NFR-28. Add 1920 px to CONST §8 if NFR-28 stays |
| T16-04 | High | REQ L47 (navigation row); TOKENS §10 L269; DS C05/C06 (L25–26); CG §1.3 | Desktop-nav breakpoint contradiction: requirements say desktop header **≥ 1280 px**, burger + drawer **below 1280**; tokens, catalogue and guidelines switch at **lg = 1024 px**. D-24(e) proposes 1024 but is pending | Decide in D-24(e); then update REQ L47 (if 1024) or `--breakpoint-lg` usage for nav and DS C05/C06 (if 1280). T-18/T-26 need one number |
| T16-05 | High | CG §3.2 (L193, L195); REQ NFR-27 (L1216) | NFR-27 requires "focus moves to the first new item when loading via the button"; CG says "after loading, focus stays where it was" and "**Don't** move focus to new items automatically". The two acceptance tests (E2E-09 vs T-19) would contradict each other | Align CG with NFR-27: activating "Load more" moves focus to the first new card's link; infinite-scroll (sentinel) loads leave focus unchanged. Update DS C18 to say the same |
| T16-06 | Medium | CG §2.2 (L109), §2.8 (L173); TOKENS §13 L328; CONST A11Y-07 (L183) | Pills and tag chips are 40 px with a −2 px (all sides) hit extension and **8 px visual gap**, which leaves **4 px between hit areas**, below the system's own "≥ 8 px between adjacent targets" (A11Y-07, CG §0). Applies on fine pointers (coarse pointers switch to 44 px) | Use 12 px gap for `--control-h-sm` rows, or extend the hit area vertically only, and state which in TOKENS §13 |
| T16-07 | Medium | DS C13 (L237), C15 (L259); CG §2.8 (L172–176) | Removable TagChip: the remove (×) button sits inside a 40 px chip, but its size and hit area are not specified, so A11Y-07 (44 × 44) cannot be verified | Specify the remove button as IconButton sm (40 + extension) or make the chip 44 px with a 44 px trailing hit area, and give the spacing to the label |
| T16-08 | Medium | DS C04 (L111); DS C08 (L159); CONST A11Y-07 (L183) | BrandSlot link is a fixed **120 × 32** slot with no hit-area extension (< 44). Footer links (`text-body-sm`, spacing 12/16) have no target height. A11Y-07 says "every interactive element" with no inline-link exception, so running-text links fail it by definition | Give BrandSlot a 44 px hit extension; set footer link rows to ≥ 44 px (or 24 px + spacing per WCAG 2.5.8, NFR-26) and add an explicit inline-text-link exception to A11Y-07 |
| T16-09 | Medium | DS C22 (L354) | After copy, the primary "Copy" button shows a **`success` check icon on `accent-strong`**: **1.01:1** (S1). The "Copied" text carries the meaning, but the icon is invisible | Draw the check in `text-on-accent` (white, 5.62) on the button; keep `success` for the toast icon |
| T16-10 | Medium | DS C37 (L478) | Spinner arc `accent` vs its adjacent track `color-skeleton` (`#DDE1E9`) is **2.91:1** (< 3). C37 quotes 3.25, which is against `bg`, not the track. When the text is `sr-only` the spinner is the only visual cue | Arc `accent-strong` (4.29 vs track, S3) or a transparent track; add the pair to T-15 |
| T16-11 | Medium | CONST §7 Selected (L159); CG §7 (L328); DS C05 (L122), C06 (L138), C14 (L253), C15 (L267), C21 (L346), C27/C44 (L388, L545), C41 (L523) | "Same selected language everywhere: inset + `accent-subtle` + ring + 600 label" is not followed: C15/C21/C41/C44 omit the inset (and C15 the label colour); nav uses a 2 px underline; the drawer a 3 px bar; the radio a filled dot. The rule is not testable as written | Either list the sanctioned exceptions in CONST §7 (current-page underline for nav, radio dot, segment fill without inset because the track is inset) or align the components; state the label colour for C15/C21/C41 |
| T16-12 | Medium | DS C40 Highlight (L508), C20 (L336); CONST §3.2 definition (L45) and Forbidden (L68) | The Highlight (liked) button is classed **N** with raised hover and pressed inset on a **pink fill**. Neumorphism requires fill = parent, and filled neumorphic buttons are forbidden ("accent fills don't emboss cleanly") | Class Highlight as M: flat `highlight` fill, hover tint, pressed `accent-strong-pressed`-style darkening or no shadow; keep the raised style only for the not-liked state |
| T16-13 | Medium | DS C47 (L556), C49 (L572); CONST §6 (L149) | Off-grid spacing: tooltip padding **6/10**, menu padding **6**. CONST requires every margin, padding and gap to be a multiple of 4 (2 px is only allowed for icon nudges, TOKENS §4) | Tooltip padding 4/8 or 8/12; menu padding 4 or 8 |
| T16-14 | Medium | TOKENS §14 (L394, L422–L428), §6 (L178) | The Tailwind mapping references **undefined variables** `--scrim`, `--neu-raised-sm`, `--neu-raised`, `--neu-raised-lg`, `--neu-inset-sm`, `--neu-inset`, `--neu-pressed` (S1). bg2 shadows, glass shadows, elevation and h2…metadata are mapped only by comments ("likewise", "follow §3"); `--color-neu-light/dark/deep` are not mapped after `--color-*: initial` | Define the raw shadow variables in the `tokens.css` specification (or map `--shadow-neu-*` directly), rename `--scrim` to the existing `--color-scrim` source, and list every mapped token explicitly so P10-01 isn't left to interpret |
| T16-15 | Medium | CONST A11Y-15 (L191); TOKENS §12 (L317) | Forced colours is not testable as specified: only the focus-outline colour is given. Neumorphic controls have no border, and forced-colors mode removes box-shadows, so pills, inputs and secondary buttons lose every boundary | Add a token/pattern: every control has `border: 1px solid transparent` (becomes a system-colour border in forced colours), and list A11Y-15 checks per control type |
| T16-16 | Medium | DS C42 (L526), §9 home row (L587), §10.1 V-11 (L629) | FAB scope contradiction: C42 states an R1 use ("Back to top" on mobile feeds) and the screen map includes it, but V-11 says no R1 journey needs a FAB. It also changes the 40/30/30 tally (N 34.9% if FAB and Toggle are excluded; S1) | Decide whether back-to-top is R1; fix C42/§9 or V-11, and restate the tally in DS §1 and D-24(b) with the R1-only set |
| T16-17 | Medium | T15 §1, §4; COLOR §7 (L154) | T-15 composites modals over the scrim but **not glass-panel over the scrim** (drawer), and omits the implied pairs found in T16-01, T16-09 and T16-10. "Every pair used in components" (P05-02 AC) is therefore not fully proven | Add backdrops "panel over scrim over bg/white/black" and the three pairs to the T-15 script; re-run after the fixes |
| T16-18 | Low | CONST §3.2 Forbidden (L67) vs TOKENS §6 (L178) | Neumorphic blur limit: "> 20 px blur" forbidden vs "no blur > 18 px" | Use one limit (18 px) in both |
| T16-19 | Low | CONST §7 (L160) vs TOKENS §9 (L238–239) | Exit "75% of" entry: tokens give 160/220 (73%) and 200/280 (71%) | Say "≈ 70–75%" or set 165/210 ms |
| T16-20 | Low | CONST §3.2 Allowed (L54) vs DS C11 (L203), TOKENS §6 (L164) | Constitution puts the sort trigger under "inset track/well"; catalogue and tokens make it raised | Move "sort trigger" to the secondary-button row in CONST §3.2 |
| T16-21 | Low | TYPO §1.2 (L45–49) vs TOKENS §3 (L103–104), §14 (L396–397) | Font stacks differ: TYPO adds `"Apple Color Emoji", "Segoe UI Emoji"` and `"Liberation Mono"` | Make TOKENS the single stack and have TYPO quote it |
| T16-22 | Low | TYPO §4.8 (L116) vs COLOR §1 (L31), CONST §5 (L137) | Lavender display text: "≥ 26 px" in TYPO vs "≥ 24 px" elsewhere | Use "display/h1/h2 only (≥ 24 px)" everywhere |
| T16-23 | Low | TOKENS §5 (L148–149) vs DS C30 (L414) | `--radius-control` (12) is "Text inputs" but TextField always uses `radius-control-lg` (14), including filters and the share field | State one rule: TextField 14 everywhere (update TOKENS usage) or 12 except auth |
| T16-24 | Low | DS C17 (L290); CONST §6 nested radii (L150) | Action bar (inset 8 px inside a 16 px thumbnail) uses `radius-control-lg` 14; the nesting rule gives 16 − 8 = 8 | Use 8 px (no token: add `radius-nested-sm` or use `radius-control-sm` 10 with a noted exception) |
| T16-25 | Low | DS C07 (L145), CG §1.5 (L72) vs DS §10.1 V-7 (L625), FR-14 | Menu item "Profile" vs confirmed "View profile" | Use "View profile" |
| T16-26 | Low | DS C38 (L481) vs C42 (L526) | Toast is placed "above FAB" while the FAB is "hidden while a toast occupies that area" | Choose one behaviour |
| T16-27 | Low | DS C11 (L199) vs CG §2.3 (L117) | Catalogue specifies a custom glass listbox with full-width trigger < md; guidelines permit a native `<select>` < md (different visuals, no glass) | Pick one for R1 and note it in both |
| T16-28 | Low | DS C40 (L516), C50 (L576), C19 (L324), C09 (L168–178), C49 (L573) | State gaps: disabled not defined for Ghost, Secondary-on-glass and Highlight; TextLink has no active/disabled entry; C19 has no Active entry; C09 has no Selected row; C49 has no Focus row (active-descendant is described only as hover) | Add the rows or mark *n/a* with a reason, per the DS state key (L13) |
| T16-29 | Low | DS C37 (L478) vs TOKENS §9 reduced-motion CSS (L252–258); DS C10 (L188), C17 (L295), C38 (L485) | Spinner "pulsing opacity" under reduced motion is an infinite animation that the global rule (`animation-duration: 0.01ms; iteration-count: 1`) cancels. C10 lift, C17 translate and C38 rise state no reduced-motion behaviour (the global rule covers them, but T-19 needs an expected result) | Use the "static ellipsis" option for the spinner; add a "Reduced motion" row to C10, C17 and C38 |
| T16-30 | Low | TOKENS §7 fallback contract (L200–220) | The `@supports`/reduced-transparency contract is specified for `.glass-panel` only; `glass-subtle` and `glass-modal` (and their blur levels) are implied | Specify all three classes (or one shared mixin) |
| T16-31 | Low | DS §1 tally (L73); CONST §3.1 (L41) | Tally method: C22/C23/C32 are instances of C48 but counted separately; C11 counts only as N although it includes a G listbox; C12's panel is a flat `bg-2` region (M) labelled N | Document the counting rule in DS §1 (or count base families only) so D-24(b) is reproducible |
| T16-32 | Low | DS §2–§8 (S1, S2) | Only 11/51 sections have a `Tokens:` line; C25 and C35 name no token (C35 "alert icon danger" without the token name) | Add a `Tokens:` line to every section (P05-05 AC) |
| T16-33 | Low | TOKENS §5 (L147, L155), §2.2 (L89); CONST §6 (L150) | `--radius-checkbox` (6 px) and the "checkbox" boundary exist, but no Checkbox component is catalogued; the 6 px exception isn't in the constitution's 10–14 range | Mark as reserved (R2) or add the component; note the exception in CONST §6 |
| T16-34 | Low | MASTER_PROJECT_WORKFLOW §7 (L213) vs CONST §3.2 (L65) | Workflow says neumorphism is used for "controls **and cards**"; the constitution forbids neumorphic cards | Update the workflow sentence to "controls and small widgets" (constitution wins) |
| T16-35 | Low | DS C41 (L522) vs CONST §3.3 (L89) | IconButton allows `text-secondary` icons "for low emphasis" without excluding glass-subtle, where CONST forbids text-secondary (3.42 passes 3:1 as an icon, so the rule and the usage disagree) | State "text-primary only on glass-subtle" in C41, or relax CONST for icons |
| T16-36 | Low | CG §6.1 (L297); DS C40 (L517) | Loading ARIA is self-contradictory: "label text stays in the accessible name" and "'Sending code…' replaces it visibly and programmatically" | Pick one (recommended: name becomes the loading text; `aria-busy` on the button) |
| T16-37 | Low | DS C22 (L349); CONST principle 3 (L26); DS C41 (L522) | Share icon buttons "on an opaque `bg-2` row" inside the glass modal: unclear whether raised-sm-bg2 (principle 3: "no neumorphic control on a glass panel's raised surface") or flat (C41 "flat on glass") | Say flat (or explicitly allow raised-bg2 on an opaque row inside glass) |
| T16-38 | Low | CONST §3.2 (L57) vs DS C45 (L549) | Avatar ring "profile header only" vs "N at lg/xl" | Limit to xl in profile header, or widen CONST |
| T16-39 | Low | CONST §3.3 (L72); COLOR §7 (L158); DS C03 (L96), C17 (L290) | glass-subtle blur pairing: CONST lists alphas and blurs side by side (implying 0.80 ↔ 8 px); COLOR says 8–16; the header uses subtle + `blur-md`. DS also writes `blur-sm/md/lg` instead of the token names `--blur-glass-*` | Add a level × blur table to TOKENS §7 and use the full token names in DS |
| T16-40 | Low | DS C37 (L478); CONST principle 5 (L28) | Spinner rotation 800 ms has no motion token (tokens-only rule) | Add `--duration-spin: 800ms` |

**Counts:** critical 0 · high 5 · medium 12 · low 23 · total 40.

## 4. Checks performed (summary)

| # | Check | Outcome |
|---|---|---|
| 1 | Token consistency | No undefined token is referenced by DS/CG/CONST; 0 raw hex in DS and CG; glass alphas identical in every file. Defects are inside DESIGN_TOKENS' own Tailwind mapping (T16-14) and an untokenised spinner duration (T16-40) |
| 2 | Pillar rules | Showcase priority is respected everywhere (C16, C24, C22 preview: flat, `elevation-0`; the only overlay is the C17 hover/focus bar). No glass behind body text (C28 About, C24 text and the profile are minimal). Violations: raised neumorphism on glass in the header/drawer (T16-02), neumorphic filled Highlight button (T16-12), accent text on panel glass (T16-01); classification nits T16-31/37/38 |
| 3 | Radii, spacing, type | Radii stay in the constitution bands (10/12/14 · 16/20 · 24/28 · pill) except the reserved 6 px checkbox (T16-33) and the nested action bar (T16-24); TextField radius ambiguity (T16-23). Spacing: two off-grid paddings (T16-13); all other spacing is on the grid. Type: every role used in DS exists in TOKENS §3; body 16 px on mobile; 600 max weight; small typography contradictions T16-21/22 |
| 4 | States, keyboard, ARIA | All interactive families have state tables or explicit delegation ("per controls"); CG covers every interactive ID with an APG pattern and keyboard table (P05-06 met). Gaps: T16-28, T16-07; behaviour conflict with NFR-27 (T16-05) |
| 5 | Accessibility testability | A11Y-01…14 have thresholds and named tests. Gaps: target spacing arithmetic (T16-06), unsized targets (T16-07, T16-08), forced colours (T16-15), reduced-motion details (T16-29), fallback scope (T16-30), and 3 implied pairs failing/absent from T-15 (T16-01, 09, 10, 17). Focus ring (2 px outline, 2 px offset, ≥ 3.50 everywhere) is consistent in CONST, TOKENS, DS and CG |
| 6 | Cross-document contradictions | Gallery columns (T16-03) and nav breakpoint (T16-04) vs requirements; Load-more focus (T16-05); FAB scope (T16-16); minor T16-18…27, 34. Glass alphas, header height, modal widths, container sizes, toast/tooltip/menu radii and the lg breakpoint are consistent *within* the design set |
| 7 | P05 acceptance criteria | §5 |

## 5. Acceptance-criteria matrix

| Task | Criterion | Status | Evidence |
|---|---|---|---|
| P05-01 | Each style has allowed/forbidden usage rules with examples | **Met** | CONST §3.2–§3.4 allowed + forbidden tables with examples and alternatives; §4 showcase priority |
| P05-01 | Accessibility rules are testable (contrast, focus, motion) | **Met with findings** | A11Y-01…A11Y-15 with thresholds and tests (CONST §9). A11Y-07 spacing/exception (T16-06, T16-08), A11Y-15 not testable as specified (T16-15) |
| P05-01 | (dependency) D-01 decided | Not met — mitigated | D-01 pending; BrandSlot placeholder (CONST §10, DS C04) keeps layouts stable |
| P05-02 | Every text pair used in components ≥ 4.5:1 (3:1 large) after refinement | **Not met (one usage)** | T-15: 130/130 tokenised pairs pass. But DS C06 uses accent-strong text on panel glass over the scrim: 4.38:1 (T16-01). The fix is a usage change, not a palette change |
| P05-02 | Every control boundary ≥ 3:1 against adjacent colours | **Met with findings** | COLOR §6 strategy; spinner arc vs track 2.91 (T16-10); C22 icon 1.01 (T16-09) |
| P05-02 | Proposal submitted for D-05 | **Met** | D-05 approved 2026-11-12; derived colours submitted as D-23 (pending) |
| P05-03 | Scale defined for 360–1440 px | **Met** | TYPO §3, §3.1 (computed at the 6 widths) |
| P05-03 | Body text ≥ 16 px on mobile | **Met** | TYPO §4.1; CONST A11Y-14; inputs 16 px (DS C09, C30) |
| P05-04 | Every token has a name, value, usage note | **Met with findings** | TOKENS §2–§13 tables. Mapping gaps (T16-14) |
| P05-04 | No raw hex values needed by components outside tokens | **Met** | S1: 0 hex in DS and CG; TOKENS §15 forbids arbitrary values |
| P05-05 | Every component in R1 screens is catalogued with all states | **Met with findings** | 51 entries, §9 screen map, §10.1 verified against P01. State gaps T16-28; FAB scope T16-16 |
| P05-05 | Each component names the tokens it uses | **Met with findings** | 49/51 sections name ≥ 2 tokens (S2); C25, C35 none; only 11 have a `Tokens:` line (T16-32) |
| P05-06 | Every interactive component has keyboard behaviour and ARIA pattern documented | **Met** | CG §1–§6 and §8 coverage list; S1 shows 49/51 IDs referenced (missing C35/C36 are non-interactive apart from standard buttons). Behaviour conflict T16-05 to fix |
| P05-07 | T-15 shows zero failing text/control pairs | **Met for T-15 as run; needs re-run** | T-15 0/130 failures, independently re-run by the lead. T-16 found implied pairs not in T-15 (T16-17); re-run after fixes |
| P05-07 | User approval recorded | **Not met (expected)** | G3 not approved; D-23 and D-24 pending in DECISION_LOG |
| G3 | D-05 and D-06 decided | **Met** | DECISION_LOG D-05, D-06 approved 2026-11-12 |

## 6. Verdict

**Pass with findings.**

The design set is internally well tokenised: no raw colours in components, no undefined token references, identical glass levels in every document, a coherent focus ring, and a pillar tally of 38/29/33 that matches the stated method. Showcase priority is consistently protected.

Before G3 is approved:

1. Fix **T16-01** and **T16-02** (constitution "Forbidden" rules and one AA text failure in the drawer and header).
2. Decide **T16-03** and **T16-04** with the user through D-24(e), then align NFR-28 / REQ L47 or the tokens. These are requirement contradictions, not design defects.
3. Fix **T16-05** (Load-more focus) to match NFR-27.
4. Extend T-15 with the pairs in T16-17 and re-run it (expect T16-09/T16-10 to fail until fixed).

Medium findings should be fixed in the same revision, because P06 prototypes will copy these specifications. Low findings can be batched into the version 1.1 pass. T-16 should be marked **Test passed with findings** in TESTING_PROGRESS once the lead has triaged the list, and re-reviewed for P06-10.
