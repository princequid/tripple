# Component Guidelines

| Field | Value |
|---|---|
| Task | P05-06 |
| Version | 2.1 — 2026-11-13: styling contract updated for revision 2.1 (A-17): bright crimson fills, deep crimson text and indicators, white background, no gradients ([§0.1](#01-identity-v21-styling-contract-crimson-white-soft-grey-charcoal)); behaviour, keyboard and ARIA unchanged. For review (G3-R2) |
| Date | 2026-11-12 |
| Covers | Every **interactive** component in [DESIGN_SYSTEM](DESIGN_SYSTEM.md) (IDs `C..` refer to that catalogue) |
| Patterns | WAI-ARIA Authoring Practices Guide (APG) — pattern named per component |
| Feeds | T-16 visual review; T-19 accessibility criteria |

Visual states and tokens live in the catalogue; this document covers anatomy, variants, sizing, do/don't, keyboard behaviour and the ARIA pattern. Native HTML elements come first: ARIA is added only where HTML has no equivalent.

---

## 0. Rules for every interactive component

| Rule | Detail |
|---|---|
| Native first | `<a href>` navigates, `<button>` acts, `<input>`/`<select>` collect. Never `div onClick` |
| Accessible name | Visible label, or `aria-label` for icon-only controls (matched by a Tooltip) |
| Focus | Global `:focus-visible` ring (2 px deep crimson `#B3263E` outline, 2 px offset; ≥ 4.01:1 on every surface). Never removed |
| Target | ≥ 44 × 44 px hit area for every control. A control whose visual size is below 44 px (the 40 px `sm` sizes) extends its hit area to 44 px and keeps ≥ 8 px between hit areas. Targets that are themselves ≥ 44 × 44 need no extra spacing. **Exception:** links inside running text need ≥ 24 × 24 px (WCAG 2.5.8 inline exception, NFR-26) |
| State in ARIA | Toggle → `aria-pressed`; disclosure → `aria-expanded` + `aria-controls`; current page → `aria-current="page"`; invalid → `aria-invalid` + `aria-describedby`; busy → `aria-busy` |
| Overlays | Escape closes; focus moves in on open and returns to the trigger on close; outside click closes non-modal overlays |
| Announcements | One polite live region per page for async results (`role="status"`); `role="alert"` only for errors that need immediate attention |
| No hover-only | Every hover-revealed control is also revealed on focus and available on touch |
| Disabled | Prefer real `disabled`. Use `aria-disabled="true"` when the control must stay focusable to explain why (tooltip) |


## 0.1 Identity v2.1 styling contract (Crimson, White, Soft Grey, Charcoal)

One styling contract for the component families named in the user constitution §3.5. Values are semantic tokens (DESIGN_TOKENS §2); contrast is from T-15 v2. **Every state is also expressed by an icon, text, weight or ARIA change**, never by colour alone (§3.6).

**Shared state language**

| State | Treatment |
|---|---|
| Hover | Soft-grey controls: deeper warm shadow crossfade + 1 px lift. Flat items (menu rows, ghost buttons, chips): `--color-accent-subtle-hover` `#FBE2E6`. Primary: `#B3263E` |
| Active / pressed | Soft-grey controls: inset pressed shadow, no movement. Primary: `#941D33`. Menu rows: `--color-accent-subtle`; flattened controls inside glass: `--color-bg-2` |
| Selected / current | Primary-light `#FCEEF1` well or fill + 1.5 px deep crimson ring + deep crimson 600 label (5.71); on glass and in nav: deep crimson bar, underline or check + charcoal 600 label |
| Focus | 2 px deep crimson outline, 2 px offset |
| Disabled | Shadows removed, label `--color-text-disabled` `#969096`, `cursor: not-allowed`; primary becomes `--color-bg-3` fill |
| Loading | Width kept; deep crimson spinner arc (white on primary) + `aria-busy`; lists show skeletons (`--color-skeleton`) |
| Success | Sage-dark `#556359` icon + text, tint `#ECF0ED` for inline alerts, toast with check icon |
| Error | Sienna `#9A3412` icon + text + field ring, tint `#F8EEEA` for inline alerts (**not crimson**, D-26) |

**Per family**

| Family | Default | Notes and limits |
|---|---|---|
| Primary button (C40) | Solid bright crimson `#DF2F4D`, white 600 label (4.51); hover `#B3263E` (6.43), pressed `#941D33` (8.46) | Flat (no neumorphism, no gradient); one primary action per view region |
| Secondary button (C40) | Soft-grey `#F2F0F0` neumorphic control, charcoal label | On glass: `.ui-btn--on-glass` (white surface + hairline); ghost for low emphasis |
| Search field (C09) | Inset soft-grey pill, secondary-text icon and placeholder (4.64), crimson submit on hero | Focus adds the crimson ring; no crimson fill on the field |
| Navigation (C03–C07) | Subtle-glass header on white; charcoal links | Current page: crimson underline (header) or bar (drawer) + 600 label; menus are panel glass with crimson check for the chosen option |
| Gallery thumbnails (C16–C18) | Artwork only: no border, shadow, tint, filter, gradient overlay or crimson frame | Hover bar is subtle glass with charcoal text; liked heart crimson inside an opaque white button |
| Cards and containers (C52) | White card, hairline + elevation-1 on white; muted card on soft grey | Never wraps showcase media; no crimson borders |
| Category filters (C10–C15) | Soft-grey pills and chips; filter panel on soft grey (classic neumorphism) | Selected category/filter = primary-light well + crimson ring + crimson label; Filters toggle shows a primary-light count badge with a crimson number |
| Dropdowns (C11, C49) | Soft-grey trigger; panel-glass list | Chosen option: deep crimson check + charcoal 600 label; hover row `#FBE2E6` |
| Modals (C48) | Modal glass (white α .94) on a charcoal scrim | Secondary text and crimson links allowed (4.67 / 5.70); errors in sienna |
| Forms and inputs (C30, C31) | Inset soft-grey wells, charcoal text, persistent labels | Invalid: sienna ring + icon + message; disabled: muted label, no shadow |
| Notifications (C38, dot) | Toasts on panel glass with sage or sienna icon; bright crimson count dot on the bell (R3) | Dot always paired with an accessible name; toasts announce via live regions |
| User profiles (C26–C28, C45) | Minimal: charcoal name, secondary headline, lavender-tint initials avatar with a soft raised ring | Badges use tints (crimson PRO, gold Featured, lavender Team, sage New) with charcoal text |
| Interactive icons (C41, C20, C21) | Soft-grey 44 px circles with charcoal icons | Liked = bright crimson heart with deep stroke in a primary-light well; on glass the controls are flat |

**No gradients** anywhere (A-17). **Supporting accents** (lavender, sage, gold) never mark interactivity or selection; they appear as tints with charcoal text, avatar fills, badges and illustration.

---

## 1. Navigation

### 1.1 SkipLink (C02)
- **Anatomy:** single link "Skip to content" → `#main` (`<main tabindex="-1">`).
- **Sizing:** 44 px high, pill.
- **Keyboard:** first Tab stop; Enter moves focus to main.
- **ARIA:** none (native link).
- **Do:** keep it first in DOM. **Don't:** hide with `display:none` (unfocusable).

### 1.2 SiteHeader (C03) and BrandSlot (C04)
- **Anatomy:** `<header>` (banner landmark) → BrandSlot link, search form, `<nav aria-label="Main">`, auth area.
- **Keyboard:** natural Tab order left → right. No roving focus.
- **ARIA:** landmarks only. BrandSlot link `aria-label="Trippple home"` (update at D-01).
- **Do:** set `scroll-padding-top: calc(var(--header-h) + 16px)` so focused elements aren't hidden under the sticky header (WCAG 2.4.11); use **Secondary-on-glass** (`.ui-btn--on-glass`) for "Log in" and hide secondary actions below md (`.ui-header__secondary`, moved into the drawer). **Don't:** put secondary text or accent links on the subtle glass; don't use raised neumorphic buttons in the header.

### 1.3 PrimaryNav & ExploreMenu (C05)
- **Anatomy:** list of links; "Explore" is a `<button>` that discloses a panel of links.
- **Variants:** desktop (≥ lg) only; < lg uses the drawer.
- **Pattern:** APG **Disclosure Navigation Menu** (not `role="menu"`; items are links).
- **Keyboard:**

| Key | Action |
|---|---|
| Tab / Shift+Tab | Moves through trigger and, when open, the panel's links in DOM order |
| Enter / Space on trigger | Toggle panel |
| Escape | Close panel, focus trigger |
| Down Arrow on trigger (optional enhancement) | Open and focus first link |

- **ARIA:** trigger `aria-expanded`, `aria-controls="explore-panel"`; current page link `aria-current="page"`.
- **Do:** open on click (hover-open allowed on fine pointers after 150 ms, but click always works). **Don't:** close the panel when the pointer crosses a small gap (use a hover bridge).

### 1.4 MobileNavDrawer (C06)
- **Anatomy:** burger IconButton → modal sheet with close button, search, nav sections (accordion), auth actions.
- **Sizing:** width `min(100%, 360px)`; rows 48 px.
- **Pattern:** APG **Dialog (Modal)**; sections use **Accordion** (`<button aria-expanded>` headers).
- **Keyboard:** Tab trapped in drawer; Escape closes; Enter/Space toggles an accordion section; focus returns to burger on close.
- **ARIA:** `role="dialog"`, `aria-modal="true"`, `aria-label="Menu"`; burger `aria-expanded`, `aria-controls`; current page row `aria-current="page"` (shown as a `text-primary` 600 label + 3 px `accent-strong` bar, never accent text).
- **Variants:** auth actions use Secondary-on-glass ("Log in") and Primary ("Sign up"), full width.
- **Do:** lock body scroll; close on route change. **Don't:** blur the scrim (no stacked glass).

### 1.5 AccountMenu (C07)
- **Anatomy:** avatar button → menu: identity header (not focusable), "View profile", "Sign out" (FR-14). The trigger is a flat avatar (no raised neumorphism on glass).
- **Pattern:** APG **Menu Button** (`role="menu"` with `menuitem`s — these are actions/one link, not site navigation).
- **Keyboard:**

| Key | Action |
|---|---|
| Enter / Space / Down Arrow | Open, focus first item |
| Up Arrow (on button) | Open, focus last item |
| Down / Up Arrow | Next / previous item (wraps) |
| Home / End | First / last item |
| Enter | Activate item |
| Escape | Close, focus button |
| Tab | Close and move on |

- **ARIA:** button `aria-haspopup="menu"`, `aria-expanded`, `aria-label="Account menu for {name}"`; menu `aria-labelledby` the button.
- **Do:** roving `tabindex` inside the menu. **Don't:** put form fields in a `role="menu"`.

### 1.6 SiteFooter (C08) and TextLink (C50)
- **Anatomy:** `<footer>` (contentinfo) with `<nav aria-label="Footer">` link lists.
- **Keyboard:** Tab through links; Enter follows.
- **ARIA:** native links; external links announce "(opens in new tab)" via `sr-only` text.
- **Sizing:** footer links are blocks ≥ 44 px high; links inside running text need ≥ 24 px (inline exception).
- **Do:** underline running-text links; keep link text meaningful out of context. **Don't:** use "click here"; don't use `accent-strong` links on subtle/panel glass.

---

## 2. Discovery controls

### 2.1 SearchBar (C09)
- **Anatomy:** `<form role="search" action="/search">` → `<label class="sr-only">Search shots</label>`, leading icon (decorative), `<input type="search" name="q">`, clear button, (submit by Enter; visible submit IconButton < md).
- **Sizing:** 48 px high; min width 240 px (≥ md), full width in drawer; text 16 px.
- **Pattern:** native search form. If autocomplete suggestions are added later, APG **Combobox (list autocomplete)**.
- **Keyboard:** type; Enter submits; Escape clears the value (second Escape blurs); clear button is a normal Tab stop.
- **ARIA:** clear button `aria-label="Clear search"`; after clearing, focus returns to the input.
- **Do:** keep the label programmatic even though the placeholder is visible. **Don't:** submit on every keystroke.

### 2.2 CategoryPills (C10)
- **Anatomy:** `<nav aria-label="Categories">` → `<ul>` of pill links; optional scroll buttons (≥ md).
- **Sizing:** 44 px (`--control-h-md`) with an 8 px gap; the 40 px `sm` size only with a 44 px hit extension and a 12 px gap; scroller padding 8 px block. The first pill is "All" (BR-89).
- **Pattern:** navigation links (they change the URL) — **not** tabs.
- **Keyboard:** Tab through links; Enter navigates; the focused pill scrolls into view (`scrollIntoView({block:'nearest', inline:'nearest'})`).
- **ARIA:** current pill `aria-current="page"`; scroll buttons `aria-label="Scroll categories left/right"`, `aria-hidden` and removed from tab order when not scrollable.
- **Do:** keep selected state visible without colour (inset + ring + weight). **Don't:** convert to `role="tablist"` — there are no tab panels.

### 2.3 SortDropdown (C11)
- **Anatomy:** trigger button showing the current value + listbox of options.
- **Variants:** the same custom glass listbox at every width (T16-27); the trigger is full width below md. Options: Popular, Recent.
- **Pattern:** APG **Select-Only Combobox**.
- **Keyboard:**

| Key | Action |
|---|---|
| Enter / Space / Alt+Down | Open; active option = current value |
| Down / Up | Move active option (opens if closed) |
| Home / End | First / last option |
| Type-ahead | Jump to option starting with typed characters |
| Enter | Select active option, close, navigate |
| Escape | Close without change |
| Tab | Select active option and close (APG behaviour) |

- **ARIA:** trigger `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-labelledby` = visually hidden "Sort by" + value; options `role="option"`, `aria-selected`.
- **Do:** keep focus on the combobox (active-descendant). **Don't:** navigate while arrowing through options — only on selection.

### 2.4 FilterToggle & FilterPanel (C12)
- **Anatomy:** "Filters" button with count badge → inline region with Tags and Timeframe groups, per-group "Clear", global "Clear all".
- **Pattern:** APG **Disclosure**.
- **Keyboard:** Enter/Space toggles; panel content follows the button in Tab order; Escape inside the panel closes it and focuses the toggle.
- **ARIA:** toggle `aria-expanded`, `aria-controls`; badge text included in name ("Filters, 2 active"); panel `role="region"` `aria-label="Filters"`; each group a `<fieldset>` with `<legend>`.
- **Do:** reflect filters in the URL; announce result count after navigation in the live region ("128 shots"). **Don't:** auto-close the panel when a filter is applied; don't show the explore filter bar on search results pages (FR-31).

### 2.5 TagFilter (C13)
- **Anatomy:** label "Tag", combobox input, suggestions listbox, and at most **one** selected-tag chip with a remove button (R1 allows one tag, FR-25).
- **Pattern:** APG **Combobox (list autocomplete with manual selection)**.
- **Keyboard:**

| Key | Action |
|---|---|
| Typing | Filters suggestions; opens list |
| Down / Up | Move through suggestions |
| Enter | Apply the active suggestion (or the typed text) as the tag, replacing any current tag |
| Escape | Close list; second Escape clears input |
| Backspace in empty input | Focus the chip's remove button (does not delete directly) |
| Tab | Leave field (list closes) |

- **ARIA:** input `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; listbox `role="listbox"`; the chip is labelled "Selected tag: {tag}", its remove button `aria-label="Remove tag {tag}"`; after removal focus returns to the input. Live region: "{n} suggestions available" (debounced).
- **Do:** replace the current tag when a new one is chosen. **Don't:** add a tag on blur; don't allow multiple tags in R1.

### 2.6 TimeframeFilter (C14) and SegmentedControl (C44, radio usage)
- **Anatomy:** `<fieldset>` + `<legend>Timeframe</legend>` + native radios (styled), or segmented visual on mobile.
- **Pattern:** APG **Radio Group** (native `<input type="radio">` preferred).
- **Keyboard:** Tab enters the group at the checked radio; Arrow keys move **and select**; Space selects the focused radio; Tab leaves.
- **ARIA:** native. If custom: `role="radiogroup"`, `role="radio"`, `aria-checked`, roving `tabindex`.
- **Do:** apply on selection (navigation) but debounce 300 ms when arrowing so passing options don't each trigger a load. **Don't:** use checkboxes (single choice).

### 2.7 SegmentedControl (C44, navigation usage — ProfileTabs C27)
- **Anatomy:** inset track with links.
- **Pattern:** navigation links with `aria-current="page"` (routes `/:username` and `/:username/about`). If a future version swaps panels in place without a route change, use APG **Tabs** (`tablist`/`tab`/`tabpanel`, arrows move, automatic activation).
- **Keyboard:** Tab through links; Enter follows.
- **Do:** use the segment form of the selected language (raised thumb + ring + accent label; CONST §7). **Don't:** mix links and buttons in one track.

### 2.8 TagChip (C15)
- **Anatomy:** link pill (`#tag`) or, in TagFilter, text + remove button.
- **Sizing:** 40 px visual with a 44 px hit extension (44 px on coarse pointers); 12 px visual gap. The removable variant's remove button has its own 44 × 44 hit area at the chip's trailing edge.
- **Keyboard:** link: Enter. Removable chip: the remove button is the Tab stop; Enter/Space/Delete removes.
- **ARIA:** link name = tag text ("#branding" read as "branding"); `aria-current="page"` on the current tag page.
- **Do:** use flat chips on glass. **Don't:** make the whole chip a remove target (accidental removal).

---

## 3. Gallery

### 3.1 ShotCard (C16) and ShotCardActionBar (C17)
- **Anatomy:** `<li><article aria-labelledby="t-{id}">`: thumbnail link (name = shot title), action bar (title text + LikeButton), footer (author link, badge, counts).
- **Sizing:** min column 264 px; action bar 64 px; like button 44.
- **Pattern:** plain links and a toggle button — no nested interactive elements inside the thumbnail link (the action bar is a sibling positioned over the image).
- **Keyboard:** Tab order per card: thumbnail link → Like → author link. Focusing any of them reveals the action bar (`:focus-within`). Enter on thumbnail opens the shot.
- **ARIA:** `alt` = author-supplied alt text or "{title} by {author}"; counts `aria-label="81 likes, 7.7 thousand views"` (abbreviations expanded); the Like button name includes the title ("Like {title}").
- **Do:** keep the card's tab stops ≤ 3. **Don't:** make the whole card one giant link containing buttons; don't hide the Like button from keyboard users when the bar is visually hidden — reveal on focus instead.

### 3.2 ShotGrid & feed loading (C18)
- **Anatomy:** `<section aria-labelledby>` → `<ol>` grid → sentinel → "Load more" button → live region.
- **Pattern:** **Feed** semantics are optional; use a list plus live status (simpler, robust). APG **Feed** (`role="feed"`, `article aria-posinset/aria-setsize`, Page Down/Up between articles) may be adopted in P10 if screen-reader testing (T-19) favours it.
- **Keyboard:** Tab through cards; "Load more" is reachable after the last card. **When the user activates "Load more", focus moves to the first new card's link** (NFR-27, E2E-09). Automatic loads triggered by the sentinel never move focus.
- **ARIA:** `aria-busy="true"` on the list while loading; live region announces "Loaded 24 more shots" / "No more shots".
- **Do:** keep "Load more" even with infinite scroll (keyboard and footer access). **Don't:** move focus on sentinel (automatic) loads; don't leave focus on a removed or disabled "Load more" button.

### 3.3 LikeButton (C20)
- **Anatomy:** `<button>` with heart icon (decorative) + visible label/count.
- **Variants:** lg pill (detail), icon-only (cards, 40/44).
- **Pattern:** APG **Button (toggle)**.
- **Keyboard:** Enter / Space toggles.
- **ARIA:** `aria-pressed="true|false"`; name constant ("Like" / "Like {title}") — the pressed state carries liked/not liked; count exposed as text ("81") or in `aria-describedby`. Signed-out: no `aria-pressed`, `aria-haspopup="dialog"` (opens AuthGateModal).
- **Do:** update optimistically; announce failures with a toast. **Don't:** change the accessible name between states ("Unlike") *and* use `aria-pressed` — choose one (we use `aria-pressed`).

### 3.4 ShotActionRail (C21)
- **Anatomy:** `<div role="group" aria-label="Shot actions">` with IconButtons: Share, Details.
- **Keyboard:** Tab between buttons (two items — no roving toolbar needed). If ≥ 4 items in later releases, adopt APG **Toolbar** (single Tab stop, arrows move).
- **ARIA:** each button `aria-haspopup="dialog"`; `aria-expanded` while its modal is open.
- **Do:** place it after the media in DOM order. **Don't:** fix it over content on < xl.

---

## 4. Overlays

### 4.1 Modal base (C48) — ShareModal (C22), ShotDetailsModal (C23), AuthGateModal (C32)
- **Anatomy:** scrim + `<div role="dialog" aria-modal="true" aria-labelledby="title" aria-describedby="desc">` → header (title, close button), body, footer actions. Prefer the native `<dialog>` element with `showModal()` (built-in focus trap, inert background, Escape).
- **Variants:** sm 420 (auth gate), md 560 (share, details); bottom sheet < md.
- **Pattern:** APG **Dialog (Modal)**.
- **Keyboard:**

| Key | Action |
|---|---|
| Tab / Shift+Tab | Cycle within the dialog |
| Escape | Close (all modals, including auth gate) |
| Enter | Activates the focused button (no implicit submit except in forms) |

- **Focus:** on open → first meaningful element (Share: "Copy link" button; Details: dialog title with `tabindex="-1"`; AuthGate: "Continue with Google"). On close → the trigger.
- **ARIA:** close button `aria-label="Close"`; background `inert`.
- **Do:** close on scrim click for informational modals (share, details); for the auth gate, scrim click also closes (no data loss). **Don't:** nest modals; don't open a glass tooltip inside a glass modal (use opaque).

**ShareModal specifics:** Copy button announces "Link copied" via the global status region; social share links (X, Pinterest; no email share, FR-39) open in a new tab (announced). **AuthGateModal specifics:** title states intent ("Sign in to like this shot"); after sign-in the original action completes and focus returns to the original trigger.

### 4.2 Menu / Listbox base (C49)
- **Pattern:** APG **Menu** (actions) or **Listbox** (value selection) — never mixed.
- **Keyboard:** Up/Down, Home/End, type-ahead, Enter to activate/select, Escape closes and returns focus.
- **ARIA:** `role="menu"`+`menuitem` / `role="listbox"`+`option` with `aria-selected`; disabled items `aria-disabled="true"` (still focusable, skipped on activation).
- **Do:** position with collision handling (flip/shift) so menus never leave the viewport. **Don't:** exceed 8 visible items without scrolling.

### 4.3 Tooltip (C47)
- **Pattern:** APG **Tooltip**.
- **Keyboard:** appears on focus of its trigger; Escape hides it without moving focus.
- **ARIA:** trigger `aria-describedby="tip-id"` (if the tooltip repeats the `aria-label`, use it as the label source instead to avoid double announcement); tooltip `role="tooltip"`.
- **Behaviour:** hover delay 400 ms, hoverable, persistent until pointer leaves/blur/Escape (WCAG 1.4.13).
- **Do:** use for icon-button names and full numbers behind abbreviations. **Don't:** put links or essential instructions in tooltips; no tooltips on touch-only.

### 4.4 Toast (C38)
- **Anatomy:** region `aria-label="Notifications"` at the page end, toasts with icon, message, optional action, close button.
- **Pattern:** live region (`role="status"`, `aria-live="polite"`; `role="alert"` for errors). Not APG Alert Dialog — toasts never take focus.
- **Keyboard:** F6 / landmark navigation reaches the region; action and close are normal Tab stops while visible; Escape when focus is inside a toast dismisses it.
- **Timing:** ≥ 5 s (errors 8 s), paused on hover and focus (WCAG 2.2.1); a toast with an action never auto-dismisses before 10 s.
- **Do:** one message per toast; plain language. **Don't:** stack more than 3; don't use toasts for form validation errors.

---

## 5. Forms and auth

### 5.1 TextField (C30)
- **Anatomy:** `<label for>` → optional leading icon (decorative) → `<input>` → helper text → error text.
- **Variants:** default, with prefix (`@` in username), read-only (share link), with trailing status (spinner/check).
- **Sizing:** 48 px; 16 px text; full width in forms (max 400 px).
- **Keyboard:** native.
- **ARIA:** `aria-describedby` = helper + error ids; `aria-invalid="true"` on error; `required` + visible "(required)" only when a form mixes optional fields; correct `type`, `autocomplete` (`email`, `username`) and `inputmode`.
- **Validation:** validate on submit, then live on change once a field has errored; on submit failure focus the first invalid field (and announce a summary for > 2 errors).
- **Do:** keep the label visible (placeholder is never the label). **Don't:** clear user input on error; don't rely on the red outline alone (icon + text).

### 5.2 OTPCodeInput (C31)
- **Anatomy:** one input visually split into 6 cells; label "6-digit code"; helper with the email; Resend button with a 60 s countdown (BR-05); "Use a different email" link.
- **Keyboard:** type digits (non-digits ignored); Backspace deletes; paste a 6-digit code fills all; arrow keys move the caret.
- **ARIA:** `autocomplete="one-time-code"`, `inputmode="numeric"`, `pattern="[0-9]*"`, `maxlength="6"`; error via `aria-invalid` + `aria-describedby`; countdown not announced every second — announce only when resend becomes available ("You can request a new code").
- **Do:** auto-submit at 6 digits, then move focus to the status message on error. **Don't:** use 6 separate inputs (breaks paste, autofill and screen-reader reading).

### 5.3 AuthForm (C29)
- **Anatomy:** heading, Google button, divider "or", email field, Turnstile widget (D-20), primary submit, disclaimer, switch link.
- **Keyboard:** Tab order follows visual order; Enter in the email field submits.
- **ARIA:** form `aria-labelledby` the heading; while sending, `aria-busy="true"` and a status message "Sending code…"; server errors in an InlineAlert with `role="alert"`.
- **Do:** move focus to the next step's heading when the step changes (email → code → username). **Don't:** reveal whether an email has an account in error copy (enumeration; security aligns with P02).

### 5.4 UsernameStep (C33)
- **Anatomy:** heading, TextField with `@` prefix, availability status, URL preview, Continue.
- **Keyboard:** native; Enter submits when valid.
- **ARIA:** availability message in a polite live region tied via `aria-describedby`; Continue uses `aria-disabled` (stays focusable) with the reason in its description until the name is valid.
- **Do:** debounce checks 300 ms (FR-17); offer suggestions as buttons that fill the field. **Don't:** announce every keystroke.

### 5.5 InlineAlert (C39)
- **Interactive part:** optional dismiss button `aria-label="Dismiss"`.
- **ARIA:** `role="alert"` for errors inserted after an action; static alerts present on load use no role.

---

## 6. Primitives

### 6.1 Button (C40)
- **Anatomy:** `<button>` (or `<a>` styled as a button when it navigates) → optional leading icon → label → optional trailing icon/spinner.
- **Variants:** primary, secondary (neumorphic), secondary-on-glass, ghost, highlight (liked only). One primary per region.
- **Sizing:** sm 40 (+ hit extension), md 44, lg 52; min width 88 px for text buttons; full width < md for form actions.
- **Keyboard:** Enter and Space activate buttons; Enter only for link-buttons.
- **ARIA:** loading → `aria-busy="true"`; the label is hidden visually but **stays the accessible name**; the progress text ("Sending code…") is announced through the page status region (T16-36, matches `.ui-btn[aria-busy]`); disabled per §0.
- **Do:** use verbs ("Continue with email"). **Don't:** use primary styling for destructive or secondary actions; don't use a raised neumorphic (secondary) button inside glass — use `.ui-btn--on-glass`.

### 6.2 IconButton (C41)
- **Anatomy:** `<button>` with a 20 px icon (`aria-hidden="true"`) and `aria-label`; paired Tooltip.
- **Sizing:** 44 default; 40 + hit extension (desktop-dense); 48 (detail actions).
- **Keyboard:** Enter / Space.
- **ARIA:** toggles use `aria-pressed`; disclosure triggers `aria-expanded`; dialog triggers `aria-haspopup="dialog"`.
- **Do:** label by action ("Share shot"), not icon ("Arrow"). **Don't:** rely on the icon alone without a tooltip.

### 6.3 FAB (C42) — R2+, not in R1
- **Status:** not used in R1 (V-11); guidance kept for when a journey adopts it.
- **Anatomy:** `<button aria-label="Back to top">` with arrow icon.
- **Keyboard:** Enter / Space scrolls to top **and moves focus** to the skip-link target (`#main`) so keyboard users aren't stranded.
- **Do:** show only after significant scroll; respect safe-area insets. **Don't:** cover the last row's Like button (add bottom padding to the grid equal to FAB size + 16 px on mobile).

### 6.4 Toggle / switch (C43)
- **Anatomy:** `<button role="switch" aria-checked>` with visible label adjacent (`aria-labelledby`), or native `<input type="checkbox" role="switch">`.
- **Pattern:** APG **Switch**.
- **Keyboard:** Space (and Enter for the button version) toggles.
- **Do:** apply immediately (switches are instant); show saving/error feedback. **Don't:** use a switch inside a form that needs a submit (use a checkbox).

### 6.5 Avatar (C45)
- **Interactive only when linked:** `<a>` to the profile with name `"{name}'s profile"`; the image `alt=""` when the name is already adjacent text.
- **Do:** fallback initials with the same accessible name. **Don't:** make a linked avatar and an adjacent linked name separate tab stops when they go to the same place — wrap both in one link where layout allows.

---

## 7. Do / don't summary across the system

| Do | Don't |
|---|---|
| Use the selected language from CONST §7 (inset + ring + accent label on bg; accent-subtle + ring inside glass; segment thumb; nav indicator; radio dot; menu check) | Invent per-component selected styles |
| Keep thumbnails flat and unframed | Add shadow, glass, tint or border to media |
| Put opaque controls on glass | Put raised neumorphic controls on glass |
| Announce async results in one status region | Fire multiple overlapping live regions |
| Return focus to the trigger after every overlay | Leave focus on `<body>` after closing |
| Test each component at 200% zoom and with reduced motion/transparency | Ship hover-only affordances |

## 8. Coverage check

Every interactive catalogue entry has keyboard and ARIA guidance: C02 §1.1 · C03/C04 §1.2 · C05 §1.3 · C06 §1.4 · C07 §1.5 · C08/C50 §1.6 · C09 §2.1 · C10 §2.2 · C11 §2.3 · C12 §2.4 · C13 §2.5 · C14/C44 §2.6 · C27/C44 §2.7 · C15 §2.8 · C16/C17 §3.1 · C18 §3.2 · C20 §3.3 · C21 §3.4 · C22/C23/C32/C48 §4.1 · C49 §4.2 · C47 §4.3 · C38 §4.4 · C30 §5.1 · C31 §5.2 · C29 §5.3 · C33 §5.4 · C39 §5.5 · C40 §6.1 · C41 §6.2 · C42 §6.3 (R2+) · C43 §6.4 · C45 §6.5. Non-interactive entries (C01, C19 text, C24, C25 container, C26 text, C28 text, C34–C37 except their buttons, C46, C51) need no keyboard pattern; their embedded buttons/links follow §6.1 and §1.6.
