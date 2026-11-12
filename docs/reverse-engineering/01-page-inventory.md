# 01 — Page Inventory

All routes below were **visited and confirmed** (HTTP status recorded) unless marked *(sitemap only)* or *(link only)*. Access is described from the perspective of an anonymous visitor.

**Access legend:** `Public` · `Auth` (redirects to `/session/new` when logged out) · `Public / Pro-gated content` (page renders, actions or content need Pro) · `Public / auth-gated actions`

**Rendering legend:** `SSR` = Rails server-rendered HTML · `SSR+Vue` = server HTML with Vue islands hydrated from `window.__INITIAL_STATE__` · `Framer` = marketing page whose nav/footer are injected via `/client_app/framer_navigation` and `/client_app/framer_footer`.

---

## A. Discovery and inspiration

| # | Page | Route pattern | Example (verified) | Status | Access | Render | Purpose | Screenshot |
|---|---|---|---|---|---|---|---|---|
| 1 | Homepage | `/` | `/` | 200 (after WAF 202) | Public | SSR | Hero (Hire Talent / Get Hired toggle), Shots/Designers/Services search toggle, popular-tag chips, sort, shot feed, designer marquee, footer | `screenshots/homepage/` |
| 2 | Explore: Popular | `/shots/popular` | `/shots/popular` | 200 | Public | SSR | Main feed ranked by popularity | `screenshots/explore/shots-popular-*` |
| 3 | Explore: Popular by category | `/shots/popular/:category` | `/shots/popular/web-design` | 200 | Public | SSR | Same feed filtered by category. Categories: `product-design, web-design, animation, branding, illustration, mobile, typography, print` | `explore/shots-popular-web-design-*` |
| 4 | Explore: New and Noteworthy | `/shots/recent` | `/shots/recent` | 200 | Public | SSR | Feed sorted by recency | `explore/shots-recent-*` |
| 5 | Explore: Recent by category | `/shots/recent/:category` *(sitemap)* | `/shots/recent/branding` | — | Public | SSR | Recency feed per category | — |
| 6 | Explore with filters | `/shots/popular?timeframe=&color=&tag=` | `?timeframe=week`, `?color=ee66aa` | 200 | Public | SSR | Filter-panel results (tag, hex colour, timeframe `now/week/month/year/ever`) | `explore/shots-timeframe-week-tag-*`, `explore/shots-color-*` |
| 7 | Playoffs | `/shots?list=playoffs` | same | 200 | Public | SSR | Design challenges: an original shot plus horizontally scrolling "playoff" responses | `explore/playoffs-desktop-viewport.png` |
| 8 | Shot detail | `/shots/:id-:slug` | `/shots/27883591-Brandform-Website-Design` | 200 | Public / auth-gated actions | SSR+Vue | Single design post (see 02 §4.4) | `design-details/` |
| 9 | Search results (shots) | `/search/:term` | `/search/dashboard` | 200 | Public | SSR | Term heading + SEO description + "Related" terms + feed | `search/search-dashboard-*` |
| 10 | Search: no results | `/search/:term` | `/search/zzzxqqqnonexistentterm` | 200 | Public | SSR | Empty-state illustration + "No results found" | `search/search-empty-*` |
| 11 | Tags index | `/tags` | `/tags` | 200 | Public | SSR | Popular tags + A–Z index | `misc-pages/tags-*` |
| 12 | Tag page | `/tags/:tag` | `/tags/framer` | 200 | Public | SSR | Count headline ("17,157 inspirational designs…") + feed | `explore/tag-framer-*` |
| 13 | Places | `/places` | `/places` | 200 | Public | SSR | Top cities, countries, US states, Canadian provinces | `misc-pages/places-*` |

## B. Profiles (designer / team)

`:username` is a root-level slug, so a clone needs a reserved-word list (`shots`, `jobs`, `hire`, `services`, `search`, `tags`, `stories`, `pro`, …).

