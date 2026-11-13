# Reverse-Engineering-to-Design Mapping

| Field | Value |
|---|---|
| Task | P05 addendum to P05-05 / P05-06, part of the G3 review package (P05-07) |
| Version | 1.2 (2026-11-13): token rows updated for identity v2 (A-16) and revision 2.1 (A-17) |
| Purpose | Show, for every pattern found in reverse engineering, whether the design foundation **preserves**, **modifies**, **replaces**, **defers** or **drops** it, or **introduces** something new, and why |
| Sources (findings) | [02 Frontend analysis](../reverse-engineering/02-frontend-analysis.md) · [03 Component inventory](../reverse-engineering/03-component-inventory.md) (58 components) · [04 User journeys](../reverse-engineering/04-user-journeys.md) · [10 Unknowns](../reverse-engineering/10-unknowns-and-limitations.md) · screenshots in `../reverse-engineering/screenshots/` |
| Targets (design) | [FRONTEND_DESIGN_CONSTITUTION](FRONTEND_DESIGN_CONSTITUTION.md) · [DESIGN_TOKENS](DESIGN_TOKENS.md) · [DESIGN_SYSTEM](DESIGN_SYSTEM.md) (C01–C51) · [COMPONENT_GUIDELINES](COMPONENT_GUIDELINES.md) · `design-system/` CSS and preview |
| Binding constraints | A-07 (own visual identity, not the reference's look) · X-9 (layout and behaviour are referenced, the look is not) · D-02 release scope · BR-89 (no banner/promo, no personalisation) · A-10 (original or licensed art only) |

## 1. Dispositions

| Code | Meaning |
|---|---|
| **Keep** | Behaviour, structure and intent kept as observed (restyled in the Trippple identity, which is always the case under A-07) |
| **Modify** | Kept in intent; behaviour, values or structure changed. The reason is given |
| **Replace** | The observed solution is replaced by a different one that serves the same user need |
| **Defer** | Kept for a later release (R2/R3/Later per D-02); not designed in the R1 foundation beyond reserving space |
| **Drop** | Not built. The reason is a requirement or decision ID |
| **New** | Not in the reference. A **proposed improvement**, each tied to a requirement, rule or accessibility need |

Release tags: R1 · R2 · R3 · Later.

## 2. Visual tokens

The reference's tokens describe *its* look, which A-07 and X-9 exclude. The structural facts behind them (sizes, ratios, hierarchy) are reused where they serve the user.

| # | Observed (doc 02 §1) | Disposition | Design result | Why |
|---|---|---|---|---|
| T-1 | Brand pink `#EA4C89` on search submit, accents, errors | **Replace** | Identity v2.1 (A-16, A-17): bright crimson `#DF2F4D` for fills (actions, likes, notifications) and deep crimson `#B3263E` for crimson text, selection and rings; lavender, sage and gold as supporting tints | A-07/A-16 identity. Crimson (hue 350°) is a true red, distinct from the reference hot pink (hue 337°), and is paired with Inter, warm-white surfaces and soft neumorphism |
| T-2 | Text `#0D0C22`, muted ≈ `#6E6D7A`, white page | **Replace** | Charcoal `#252326`, secondary `#706A70`, white page `#FFFFFF` | A-16. Neumorphic depth comes from soft-grey `#F2F0F0` controls lifted off the warm page, not from tinting the whole page; no gradients (A-17) |
| T-3 | Active-pill surface `#F8F7F4` | **Replace** | Selected language: primary-light well + 1.5 px deep crimson ring + deep crimson label | Observed active state relied on a ~1.05:1 fill change; ours has a ≥ 3:1 cue (F-10) |
| T-4 | Border `#E7E7E9` on outline buttons and inputs | **Replace** | No outlines on controls; depth from neumorphic shadows; boundary ring only where a 3:1 cue is needed | Constitution pillar N |
| T-5 | Error colour = brand pink | **Replace** | Sienna `#9A3412` (proposed, D-26) + icon + text | The reference used the same hue for brand and errors; with a crimson brand this matters more, so errors use a distinct hue and never colour alone |
| T-6 | Mona Sans 16/28, UI weight 600, display ≈ 56–64 px | **Modify** | Inter, body 16/1.6, max weight 600 (D-24d), display clamp 40→64 px | A-07 forbids Mona Sans; hierarchy and weight habits kept |
| T-7 | Serif display on jobs hero | **Defer** (Later) | Not designed | Jobs page is R2; no second family in R1 |
| T-8 | Gutter 20/32/72 px | **Modify** | 16/24/32/48/64 px by breakpoint | Same rhythm; 72 px wastes width at 1280 for a 4-up grid |
| T-9 | Grid gap 36 px | **Modify** | 16/24/32 px | Tighter gap gives larger thumbnails (showcase priority) |
| T-10 | Thumbnail radius 8 px | **Modify** | 16 px (`--radius-card`) | Constitution radius bands |
| T-11 | Pill buttons (9999 px), 40 px circles | **Keep** | Pill radius; icon buttons 44 px (40 px only with a 44 px hit area) | WCAG 2.5.8 / A11Y-07 |
| T-12 | Inputs ≈ 12 px radius with 1 px border | **Replace** | Recessed neumorphic wells, 14 px radius, focus outline ring | Pillar N for fields |
| T-13 | Modals ≈ 16 px, white, scrim ≈ black 60% | **Modify** | Modal glass α 0.94, 24 px radius, flat text-tinted scrim 48% (never blurred) | Pillar G; contrast verified over worst-case media (T-15) |
| T-14 | Dropdown panels white + soft shadow | **Replace** | Panel glass α 0.88 | Pillar G |
| T-15 | Button transitions 0.05 s; card overlay 0.3 s; footer reveal 0.4 s | **Modify** | 120 / 180 / 220 / 280 ms tokens, reduced-motion fallbacks | Consistent motion scale |
| T-16 | Avatars 24 / 48 / 60 / 80 | **Modify** | 24 / 32 / 40 / 64 / 96 | Fewer, token-based sizes |
| T-17 | 4:3 feed thumbnails, `object-fit` cover | **Keep** | `aspect-ratio: 4/3` | Proven scanning rhythm |
| T-18 | Dominant-colour placeholder while loading | **Keep** | `--shot-placeholder` (only allowed inline style) | Prevents layout and colour flash; D-15 computes it |
| T-19 | Lazy fade-in, first row high priority | **Keep** | Fade `--duration-base`; none under reduced motion | — |
| T-20 | Video teaser on hover; motion icon | **Defer** (R3) | — | D-18 (video in R3) |
| T-21 | Badges PRO/PRO+ (light / dark) | **Modify** | `.ui-badge` neutral / accent / highlight; word carries meaning | No dark-on-light inversion needed |

## 3. Layout and responsive behaviour

| # | Observed | Disposition | Design result | Why |
|---|---|---|---|---|
| L-1 | Header: logo, search (not on home), 4 nav menus, Sign up + Log in | **Modify** | Glass header: brand, search ≥ 768 px (not on home), **Explore + Tags** (R1 scope), Log in (on-glass) + Sign up (primary) | D-02 scope; nav grows in R2/R3 |
| L-2 | Homepage: no header search; hero search with Shots/Designers/Services tabs | **Modify** | Hero search kept, **Shots only** in R1 (no tabs); Designers R2, Services R3 | FR-21 |
| L-3 | Homepage hero toggle Hire talent / Get hired, rotating phrase | **Drop** (R1) / Defer (R3) | — | FR-21 note: toggle not built until R3 |
| L-4 | Announcement banner, floating "project brief" promo toast | **Drop** | — | BR-89 |
| L-5 | Google One Tap prompt | **Drop** | Google button only | FR-13 |
| L-6 | Auth: split screen, form 72% + credited artwork | **Modify** | Centred 400 px column; optional flat artwork panel ≥ 1024 px | A-10 (licensed art only); simpler at small widths |
| L-7 | 404 / wizard minimal chrome | **Modify** | ErrorState (C35) inside the normal shell | Keeps navigation available on errors |
| L-8 | Footer: category marquee, 7 link columns, socials | **Modify** | bg-2 band, brand + 3 link columns (Explore, Company, Legal), 44 px link rows | Minimal pillar; marquee is motion with no task value |
| L-9 | Grid columns 1/1/2/3/3/3/4/4/6 at 360…2400; desktop nav from 1280 | **Modify** | 1/2/3/4 columns at 360/768/1024/1280, max 5; desktop nav from 1024 | **D-24(e)**, approved by the user 2026-11-12 (see I-1) |
| L-10 | Mobile: burger → full-width sheet with accordions, dimmed page | **Keep** | MobileNavDrawer (C06): panel glass over a flat scrim, Explore accordion | — |
| L-11 | Mobile header: burger + logo + Log in | **Modify** | Brand + Sign up + burger; Log in moves into the drawer | 360 px overflow fix (T-33); Sign up is the primary conversion |
| L-12 | Category pills scroll horizontally; sort becomes a full-width native select | **Modify** | Pills scroll (kept); sort keeps the custom listbox with a full-width trigger | T16-27: one listbox behaviour at every width |
| L-13 | Shot detail mobile: action rail moves under media as a row | **Keep** | C21 row of neumorphic IconButtons below 1280 px; glass rail ≥ 1280 | — |
| L-14 | Shot page container 64/120 px padding; content ≈ 1024 px | **Modify** | `--container-detail` 1024 px, standard gutters | Same measure, token-based |
| L-15 | Profile grid 3 columns at 1440 (larger cards) | **Modify** | Shared gallery grid | One grid rule (D-24e) |

## 4. Components (all 58 from doc 03)

| RE # | Observed component | Disposition | Release | Design target | Notes |
|---|---|---|---|---|---|
| 1 | AppLayout | **Modify** | R1 | C01 AppShell | No banner or promo toast (BR-89) |
| 2 | AuthLayout | **Modify** | R1 | C29 | See L-6 |
| 3 | MinimalLayout | **Modify** | R1 | C35 in the normal shell | See L-7 |
| 4 | WizardLayout | **Defer** | R2 (job post) | — | — |
| 5 | SiteFooter | **Modify** | R1 | C08 | See L-8 |
| 6 | AnnouncementBanner | **Drop** | — | — | BR-89 |
| 7 | FloatingPromoToast | **Drop** | — | — | BR-89 |
| 8 | Container / PageGutter | **Modify** | R1 | C01, `--gutter` | See T-8 |
| 9 | SiteHeader | **Modify** | R1 | C03, C04 | Glass; see L-1 |
| 10 | MainNav + MegaMenu (hover) | **Modify** | R1 | C05 PrimaryNav & ExploreMenu | Disclosure pattern, **opens on click**, hover-open optional after 150 ms; simple link list instead of icon + description items |
| 11 | MobileNavDrawer | **Keep** | R1 | C06 | — |
| 12 | HeaderSearch (+ autocomplete) | **Modify** | R1 / R2 | C09 | R1: plain search; autocomplete is R2 (FR via P09-18) |
| 13 | SearchTypeDropdown | **Defer** | R2/R3 | — | R1 searches shots only (V-6) |
| 14 | HeroSearch | **Modify** | R1 | C09 hero variant | Shots only; "Popular:" tag chips kept |
| 15 | Breadcrumbs | **Defer** | R3 (hire) | — | No R1 page needs it |
| 16 | Button (5 variants, 3 sizes) | **Modify** | R1 | C40 | Primary (accent), secondary (neumorphic), on-glass, ghost; sizes 44/52 (40 only with hit extension) |
| 17 | IconButton (circle, count badge) | **Modify** | R1 | C41 | 44 px; count badge via C46 when needed |
| 18 | Avatar (online dot, stack) | **Modify** | R1 | C45 | Online dot and team stack not in R1 |
| 19 | Badge (PRO, PRO+, SELECT, NEW, Promoted) | **Modify** | R1 | C46 | Neutral labels; "Promoted" dropped with ads |
| 20 | Chip / TagChip | **Modify** | R1 | C15 | Flat chip; current-tag state added; removable variant for the tag filter |
| 21 | PillTabs / SegmentedControl | **Modify** | R1 | C10 pills, C44 segmented | Category pills and profile tabs are links with `aria-current` (D-24g) |
| 22 | Dropdown / Select | **Modify** | R1 | C11 + C49 | Glass listbox with check icon |
| 23 | Tooltip | **Keep** | R1 | C47 | Hoverable, focus-triggered, Escape closes |
| 24 | Modal | **Modify** | R1 | C48 | Glass; bottom sheet < 768 px; **Escape closes** (see I-4) |
| 25 | Toast | **Keep** | R1 | C38 | Success and error variants |
| 26 | Input / TextField | **Replace** | R1 | C30 | Recessed well; see T-12 |
| 27 | Checkbox / Radio / Group | **Modify** | R1 | C14 radio rows | Checkboxes not needed in R1 |
| 28 | RichTextEditor | **Defer** | R2 (jobs) | — | — |
| 29 | Stat (abbreviated number) | **Keep** | R1 | C16 meta row, C23 stats | Abbreviations get full numbers for screen readers |
| 30 | ShotGrid (ads, boosts, infinite scroll) | **Modify** | R1 | C18 | Ads and boosts dropped (monetisation not in scope); "Load more" added (see N-3) |
| 31 | ShotCard | **Modify** | R1 | C16 | No effects on the thumbnail; touch layout puts Like in the meta row |
| 32 | ShotThumbnail (placeholder, teaser) | **Modify** | R1 / R3 | C16 media | Placeholder kept; teaser R3 |
| 33 | ShotCardActions (Get in touch, Save, Like) | **Modify** | R1 → R3 | C17 | R1 Like only; Save R2; "Message" R3; signed-out → AuthGate |
| 34 | AdCard | **Drop** | — | — | No advertising |
| 35 | DesignerCard (hire) | **Defer** | R3 | — | Hire directory R3 |
| 36 | ServiceCard | **Defer** | R3 | — | — |
| 37 | JobRow | **Defer** | R2 | — | — |
| 38 | CollectionCard | **Defer** | R2 | — | — |
| 39 | ShotHeader (sticky; Follow, Like, Save, Get in touch) | **Modify** | R1 | C19 + C20 | Not sticky in R1; Like only; Follow R2, Save R2, Message R3 |
| 40 | ContentBlockRenderer | **Modify** | R1 | C24 | Image + text in R1; video R3 |
| 41 | ShotActionRail (Comments, Share, Details) | **Modify** | R1 | C21 | Share + Details in R1; Comments R2 |
| 42 | ShareModal (Pinterest, X, copy) | **Keep** | R1 | C22 | No email share (FR-39); generic icons, no brand logos |
| 43 | ShotDetailsModal | **Modify** | R1 | C23 | Views + Likes in R1 (Saves, Comments R2); tags as chips |
| 44 | CommentsPanel | **Defer** | R2 | — | Unverified in RE (robots-disallowed) |
| 45 | ColorPalette (+ .aco download) | **Defer** | R3 | — | Palette stored from R2 uploads (D-15); download dropped |
| 46 | RelatedShotsSection | **Keep** | R1 | C25 | "More by" + "You might also like" |
| 47 | ProfileHeader (Select badge, Schedule a call, promo panel) | **Modify** | R1 | C26 | No promo panel or "Schedule a call" (X-6); Follow R2 |
| 48 | ProfileTabs (7 tabs + sort) | **Modify** | R1 | C27 | Work + About in R1; Liked R2; others later |
| 49 | ProfileAboutSidebar | **Modify** | R1 | C28 | Fields limited to R1 data |
| 50 | ReviewSummary + ReviewItem | **Defer** | Later | — | Reviews tied to paid services |
| 51 | ServiceListItem | **Defer** | R3 | — | — |
| 52 | ShotFilterBar | **Keep** | R1 | C10 + C11 + C12 | Same three-part layout (sort · pills · Filters) |
| 53 | ShotFilterPanel (Tags / Color / Timeframe) | **Modify** | R1 | C12 + C13 + C14 | Colour filter R3 (X-4); **one** tag in R1 (FR-25) |
| 54 | FilterDropdownGroup (Apply per dropdown) | **Defer** | R3 | — | Hire/services filters |
| 55 | JobFilterSidebar | **Defer** | R2 | — | — |
| 56 | AuthForm (Google, divider, one field, CAPTCHA) | **Modify** | R1 | C29 + C30 + C31 | Email code (OTP, 6 cells), Turnstile (D-20) instead of reCAPTCHA |
| 57 | AuthGateModal (intent + return URL) | **Keep** | R1 | C32 | Pending action completes once after sign-in (FR-15) |
| 58 | EmptyState (illustration) | **Modify** | R1 | C34 | 48 px icon instead of illustration (licensing, minimalism) |

**Totals (counted from the table):** Keep 8 · Modify 32 · Replace 1 · Defer 14 · Drop 3 = 58. The 41 Keep/Modify/Replace rows all have an R1 role (some also grow in R2/R3, e.g. #12, #33); the 14 deferred rows are scheduled, not lost; the 3 dropped rows (#6, #7, #34) are excluded by BR-89 or by having no advertising.

## 5. Interactions and states (doc 02 §5)

| # | Observed | Disposition | Design result |
|---|---|---|---|
| S-1 | Card hover: overlay fades in with gradient, title, 3 circle buttons | **Modify** | Subtle-glass bar, no gradient over the art; also revealed on **keyboard focus**; touch shows Like in the meta row |
| S-2 | Nav opens mega-menu on hover | **Modify** | Click always works; hover-open optional (CG §1.3) |
| S-3 | Tippy tooltips on badges | **Keep** | C47 |
| S-4 | Logged-out Like/Save/Follow → sign-up modal with intent + return URL | **Keep** | C32; R1 intent = like |
| S-5 | Sign-up modal **does not close on Escape** | **Replace** | Escape closes every overlay (WCAG 2.1.2 / CG §0) |
| S-6 | Share → modal; Details → modal | **Keep** | C22, C23 |
| S-7 | Sort dropdown and category pills navigate | **Keep** | URL is the state (FR-22) |
| S-8 | Filters panel expands inline; each change navigates (GET form) | **Keep** | C12; panel animates open (reduced motion: instant) |
| S-9 | Email copy → "Email copied!" toast | **Modify** | Same pattern used for "Link copied" (C22); profile email copy follows R1 profile data |
| S-10 | WAF interstitial | **Drop** | Infrastructure artefact |
| S-11 | Infinite-scroll "Loading…" text | **Replace** | Skeleton cards + polite live region + always-present "Load more" (NFR-27) |
| S-12 | Google button skeleton shimmer | **Modify** | Generic Skeleton (C36) wherever content loads |
| S-13 | Search no results: illustration + copy | **Modify** | C34 with icon, copy and "Clear filters" action |
| S-14 | Validation: pink text + pink outline, button dims | **Modify** | Danger ring + icon + text + `aria-invalid`/`aria-describedby`; the button is **not** disabled (errors announce on submit) |
| S-15 | Custom 404 with colour mosaic | **Modify** | C35 ErrorState in the shell |
| S-16 | Paginated lists end silently | **Modify** | "You've reached the end" caption; "Load more" removed |

## 6. Introduced (proposed improvements, not in the reference)

| # | Improvement | Grounding |
|---|---|---|
| N-1 | Neumorphic **selected language** with a ≥ 3:1 cue (inset + ring + accent label) | F-10 (neumorphic shadows alone are ~1.3:1); constitution pillar N |
| N-2 | **Glass flattening rule**: raised neumorphism is never drawn inside glass | Constitution §3.2; T16-02; checked automatically in T-33 v1.2 |
| N-3 | **"Load more" button** next to infinite scroll; focus moves to the first new card | NFR-27 (keyboard/screen-reader access to feeds) |
| N-4 | Skip link, visible 2 px focus ring on every control | WCAG 2.4.1, 2.4.7, 2.4.11 |
| N-5 | Reduced-motion, reduced-transparency, no-`backdrop-filter` and forced-colours fallbacks | A11Y-12…A11Y-15 |
| N-6 | 44 px minimum targets (40 px visuals extend their hit area) | A11Y-07 |
| N-7 | Active-filter **count badge** on the Filters toggle; per-group "Clear" | Usability: the reference gave no summary once the panel closed |
| N-8 | Removable chip for the single selected tag | FR-25 (one tag) — makes the replacement rule visible |
| N-9 | Timeframe as radio rows (≥ 768 px) / segmented control (< 768 px) | The reference's list had no visible selected state cue |
| N-10 | Touch layout: Like in the card meta row (no hover on touch) | CG §0 "No hover-only" |
| N-11 | Release tags in the preview, so reviewers see what is R1 | Gate hygiene |

## 7. Inconsistencies found and recommendations

| # | Inconsistency | Status | Recommendation |
|---|---|---|---|
| I-1 | Observed grid (3 columns at 1280, 6 at ≥ 2000) and desktop nav from 1280 differ from the design (4 at 1280, max 5; nav from 1024) | **Resolved** by the user in D-24(e) (2026-11-12). DESIGN_SYSTEM §12 still recommended the other option; corrected in DS v1.2 | None; record kept for traceability |
| I-2 | Sort label: FR-22 says "Popular / New & noteworthy"; IA G-04, WF-17, C05 and C11 use **Recent** | **Open** | Approve "Recent" (neutral wording, matches `/shots/recent`) and update FR-22 and FR-01 text. Question Q-2 |
| I-3 | Reference timeframe labels "Now / This Past Week / …" vs design "Trending now / Past 7 days / Past 30 days / Past 12 months / All time" | Resolved (catalogue v1.1, neutral labels, same five periods) | None |
| I-4 | Reference sign-up modal ignores Escape; design closes it | Resolved (FR-15, V-5) | None |
| I-5 | Category list: the reference shows "Discover" + 8 categories; ours is "All" (BR-89) + 8 from seed data that does not exist yet | **Open** | The preview uses placeholder names. Confirm the 8 categories when the seed set is chosen (P09-02). Question Q-3 |
| I-6 | Pillar balance by family count is N 32.6 / G 30.2 / M 37.2 (target 40/30/30). D-24(b) approved 38/29/33 under an older counting rule | **Open** | Question Q-1 |
| I-7 | Previous preview showed non-R1 content: header nav "Designers / Jobs", sort option "Most viewed", search placeholder mentioning colours | **Fixed** in preview v1.2 | None |
| I-8 | Catalogue C17 says the action bar uses `--radius-control-lg`; T16-24 changed the CSS to `--radius-control-sm` | **Fixed** in DS v1.2 | None |
| I-9 | Seven CSS defects listed in DS §11 (X1, X2, X4–X9) were still present in the CSS | **Fixed** 2026-11-13, verified by T-33 v1.2 | None |
| I-10 | "Available for work" label and avatar online dot are observed but have no requirement in R1–R3 | Open (low) | Leave out; the Toggle (C43) in the preview is reserved and labelled as such. Raise as a candidate in OPEN_QUESTIONS if wanted |
