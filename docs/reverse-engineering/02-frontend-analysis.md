# 02 — Frontend Analysis

Values marked [OBSERVED] come from `getComputedStyle`, CSS custom properties, or DOM attributes captured on 2026-11-12. Colours noted "≈" were sampled visually from screenshots and should be treated as approximate.

---

## 1. Design tokens

### 1.1 Colour palette

| Token (proposed name) | Value | Where observed |
|---|---|---|
| `--color-brand` (pink) | **`#EA4C89`** (rgb 234 76 137) | Search submit button, "product design" hero accent, "Start Project Brief" in mobile menu, Shoelace `--sl-color-primary-500` [OBSERVED] |
| `--color-brand-600` | `#E44A85` | `--sl-color-primary-600` [OBSERVED] |
| Brand scale 50→950 | `#FEF8FA, #FCE7EF, #FAD4E3, #F8BFD5, #F4A2C2, #EA4C89, #E44A85, #BB3D6E, #9B325B, #6F2441, #451628` | `--sl-color-primary-*` [OBSERVED] |
| `--color-text` | **`#0D0C22`** (rgb 13 12 34) | Body text, headings, primary dark buttons ("Log in", "Get in touch") [OBSERVED] |
| `--color-text-nav` | `#060318` | Main nav links [OBSERVED] |
| `--color-text-muted` | ≈ `#6E6D7A` | Secondary text, stats, "Follow" link (visual) |
| `--color-bg` | `#FFFFFF` | Page background [OBSERVED] |
| `--color-surface-subtle` | **`#F8F7F4`** | Active category pill, segmented-tab active background [OBSERVED] |
| `--color-surface-input` | ≈ `#F3F3F4` | Header search field background (visual) |
| `--color-border` | **`#E7E7E9`** | Outline buttons, filter toggle, tertiary buttons [OBSERVED] |
| `--color-announcement-bg` | ≈ `#FDF2F7` with a pink border | Promo banner ("Get 20% off…") (visual) |
| `--color-success` | ≈ `#3AAE5C` | "Available for work" label (visual) |
| `--color-error` | ≈ `#EA4C89` / pink-red | Validation message text and input outline on login (visual) |
| Badge `PRO` | Light grey bg, dark text | Shot cards (visual) |
| Badge `PRO+` | Dark (`#0D0C22`) bg, white text | Shot cards (visual) |
| Thumbnail placeholder | Per-shot `--thumbnail-bg-color` (e.g. `#0C0B0B`, `#FEFEFE`, `#9FD7FD`) | Inline style on `<drb-thumbnail>`: the shot's **dominant colour** is shown while the image loads [OBSERVED] |

### 1.2 Typography

| Role | Family | Size / line-height / weight | Evidence |
|---|---|---|---|
| Base / body | **Mona Sans**, "Helvetica Neue", Helvetica, Arial, sans-serif | 16px / 28px / 400 | `body` computed [OBSERVED] |
| Main nav link | Mona Sans | 14px / 30px / 600 | `.site-nav-main__link` [OBSERVED] |
| Sign-up text link | Mona Sans | 14px / 17px / 700 | `.site-nav__signup` [OBSERVED] |
| Primary button label | Mona Sans | 14px / 600 | `.site-nav__login` [OBSERVED] |
| Small button label | Mona Sans | 12–13px / 600–700 | `.btn2`, `.btn2--tertiary` [OBSERVED] |
| Shot page H1 | Mona Sans | 24px / 29px / 600 | `h1` on shot page [OBSERVED] |
| Card title (overlay) | Mona Sans | 14px / 20px / 500, white | `.shot-title` [OBSERVED] |
| Category pill | Mona Sans | 14px / 20px; 400 inactive, 600 active | `.filter-categories` [OBSERVED] |
| Hero display (homepage) | Mona Sans (wide/bold) | ≈ 56–64px, ~700 | Visual |
| Job-board hero | **Serif** display face (family not captured) | ≈ 72px | Visual; UNKNOWN family |
| Secondary font asset | **WF Visual Sans** (Regular Text, SemiBold) | — | Preloaded `.woff2` on homepage [OBSERVED] |