| # | Page | Route | Example | Status | Access | Purpose | Screenshot |
|---|---|---|---|---|---|---|---|
| 14 | Profile: Work | `/:username` | `/halolab`, `/madebylalit_` | 200 | Public | Header + tabs + shot grid ("Recent Shots" / "Popular Shots" sort) | `designer-profile/profile-halolab-*`, `profile-individual-*` |
| 15 | Profile: Services | `/:username/services` | `/halolab/services` | 200 | Public | Service list with price, duration, Quick Hire flag | `hire/profile-services-*` |
| 16 | Profile: Reviews | `/:username/reviews` | `/halolab/reviews` | 200 | Public | Aggregate rating ("4.9 (158 ratings)") + review list | `hire/profile-reviews-*` |
| 17 | Profile: Collections | `/:username/collections` | `/halolab/collections` | 200 | Public | Collection cards ("6 Shots • 1 Designer") | `designer-profile/collection-list-*` |
| 18 | Collection detail | `/:username/collections/:id-:slug` | `/halolab/collections/7827608-SaaS-B2B-Tech-AI` | 200 | Public | Curated-by header, counts, Share, shot grid | `designer-profile/collection-detail-*` |
| 19 | Profile: Liked Shots | `/:username/likes` | `/halolab/likes` | **302 → `/session/new`** | **Auth** | Liked shots (only visible logged in) | `authentication/profile-likes-redirects-to-login.png` |
| 20 | Profile: Members | `/:username/members` | `/halolab/members` | 200 | Public | Team members (teams only) | `designer-profile/profile-members-*` |
| 21 | Profile: About | `/:username/about` | `/halolab/about` | 200 | Public | Biography, location, Pro status, member-since, expertise, languages, skills, counts, contact, members, social links | `designer-profile/profile-halolab-about-*` |
| — | Followers / Following | `/:username/followers`, `/:username/following` | *(link only)* | — | robots-disallowed | Not visited | — |

## C. Hiring (client side)

| # | Page | Route | Example | Status | Access | Purpose | Screenshot |
|---|---|---|---|---|---|---|---|
| 22 | Talent directory | `/hire` (`?search=` supported) | `/hire`, `/hire?search=logo` | 200 | Public / auth-gated actions | Designer/agency cards with filters | `hire/hire-*` |
| 23 | Designer search redirect | `/designers?search=` | `/designers?search=logo` | **→ `/hire?search=logo`** | Public | The header "Designers" search type lands on the hire directory | `search/designers-search-*` |
| 24 | Specialty landing | `/hire/:specialty` | `/hire/app-designers` (~100+ in sitemap) | 200 | Public | SEO landing: directory + long-form guide + FAQ | `hire/hire-app-designers-*` |
| 25 | Design agencies | `/design-agency` | same | 200 | Public | Agency directory + FAQ | `hire/design-agency-*` |
| 26 | Agency SEO landing | `/ux-ui-design-agency`, `/web-design-company` *(link)* | `/ux-ui-design-agency` | 200 | Public | Agency SEO page (also where the legacy `/signup/new` redirects) | `hire/signup-new-redirect-*` |
| 27 | Services marketplace | `/services` | same | 200 | Public | Service cards with filters | `services/services-*` |
| 28 | Services search | `/services/search/:slug` | `/services/search/logo-design` | 200 | Public | "Results for logo design" | `services/services-search-logo-*` |
| 29 | Service detail | `/services/:id-:slug` | `/services/12641-Custom-Vector-illustrations-Scene` | 200 | Public / auth-gated actions | Description, price, revisions, duration, Hire Now / Request Service, seller card | `services/service-detail-*` |
| 30 | Project brief wizard | `/instantmatch` | same | 200 | Public (later steps likely auth) | "Generate Brief" (AI) / "I'll write it myself" → step: "What kind of design work do you need?" (12 types) | `project-briefs/instantmatch-*` |
| 31 | Post a job | `/jobs/new` | same | 200 | Public form; submission UNVERIFIED | 4-step wizard (step 1: title, rich-text description, location, workplace type, specialty, employment type, apply URL, company name, website, logo) | `jobs/jobs-new-*` |
| 32 | Hiring pricing | `/hiring` | same | 200 | Public | Framer page: Free / $150/mo / $300/mo job plans | `marketing/hiring-*` |

## D. Get hired (designer side)

| # | Page | Route | Status | Access | Purpose | Screenshot |
|---|---|---|---|---|---|---|
| 33 | Project briefs board | `/browse-project-briefs` | 200 | Public / **Pro-gated content** | Stats (1,000+ briefs, $2.5M+ value, last 30 days), "Unlock Project Briefs with Pro", filters: Category, Project scope, Budget, Timeline, Client type | `project-briefs/browse-project-briefs-*` |
| 34 | Outbound proposals | `/proposals` | 200 | Public marketing | Explains sending proposals to any client | `project-briefs/proposals-*` |
| 35 | Job board | `/jobs` | 200 | Public | Job list + "Job Board / Designer Search" tabs + filters | `jobs/jobs-*` |
| 36 | Job detail | `/jobs/:id-:slug` | 200 | Public | Description, share (Facebook/X/Copy), company card, Apply, job type, location, posted date, related directory links | `jobs/job-detail-*` |
| 37 | Job directory | `/:specialty-jobs-in-:place` | 200 | Public | SEO job lists, e.g. `/design-jobs-in-germany` | `jobs/job-directory-*` |
| 38 | Jobs directory index | `/directories/jobs` | 200 | Public | Browse by letter, country, city, specialty | `jobs/directories-jobs-*` |
| 39 | Pro plans | `/pro` | 200 | Public | Framer page; Lite/Standard/Plus, monthly/annual toggle | `marketing/pro-*` |
| 40 | Designer advertising | `/designer-advertising` | 200 | Public | Framer page | `marketing/designer-advertising-*` |
| 41 | Upload a shot | `/uploads/new` | **→ `/session/new`** | **Auth** | Shot uploader (not inspectable) | `authentication/uploads-new-redirects-to-login.png` |

