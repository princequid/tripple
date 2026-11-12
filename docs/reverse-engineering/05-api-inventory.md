# 05 — API Inventory (observed)

**Scope:** first-party (`dribbble.com`) XHR/fetch requests captured while browsing logged out, plus form actions found in the DOM. Third-party traffic (Google Analytics, Ads, CookieYes, BuySellAds, AWS WAF, Google Identity, reCAPTCHA, Stripe) is listed separately in §6.

> **Key architectural finding [OBSERVED]:** Dribbble does **not** expose a JSON REST API for its UI. Pages are server-rendered by what appears to be Rails. "API" calls are mostly **HTML partials** (sometimes wrapped as `{"results":"<html>"}`) used for infinite scroll and lazy sections, plus a few small JSON endpoints and fire-and-forget telemetry. The clone does **not** need to copy this pattern. [07-technology-recommendation.md](07-technology-recommendation.md) proposes a clean JSON REST API instead.
>
> Nothing below is an invented endpoint. Every row was captured. Fields are listed only as observed.

---

## 1. Endpoint table

| # | Feature | Method | Endpoint | Request (observed params / body) | Response (observed) | Status |
|---|---|---|---|---|---|---|
| 1 | Explore feed pagination | GET | `/shots/popular` | `page`, `per_page` (24–27), filters echoed (`color`, `timeframe`, `tag`); headers `X-Requested-With: XMLHttpRequest`, `X-CSRF-Token` | `text/html`: `<li class="shot-thumbnail">…` fragments | 200 |
| 2 | Homepage feed pagination | GET | `/shots/popular` | `page`, `perPage=24`, `served_shot_ids[]` (already-shown IDs, for de-dup); header **`x-drb-component: drb-infinite-scroll`** | `application/json`: `{"results": "<div class=\"shot2-item\">…"}` | 200 |
| 3 | Category feed pagination | GET | `/shots/popular/:category` | `page`, `per_page=24` | HTML fragment | 200 |
| 4 | Recent feed pagination | GET | `/shots/recent` | `page`, `per_page=24` | HTML fragment | 200 |
| 5 | Playoffs list pagination | GET | `/shots` | `list=playoffs`, `page`, `per_page=5` | HTML `<li class="scrolling-row playoff">` | 200 |
| 6 | Playoff response shots | GET | `/client_app/playoff_shots` | `playoff_ids[]` (×5), `per_page=7`; `Accept: application/json` | JSON array: `[{playoff_id, shots:[{id, user_id, animated, description, ga:[[name, id]], img, …}]}]` | 200 |
| 7 | Boosted (sponsored) shots | GET | `/screenshot_boost` | `render_in_list=true`, `original_params` (JSON of the current route, e.g. `{"popular":true,"controller":"filters","action":"index","color":"ee66aa"}`), `request_source` ("Popular Feed"), `number_of_boosts` (2–3), `current_page` | 200: `{"data":[{"viewData":"<li …data-boost-id=…>"}]}`; 404: `{"errors":["No relevant boosted shot found"]}` | 200 / 404 |
| 8 | View tracking | POST | `/shots/log_views` | `application/x-www-form-urlencoded` **or** JSON: `ids[]=…` / `{"ids":["27883811",…]}` (batched IDs that entered the viewport); `X-CSRF-Token` | empty body | 200 |
| 9 | Product analytics events | POST | `/client_app/events` | JSON `{"event":{"name":"<EventName>","payload":{page_url, anonymous_id, user_id, ab_tests:{…}, …event-specific}}}`. Names seen: `CTAClicked`, `BriefFloatingPromoDisplayed`, `AdRequested`, `ProjectBriefFlowLanded` | empty | 201 |
| 10 | Search / impression analytics | POST | `/client_app/search_results` | JSON `{"events":[{uuid, target:"<id>", target_type:"Screenshot" \| "User", name:"ShotSeen" \| "DesignerSeen", ab_tests}]}` | empty | 204 |
| 11 | Shot: "More by" section | GET | `/shots/:id/more_by` | — | HTML fragment of shot thumbnails | 200 |
| 12 | Shot: similar shots | GET | `/shots/:id/similar` | — | HTML fragment (`data-request-source="Similar Work"`) | 200 |
| 13 | Auth-gate modal | GET | `/signups/new` | `intent` (`like-shot`, `request-service`, …), `return_to` (absolute URL) | HTML fragment `<div data-screen="auth-signup">…` | 200 |
| 14 | Profile shots pagination | GET | `/:username` | `page`, `per_page=24` | HTML fragment | 200 |
| 15 | Profile collections pagination | GET | `/:username/collections` | `page`, `perPage=6`; `x-drb-component: drb-infinite-scroll` | JSON `{"results":"<li class=\"shots-group-item\">…"}`; 404 when exhausted | 200 / 404 |
| 16 | Profile reviews pagination | GET | `/:username/reviews` | `page`, `perPage=10` | JSON `{"results":" "}` with **404** when no more pages | 404 (end) |
| 17 | Hire directory pagination | GET | `/hire` | `page`, `perPage=10`, `additional_count` (offset correction for injected promoted cards) | JSON `{"results":"<div data-resume-user-card …>"}` | 200 |
| 18 | Services pagination | GET | `/services` | `page`, `perPage=24`, `additional_count` | JSON `{"results":"<article class=\"service-result\" …>"}` | 200 |
| 19 | Services search pagination | GET | `/services/search/:slug` | `page`, `perPage=24`, `additional_count` | JSON `{"results": html}` | 200 |
| 20 | Current-user bootstrap | GET | `/client_app/users` | — | JSON `{"data":{"isLoggedIn":false,"countryCode":"<ISO-3166 alpha-2 of visitor>"},"meta":{}}` (value redacted; geo-IP based) | 200 |
| 21 | Framer-page nav injection | GET | `/client_app/framer_navigation` | `X-Requested-With` | HTML (site nav markup + font preloads) | 200 |
| 22 | Framer-page footer injection | GET | `/client_app/framer_footer` | `X-Requested-With` | HTML footer | 200 |
| 23 | 404 colour mosaic | GET | `/colors/for_404.json` | `hex` (e.g. `0094ff`) | JSON `{"shots":[{"img":"…?resize=400x300","url":"/shots/…"}]}` | 200 |