Typographic character: tight, modern grotesque; heavy use of 600 weight for UI; generous 28px body line-height.

### 1.3 Spacing and layout

| Token | Value | Evidence |
|---|---|---|
| Page side gutter (≥1200px) | **72px** | `.shots-grid` padding [OBSERVED] |
| Page side gutter (768–1199px) | 32px | breakpoint test [OBSERVED] |
| Page side gutter (<768px) | 20px | breakpoint test [OBSERVED] |
| Grid gap (shots) | **36px** (row and column) | `.shots-grid` [OBSERVED] |
| Shot page container padding | 64px 120px | `.shot-page-container` [OBSERVED] |
| Filter sub-nav top padding | 32px | `.filter-subnav` [OBSERVED] |
| Card overlay padding | 20px | `.shot-thumbnail-overlay` [OBSERVED] |
| Nav link horizontal padding | 16px | [OBSERVED] |
| Button gap (icon+label) | 8px | `.btn2` [OBSERVED] |
| Shot-page content width | ≈ 1024px (H1 width) inside a 1200px related grid | [OBSERVED] |

Suggested scale for the clone: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 36 · 48 · 64 · 72 · 120.

### 1.4 Radii, borders, shadows, motion

| Element | Value | Evidence |
|---|---|---|
| Shot thumbnail | **8px** radius | `.shot-thumbnail-base` [OBSERVED] |
| Buttons (pill) | 9999px (`1e7px`) | `.site-nav__login`, `.btn2--tertiary`, filters toggle [OBSERVED] |
| Circle buttons | 50% (40×40) | `.btn2--circle` [OBSERVED] |
| Inputs | ≈ 12px radius, 1px `#E7E7E9`-ish border | Login input, filter inputs (visual) |
| Modals | ≈ 16px radius, white, centred, dark scrim ≈ rgba(0,0,0,.6) | Sign-up, Share, Shot details modals (visual) |
| Dropdown panels | ≈ 12–16px radius, soft shadow | Nav mega-menus (visual) |
| Autocomplete panel shadow | `0 0 0 1px rgba(35,38,59,.1), 0 6px 16px -4px rgba(35,38,59,.15)` | `--aa-panel-shadow` [OBSERVED] |
| Button transitions | `color/background-color/border 0.05s cubic-bezier(0.32,0,0.59,0.03)` | `.btn2` [OBSERVED] |
| Card overlay | `opacity 0.3s` | `.shot-thumbnail-overlay` [OBSERVED] |
| Footer reveal | `opacity 0.4s ease-in-out 0.1s` | `.site-footer` [OBSERVED] |
| Shot page padding | `padding 0.25s linear 0.15s` (animates when the side rail opens) | [OBSERVED] |

### 1.5 Image treatment

- **Aspect ratio:** feed thumbnails are a fixed **4:3** (`data-aspectratio="1.3333"`, base `320×240`, crop `vertical=center`) [OBSERVED].
- **Responsive images:** `srcset` at 320, 400, 450, 640, 700, 800, 840, 1000, 1200 widths using CDN query params `?format=webp&resize=WxH&vertical=center` [OBSERVED].
- **Lazy loading:** lazysizes (`lazyload lazyfadein`, `data-srcset`, `data-sizes="auto"`). The first row uses `fetchpriority="high"` [OBSERVED].
- **Animated shots:** a still PNG (`still-*.png`) is shown by default; on hover, a video teaser plays (`data-video-teaser-small/medium/large` or `hover-media-src` MP4s). A camera icon in the top right marks motion shots [OBSERVED].
- **Original shot media:** e.g. 1600×1200 video (shotData `width`/`height`). Multi-file shots use **content blocks** [OBSERVED].
- **Placeholder colour:** the shot's dominant colour is the background before load [OBSERVED].
- **Avatars:** circular (24px in cards, ≈ 48px on the shot header, ≈ 80px on the profile header) (visual).