## E. Community and content

| # | Page | Route | Status | Purpose | Screenshot |
|---|---|---|---|---|---|
| 42 | Blog index | `/stories` | 200 | "Courtside: The Dribbble Blog" article list | `community/stories-*` |
| 43 | Blog post | `/stories/:yyyy/:mm/:dd/:slug` | 200 | Article + "More in this category" | `community/story-post-*` |
| 44 | Resources | `/resources` | 200 | Guides grouped Agencies / Career / Education / Freelance / Tips | `community/resources-*` |
| 45 | Resource article | `/resources/agencies/:slug` *(sitemap)* | — | Agency roundups | — |

## F. Authentication

| # | Page | Route | Status | Purpose | Screenshot |
|---|---|---|---|---|---|
| 46 | Sign in | `/session/new` | 200 | Split screen: form left, artwork right (credited `@username`). Google button + "Enter email or username" + Continue. Form action `/session/send_email_otp` | `authentication/login-*` |
| 47 | Sign up | `/signup`, `/signups/new` | 200 | "Welcome to Dribbble". Google + email → `/signups/send_email_otp`. Also served as a modal partial with `?intent=…&return_to=…` | `authentication/signup-page-*` |
| 48 | Password reset | `/password_resets/new` | 200 | "Forgot Password?" email form | `authentication/password-reset.png` |
| — | Legacy signup | `/signup/new` | **→ `/ux-ui-design-agency`** | Redirect observed (likely a stale or SEO redirect) | — |

## G. Marketing and legal

| # | Page | Route | Status | Notes |
|---|---|---|---|---|
| 49 | For designers | `/for-designers` | 200 | Framer page |
| 50 | Brand advertising | `/advertise` | 200 | Framer page |
| 51 | About | `/about` | 200 | Framer page |
| — | Contact, Terms, Privacy, Cookies | `/contact`, `/terms`, `/privacy`, `/cookie-policy` | *(footer links)* | Not visited (static legal) |

## H. System pages

| # | Page | Route | Status | Notes |
|---|---|---|---|---|
| 52 | 404 | any unknown path | **404** | Custom page: "Whoops, that page is gone.", the digits "404" drawn from shot thumbnails matching a random colour (`/colors/for_404.json?hex=`), a hue slider, and a search box. **No global nav.** |
| — | WAF challenge | any | **202** | AWS WAF JavaScript challenge interstitial before the first real page load |

---

## Summary counts

- **Distinct route patterns documented:** 52 (rows 1–52). **50 were visited and verified** in this session; rows 5 (`/shots/recent/:category`) and 45 (`/resources/agencies/:slug`) come from the sitemap only.
- **Additional routes known from sitemap or links but not visited:** ~10 (`/shots/recent/:category`, `/resources/agencies/:slug`, `/:username/followers`, `/:username/following`, `/contact`, `/terms`, `/privacy`, `/cookie-policy`, `/web-design-company`, `/shots/filters`)
- **Auth-gated routes confirmed by redirect:** `/:username/likes`, `/uploads/new`

## Sitemap families (from `/sitemap.xml`) [OBSERVED]

`landing_pages` (`/hire/*`), `search` (×8 files of `/search/*`), `products` (`/pro`, `/hiring`, `/advertise`), `categories` (`/shots/{popular,recent}/:cat`), `designers`, `design_teams`, `blog`, `graphic_design_jobs`, `job_directories`, `design_resources`, `services`, `images` (×6). This shows a heavy **programmatic-SEO** strategy: pre-generated search, hire and job-directory pages.

## Routes disallowed by robots.txt (not crawled)

`/*/buckets`, `/*/followers`, `/*/following`, `/*/tags`, `/autocompletes/*`, `/shots/*/comments`, `/shots/*/fans`, `/shots/*/rebounds`, `/shots/*/buckets`, `/shots/new`, `/messages`, `/account`, `/sessions/new`, `/uploads/*`, `/jobs/*/apply_now`, `/talent/matches/*`, `/recommendations/*`, `/comments/*/likes`, and others. See [10-unknowns-and-limitations.md](10-unknowns-and-limitations.md).