### 1.1 Form actions found in the DOM (not submitted)

| # | Feature | Method | Action | Fields (observed) | Status |
|---|---|---|---|---|---|
| F1 | Sign-in: send OTP | GET in markup; **JS-intercepted** (real method UNKNOWN) | `/session/send_email_otp` | `login` (email or username, required), `g-recaptcha-response` | NOT SUBMITTED |
| F2 | Sign-up: send OTP | same | `/signups/send_email_otp` | `email` (type=email, required), `g-recaptcha-response` | NOT SUBMITTED |
| F3 | Shot filters | GET | `/shots/popular` | `tag`, `color` (hex, max 7), `timeframe` (`''`/`week`/`month`/`year`/`ever`) | 200 (navigated) |
| F4 | Job filters | GET | `/jobs` | `keyword`, `specialty_ids[]` (1–9), `location`, `anywhere=true`, `fulltime`, `freelance_or_contract` | Form observed |
| F5 | Hire filters | GET (inferred) | `/hire` | `categories` (checkboxes), `location`, `minimum_rating` (radio), `available_for_work`, `pro_only`, `responds_quickly`, `agencies_only`, `search`; budget fields UNKNOWN | Form observed |
| F6 | Password reset | UNKNOWN | UNKNOWN (on `/password_resets/new`) | email | NOT SUBMITTED |

### 1.2 Endpoints referenced but not inspected (UNKNOWN)

| Feature | Evidence | Why not inspected |
|---|---|---|
| Like / unlike a shot | `<drb-shot-like>`, `aria-label="Like shot"` | Requires auth |
| Save to collection ("bucket") | `.bucket-shot`, robots `/shots/*/buckets` | Auth + robots |
| Follow / unfollow | "Follow Following Blocked" markup | Auth |
| Comments list / create | `.comments-action`, robots `/shots/*/comments` | robots-disallowed |
| Messaging | `data-message-dialog-button`, robots `/messages` | Auth + robots |
| Search autocomplete | Algolia Autocomplete UI, robots `/autocompletes/*` | robots-disallowed |
| Shot upload | `/uploads/new` → login; `reboundPath` `/uploads/new?rebound=…` | Auth |
| Colour palette download | robots `/shots/*/colors.aco` | robots-disallowed |
| Job apply | robots `/jobs/*/apply_now` | robots-disallowed |
| Service checkout, brief creation, proposals, Pro checkout | Stripe.js loaded | Auth + payment |

---

## 2. Authentication and session [OBSERVED]