---

## 2. Global layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header: Logo | [Search ▾type (●)] | Explore▾ Hire Talent▾ Get Hired▾ │
│         Community▾ |                          Sign up  [ Log in ]    │
├──────────────────────────────────────────────────────────────────────┤
│ Announcement banner (dismissible, pink tint)        [Get Started] ✕ │
├──────────────────────────────────────────────────────────────────────┤
│ Page content (max width = viewport − 2×72px)                         │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ Footer: category marquee | Logo | For designers · Hire talent ·      │
│ Inspiration · Advertising · Blog · About · Support | socials         │
│ © 2026 · Terms · Privacy · Cookies         Jobs · Tags · Places ·    │
│                                            Resources                 │
└──────────────────────────────────────────────────────────────────────┘
Floating: "Start a Project Brief" promo toast (bottom-centre, dismissible),
Google One Tap prompt (top-right desktop / bottom-sheet mobile)
```

- **Homepage variant:** the header has *no* search field. Search lives in the hero section with a Shots / Designers / Services segmented toggle [OBSERVED].
- **Auth pages:** no global header or footer. Split layout: form ≈ 72% left, full-height artwork ≈ 28% right, credited to a designer [OBSERVED].
- **404 and `/instantmatch`:** minimal chrome (logo plus "Contact us" or "Cancel") [OBSERVED].

---

## 3. Responsive behaviour [OBSERVED via viewport sweep on `/shots/popular`]

| Viewport width | Grid columns | Column width | Side padding | Desktop nav | Burger |
|---|---|---|---|---|---|
| 360 | 1 | 320px | 20px | hidden | ✔ |
| 600 | 1 | 560px | 20px | hidden | ✔ |
| 768 | 2 | 334px | 32px | hidden | ✔ |
| 1024 | 3 | 296px | 32px | hidden | ✔ |
| 1200 | 3 | 328px | 72px | hidden | ✔ |
| 1280 | 3 | 355px | 72px | **visible** | ✘ |
| 1440 | 4 | 297px | 72px | visible | ✘ |
| 1920 | 4 | 417px | 72px | visible | ✘ |
| 2400 | 6 | 346px | 72px | visible | ✘ |

**Implementation hint:** `grid-template-columns: repeat(auto-fill, minmax(~270px, 1fr))` with a 36px gap approximates this. Exact breakpoints: 768 / 1024 / 1200 / 1280 / ~2000+.

Mobile-specific behaviour [OBSERVED]:
- The header collapses to burger + logo + "Log in" pill. The burger opens a full-width sheet with accordion sections (Explore, Hire Talent, Get Hired, Community) and a pink "Start Project Brief" link; the page behind is dimmed.
- Shot detail on mobile: Like and Save circles plus a full-width "Get in touch" button under the author. The action rail (comments, share, info) moves *below* the media as a horizontal row.
- Category pills scroll horizontally. The sort dropdown becomes a full-width select.
- Google One Tap appears as a bottom sheet.

---

## 4. Page-by-page specification

### 4.1 Homepage `/`
- **Layout:** two-column hero (copy left; rotating showcase artwork right on a coloured rounded card, credited with a designer chip). Below: search block, feed, then a horizontal designer/agency marquee and a two-sided CTA.
- **Hero:** segmented toggle `HIRE TALENT | GET HIRED` (uppercase, letter-spaced, pill). H1 "Work with the world's best in **{rotating phrase}**"; the phrase cycles through web design, mobile design, motion design, product design, brand design, UX/… in pink. Three pink-check bullet points and a dark pill CTA "Start Your Project Brief" with a sparkle icon. The "Get Hired" state swaps the copy (H1 phrases: share your work, offer your services, send proposals…).
- **Search block:** tabs `Shots | Designers | Services` with icons; a large rounded search input ("What type of design are you interested in?") with a pink circular submit; a "Popular:" row of tag chips (dashboard, landing page, mobile app, portfolio, ecommerce, animation, illustration, onboarding) linking to `/search/:term`; a "Popular ▾" sort.
- **Feed:** `shot2-item` cards (newer card generation) with infinite scroll via `GET /shots/popular?page=N&perPage=24&served_shot_ids[]=…` (de-duplication list).
- **States:** WAF interstitial on first load (202). Lazy fade-in of images.

### 4.2 Explore `/shots/popular[/:category]`, `/shots/recent`
- **Filter sub-nav row:** left "Popular ▾" dropdown (Popular, New & Noteworthy); centre category pill bar (Discover active + 8 categories, with a right-arrow scroller); right "Filters" outline pill with icon.
- **Filters panel (expands inline):** three equal columns: **Tags** (search input with icon), **Color** (hex input with a rainbow swatch; dropdown of ~60 preset hex chips; `maxlength=7`, `pattern=[a-fA-F\d]+`), **Timeframe** (Now, This Past Week, This Past Month, This Past Year, All Time). Each has a "Clear" link once set. Changing a filter navigates (GET form, `action=/shots/popular`).
- **Grid:** `ol.shots-grid` of `li.shot-thumbnail`. Ad cards are interleaved (Carbon/BuySellAds "Hide ads • Advertise"). Boosted shots are fetched separately (`/screenshot_boost`).
- **Infinite scroll:** `GET /shots/popular?page=N&per_page=24` returns an HTML `<li>` fragment. A "Loading…" indicator shows at the bottom.

### 4.3 Shot card (feed item)

```
┌──────────────────────────────┐  4:3, radius 8, bg = dominant colour
│                         [▶] │  ← motion indicator (video icon) top-right
│                              │
│  (hover) gradient overlay    │  opacity 0→1, .3s
│  Title…        (💬)(🔖)(♡)   │  white circular buttons 40px
└──────────────────────────────┘
(◯) Designer Name [PRO]      ♥ 81  👁 7.7k
```
- **Click areas:** the image links to the shot (`/shots/:id-:slug`). Avatar/name link to the profile. Overlay buttons: Get in touch (message), Save (bucket/collection), Like.
- **Logged-out:** all three overlay actions open the sign-up modal (`data-signup-trigger`, `data-context="message-user|bucket-shot"`, like → `intent=like-shot`).
- **Counts** are abbreviated (`7.7k`, `1.8k`, `2m`).
- **Badges:** `PRO`, `PRO+`, team avatar.
- **Ad variant:** sponsor name + "Hide ads • Advertise" instead of stats; external-link icon on the image.

### 4.4 Shot detail `/shots/:id-:slug`
- **Header block (sticky "user-sticky-header"):** H1 title (24/600). Avatar (48px) + "**Name** for **Team**" + green "Available for work" + "Follow" text link. Right side: Like (circle, outline), Save (circle, outline), "Get in touch" (dark pill).
- **Media:** full-width rounded container on a light grey background showing the primary content block (image/video autoplay-loop). Further content blocks stack below (image, video, text) with optional full width.
- **Right floating action rail (desktop):** Comments (with count badge), Share, Details (ⓘ). Fixed vertically centred at the right edge.
  - **Share modal:** shot preview image on top, "Share this with your social Community", Pinterest and X circular buttons, "or copy link" field with a Copy button.
  - **Details modal:** "Shot details", "Posted Nov 12, 2026"; stats grid Views / Saves / Likes / Comments; **Tags** as outline chips linking to `/tags/:tag`.
  - **Comments:** opens a side panel (not inspected; robots-disallowed endpoint).
- **Below media:** colour palette (7 hex swatches, e.g. `#FEFEFE … #6C96F8`) + "Download color palette" (.aco, disallowed). Author card (avatar, team name, tagline, Get in touch). "More by {team}" (4-up grid + View profile). "You might also like" (12-up grid, `data-request-source="Similar Work"`). "Need help with web design?" links to hire/agency/services landing pages.
- **Prev/next shot navigation** buttons exist (`.shot-nav-prev/next`).

