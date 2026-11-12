# Wireframe Specification (P06-03)

| Field | Value |
|---|---|
| Task | P06-03 — Wireframe specification |
| Owner | Designer (UI/UX, information architecture) |
| Version | 1.0 — draft for review |
| Date | 2026-11-12 |
| Status | Awaiting Review (proposed) |
| Depends on | P06-02 [APPLICATION_SITEMAP](APPLICATION_SITEMAP.md) (screen IDs), P06-01 [INFORMATION_ARCHITECTURE](INFORMATION_ARCHITECTURE.md) (labels, navigation, URLs) |
| Acceptance criterion | Every R1 screen has a wireframe including empty, loading and error states |
| Tests / validation | T-20 usability review **input** (the final usability review is P07-04) |
| Fidelity | **Low fidelity.** Boxes show regions, order and behaviour only. No colour, type size, imagery or copy beyond working labels. Visual design comes from tokens in the P06-05 prototypes (after G3) |
| Companion documents | [RESPONSIVE_DESIGN](RESPONSIVE_DESIGN.md) (per-width rules referenced from every screen) · [DESIGN_SYSTEM](../05-design-system/DESIGN_SYSTEM.md) (Cxx) · [COMPONENT_GUIDELINES](../05-design-system/COMPONENT_GUIDELINES.md) (keyboard/ARIA) · [FRONTEND_DESIGN_CONSTITUTION](../05-design-system/FRONTEND_DESIGN_CONSTITUTION.md) (pillars) |

> **Originality.** The reference product informed layout and behaviour only (A-10). Labels are the neutral set in [IA §4.2](INFORMATION_ARCHITECTURE.md). Copy shown here is working copy; final copy is written with the prototypes.

---

## 1. Conventions

### 1.1 Reading the wireframes

| Notation | Meaning |
|---|---|
| `[Label]` | Button (C40) or icon button (C41); `[x]` close; `[i]` details; `[=]` burger; `[Q]` search icon |
| `( Search shots      )` | Inset text field or search bar (C09/C30) |
| `‹All› ‹Branding›` | Pill/chip link (C10/C15); `‹›` with `*` = selected (`aria-current`) |
| `▾` | Disclosure / dropdown trigger |
| `▓▓▓▓` | Shot media (flat, no effect — showcase priority) |
| `░░░░` | Skeleton (C36) |
| `(o)` | Avatar (C45) |
| `<3 42` | Like control with count (C20); `<3*` = liked |
| `{profile}` | Profile path, OQ-02 Option A `/:username` or B `/@:username` |
| **[N] [G] [M]** | Pillar of a region: Neumorphism (controls), Glass (floating layers), Minimal (layout/content) — constitution §3 |
| **P1…P4** | Content priority (P1 = reason the page exists; mobile order follows priority) |

Widths: desktop wireframes are drawn for **1440 px**, mobile for **390 px**. Tablet (768/1024) notes follow each screen; exact per-width behaviour (1440/1280/1024/768/390/360) is in [RESPONSIVE_DESIGN §4](RESPONSIVE_DESIGN.md).

### 1.2 State IDs and shared states

