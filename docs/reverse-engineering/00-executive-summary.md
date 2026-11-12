# 00 — Executive Summary

**Target:** https://dribbble.com/
**Investigation date:** 2026-11-12
**Investigation mode:** Logged-out (anonymous) visitor only. Desktop (1440×900) and mobile (390×844, iPhone UA) using a headless Chromium driven by Playwright. Network traffic (XHR/fetch/document) was recorded for every visited page.

> **Evidence labels used throughout these documents**
> - **[OBSERVED]**: seen directly in the rendered UI, DOM, or captured network traffic.
> - **[INFERRED]**: a reasonable conclusion from observed evidence, not directly verified.
> - **[UNVERIFIED]** / **UNKNOWN**: could not be inspected (auth-gated, robots-disallowed, or would require a consequential action).

---

## 1. What Dribbble is

Dribbble is a **design-community portfolio site plus a hiring marketplace**. It has four product pillars, which match the four top-level navigation menus [OBSERVED]:

| Pillar | Purpose | Key routes |
|---|---|---|
| **Explore** (inspiration) | Browse "shots" (design posts: images, videos, multi-media case studies) by popularity, recency, category, tag, colour and timeframe | `/`, `/shots/popular`, `/shots/recent`, `/shots/:id-:slug`, `/search/:term`, `/tags/:tag` |
| **Hire Talent** (client side) | Find designers and agencies, buy pre-packaged services, post a project brief (AI-assisted), post a full-time job | `/hire`, `/hire/:specialty`, `/services`, `/services/:id-:slug`, `/instantmatch`, `/design-agency`, `/jobs/new` |
| **Get Hired** (designer side) | Browse client project briefs (Pro-gated), send outbound proposals, add services, browse full-time jobs, upgrade to Pro, buy ads | `/browse-project-briefs`, `/proposals`, `/jobs`, `/pro`, `/designer-advertising` |
| **Community** | Blog ("Courtside"), Playoffs (design challenges), help centre | `/stories`, `/shots?list=playoffs`, external help centre |

Designer and agency **profiles** (`/:username`) tie the pillars together. Each profile is a portfolio (Work), a storefront (Services), a reputation page (Reviews), curated Collections, Liked Shots, team Members and About.

## 2. Core functionality (observed)

- **Shot feed** with infinite scroll, a category pill bar, a Popular / New & Noteworthy sort, and a filter panel (Tags, Color, Timeframe).
- **Shot cards** with hover overlay (title, Get in touch, Save, Like), designer attribution, PRO/PRO+ badges, like and view counts, and video-teaser-on-hover for animated shots.
- **Shot detail page**: title, author (with team "for X"), Follow, Like, Save, Get in touch, ordered **content blocks** (image/video/text), colour palette, a side action rail (Comments, Share, Details), "More by" and "You might also like" sections, and service-upsell links.
- **Profiles**: header with avatar, Dribbble Select badge, headline, follower/following/like counts, Get in touch, Follow, Save, Schedule; tabs; a "Recent/Popular shots" sort.
- **Talent directory** (`/hire`): rich designer cards, filters (Categories, Budget, Location, Rating, More), and SEO landing variants per specialty.
- **Services marketplace**: service cards with price, duration, "Quick Hire", and filters (category, tags, price, delivery time, designer filters).
- **Project briefs**: an AI-assisted multi-step client brief wizard, and a Pro-gated brief board for designers.
- **Job board**: list, specialty/location/type filters, job detail, and a 4-step job-post wizard (paid tiers $150 / $300 per month shown on `/hiring`).
- **Authentication**: **passwordless email OTP**, plus Google sign-in (button and One Tap) and a legacy password-reset page. Every social action (like, save, follow, message, request service) opens a sign-up modal when logged out.
- **Monetisation**: Pro subscriptions (Lite $4, Standard $8, Plus $99 per month billed yearly), job posts, boosted shots, Carbon/BuySellAds ad slots, and platform fees.

## 3. Major subsystems

1. **Content/Media**: shots, content blocks, uploads (images, video, GIF), CDN image resizing (`?resize=WxH&format=webp`).
2. **Discovery/Search**: feeds, categories, tags, colour search, timeframe ranking, full-text search (Algolia Autocomplete UI in the header; an A/B flag named `opensearch_search_result_metadata` suggests an OpenSearch backend [INFERRED]).
3. **Social graph**: likes, saves (collections), follows, comments, views.
4. **Profiles and teams**: individual users, teams/agencies with members.
5. **Marketplace**: services, project briefs, proposals, reviews/ratings, messaging ("Get in touch").
6. **Jobs**: job posts, specialties, location directories.
7. **Identity**: email OTP, Google OAuth, sessions, CSRF.
8. **Monetisation**: Pro plans, boosts, ads, Stripe (Stripe.js v2 is loaded on shot pages).
9. **Content/CMS**: blog, resources, Framer-built marketing pages, SEO landing pages and sitemaps.
10. **Analytics/Experimentation**: `/client_app/events`, `/client_app/search_results`, `/shots/log_views`, A/B flags rendered as `<drb-ab-test>`.