### 4.5 Profile `/:username`
- **Header (two-column):** left: large avatar (≈80px, online dot), name + "DRIBBBLE SELECT" badge (tooltip: "vetted for high-quality work…"), large headline H2 (≈44px/700), stats "54,662 followers · 541 following · 14,703 likes", actions [Get in touch] [Follow] [🔖 Save] [📅 Schedule a call]. Right: a custom promo panel (user-uploaded image or brand panel).
- **Tabs (pill style, active = subtle bg):** Work · Services · Reviews · Collections · Liked Shots · Members (teams) · About. Right side: "Recent Shots ▾ / Popular Shots".
- **Grid:** 3 columns at 1440px (larger cards than Explore).
- **About tab:** Biography, location, "Dribbble Pro", "Member since Dec 2013", Expertise (e.g. Webflow Expert), Languages, Skills (chips), counts (followers/following/tags), Contact Info (website, email with "Email copied!" toast), Members, Social links (website, Twitter, Facebook, Instagram, GitHub).
- **Services tab:** list rows with title, "From $X | duration", description excerpt, "Quick Hire" tag.
- **Reviews tab:** "4.9 (158 ratings)" plus explainer, then "Latest Reviews" (reviewer, relative date, text).
- **Collections tab:** cards with a thumbnail mosaic, title, "N Shots • M Designers".

