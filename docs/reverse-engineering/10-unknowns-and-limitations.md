# 10 — Unknowns and Limitations

## 1. How the investigation was conducted (and its limits)

| Constraint | Effect |
|---|---|
| **Claude-in-Chrome extension not connected** | Browsing was done with a **local headless Chromium (Playwright)** instead of an interactive browser. Equivalent for DOM, network and screenshots, but no human-like sessions and no logged-in profile. |
| **Anonymous visitor only** | No account was created and no login was performed (the rules forbid creating accounts or entering credentials). Every logged-in state is **UNVERIFIED**. |
| **robots.txt respected** | Disallowed paths were not requested, including `/shots/*/comments`, `/autocompletes/*`, `/*/followers`, `/*/following`, `/messages`, `/shots/*/colors.aco`, `/jobs/*/apply_now`, `/sessions/new`, `/uploads/*`, `/talent/matches/*`, `/recommendations/*`. |
| **No consequential actions** | No form was submitted that would send email, create content, message someone, or start a payment. Only empty-submit validation was triggered. |
| **AWS WAF** | First page loads return an HTTP **202 JS challenge**. Playwright passed it automatically by executing the page's JS; no CAPTCHA was bypassed. Request volume was kept low (sequential, under 100 page loads in total). |
| **Point-in-time snapshot** | Captured on **2026-11-12**. A/B flags (`new_search_infinite`, `collections_v2`, `expanded_categories`, …) mean other visitors may see different UI. Promo banners and prices change. |
| **Region** | Requests came from one geography. `countryCode` is returned by `/client_app/users`, so pricing and currency may be region-dependent (UNVERIFIED). |

## 2. Features that could not be investigated

| Feature | Why | What is known |
|---|---|---|
| Logged-in header (avatar menu, notifications, upload button) | Auth | Nothing directly. Assume an avatar dropdown, notifications and an upload CTA. |
| Like / save / follow success behaviour and APIs | Auth | Buttons and counters exist; `isLiked` / `isSaved` flags in `shotData`; logged-out → sign-up modal |
| Collections save picker | Auth + robots (`/buckets`) | Collection pages are public; "Save shot" link exists |
| Comments (read and write) | robots-disallowed | `commentsCount`, `canCurrentUserComment`, `commentsDisabled` flags; comment button with count badge |
| Messaging / "Get in touch" | Auth + robots | `data-message-recipient=<userId>` on buttons |
| OTP code entry screen, OTP length and expiry, error copy | Not submitted | Forms post to `/session/send_email_otp` and `/signups/send_email_otp`; `data-screen-transition` implies multi-screen auth |
| Google OAuth callback flow | Not executed | Google Identity Services client present |
| Password-reset submission and its relation to OTP | Not submitted | The page exists, which suggests legacy password accounts |
| Onboarding after sign-up | Auth | — |
| Shot upload/composer (`/uploads/new`) | Auth (302) + robots | Content-block model inferred from `shotData` |
| Rebounds | robots + auth | `reboundPath`, `shotHasRebounds` |
| Header search autocomplete suggestions | robots (`/autocompletes/*`) | Algolia Autocomplete UI present |
| Services checkout, order lifecycle, delivery, disputes | Auth + payment | Stripe.js present; "Hire Now" / "Request Service" → sign-up modal |
| Project brief wizard beyond step 1, AI generation | Would require continuing a real brief | Step 1: 12 design types |
| Brief board contents, proposals | Pro-gated | Filter taxonomy observed |
| Job-post steps 2–4, plan selection, payment | Would require entering company data | Step 1 fields + `/hiring` tier prices |
| Pro checkout, plan entitlements enforcement | Payment | Plan matrix observed on `/pro` |
| Followers / following lists | robots | Counts only |
| Notifications, settings, account deletion | Auth | — |
| Liked Shots tab | Auth (302) | — |
| Team admin (inviting members) | Auth | Members tab is public |
| Email templates | Not triggered | — |
| Rate limits and their thresholds | Not probed (would be abusive) | — |
| Internal search ranking and popularity formula | Server-side | Only outputs visible (popular / recent / timeframe) |

## 3. Behaviour observed but not fully understood