## 4. Observed technology fingerprint (target site, not a recommendation)

| Signal | Evidence | Conclusion |
|---|---|---|
| `x-runtime`, `x-request-id` headers, `<meta name="csrf-param">`, `_dribbble_session` cookie, Rails-style CSRF token | Response headers / DOM | **Ruby on Rails** monolith, server-rendered HTML [INFERRED, strong] |
| `shrineCacheId` in content-block media | Embedded JSON | **Shrine** (Ruby upload library) [INFERRED] |
| `/assets/vite/assets/*.js`, `data-v-*` attributes, `window.__INITIAL_STATE__ = {componentName, props}` | Script tags / DOM | **Vite** bundling + **Vue** islands hydrated from server props [OBSERVED] |
| `<drb-dropdown>`, `<drb-thumbnail>`, `<drb-infinite-scroll>`, `--sl-*` CSS vars | DOM / CSS | Custom web components, partly **Shoelace**-based [OBSERVED] |
| jQuery, lazysizes (`lazyload`, `data-srcset`), Pristine.js (`data-pristine-*`), Tippy | DOM | Legacy jQuery layer alongside Vue [OBSERVED] |
| `aa-Form`, `--aa-*` variables, `search-insights` script | DOM | **Algolia Autocomplete** UI for header search [OBSERVED] |
| CloudFront headers, `x-amzn-waf-action: challenge`, `aws-waf-token` cookie | Headers / cookies | **AWS CloudFront + AWS WAF** bot challenge (HTTP 202 interstitial) [OBSERVED] |
| reCAPTCHA v2 invisible, Google Identity Services, Stripe.js v2, CookieYes, GTM/GA4 | Script tags | Third-party integrations [OBSERVED] |

## 5. Complexity assessment

| Area | Complexity | Notes |
|---|---|---|
| Explore feed + shot cards | Medium | Infinite scroll, filters, responsive grid, video teasers |
| Shot detail | **High** | Content blocks, media types, palette extraction, modals, related queries |
| Profiles + teams | Medium–High | Many tabs, team/member relations, collections |
| Search | **High** | Full-text, tag, colour similarity, ranking by popularity/timeframe |
| Auth (OTP + Google) | Medium | Email delivery, rate limiting, CAPTCHA |
| Social actions | Medium | Likes/saves/follows/comments with counters |
| Services marketplace + briefs + proposals | **Very high** | Payments, escrow-like flows, reviews, messaging (largely auth-gated, mostly UNVERIFIED) |
| Jobs board | Medium | CRUD, filters, paid tiers |
| Marketing/CMS pages | Low–Medium | Static content |

**Overall:** a large, mature product. A credible functional clone should **scope to an MVP**: Explore, Shot detail, Profiles, Auth, Likes/Saves/Follows/Comments, Search, Collections and Jobs. Defer the services marketplace, briefs, proposals, payments and ads to later phases (see [09-implementation-roadmap.md](09-implementation-roadmap.md)).

## 6. Document index

| File | Contents |
|---|---|
| [01-page-inventory.md](01-page-inventory.md) | All discovered routes, purpose, access |
| [02-frontend-analysis.md](02-frontend-analysis.md) | Layout, typography, colours, spacing, responsive behaviour, states |
| [03-component-inventory.md](03-component-inventory.md) | Reusable components and their relationships |
| [04-user-journeys.md](04-user-journeys.md) | Journeys with Mermaid flowcharts |
| [05-api-inventory.md](05-api-inventory.md) | Observed endpoints, payloads, auth, errors |
| [06-database-design.md](06-database-design.md) | Proposed schema + ER diagram |
| [07-technology-recommendation.md](07-technology-recommendation.md) | Recommended clone stack |
| [08-feature-breakdown.md](08-feature-breakdown.md) | Features by subsystem, dependencies, complexity |
| [09-implementation-roadmap.md](09-implementation-roadmap.md) | Phases, order, testing |
| [10-unknowns-and-limitations.md](10-unknowns-and-limitations.md) | Gaps, assumptions, follow-ups |
| [screenshots/](screenshots/) | 144 visual references by feature |