### 4.6 Hire directory `/hire`
- Breadcrumb (Home / Designers and Developers), H1, intro, "Popular:" chips.
- **Filter bar:** settings icon + dropdown pills: Categories (8 checkboxes), Budget (range inputs + Apply), Location (text + Apply), Rating (radio `minimum_rating`: N & up), More (`available_for_work`, `pro_only`, `responds_quickly`, `agencies_only`). Each dropdown has an Apply button; "Clear Filters".
- **Designer card (`resume-user-card`):** avatar 60px, name, PRO+/SELECT badges, ★ rating (count), "✔ 161 projects completed", "Promoted" label; meta row (From $3,000/project · location · "Responds in about 1 hour" · "15 Services available"); 4 work thumbnails; skill chips (+N skills); Save (circle) + "Get in touch".
- Infinite scroll (`/hire?page=2&perPage=10&additional_count=4`).
- Specialty landing pages add long-form SEO content, "The Dribbble Standard", a "How to hire" 3-step section and an FAQ accordion.

### 4.7 Services `/services`, `/services/:id-:slug`
- Filters: Categories, Tags (with counts, e.g. "UI Design (7,052)"), Price, Delivery Time (<3 days, <1 week, <1 month), Designer Filters (PRO, Responds Quickly, Agencies, rating), Quick Hire toggle.
- Service card (`article.service-result`): cover image(s), title, seller, price, delivery.
- **Detail page:** title, seller + PRO; "About this Service" rich text; "Browse Related Services" chips. Sticky purchase box: price ($500), "Quick Hire", "Concepts and revisions: 1 concept, 3 revisions", "Project Duration: 4 days", [Hire Now] [Request Service]. Seller card: rating 4.7 (46), projects completed, country, response time, services count.

### 4.8 Jobs `/jobs`, `/jobs/:id-:slug`, `/jobs/new`
- **List:** serif hero "The #1 job board for graphic design jobs", [+ Post a job]. Tabs "Job Board | Designer Search". Search input (company, skill, tag). "Recent posts" with a "N new opportunity posted today!" note.
- **Job row:** company logo, company, title, location, Remote tag, [View job] [Apply now], "Posted about 1 hour ago".
- **Right sidebar filter card:** Specialties (9 checkboxes), Location + "Open to remote", Full-Time / Freelance-Contract, Clear Filters.
- **Detail:** "< All Jobs" pill; "Job Details" eyebrow; H1; share buttons (Share = Facebook, Post = X, Copy); rich-text description. Sticky right card: company logo (circle), name, Visit Website, [Apply for this position], Job Type, Location (+ Remote Friendly), Date posted. "You might also like" directory links and "Are you also hiring?" links.
- **Post wizard (1/4):** left art panel credited to an artist; right form: Job title*, Job description* (rich-text editor with Body/H1/H2, bold, italic, bullet and ordered lists), Job location (blank = "Remote"), Workplace type* (Remote/On-site/Hybrid), Designer type* (9 specialties), Employment type* (Full-time employee / Freelance-Contract hire), Where can people apply?* (URL), Company name, Company website*, logo ("Choose image"). [Cancel] [Continue].