| Item | Value |
|---|---|
| Session cookie | `_dribbble_session` (HttpOnly, Secure, SameSite=Lax) |
| CSRF | `<meta name="csrf-param">` + `<meta name="csrf-token">`; sent as the **`X-CSRF-Token`** header on POST and some GET XHRs |
| Anonymous identity | `anonymous_id` cookie (UUID), echoed in event payloads |
| Bot protection | AWS WAF JS challenge (`x-amzn-waf-action: challenge`, HTTP **202** first response), `aws-waf-token` cookie; invisible reCAPTCHA v2 on auth forms |
| Social login | Google Identity Services (button + One Tap; `g_state` cookie) |
| Auth gating pattern | Gated UI elements carry `data-signup-trigger="true"` + `data-href="/signups/new"` + `data-context`; protected pages redirect (302) to `/session/new` |
| A/B testing | Flags rendered server-side as `<drb-ab-test name value>` and echoed in analytics, e.g. `opensearch_search_result_metadata`, `new_search_infinite`, `logged_out_message_flow`, `collections_v2`, `dribbble_studio`, `collaborators`, `case_studies_link_block`, `expanded_categories`, `toggle_ad_shot_feed_*` |

## 3. Pagination, filtering and sorting conventions [OBSERVED]

- **Page-number pagination** (`page=N`). Parameter naming is inconsistent (`per_page` vs `perPage`).
- **De-duplication:** `served_shot_ids[]` on homepage infinite scroll.
- **Injected-item correction:** `additional_count` when promoted cards occupy slots.
- **End of list:** HTTP 404 with an empty `results`.
- **Sorting:** encoded in the path (`/shots/popular` vs `/shots/recent`); profile sort uses a dropdown (Recent/Popular).
- **Filtering:** query string (`tag`, `color`, `timeframe`, `search`, checkbox arrays).
- **Search:** path-based (`/search/:term`, `/services/search/:slug`) for SEO.

## 4. Caching and headers [OBSERVED]

| Response | Cache-Control | Notes |
|---|---|---|
| WAF challenge | `no-store, max-age=0` | 202 |
| Personalised HTML (shot page, first party) | `max-age=0, private, must-revalidate` | `x-runtime`, `x-request-id` headers |
| Some HTML partials | `public, max-age=300` | CloudFront `Hit from cloudfront` |
| Security headers | `x-frame-options: SAMEORIGIN`, `x-content-type-options: nosniff`, `x-xss-protection`, `x-permitted-cross-domain-policies: none`, `x-download-options: noopen` | |
| CDN | `cdn.dribbble.com` for assets and user uploads, with on-the-fly resize (`?resize=WxH&format=webp&vertical=center`) | |

## 5. Error responses [OBSERVED]

| Case | Response |
|---|---|
| Unknown page | Custom HTML 404 |
| No boosted shot | `404 {"errors":["No relevant boosted shot found"]}` |
| Paginated list exhausted | `404 {"results":" "}` |
| Auth required (page) | `302 → /session/new` |
| Client validation | No request sent; inline messages |

## 6. Third-party calls observed (for awareness only; do not replicate)

AWS WAF token endpoints · Google Analytics 4 (many properties), Google Ads / DoubleClick remarketing · CookieYes consent (`cdn-cookieyes.com`) · BuySellAds / Carbon (`srv.buysellads.com/ads/*.json`) · Google Identity Services (`accounts.google.com/gsi/*`) · reCAPTCHA · Stripe.js v2 · Rakuten tag · Algolia `search-insights`.

---

## 7. Shot data contract (embedded `shotData`, observed on the shot page)

This is the most complete structured data seen. It is useful as a reference for the clone's `GET /api/shots/:id` response. Field names below are Dribbble's. The clone should define its own.

```text
shotId: number                 title: string               postedOn: string ("Nov 12, 2026")
width: number  height: number  shotFormat: "video"|"image"… isAnimated, isAnimatedGif, isVideo, isMultiShot: boolean
likesCount, savesCount, viewsCount, commentsCount, attachmentCount: number
isLiked, isSaved: boolean|null (null when anonymous)
isOwnedByCurrentUser, isPublished, isPublishedByTeam, isCaseStudy, hasDownloads: boolean
canCurrentUserComment, canCurrentUserRebound, commentsDisabled, shotHasRebounds: boolean
reboundPath: string            featureShotUrl: string      shouldDisplayAds: boolean
shareUtms: { source, campaign, content }
shotMediaPreview: { mediaType, shotImageUrl, shotGifUrl, shotVideoUrl }
shotUser: { id, username, name, url, avatarUrl, isTeam, forHire, team: { id, name, url, avatarUrl } }
tags: string[]                 tagUrls: [{ name, url }]
boost: { id, canBoostShot, hasBoostedShots, status, statusReason, clicksCount, impressionsCount, totalImpressions }
contentBlocks: { total, results: [{ id, subjectType:"Screenshot", subjectId, contentType:"image"|"video"|…, position,
                 isCaseStudy, content: { alt, media:[{ id(uuid), type, width, height, fileExtension, … }], mediaId,
                 isFullWidth, shouldVideoLoop, shouldVideoAutoplay }, userUploadsAttributes:[…] }] }
```