- **`/signup/new` redirects to `/ux-ui-design-agency`.** Possibly an SEO or legacy redirect, or experiment-driven. The real sign-up routes are `/signup` and `/signups/new`.
- **The sign-up modal did not close on Escape** in headless testing. It may be intentional, or a focus issue in headless mode.
- **Two shot-card generations coexist:** `shot2-item` (homepage, `<drb-thumbnail>`) and `li.shot-thumbnail` (explore, profile). They are visually equivalent. The clone should implement one.
- **Inconsistent pagination params** (`per_page` vs `perPage`) and response formats (bare HTML vs `{results: html}`), depending on the `x-drb-component` header.
- **Infinite-scroll end signal** is an HTTP 404 with empty results (seen on reviews). Whether this applies to every list is UNVERIFIED.
- **The announcement banner dismissal** persistence mechanism (cookie vs localStorage) was not determined.
- **The jobs hero serif font** family was not identified.
- **"Discover" pill** on explore: its relation to `/shots/popular` (default) vs a personalised feed for logged-in users is UNVERIFIED.

## 4. Assumptions made in the proposed design

1. Teams are modelled as users with `account_type = team` (supported by `shotUser.isTeam` and profile routes).
2. Comments allow one level of replies (common pattern; not observed).
3. Collections can be private (common pattern; not observed).
4. Popular ranking is a time-decayed engagement score; timeframe filters rank by engagement within the window.
5. Colour search uses perceptual (CIELAB) distance to palette colours.
6. "Apply for this position" links to an external employer URL (the job form requires "Where can people apply?").
7. Pro status affects search ranking and unlocks brief access (stated on `/pro`). Enforcement details are unknown.
8. View counts are deduplicated per visitor/session (implied by batched `log_views`, not proven).

## 5. Recommended follow-up investigation (if permitted)

1. With a **test account the user creates themselves**, observe logged-in flows: the like, save, follow and comment endpoints and payloads, the header avatar menu, notifications, upload composer steps, collection picker and onboarding. (Credentials must be entered by the user, not the agent.)
2. Confirm the OTP UX: code length, expiry, resend cooldown, error messages.
3. Capture the remaining job-post wizard steps up to, but not including, payment.
4. Check whether the Explore "Discover" tab is personalised for logged-in users.
5. Review the help centre (help.dribbble.com) for documented business rules: fees, Pro entitlements, service-order lifecycle, refund policy.
6. Accessibility audit of the original (axe) for parity targets.

## 6. Legal and ethical note

This blueprint documents **observable functionality** to guide an **independent** implementation. Do **not** reuse Dribbble's name, logo, illustrations, user content, screenshots, copy, or proprietary code. The screenshots in `screenshots/` are internal reference material only and must not ship in the product. Use original branding and licence-free seed content.

## 7. Quality checks performed

| Check | Result |
|---|---|
| Documented pages exist | ✔ Each row in doc 01 marked as visited has a recorded HTTP status from this session (200, 302→login, 404, or redirect target). |
| Routes not duplicated | ✔ Each route pattern appears once in doc 01. Aliases (`/signup` and `/signups/new`, `/designers?search=` → `/hire?search=`) are noted in a single row. |
| Screenshots match pages | ✔ Mislabelled captures were renamed (`/signup/new` → `hire/signup-new-redirect-to-ux-ui-design-agency-*`, `/uploads/new` → `authentication/uploads-new-redirects-to-login.png`, `/halolab/likes` → `authentication/profile-likes-redirects-to-login.png`). Three interaction screenshots whose clicks did not fire (save, get-in-touch, follow) were **deleted** rather than mislabelled. |
| Inferred info labelled | ✔ [OBSERVED] / [INFERRED] / UNVERIFIED / UNKNOWN markers are used throughout. Doc 06 is explicitly "PROPOSED". |
| Missing functionality identified | ✔ See §2. |
| DB relationships sane | ✔ FK directions checked. Self-references (follows, replies, rebounds) bounded. Unique constraints prevent duplicate likes, follows and saves. |
| Roadmap follows dependencies | ✔ The flat order was checked against doc 08 dependencies. Three ordering errors were found and corrected (D-08, P-07, P-06). |
| Privacy | ✔ The visitor's geo country code returned by `/client_app/users` is redacted in doc 05. |