### 4.9 Auth `/session/new`, `/signup`
- Centred 310px-wide column: pink dribbble-ball icon, H "Welcome back" / "Welcome to Dribbble", [Continue with Google] (outline pill with G logo), "or" divider, single input, [Continue] (dark pill, full width), terms disclaimer, switch link ("Don't have an account? Sign up").
- **Validation (client-side, Pristine.js):** empty submit shows a pink message below the input ("Please enter an email address or username" / "Please enter an email address" / "Please enter a valid email address"), the input outline turns pink, and the button dims. A server message slot `[data-server-message]` exists for server errors.
- **Loading:** the Google button shows a grey shimmer skeleton until GIS loads.

### 4.10 Other notable pages
- **Browse project briefs:** stats header, a Pro upsell card overlaying the list, multi-filter row (Category, Project scope, Budget, Timeline, Client Type with descriptions Verified / Promising / Returning).
- **Instantmatch:** marketing step (Generate Brief / I'll write it myself) → step 1 grid of 12 design types + "Need something else?". Back / Cancel in the header.
- **Blog:** article cards; post page with H2 sections and "More in this category".
- **404:** colour-driven mosaic and hue slider.

---

## 5. Interaction states

### 5.1 Hover
| Element | Behaviour |
|---|---|
| Shot card | Overlay fades in (0.3s) with a bottom gradient, title and 3 white circle buttons; animated shots start the teaser video [OBSERVED] |
| Nav item | Opens a mega-menu dropdown on hover (desktop); the item text turns muted [OBSERVED] |
| Nav dropdown items | Icon + bold title + description; hover background on items [OBSERVED class `site-nav-sub__item`] |
| Buttons | Fast colour/background transitions (0.05s) [OBSERVED] |
| Tooltips | Tippy-based (`data-tippy-directive`, `<drb-tooltip>`) for badges [OBSERVED] |

### 5.2 Click
| Element | Result |
|---|---|
| Like / Save / Get in touch / Follow / Hire Now (logged-out) | Sign-up modal loaded via `GET /signups/new?intent=<intent>&return_to=<url>`. Intents seen: `like-shot`, `request-service`. The modal **does not close on Escape** (observed); close with the ✕ button |
| Share | Share modal (Pinterest, X, copy link) |
| Details (ⓘ) | Shot details modal (stats + tags) |
| Sort dropdown | Two-option list (Popular / New & Noteworthy), navigates |
| Category pill | Navigates to `/shots/popular/:category` |
| Header search type | `<drb-dropdown>` with Shots / Designers / Services |
| Email on profile | Copies to clipboard and shows an "Email copied!" toast |
| Announcement ✕ | Dismisses the banner (persistence UNKNOWN; likely a cookie) |

### 5.3 Loading states
- WAF challenge page (blank or minimal) with HTTP 202, then a reload.
- Image lazy fade-in over the dominant-colour placeholder.
- Infinite-scroll "Loading…" text at the end of lists.
- Skeleton shimmer on the Google sign-in button.
- Vue islands are SSR-rendered, so there is no spinner on first paint.

### 5.4 Empty states
- Search with no results: line-art illustration, "No results found", "It seems we can't find any results based on your search." [OBSERVED]
- Paginated lists stop when the server returns `404 {"results":" "}` (observed on reviews page 2).

### 5.5 Error states
- Form validation: inline pink text under the field plus a pink outline (`aria-invalid="true"`, `role="alert"`).
- 404 page (custom).
- `/screenshot_boost` returns `404 {"errors":["No relevant boosted shot found"]}` silently (no UI).
- Server-side auth errors: rendered into `[data-server-message]` (content UNVERIFIED).