Each screen lists its states as `SCR-xx.a, .b …`. States shared by every grid (initial skeleton, loading more, load-more error, end of list, back-to-top) are defined once in [§4](#4-scr-02-explore-feed) and referenced. Every page also has the common states of the Definition of Done (loading skeleton, empty, error, success) — a state marked *n/a* gives the reason.

### 1.3 Review checklist (P06 step 3)

Each screen ends with a self-review against three checks. **Pass** = no finding; **Finding WF-xx** = recorded in [§15](#15-self-review-findings). The final usability review is P07-04 (T-20), so these results are design-team self-review only.

| Check | Question |
|---|---|
| Feature coverage | Does the screen implement every R1 FR and BR it is mapped to, and hide unreleased actions (BR-45)? |
| Usability | Is the primary task obvious, are errors recoverable, are touch and keyboard equivalents present? |
| Navigation | Can the user reach and leave the screen through the IA, with focus and `returnTo` handled? |

---

## 2. Global shell

### 2.1 SH-01 Site header · [G] glass-subtle

**FR-01** · Journeys UJ-01, UJ-02, UJ-05 · Components C02, C03, C04, C05, C09, C40, C45/C07.

**Desktop 1440 — visitor, standard page (SH-01.a)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Skip to content] (visible on focus only)                                                  │
│ Trippple    ( [Q] Search shots                    )   Explore ▾   Tags    [Log in] [Sign up] │
│ └C04 [M]    └C09 [N] inset, min 240                  └C05 [G]             └C40 sec └C40 prim │
└────────────────────────────────────────────────────────────────────────────────────────────┘
  sticky, 64 px (lg+), glass-subtle; adds hairline + shadow after 8 px scroll (SH-01.d)
```

**Desktop 1440 — member (SH-01.b)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Trippple    ( [Q] Search shots                          )   Explore ▾   Tags            (o) │
│                                                                              └C07 avatar 40 │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Homepage variant (SH-01.c):** identical but **no SearchBar** (hero search, FR-21/V-2); Explore and Tags shift left next to the brand.

**Mobile 390 — visitor (SH-01.g) / member (SH-01.h)**

```text
┌──────────────────────────────────────┐      ┌──────────────────────────────────────┐
│ [=]  Trippple            [Q] [Log in]│      │ [=]  Trippple                 [Q] (o)│
└──────────────────────────────────────┘      └──────────────────────────────────────┘
  56 px; [Q] opens the drawer focused on search (hidden on the homepage)
```

| Region | Components | Pillar | Priority | Interaction |
|---|---|---|---|---|
| Skip link | C02 | M | — | First Tab stop → `#main` |
| Brand | C04 | M | P2 | Link to `/`; 120 × 32 slot (D-01 pending) |
| Search | C09 | N (inset; opaque `bg-2` fill on glass) | P1 | Enter → `/search/:term`; empty submit ignored (BR-38) |
| Nav | C05 | G | P1 | Explore opens SH-02 on click/Enter/Space; Escape closes |
| Auth / account | C40 / C07 | N/M | P2 | Log in → `/login?returnTo={current}`; Sign up → `/signup?returnTo={current}` |

**States:** SH-01.a visitor · .b member · .c homepage variant · .d scrolled (hairline + shadow) · .e session resolving (32 px avatar skeleton, no shift) · .f session lookup failed → renders .a, page still loads (FR-01) · .g mobile visitor · .h mobile member. Error/empty *n/a* beyond .f (static chrome).

**Tablet:** 768 = mobile layout with search field visible in the bar (≥ md, C03); 1024 = desktop layout (nav from `lg`, see IA G-01).

**Review:** Feature coverage — Pass (R1 entries only; Jobs/Hire/Share work/bell absent per BR-45). Usability — Pass. Navigation — Pass; **WF-13** (desktop nav breakpoint 1024 vs FR-01 1280).

### 2.2 SH-02 Explore menu · [G] glass-panel

```text
                 Explore ▴
               ┌──────────────────────────────────────────┐
               │ Popular                     Recent        │
               │ ──────────────────────────────────────── │
               │ Product design   Web design   Animation   │
               │ Branding         Illustration Mobile      │
               │ Typography       Print                    │
               │ ──────────────────────────────────────── │
               │ All tags →                                │
               └──────────────────────────────────────────┘
               8 px below trigger; links only (APG disclosure navigation)
```

States: SH-02.a open (current page link has `aria-current` + underline). Loading/error/empty *n/a* (static list, BR-36). Links go to `/shots/popular`, `/shots/recent`, `/shots/popular/:category`, `/tags`.
**Review:** Feature coverage — Pass. Usability — Pass (click-to-open always works; hover-open optional). Navigation — Pass. Label **Recent** replaces "New & noteworthy" (**WF-17**).

### 2.3 SH-03 Mobile navigation drawer · [G] glass-panel on scrim

```text
Mobile 390 (SH-03.a visitor)                    (SH-03.b member — account block)
┌──────────────────────────────────────┐        ┌──────────────────────────────────────┐
│░░░░░░│ Trippple                   [x]│        │ ...                                  │
│░scrim│ ( [Q] Search shots           )│        │ (o) Lena Ortiz                       │
│░░░░░░│ Explore                     ▴ │        │     @lena-ortiz                      │
│░░░░░░│   Popular                      │        │ View profile                         │
│░░░░░░│   Recent                       │        │ Sign out                             │
│░░░░░░│   Product design … Print (8)   │        └──────────────────────────────────────┘
│░░░░░░│ Tags                           │
│░░░░░░│ ────────────────────────────── │
│░░░░░░│ [        Sign up             ] │
│░░░░░░│ [        Log in              ] │
│░░░░░░│ Terms · Privacy · Cookies      │
│░░░░░░│ About · Contact                │
└──────────────────────────────────────┘
  width min(100%, 360 px) from the right; rows 48 px; body scroll locked
```

States: SH-03.a visitor · .b member. Closes on Escape, [x], scrim tap and route change; focus returns to `[=]`. Error/loading/empty *n/a*.
**Review:** Feature coverage — Pass. Usability — Pass (all targets 48 px). Navigation — Pass (same destinations as desktop, IA §3.3).

### 2.4 SH-04 Account menu · [G] glass-panel

```text
                                                        (o) ▴
                                         ┌───────────────────────┐
                                         │ Lena Ortiz            │  identity (not focusable)
                                         │ @lena-ortiz           │
                                         │ ───────────────────── │
                                         │ View profile          │
                                         │ Sign out              │
                                         └───────────────────────┘
```

States: SH-04.a open · .b signing out (Spinner on item, `aria-disabled`) · .c sign-out failed (toast "Couldn't sign out. Try again."). R2/R3 entries per IA §3.4 are not rendered in R1.
**Review:** Feature coverage — Pass (FR-01, FR-14; V-7). Usability — Pass. Navigation — Pass (after sign-out: header shows SH-01.a on `/`).

### 2.5 SH-05 Site footer · [M]

```text
Desktop 1440 (SH-05.a)
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Trippple                 Explore            Company            Legal                       │
│                          Popular            About              Terms                       │
│                          Recent             Contact            Privacy                     │
│                          Tags                                  Cookies                     │
│ ────────────────────────────────────────────────────────────────────────────────────────── │
│ © 2026 Trippple                                                                             │
└────────────────────────────────────────────────────────────────────────────────────────────┘
Mobile 390 (SH-05.b): brand, then the three columns stacked (each heading + links), then ©.
```

States: SH-05.a desktop · .b stacked. Static; no loading/error. Absent on SCR-09 and SCR-10.
**Review:** Feature coverage — Pass (FR-02 link set; Jobs added in R2). Usability — Pass. Navigation — Pass (reachable below infinite lists because auto-load stops at the "Load more" fallback, NFR-27).

### 2.6 SH-06 Toast region · [G] glass-panel

```text
Desktop: bottom-centre, max 3 stacked          Mobile: bottom, full width − gutters, above FAB
        ┌──────────────────────────────────┐
        │ [ok] Link copied             [x] │   role=status (success/info)
        └──────────────────────────────────┘
        ┌──────────────────────────────────┐
        │ [!] Couldn't save your like.     │   role=alert (errors, 8 s)
        │     Try again           [Retry][x]│
        └──────────────────────────────────┘
```

States: SH-06.a success/info · .b error with action · .c stacked (≤ 3). Timer pauses on hover/focus; never covers the focused element (A11Y-06).
**Review:** all three checks Pass.

---

## 3. SCR-01 Homepage

**Route** `/` · **FR-21**, FR-23, FR-24, FR-45 · **Journey** UJ-01 (E2E-01), UJ-02 entry · **Purpose:** introduce the product and lead straight into discovery.

**Desktop 1440 (SCR-01.a, visitor)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ SH-01.c  Trippple   Explore ▾   Tags                                    [Log in] [Sign up] │ [G]
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│   HERO [M]                                                     ┌────────────────────────┐  │
│   A home for design work worth sharing.            (H1, P1)    │                        │  │
│   One line on discovering and appreciating shots.              │  ▓▓▓ featured shot ▓▓▓ │  │
│   [Explore shots]  [Sign up]                       (C40)       │  ▓▓▓ (flat media)  ▓▓▓ │  │
│                                                                │ (o) by Designer name   │  │
│                                                                └────────────────────────┘  │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐    │
│   │ ( [Q] Search shots, e.g. dashboard, logo, mobile app            ) [Search]        │    │ [N] C09 lg
│   └──────────────────────────────────────────────────────────────────────────────────┘    │
│   Trending tags:  ‹dashboard› ‹landing page› ‹branding› ‹mobile app› ‹logo› ‹3d› ‹ui›…    │ [N] C15 (8)
│                                                                                            │
│   Popular shots                                                   See all popular →       │ [M]
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                                      │
│   │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│   C16 cards, 4 columns at 1440       │
│   │▓▓▓▓ 4:3 ▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│   hover/focus: C17 bar [G]           │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘                                      │
│   (o) Name    <3 41  12k    …                                                              │
│   … rows (infinite scroll, 24 per page) …                                                  │
│                         [Load more]   (C18; status "Loaded 24 more shots")                 │
│                                                                                            │
│   Most appreciated designers                                        ‹ ›                    │ [M] (P4)
│   (o) Name  (o) Name  (o) Name  (o) Name  (o) Name  …  (10, horizontal scroller)           │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ SH-05 footer                                                                               │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Mobile 390 (SCR-01.a)**

```text
┌──────────────────────────────────────┐
│ [=]  Trippple                [Log in]│  SH-01.g (no [Q] on home)
├──────────────────────────────────────┤
│ A home for design work               │  H1 (P1)
│ worth sharing.                       │
│ One supporting line.                 │
│ [ Explore shots ]  [ Sign up ]       │
│ ( [Q] Search shots             )     │  C09 lg, full width
│ Trending tags:                       │
│ ‹dashboard› ‹landing page› ‹bran…    │  horizontal scroll, fade edge
│                                      │
│ Popular shots          See all →     │
│ ┌──────────────────────────────────┐ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │  1 column
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 4:3 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ └──────────────────────────────────┘ │
│ (o) Name           [<3] 41   12k     │  touch: Like in footer row
│ …                                    │
│ [            Load more             ] │
│ Most appreciated designers  ‹ ›      │
│ (o) (o) (o) (o) → scroll             │
│ SH-05.b                              │
└──────────────────────────────────────┘
```

Hero featured artwork is hidden below `md` (decorative; P1 content first).

| Region | Components | Pillar | Priority | Notes |
|---|---|---|---|---|
| Hero copy + CTAs | C40 | M | P1 | Original copy; "Sign up" only for visitors; member sees "Explore shots" only (SCR-01.b) |
| Featured artwork | C16 media variant | M | P4 | Seed shot (licence-free, BR-87), credited to its seed author; ≥ lg only |
| Hero search | C09 (`--control-h-lg`) | N | P1 | Shots only in R1 (no type switch) |
| Trending tags | C15 | N | P2 | 8 tags with most eligible shots → `/search/:term` (FR-21) |
| Popular feed | C16, C17, C18, C20 | M (+G bar) | P3 | Same feed as `/shots/popular` |
| Designer strip | C45 + name + likes received | M | P4 | 10 designers; links to `{profile}` |

**Interactions:** search Enter/[Search] → `/search/:term`; empty submit does nothing and shows the hint "Type something to search" (SCR-01.g); tag chip → `/search/:term`; card → shot; author → profile; Like on a card → FR-45 (visitor → OV-03); "See all popular" → `/shots/popular`.

**States**

| ID | State | Display |
|---|---|---|
| SCR-01.a | Visitor default | As drawn |
| SCR-01.b | Member default | No "Sign up" CTA; header SH-01.b |
| SCR-01.c | Initial loading | Hero renders (server); tag row 8 chip skeletons; feed 12 card skeletons; strip 10 avatar skeletons |
| SCR-01.d | Tag row or designer strip query failed | That section is **omitted**; feed still renders (FR-21) |
| SCR-01.e | Feed failed | C35 inline section error "Couldn't load shots" + [Try again]; hero, search and tags still work |
| SCR-01.f | Feed empty (no eligible shots — seed missing) | C34 "No shots yet" (defensive; not expected with seed) |
| SCR-01.g | Empty search submit | No navigation; caption hint below the field |
| — | Loading more / load-more error / end of list | Shared grid states SCR-02.h, .i, .l |

**Tablet:** 768 — hero single column, artwork hidden, 2-column feed; 1024 — hero two columns, 3-column feed.

**Review:** Feature coverage — Pass (FR-21 all parts; no hire toggle, promo toast or banner, BR-89). Usability — Pass (search is above the fold at 390 and 1440). Navigation — Pass. Findings: **WF-12** (homepage feed has no sort control — by design, "See all popular" leads to the full feed).

---

## 4. SCR-02 Explore feed

**Routes** `/shots/popular[/:category]`, `/shots/recent[/:category]` + `?tag=&timeframe=` · **FR-22, FR-23, FR-24, FR-25**, FR-45 · **Journey** UJ-01 (E2E-01…E2E-09).

**Desktop 1440 — default, Popular, all categories (SCR-02.a)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ SH-01.a                                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ FILTER BAR (scrolls with the page)                                                         │
│ [Popular ▾]   ‹All*› ‹Product design› ‹Web design› ‹Animation› ‹Branding› … [>]  [Filters] │
│  └C11 [N]      └C10 [N] links, aria-current                         └scroll btn  └C12 [N]  │
│                                                                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                                        │
│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│  ShotGrid C18 [M]: ol, 4 cols, gap 32   │
│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│                                        │
│ │┌────────┐│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│  hover/focus-within on card 1:          │
│ ││Title [<3]│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│  C17 glass-subtle bottom strip [G]     │
│ │└────────┘│ │          │ │          │ │          │                                        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                                        │
│ (o) Name [Team]  <3 41 · 12k   (footer row, metadata)                                       │
│ … 24 cards …                                                                               │
│                              [Load more]                                                   │
│ (live region: "Loaded 24 more shots")                                                      │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ SH-05                                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop 1440 — Filters panel open with active filters (SCR-02.d, .e)**

```text
│ [Popular ▾]   ‹All› ‹Product design› ‹Web design*› ‹Animation› …            [Filters (2)]* │
│ ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ FILTER PANEL C12 [N] bg-2 surface, inline (pushes grid down)                           │ │
│ │  Tag                                   [Clear]   Timeframe                     [Clear]  │ │
│ │  ( [#] dashboard                    )            ( ) Trending now                       │ │
│ │  ┌────────────────────────────────┐              ( ) Past 7 days                        │ │
│ │  │ dashboard          (suggestion) │              (•) Past 30 days                       │ │
│ │  │ dashboard ui                    │ C13 listbox  ( ) Past 12 months                     │ │
│ │  │ dashboards                      │ [G] panel    ( ) All time       C14 radio group     │ │
│ │  └────────────────────────────────┘                                                    │ │
│ │                                                                         [Clear all]    │ │
│ └────────────────────────────────────────────────────────────────────────────────────────┘ │
│ Active: ‹tag: dashboard [x]› ‹Past 30 days [x]›    (removable chips, C15 remove variant)   │
│ ┌──────────┐ ┌──────────┐ …  grid                                                          │
```

URL after these choices: `/shots/popular/web-design?tag=dashboard&timeframe=month`. Each change navigates (server-rendered, shareable).

**Mobile 390 (SCR-02.a and filters open)**

```text
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ [=]  Trippple            [Q] [Log in]│   │ [ Popular ▾                       ] │
├──────────────────────────────────────┤   │ ‹All*› ‹Product design› ‹Web…  → │
│ [ Popular ▾                       ] │   │ [ Filters (2)                     ]*│
│  └C11 full-width trigger             │   │ ┌──────────────────────────────────┐ │
│ ‹All*› ‹Product design› ‹Web d… →    │   │ │ Tag                      [Clear] │ │
│  └C10 horizontal scroll, fade edge   │   │ │ ( [#] dashboard               )  │ │
│ [ Filters                         ] │   │ │ Timeframe                [Clear] │ │
│ ┌──────────────────────────────────┐ │   │ │ [Now|7 d|30 d*|12 mo|All] →     │ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │   │ │  └C44 segmented, scrolls         │ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 4:3 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │   │ │ [Clear all]                      │ │
│ └──────────────────────────────────┘ │   │ └──────────────────────────────────┘ │
│ (o) Name           [<3] 41   12k     │   │ ‹tag: dashboard x› ‹Past 30 days x› │
│ …                                    │   │ grid …                               │
│                               [^]    │   └──────────────────────────────────────┘
│  └C42 FAB back to top (after 2 screens)│
└──────────────────────────────────────┘
```

| Region | Components | Pillar | Priority | Notes |
|---|---|---|---|---|
| Sort | C11 | N trigger + G listbox | P2 | Popular / Recent (changes path segment) |
| Category pills | C10 | N | P2 | "All" + 8 (BR-36); links with `aria-current` (D-24(g)); scroll buttons ≥ md |
| Filters toggle + panel | C12, C13, C14 | N (controls on `bg-2`) | P3 | Tag (single tag, see **WF-06**) + Timeframe; Timeframe hidden on Recent (BR-34) |
| Active filter chips | C15 (remove) | N | P3 | Each removes one parameter; "Clear all" |
| Grid | C16, C17, C18, C20 | M (+G bar) | P1 | 24 per page, cursor pagination (BR-35) |
| Back to top | C42 | N | — | Mobile only, after 2 screens of scroll |

**Interactions:** sort/pill/filter → navigation to the new URL, selected control updates immediately, grid shows skeletons (C10/C11 loading states); tag field suggests existing tags (≥ 2 chars), Enter applies free text; sentinel near the end auto-loads the next page; "Load more" always visible and moves focus to the first new card (NFR-27); back navigation restores scroll (FR-23).

**States (shared grid states are defined here and reused by SCR-01, SCR-04, SCR-06, SCR-08)**

| ID | State | Display |
|---|---|---|
| SCR-02.a | Default (Popular, All) | As drawn; `All` pill selected |
| SCR-02.b | Category selected | Pill selected + page title "Popular {category} shots" |
| SCR-02.c | Recent sort | Timeframe column and chip removed; `timeframe` dropped from URL |
| SCR-02.d | Filter panel open | Toggle selected (`aria-expanded`), panel expanded inline |
| SCR-02.e | Active filters | Count badge on toggle; removable chips row |
| SCR-02.f | Tag suggestions: loading / failed / no match | 3 skeleton rows / "Couldn't load suggestions" (free text still works) / "No matching tags — press Enter to use '…'" |
| SCR-02.g | **Initial loading** | 12 skeleton cards (C36), `aria-busy` |
| SCR-02.h | **Loading more** | 4 skeleton cards appended; Spinner in "Load more" |
| SCR-02.i | **Load-more error** | Loaded cards kept; inline row "Couldn't load more shots." [Try again] (E2E-07) |
| SCR-02.j | **Initial error** | C35 in place of the grid: "Couldn't load shots" [Try again] [Go home] |
| SCR-02.k | **Empty (no matches)** | C34: "No shots match these filters" + [Clear filters] (E2E-06) |
| SCR-02.l | End of list | Caption "You've reached the end"; FAB on mobile |
| SCR-02.m | Touch device card | No hover bar; Like icon button in the footer row (C16 touch) |
| SCR-02.n | Liked card | Footer heart filled (`highlight-strong`), `aria-pressed` |
| SCR-02.o | Unknown category | SCR-11 (HTTP 404, E2E-04) |
| SCR-02.p | Invalid cursor | List restarts from page 1 (FR-23) — no visible error |

**Tablet:** 768 — 2 columns, pills scroll with buttons, filter panel two columns; 1024 — 3 columns, desktop header.

**Review:** Feature coverage — Pass (FR-22…FR-25; no colour control until R3, X-4; no ad/boosted cards). Usability — Pass; **WF-06** (C13 allows 5 tags, FR-25/URL use one `tag`). Navigation — Pass (URL is the state; back restores scroll). Findings **WF-01** ("All" replaces "Discover"), **WF-02** (timeframe labels), **WF-15** (FAB use).

---

## 5. SCR-03 Shot detail and overlays

**Route** `/shots/:id-:slug` · **FR-37, FR-38, FR-39, FR-40, FR-41, FR-42, FR-45**, FR-29 (beacon, no UI) · **Journeys** UJ-01, UJ-04 (E2E-20…E2E-28).

**Desktop 1440 — member, not liked (SCR-03.b)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ SH-01.b                                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ STICKY SHOT HEADER C19 [M] (sticks under SH-01 after scroll)                               │
│ Shot title as H1                                                       [<3 Like  42]       │ C20 lg [N]
│ (o) Designer name  [Featured Studio]                                                       │
│────────────────────────────────────────────────────────────────────────────────────────────│
│        ┌──────────────────────────────────────────────────────────────────┐        ┌───┐   │
│        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│        │Sh │   │
│        │▓▓▓▓▓▓ CONTENT BLOCK 1 (image, own ratio, ≤ 1024 wide, LCP) ▓▓▓▓▓▓│        │are│   │ C21 rail
│        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│        │[i]│   │ [G] ≥ xl,
│        └──────────────────────────────────────────────────────────────────┘        └───┘   │ fixed right,
│              Text block (≤ 720, body-lg)  C24 [M]                                          │ v-centred
│              Lorem ipsum working text with a link …                                        │
│        ┌──────────────────────────────────────────────────────────────────┐                │
│        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ CONTENT BLOCK 3 (image) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                │
│        └──────────────────────────────────────────────────────────────────┘                │
│                                                                                            │
│              AUTHOR CARD [M]   (o) Designer name · headline          [View profile]        │
│                                                                                            │
│   More by Designer name                                              View profile →        │ C25 [M]
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   (≤ 4)                                      │
│   │▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓│                                              │
│   └────────┘ └────────┘ └────────┘ └────────┘                                              │
│   You might also like                                                                      │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   (≤ 12, 3 rows of 4)                        │
│   … streamed after main content (never delays LCP) …                                       │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ SH-05                                                                                      │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Mobile 390 (SCR-03.a, visitor)**

```text
┌──────────────────────────────────────┐
│ [=]  Trippple            [Q] [Log in]│
├──────────────────────────────────────┤
│ Shot title as H1 (wraps)             │  P2
│ (o) Designer name          [<3 42]   │  Like beside the author (FR-42)
├──────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  block 1 full width (P1, LCP)
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
├──────────────────────────────────────┤
│ [Share]  [i Details]                 │  rail becomes a row of C41 [N] on bg
│ Text block …                         │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  further blocks
│ (o) Designer name · headline         │
│ [          View profile          ]   │
│ More by Designer name   View profile │
│ ┌──────────────────────────────────┐ │  1 column
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │
│ └──────────────────────────────────┘ │
│ You might also like …                │
└──────────────────────────────────────┘
```

| Region | Components | Pillar | Priority | Notes |
|---|---|---|---|---|
| Shot header | C19, C45, C46, C20 | M (+N Like) | P2 | Sticky; "Follow" and "for {Team}" not rendered in R1 (BR-45) |
| Content blocks | C24 | M (no effects) | P1 | Image `srcset` + explicit dimensions + alt (FR-38) |
| Action rail | C21 (glass ≥ xl; neumorphic row < xl), C41 | G / N | P3 | Share, Details only; Comments hidden (BR-45) |
| Author card | C45, C50, C40 | M | P3 | "View profile" |
| Related | C25 (C18 grid) | M | P4 | BR-43; empty section not rendered |

**Interactions:** Like → optimistic toggle (BR-47), visitor → OV-03 (`intent=like-shot`); Share → OV-01; Details → OV-02; author/avatar/View profile → `{profile}`; tag chip in OV-02 → `/tags/:tag`; modals close on Escape/[x]/scrim and return focus to the trigger.

**States**

| ID | State | Display |
|---|---|---|
| SCR-03.a | Visitor | Like enabled; activating opens OV-03 |
| SCR-03.b | Member, not liked | Outline heart + count |
| SCR-03.c | Member, liked | `highlight` fill, "Liked", `aria-pressed=true` |
| SCR-03.d | Own shot | **No Like control** (BR-46, E2E-27); counts still shown in OV-02 |
| SCR-03.e | Loading (client navigation) | Title/author skeleton lines; block 1 dominant-colour placeholder at its ratio |
| SCR-03.f | One block's media failed | That block: image-off icon + "Image unavailable"; others render (FR-38) |
| SCR-03.g | Related query failed or empty | Section omitted, logged (FR-41, NFR-18) |
| SCR-03.h | Like failed (5xx) | Rollback + error toast "Couldn't save your like. Try again." (E2E-25) |
| SCR-03.i | Like rate-limited (429) | Rollback + toast "You're doing that too fast. Try again in {n} s." (E2E-26) |
| SCR-03.j | Moderator viewing a hidden shot | C39 info alert above the header: "Hidden by moderation — only staff can see this" (**WF-09**: no catalogued component variant) |
| SCR-03.k | Missing / ineligible / non-numeric | SCR-11 (404); outdated slug → 308 first |
| SCR-03.l | Intent applied after sign-in | Toast "You liked this shot" (or "This shot is no longer available" if the target is gone, BR-15) |

**Tablet:** 768 and 1024 — rail is the row under block 1 (C21 < xl); 1280+ — vertical glass rail. Related grids 2/3/4 columns.

### 5.1 OV-01 Share modal · [G] glass-modal on scrim

```text
Desktop (centred, 560 max)                       Mobile 390 (bottom sheet)
┌────────────────────────────────────────┐       ┌──────────────────────────────────────┐
│ Share this shot                    [x] │       │ ───── (grabber)                      │
│ ┌──────────────┐                        │       │ Share this shot                  [x] │
│ │▓▓▓ preview ▓▓│  Shot title            │       │ ▓▓▓ preview ▓▓  Shot title           │
│ └──────────────┘  by Designer name      │       │ [X]  [Pinterest]  [More options]     │
│ ┌────────────────────────────────────┐ │       │ Copy link                            │
│ │ [X]   [Pinterest]   [More options] │ │       │ ( https://…/shots/123-title?utm… )  │
│ └────────────────────────────────────┘ │       │ [              Copy              ]   │
│ Copy link                               │       └──────────────────────────────────────┘
│ ( https://…/shots/123-title?utm_… ) [Copy] │
└────────────────────────────────────────┘
```

States: OV-01.a default · .b copied ("Copied" + check for 2 s + toast "Link copied") · .c clipboard denied (text auto-selected + "Press Ctrl+C / ⌘C to copy") · .d no Web Share API → "More options" not rendered. X/Pinterest are intent URLs in a new tab; no third-party scripts (BR-44). Loading/empty *n/a* (local data).

### 5.2 OV-02 Shot details modal · [G] glass-modal

```text
┌────────────────────────────────────────┐
│ Shot details                       [x] │
│ Posted 12 Nov 2026                      │
│ ┌───────────────┐ ┌───────────────┐    │
│ │ 12,345        │ │ 1,234         │    │  full numbers, thousands separators
│ │ Views         │ │ Likes         │    │  (Saves/Comments added in R2)
│ └───────────────┘ └───────────────┘    │
│ Tags                                    │
│ ‹dashboard› ‹saas› ‹analytics›          │  flat chips on glass (C15 glass variant)
└────────────────────────────────────────┘
```

States: OV-02.a default · .b no tags ("No tags") · .c lazy counts loading (stat skeletons) / failed ("Couldn't load details" + retry) — only if counts are fetched lazily (C23).

### 5.3 OV-03 Auth-gate modal · [G] glass-modal (bottom sheet < md)

```text
Email step (OV-03.a)                              Code step (OV-03.c)
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│ Log in to like this shot         [x] │          │ Check your email                 [x] │
│ Sign in or create an account to save │          │ We sent a 6-digit code to            │
│ shots you like.                      │          │ name@example.com  Use a different email│
│ [ G  Continue with Google          ] │          │ 6-digit code                         │
│ ──────────────── or ──────────────── │          │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  C31 [N]     │
│ Email address                        │          │ │ 4││ 8││ 1││  ││  ││  │  one input   │
│ ( name@example.com                 ) │          │ └──┘└──┘└──┘└──┘└──┘└──┘              │
│ [Turnstile widget]                   │          │ Send a new code in 0:48              │
│ [      Continue with email         ] │          │                                      │
│ By continuing you agree to the Terms │          │                                      │
│ and Privacy Policy.                  │          │                                      │
└──────────────────────────────────────┘          └──────────────────────────────────────┘
```

Opens from a gated control with `intent=like-shot`, `target={shotId}`, `returnTo={current path}`. New accounts go to SCR-10 first, then back (FR-15). Error/edge states are the same as SCR-09 (.c….o) rendered inside the modal; listed there once.

States: OV-03.a email step · .b sending · .c code step · .d verifying · .e…  = SCR-09 error states · .x closed by Escape/[x] (focus returns to Like, nothing recorded, E2E-24).

**SCR-03 Review:** Feature coverage — Pass (FR-37…FR-42, FR-45; Save/Follow/Comments/Get in touch absent, E2E-28). Usability — Pass (Like reachable without scrolling on mobile; modals are bottom sheets < md). Navigation — Pass (returnTo brings the visitor back to the same shot). Findings **WF-05** (C22 lists an email share button not in FR-39 — omitted), **WF-09**.

---

## 6. SCR-04, SCR-05 Profile

**Routes** `{profile}` (Work), `{profile}/about` · **FR-54, FR-55** · **Journey** UJ-03 (E2E-16…E2E-19).

**Desktop 1440 — Work tab (SCR-04.a)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ SH-01                                                                                      │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ PROFILE HEADER C26 [M]                                                                     │
│   ( o )   Display name   [Featured Studio] [Team]                     (H1, P1)             │
│   (96px)  Headline in one or two lines                                                     │
│   neu     Location · Member since Mar 2025                                                 │
│   ring    128 shots   ·   9.4k likes received          (R1 stats only)                     │
│                                                                                            │
│ ┌─────────────────────┐                                              [Recent ▾]            │
│ │ Work*  │  About     │  C27 [N] inset track, links with aria-current  └C11 Recent/Popular │
│ └─────────────────────┘                                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                                        │
│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│  C18 grid (author row omitted on own     │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘  profile cards: stats only)            │
│ <3 41 · 12k  …                                                                             │
│                              [Load more]                                                   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop 1440 — About tab (SCR-05.a)**

```text
│ PROFILE HEADER (same)                                                                      │
│ │ Work  │  About*  │                                                                       │
│ ┌──────────────────────────────────────────────┐  ┌───────────────────────────────┐        │
│ │ ABOUT PANEL C28 [M] card, elevation-1         │  │ Contact                       │        │
│ │ Biography (body-lg, ≤ 72ch)                   │  │ hello@studio.example  [Copy]  │        │
│ │ Lorem ipsum …                                 │  │ Links                         │        │
│ │                                               │  │ studio.example ↗              │        │
│ │ Skills  ‹ui› ‹branding› ‹motion›              │  │ Social profile ↗              │        │
│ │ Languages  English, Spanish                   │  │ Location  Lisbon              │        │
│ │                                               │  │ Member since  Mar 2025        │        │
│ └──────────────────────────────────────────────┘  └───────────────────────────────┘        │
```

**Mobile 390 (SCR-04.a / SCR-05.a)**

```text
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ SH-01.g                              │   │ (o) Display name  [Team]             │
├──────────────────────────────────────┤   │ ┌──────────────┬──────────────┐      │
│        ( o ) 96                      │   │ │ Work         │ About*       │      │
│    Display name [Featured Studio]    │   │ └──────────────┴──────────────┘      │
│    Headline …                        │   │ Biography …                          │
│    Lisbon · Member since Mar 2025    │   │ Contact                              │
│    128 shots · 9.4k likes received   │   │ hello@studio.example [Copy]          │
│ ┌──────────────┬──────────────┐      │   │ Skills ‹ui› ‹branding› …             │
│ │ Work*        │ About        │      │   │ Links  studio.example ↗              │
│ └──────────────┴──────────────┘      │   │ Languages · Location · Member since  │
│ [ Recent ▾                        ] │   └──────────────────────────────────────┘
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (1 column)        │
└──────────────────────────────────────┘
```

| Region | Components | Pillar | Priority | Notes |
|---|---|---|---|---|
| Header | C26, C45 (xl, neu ring), C46 | M | P1 | Featured Studio badge only when set (OQ-27); "Team" label for team accounts; no Follow/Message (BR-45) |
| Tabs | C27 | N | P2 | Work · About only in R1 |
| Sort (Work) | C11 | N | P3 | Recent (default) / Popular → `?sort=popular` |
| Grid (Work) | C16–C18 | M | P1 | Shared grid states SCR-02.g…l |
| About panel | C28, C15, C50 | M | P1 | Empty fields omitted, not blank (FR-55) |
| Contact | C50 + [Copy] C40 ghost, C38 | M | P2 | Public contact email only if set (BR-78) |

**States**

| ID | State | Display |
|---|---|---|
| SCR-04.a | Member profile, Work | As drawn |
| SCR-04.b | Team account | "Team" badge next to the name (FR-54) |
| SCR-04.c | Sort Popular | Sort label updates; grid skeletons, then reorder |
| SCR-04.d | **Empty Work** | C34 "No shots yet" inside the tab (E2E-18) — not an error |
| SCR-04.e | **Loading** | Avatar circle + 3 skeleton lines; 12 card skeletons |
| SCR-04.f | **Error (grid)** | Shared SCR-02.j / .i |
| SCR-04.g | Unknown / suspended / deleted | SCR-11 "We can't find that page" (E2E-17, E2E-19) |
| SCR-04.h | Own profile (member) | Same as public in R1 (no edit until R2); stats shown |
| SCR-05.a | About, all fields | As drawn |
| SCR-05.b | About, some fields missing | Missing rows omitted; right column collapses if empty |
| SCR-05.c | **Empty About** | "{name} hasn't added an about section yet." |
| SCR-05.d | Email copied | Toast "Email copied" (E2E-16) |
| SCR-05.e | Clipboard denied | Email shown as selectable text, hint "Select and copy" |
| SCR-05.f | **Loading** | Skeleton lines in the panel |

**Tablet:** 768 — header stacked (avatar left of name), tabs full width, 2-column grid; About panel single column with Contact below Biography. 1024 — header row, 3 columns; About two columns.

**Review:** Feature coverage — Pass (FR-54 R1 stats/tabs only; FR-55 field set). Usability — Pass. Navigation — Pass (tabs are links; About reachable directly). Findings **WF-07** (C26 "Share profile" icon button not in FR-54 — omitted).

---

## 7. SCR-06 Search results

**Route** `/search/:term` · **FR-31, FR-32** · **Journey** UJ-02 (E2E-10, E2E-12…E2E-14).

**Desktop 1440 — results (SCR-06.a)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ SH-01.a  (search field shows "dashboard")                                                  │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Results for dashboard                                                     (H1, P1)         │
│ Shots about dashboard from the community.                                 (one line)       │
│ Related tags: ‹dashboard ui› ‹saas› ‹analytics› ‹admin› ‹charts› … (≤ 8)   C15 [N] (P2)    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                                        │
│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│ │▓▓▓▓▓▓▓▓▓▓│  C18 grid, relevance + popularity (BR-39)│
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                                        │
│                              [Load more]                                                   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop / mobile — no results (SCR-06.c)**

```text
┌────────────────────────────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ Results for zzqxnonexistent                                │   │ Results for zzqxnonexistent          │
│                                                            │   │                                      │
│                      [ line icon ]                         │   │            [ line icon ]             │
│          No shots match 'zzqxnonexistent'                  │   │   No shots match 'zzqxnonexi…'       │
│          Try one of these tags instead:                    │   │   Try one of these tags instead:     │
│     ‹dashboard› ‹branding› ‹mobile app› ‹logo› ‹ui› …      │   │   ‹dashboard› ‹branding› ‹logo›      │
│                                                            │   │   ‹mobile app› ‹ui› …                │
└────────────────────────────────────────────────────────────┘   └──────────────────────────────────────┘
  C34 [M] centred in content area, max 400; HTTP 200, noindex (E2E-12)
```

**Mobile 390 (SCR-06.a):** H1 wraps; description line; related tags row scrolls horizontally; 1-column grid. The header [Q] opens the drawer search pre-filled with the term.

| Region | Components | Pillar | Priority |
|---|---|---|---|
| Heading + description | text | M | P1 |
| Related tags | C15 | N | P2 |
| Results grid | C16–C18 | M | P1 |
| Empty state | C34 + C15 | M | P1 (when empty) |

**States**

| ID | State | Display |
|---|---|---|
| SCR-06.a | Results with related tags | As drawn |
| SCR-06.b | Related tags failed or none | Row omitted (FR-32) |
| SCR-06.c | **Empty (no results)** | C34 + popular-tag suggestions; every suggestion has results (FR-32) |
| SCR-06.d | **Error: search unavailable (503)** | C35 "Search isn't available right now" [Try again] (FR-31) |
| SCR-06.e | **Loading** | Heading renders; related row 6 chip skeletons; 12 card skeletons |
| SCR-06.f | No term (`/search`) | Heading "Search shots", focused search field + popular tags (proposal, IA §5.2) |
| SCR-06.g | Long or operator-laden term | Normalised/truncated term shown in heading; never an error (BR-38, E2E-13/14) |
| — | Loading more / errors / end | Shared SCR-02.h, .i, .l |

**Tablet:** 768 — 2 columns, related row scrolls; 1024 — 3 columns.

**Review:** Feature coverage — Pass. Usability — Pass (empty state always offers a way forward). Navigation — Pass. Finding **WF-08** (DESIGN_SYSTEM screen map says search uses the explore filter bar; FR-31 specifies none — not shown).

---

## 8. SCR-07, SCR-08 Tags

**Routes** `/tags`, `/tags/:tag` · **FR-33, FR-34** · **Journey** UJ-02 (E2E-11, E2E-15).

**Desktop 1440 — tags index (SCR-07.a)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ SH-01.a                                                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Tags                                                                     (H1)              │
│ Most used                                                                (P1)              │
│ ‹dashboard 1.2k› ‹branding 980› ‹logo 870› ‹mobile app 760› … (50 chips, wrap)   C15 [N]   │
│                                                                                            │
│ Browse A–Z                                                               (P2)              │
│ [#] [A] [B] [C] [D] [E] … [Z]    jump links (C50), 44 px targets                           │
│ ── A ─────────────────────────────────────────────────────────────────────────────────── │
│ abstract   accessibility   admin   agency   animation   app   …     (columns of links)     │
│ ── B ─────────────────────────────────────────────────────────────────────────────────── │
│ …                                                                                          │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Desktop 1440 — tag page (SCR-08.a)**

```text
│ 1,234 shots tagged dashboard                                            (H1, full number)  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  popular order, C18 grid               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                                        │
│                              [Load more]                                                   │
```

**Mobile 390:** index — most-used chips wrap; A–Z jump bar scrolls horizontally and sticks under the header while scrolling the index; letter sections single column. Tag page — headline wraps; 1-column grid.

| ID | State | Display |
|---|---|---|
| SCR-07.a | Default | As drawn |
| SCR-07.b | **Loading** | 20 chip skeletons + letter-section skeleton lines (server-rendered normally, cached ≤ 1 h) |
| SCR-07.c | **Empty catalogue** | C34 "No tags yet" |
| SCR-07.d | **Error** | C35 [Try again] |
| SCR-08.a | Tag page default | As drawn |
| SCR-08.b | **Loading** | Headline skeleton + 12 card skeletons |
| SCR-08.c | Tag missing or 0 eligible shots | SCR-11 (404, BR-41) |
| SCR-08.d | **Error / load more / end** | Shared SCR-02.i, .j, .l |
| — | **Empty** | *n/a* for SCR-08: a tag with no eligible shots is a 404 (BR-41) |

**Review:** Feature coverage — Pass (50 most used + A–Z with `#`, BR-41). Usability — Pass (jump links are 44 px). Navigation — Pass (header › Tags, footer › Tags, chips everywhere).

---

## 9. SCR-09 Log in and sign up

**Routes** `/login`, `/signup` (`?returnTo=&intent=&target=`) · **FR-10, FR-11, FR-12, FR-13, FR-16, FR-20** (+ FR-04 links) · **Journey** UJ-05 (E2E-29…E2E-44). No SiteHeader or footer (C03/FR-02).

**Desktop 1440 — email step (SCR-09.a)**

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ AUTH LAYOUT C29 [M]                                                                        │
│                                                    │                                       │
│            Trippple   (C04)                        │   ┌───────────────────────────────┐   │
│                                                    │   │                               │   │
│            Welcome back                (H2, P1)    │   │  ▓▓▓▓ optional artwork ▓▓▓▓▓  │   │
│            Log in with a code sent to your email.  │   │  ▓▓▓ (original/licensed, ▓▓▓  │   │
│                                                    │   │  ▓▓▓  flat, ≥ lg only)  ▓▓▓▓  │   │
│            [ G  Continue with Google          ]    │   │                               │   │
│            ─────────────── or ───────────────      │   │  credit: seed author          │   │
│            Email address                           │   └───────────────────────────────┘   │
│            ( name@example.com                 )    │                                       │
│            [Turnstile]                              │                                       │
│            [      Continue with email         ]    │                                       │
│            By continuing you agree to the Terms     │                                       │
│            and the Privacy Policy.                 │                                       │
│            New here? Create an account             │                                       │
│                         column 400 px              │                                       │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Mobile 390 — email step (SCR-09.a) and code step (SCR-09.e)**

```text
┌──────────────────────────────────────┐   ┌──────────────────────────────────────┐
│ Trippple                             │   │ Trippple                             │
│                                      │   │                                      │
│ Welcome back                         │   │ Check your email                     │
│ Log in with a code sent to your      │   │ We sent a 6-digit code to            │
│ email.                               │   │ name@example.com                     │
│ [ G  Continue with Google          ] │   │ Use a different email                │
│ ─────────────── or ───────────────   │   │ 6-digit code                         │
│ Email address                        │   │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐             │
│ ( name@example.com                 ) │   │ │  ││  ││  ││  ││  ││  │ numeric kbd │
│ [Turnstile]                          │   │ └──┘└──┘└──┘└──┘└──┘└──┘             │
│ [      Continue with email         ] │   │ Submits on the 6th digit             │
│ By continuing you agree to the Terms │   │ Send a new code in 0:58  (disabled)  │
│ and the Privacy Policy.              │   │                                      │
│ New here? Create an account          │   │ Didn't get it? Check spam, or        │
└──────────────────────────────────────┘   │ Continue with Google                 │
                                           └──────────────────────────────────────┘
```

| Region | Components | Pillar | Priority | Notes |
|---|---|---|---|---|
| Brand + heading | C04, text | M | P1 | "Welcome back" (`/login`) / "Create your account" (`/signup`) |
| Google | C40 secondary | N | P2 | No One Tap prompt (FR-13) |
| Divider | C51 | M | — | "or" |
| Email + Turnstile + submit | C30, Turnstile, C40 primary | N / M | P1 | Client validation before any request (BR-10) |
| Code entry | C31 | N | P1 | One input, 6 visual cells (D-24(f)); paste fills; auto-submit |
| Resend | C40 ghost | M | P2 | 60 s countdown (BR-05) — **WF-03** |
| Alerts | C39, C30 error | M | — | Server/limit errors above the form |
| Legal + switch links | C50 | M | P3 | Terms, Privacy (FR-04); `/login` ↔ `/signup` keep `returnTo` |

**States**

| ID | State | Display |
|---|---|---|
| SCR-09.a | Log in, email step | As drawn |
| SCR-09.b | Sign up, email step | Heading "Create your account"; switch "Already have an account? Log in" (same flow, BR-09) |
| SCR-09.c | Field errors | "Enter your email address" / "Enter a valid email address", `aria-invalid`, no request (E2E-34) |
| SCR-09.d | **Sending** | Button Spinner + "Sending code…", form `aria-busy`, inputs read-only |
| SCR-09.e | Code step | As drawn; identical whether or not the account exists (BR-06) |
| SCR-09.f | Verifying | Spinner + "Verifying…", input read-only |
| SCR-09.g | **Wrong code** | Group error "That code didn't work. {n} attempts left." input cleared and refocused (BR-04, E2E-35) |
| SCR-09.h | **Expired or exhausted** | "This code is no longer valid." + [Send a new code] as primary (E2E-35, E2E-36) |
| SCR-09.i | Resend cooldown | "Send a new code in 0:{ss}" disabled; announced once (BR-05) |
| SCR-09.j | New code sent | Toast "New code sent" |
| SCR-09.k | **Rate limited (429)** | C39 danger "Too many attempts. Try again in {time}." (E2E-37) |
| SCR-09.l | **Turnstile failed / didn't load** | C39 "We couldn't verify you're human. Try again." + retry; Google remains available (FR-20, E2E-38) |
| SCR-09.m | **Email provider error** | C39 "We couldn't send the code. Try again or continue with Google." (NFR-18) |
| SCR-09.n | **Google didn't complete** | C39 on `/login`: "Google sign-in didn't complete. Try again or use your email." (E2E-42) |
| SCR-09.o | **Suspended account** | C39 "This account is unavailable." No session (E2E-43) |
| SCR-09.p | Redirected from a protected page | Info line above heading "Log in to continue" (FR-16) |
| SCR-09.q | Success | Redirect: pending → SCR-10; else safe `returnTo` (BR-14) |
| — | Empty | *n/a* (form) |

**Tablet:** 768 — single centred column, no artwork; 1024 — artwork panel appears (≥ lg).

**Review:** Feature coverage — Pass (FR-10…FR-13, FR-20; no password fields, BR-12). Usability — Pass (one field per step; recovery on every error). Navigation — Pass (`returnTo` kept across switch link and Google). Findings **WF-03**, **WF-11** (code step has no URL by design, IA §6.1 rule 5).

---

## 10. SCR-10 Choose username

**Route** `/onboarding?returnTo=` · **FR-17** · **Journey** UJ-05 (E2E-29, E2E-40, E2E-41). AuthLayout (no header/footer).

**Desktop 1440 / Mobile 390 (same single column, 400 px)**

```text
┌──────────────────────────────────────┐
│ Trippple                             │
│                                      │
│ Choose your username        (H2, P1) │
│ This is your public address.         │
│                                      │
│ Username                             │
│ ( @ lena-ortiz                [ok] ) │  C30 with @ prefix, live check (300 ms)
│ @lena-ortiz is available             │  success caption
│ {domain}{profile} preview            │  e.g. trippple.app/lena-ortiz (domain pending D-01)
│                                      │
│ Display name                         │
│ ( Lena Ortiz                       ) │  pre-filled from Google when available
│                                      │
│ By continuing you accept the Terms   │
│ and Privacy Policy.                  │
│ [            Continue            ]   │  C40 primary, disabled until valid + available
│                                      │
│ Not you? Sign out                    │  (WF-18 / IA G-12)
└──────────────────────────────────────┘
```

| ID | State | Display |
|---|---|---|
| SCR-10.a | Default, suggestion pre-filled | Suggested username (BR-21) already checked |
| SCR-10.b | **Checking** | Trailing Spinner; live region "Checking availability…" |
| SCR-10.c | Available | Check icon + "@{name} is available" |
| SCR-10.d | **Taken** | "That username is taken" + 2 suggestion chips (C15) that fill the field |
| SCR-10.e | **Reserved** | "That username isn't available" + suggestions (BR-20) |
| SCR-10.f | **Invalid format** | Specific rule text: too short/long, characters, consecutive `_`/`-`, all digits (BR-18) |
| SCR-10.g | Display name error | "Enter a display name (1–50 characters)" (BR-22) |
| SCR-10.h | **Submitting** | Button Spinner, fields read-only |
| SCR-10.i | **Race lost (409)** | "Someone just took that username" + new suggestion (FR-17) |
| SCR-10.j | **Server error / 429** | C39 danger with retry time |
| SCR-10.k | Success | Redirect to `returnTo` with intent applied (BR-15) |
| — | Loading (page) | *n/a* — server-rendered with the suggestion |
| — | Empty | Field cleared by user → Continue disabled, rule hint shown |

**Review:** Feature coverage — Pass (FR-17, BR-16…BR-22). Usability — Pass; **WF-04** (C33 debounce 400 ms vs FR-17 300 ms — 300 used). Navigation — Pass with **WF-18** (sign-out link added so pending members are not stuck).

---

## 11. SCR-11, SCR-12 Not found and error

**FR-05** (R1 simple 404; the colour mosaic is R3, FR-08) · Journeys UJ-01, UJ-02 (E2E-04, E2E-05, E2E-15).

```text
SCR-11.a 404 — desktop 1440 (minimal chrome)                    Mobile 390
┌────────────────────────────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ Trippple                                                   │  │ Trippple                             │
│                                                            │  │                                      │
│                    [ line icon ]                           │  │           [ line icon ]              │
│              We can't find that page            (H1)       │  │    We can't find that page           │
│      It may have moved, or the link is wrong.              │  │    It may have moved, or the link    │
│   ( [Q] Search shots                         )             │  │    is wrong.                         │
│                    [Go home]                               │  │ ( [Q] Search shots             )     │
│                                                            │  │ [            Go home           ]     │
└────────────────────────────────────────────────────────────┘  └──────────────────────────────────────┘
  HTTP 404, noindex; header nav omitted (BrandSlot only), footer omitted

SCR-12.a Error (500)
┌────────────────────────────────────────────────────────────┐
│ Trippple                                                   │
│                    [ alert icon ]                          │
│               Something went wrong             (H1)        │
│      Please try again. If it keeps happening, contact us   │
│      and quote this reference: 7f3a-…  (request ID)        │
│              [Try again]   [Go home]                       │
└────────────────────────────────────────────────────────────┘
```

| ID | State | Display |
|---|---|---|
| SCR-11.a | 404 page | As drawn (C35 404 variant) |
| SCR-12.a | 500 page | As drawn; no stack/SQL (FR-05) |
| SCR-12.b | Error page itself fails | Minimal static HTML fallback: message + home link (FR-05) |
| SCR-12.c | Inline section error | C35 inline variant inside a section ("Couldn't load …" + [Try again]) — used by SCR-01.e, SCR-02.j, SCR-06.d |
| SCR-12.d | Database unreachable | Same as SCR-12.a (503) (FR-07) |
| — | Loading / empty | *n/a* (terminal pages) |

**Review:** Feature coverage — Pass. Usability — Pass (search + home on 404; retry + reference on error). Navigation — Pass. Finding **WF-16** (404 minimal chrome follows the reference structure; confirm the footer is intentionally omitted).

---

## 12. SCR-13 Legal and static pages

**Routes** `/terms`, `/privacy`, `/cookies`, `/about`, `/contact` · **FR-04** · Journey UJ-05 (E2E-44).

```text
Desktop 1440                                                     Mobile 390
┌────────────────────────────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ SH-01                                                      │  │ SH-01.g                              │
├────────────────────────────────────────────────────────────┤  ├──────────────────────────────────────┤
│        Privacy Policy                       (H1)           │  │ Privacy Policy                       │
│        Last updated 12 Nov 2026                            │  │ Last updated 12 Nov 2026             │
│        ┌ On this page ┐  (≥ lg, sticky; links to H2s)      │  │ On this page ▾  (disclosure)         │
│        │ Data we hold │  Body text, ≤ 720 px measure       │  │ Body text …                          │
│        │ Retention    │  H2 sections …                      │  │                                      │
│        │ Deletion     │  "How to request deletion" → contact│  │                                      │
│        └──────────────┘                                    │  │                                      │
├────────────────────────────────────────────────────────────┤  │ SH-05.b                              │
│ SH-05                                                      │  └──────────────────────────────────────┘
└────────────────────────────────────────────────────────────┘
```

| ID | State | Display |
|---|---|---|
| SCR-13.a | Default | Static, server-rendered, indexable |
| SCR-13.b | Contact page | Same template; contact email address + purpose list (support, deletion request BR-24, takedown BR-70) — no form in R1 |
| — | Loading / empty / error | *n/a* (static; a missing approved text blocks P12-05, not development, FR-04) |

**Review:** Feature coverage — Pass (five pages; Privacy explains retention and deletion request, BR-24, BR-79). Usability — Pass. Navigation — Pass (footer, sign-up disclaimer, onboarding). Finding **WF-19** (text pending OQ-03).

---

## 13. Pillar map (where each pillar applies)

| Pillar | R1 regions |
|---|---|
| **Neumorphism [N]** | Search fields (C09), text fields and OTP cells (C30, C31), category pills (C10), sort trigger (C11), Filters toggle and panel controls (C12–C14), tag chips on `bg` (C15), Like button (C20), icon buttons and rail row < xl (C41), profile tabs (C27), segmented timeframe (C44), FAB (C42), secondary buttons (C40), profile avatar ring (C45 xl) |
| **Glass [G]** | Site header (subtle), Explore menu, account menu, sort listbox, tag suggestions (panel), mobile drawer (panel), card hover bar and action rail ≥ xl (subtle), toasts and tooltips (panel), Share / Details / Auth-gate modals (modal) |
| **Minimal [M]** | Page layout and gutters, hero, every grid and card, shot media and content blocks, profile header and About, headings, empty/error/loading states, auth layout, legal pages, footer |

No region stacks effects (constitution principle 3): controls inside modals use the flat/`bg-2` variants (C15 glass variant, C40 secondary-on-glass).

---

## 14. R2 and R3 screens (block level; wireframes deferred)

Detailed wireframes for R2 and R3 are **deferred to their own design cycles**: R2 in P06-06 with approval at **G4-R2**, R3 in P06-07 with approval at **G4-R3** (P07-07). The block-level structure below fixes regions and order so R1 layouts leave room for them. Screen IDs are from [APPLICATION_SITEMAP §2–§3](APPLICATION_SITEMAP.md).

| Screen | Blocks (top → bottom) |
|---|---|
| SCR-20/21 Composer | Header bar (Cancel · status "Saved" · Save draft · Publish) → upload drop zone → ordered block list (image/text, drag + keyboard reorder, full-width toggle, alt text) → side panel ≥ lg / step below < lg: title, description, category, tags, team |
| SCR-22 Shot detail (R2) | R1 layout + "for {Team}" + Follow in header; Save beside Like; Comments on rail; palette row under block 1; Previous/Next at media edges; owner menu |
| SCR-23 Profile (R2) | R1 header + followers/following stats + Follow / Edit profile; tabs Work · Collections · Liked shots (owner) · Members (teams) · About; drafts strip (owner) |
| SCR-24/25 Collections | Grid of collection cards (2×2 mosaic, name, count) → detail: curator header + Share + grid |
| SCR-26 Liked shots | Profile header + tabs + grid (owner) |
| SCR-27/28 Members, followers | Person rows (avatar, name, headline, Follow) + Load more |
| SCR-29 Full onboarding | Stepper → avatar → headline/location → intent → skills; Skip on each |
| SCR-30…36 Settings | Settings nav (side ≥ md / list < md) → section form → sticky Save bar |
| SCR-37 Job board | Heading + Post a job → keyword search → filter sidebar ≥ lg (sheet < lg) + job rows + pagination |
| SCR-38 Job detail | "All jobs" → title/meta → description → company card + Apply (sticky ≥ lg; bottom bar < lg) |
| SCR-39 Post a job | Stepper (Details · Company · Preview) → form → Back / Continue |
| SCR-41 Report queue | Status tabs → report rows (target preview, reason, actions Hide/Dismiss/Suspend) |
| SCR-42 Designer results | Type switch → person rows with 3 work thumbnails |
| OV-04 Comments | Side panel ≥ md / sheet < md: list (1 reply level) → composer pinned bottom |
| OV-05 Save picker | Popover: collection checkboxes → "New collection" |
| SCR-50 Notifications | Mark all read → grouped rows |
| SCR-51/52 Messages | Thread list (≥ md two-pane) → conversation + composer |
| SCR-53 Hire | Filter bar → designer cards (4 thumbnails, skills, Message) |
| SCR-54…57 Services | Filters → service cards → detail (price box sticky ≥ lg, Request service) → profile tab rows |
| SCR-58 Blocked | Rows with Unblock |
| SCR-59 Colour filter | Third column in the Filters panel: hex input + swatches |
| SCR-60 Mosaic 404 | Mosaic digits → hue slider → search |
| OV-10 Cookie consent | Bottom banner: Accept · Reject · Settings (equal prominence) |

---

## 15. Self-review findings

Self-review per [§1.3](#13-review-checklist-p06-step-3). Severity: **H** blocks a prototype screen, **M** needs a decision before P06-05, **L** can wait for P06-10. None changes a requirement or design-system document; owners decide.

| ID | Sev. | Screen | Finding | Applied in wireframes | Owner |
|---|---|---|---|---|---|
| WF-01 | M | SCR-02 | C10/V-8 list a "Discover" pill; BR-89 forbids a Discover tab | "All" pill | Lead (DESIGN_SYSTEM C10, V-8) |
| WF-02 | L | SCR-02 | FR-25 timeframe labels mirror reference copy | Trending now · Past 7 days · Past 30 days · Past 12 months · All time | Lead / user |
| WF-03 | M | SCR-09, OV-03 | C31 resend countdown 30 s vs BR-05 60 s | 60 s | Lead (DESIGN_SYSTEM C31) |
| WF-04 | L | SCR-10 | C33 debounce 400 ms vs FR-17 300 ms | 300 ms | Lead (DESIGN_SYSTEM C33) |
| WF-05 | L | OV-01 | C22 includes an email share button; FR-39 lists X, Pinterest, copy link, native share | Email omitted | Lead |
| WF-06 | M | SCR-02 | C13 allows up to 5 tags; FR-25/E2E-03 use a single `tag` parameter | Single tag | Lead (DESIGN_SYSTEM C13 or FR-25) |
| WF-07 | L | SCR-04 | C26 has a "Share profile" icon button not in FR-54 | Omitted | Lead |
| WF-08 | L | SCR-06 | DESIGN_SYSTEM §9 maps search to the explore filter bar; FR-31 has no sort/filters | Not shown | Lead |
| WF-09 | M | SCR-03 | Staff can open hidden shots (BR-42) but no component signals "hidden" | C39 info alert proposed | Lead (component variant) |
| WF-10 | L | SH-01 | SearchBar form posts `?q=`; route is `/search/:term` | 308 redirect (IA G-09) | Lead / P02-03 |
| WF-11 | L | SCR-09 | Code step has no URL; reload returns to the email step | Documented (IA §6.1) | Lead / P02-03 |
| WF-12 | L | SCR-01 | Homepage feed has no sort control | "See all popular" link | Designer |
| WF-13 | M | SH-01 | Desktop nav from 1024 (tokens, D-24) vs ≥ 1280 (FR-01) | 1024 (D-24 pending) | Lead / user (D-24) |
| WF-14 | M | Grids | 4 columns at 1280 (tokens, D-24) vs 3 (NFR-28) | Tokens | Lead / user (D-24, NFR-28) |
| WF-15 | L | SCR-02 | V-11 says no R1 journey needs a FAB; C18/C42 specify back-to-top FAB on mobile | FAB shown (mobile only) | Lead |
| WF-16 | L | SCR-11 | 404 with minimal chrome (no nav/footer): good focus, but footer legal links missing | Minimal chrome | Designer → P07-04 |
| WF-17 | M | SH-02, SCR-02 | "New & noteworthy" is reference wording (FR-01, FR-22, C05, C11) | "Recent" | Lead / user |
| WF-18 | M | SCR-10 | Pending members have no sign-out path on onboarding | "Not you? Sign out" link | Lead (FR-17) |
| WF-19 | L | SCR-13 | Legal text pending OQ-03 | Template only | User (OQ-03) |

Open H findings: **0**. Open M findings: 9 (decisions, not design defects).

---

## 16. FR coverage (R1)

Every R1 FR that has a user interface maps to at least one wireframed screen and state.

| FR | Title | Screen(s) / state(s) |
|---|---|---|
| FR-01 | Global header and navigation | SH-01, SH-02, SH-03, SH-04 |
| FR-02 | Footer | SH-05 |
| FR-03 | UI primitives and shared states | All screens; SH-06; shared grid states SCR-02.g…l; SCR-12.c |
| FR-04 | Legal and static pages | SCR-13; links in SCR-09, SCR-10, SH-05 |
| FR-05 | Not-found and error pages | SCR-11, SCR-12 |
| FR-10 | Request a sign-in code | SCR-09.a….d, .k….m; OV-03 |
| FR-11 | Verify a sign-in code | SCR-09.e….h, .o, .q |
| FR-12 | Resend a code | SCR-09.i, .j |
| FR-13 | Continue with Google | SCR-09.a, .n; OV-03.a |
| FR-14 | Session and sign-out | SH-01.b/.e/.f, SH-04 |
| FR-15 | Auth-gate modal | OV-03; SCR-03.a, .l |
| FR-16 | Protected routes | SCR-09.p (redirect notice), .q |
| FR-17 | Minimal onboarding | SCR-10 |
| FR-20 | Bot protection | SCR-09.a (widget), .l |
| FR-21 | Homepage | SCR-01 |
| FR-22 | Shot feeds | SCR-02.a….c, .o |
| FR-23 | Infinite scroll + Load more | SCR-02.g….l, .p |
| FR-24 | Shot card | SCR-02 (card), .m, .n; all grids |
| FR-25 | Filter bar | SCR-02.d….f, .k |
| FR-31 | Shot search | SCR-06.a, .d….g |
| FR-32 | Search empty state, related tags | SCR-06.b, .c |
| FR-33 | Tags index | SCR-07 |
| FR-34 | Tag page | SCR-08 |
| FR-37 | Shot detail page | SCR-03.a….e, .j, .k |
| FR-38 | Content blocks | SCR-03 (blocks), .f |
| FR-39 | Action rail + Share | SCR-03 rail; OV-01 |
| FR-40 | Details modal | OV-02 |
| FR-41 | Related shots | SCR-03 related, .g |
| FR-42 | Mobile shot layout | SCR-03 mobile wireframe; OV-01/OV-03 bottom sheets |
| FR-45 | Like / unlike | SCR-03.b….d, .h, .i, .l; SCR-02.n; card Like everywhere |
| FR-54 | Profile header + Work | SCR-04 |
| FR-55 | About tab | SCR-05 |

R1 FRs without a user interface (no screen needed): FR-06, FR-07 (its error surfaces are SCR-12.d), FR-09 (no public UI; staff view = SCR-03.j), FR-27, FR-29 (counts appear in C16/OV-02), FR-87 (page titles, IA §4.3).

**Result: 32 R1 FRs with UI, 32 covered. R1 FRs with UI not covered: 0.**

---

## 17. Screen and state count (R1)

| Group | Surfaces | States |
|---|---|---|
| Shell SH-01…SH-06 | 6 | SH-01 8 · SH-02 1 · SH-03 2 · SH-04 3 · SH-05 2 · SH-06 3 = **19** |
| Overlays OV-01…OV-03 | 3 | OV-01 4 · OV-02 3 · OV-03 5 (+ SCR-09 error states reused) = **12** |
| Pages SCR-01…SCR-13 | 13 | SCR-01 7 · SCR-02 16 · SCR-03 12 · SCR-04 8 · SCR-05 6 · SCR-06 7 · SCR-07 4 · SCR-08 4 · SCR-09 17 · SCR-10 11 · SCR-11 1 · SCR-12 4 · SCR-13 2 = **99** |
| **Total** | **22** (13 pages + 6 shell + 3 overlays) | **130** |

Every R1 page has a wireframe at 1440 and 390 with loading, empty and error states (or a stated *n/a* reason): acceptance criterion **met** (self-assessed; reviewed at P06-10 and P07).
