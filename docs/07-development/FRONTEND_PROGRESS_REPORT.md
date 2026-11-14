# Frontend Progress Report

| Field | Value |
|---|---|
| Phase | P10 Frontend Implementation: demonstration prototype |
| Updated | 2026-11-14 (demo-readiness session) |
| Companions | [FRONTEND_IMPLEMENTATION_PLAN](FRONTEND_IMPLEMENTATION_PLAN.md) · [REVERSE_ENGINEERING_TO_FRONTEND_MAPPING](REVERSE_ENGINEERING_TO_FRONTEND_MAPPING.md) · [FRONTEND_API_INTEGRATION_REQUIREMENTS](FRONTEND_API_INTEGRATION_REQUIREMENTS.md) · [TESTING_PROGRESS](../TESTING_PROGRESS.md) |

## 1. Summary

The prototype covers every R1–R3 screen in [APPLICATION_SITEMAP](../06-ui-ux/APPLICATION_SITEMAP.md) §1–§3. It launches locally with `npm run dev` and needs no external service: no hosted database, email provider or media CDN.

- **Data.** R1/R2 screens read the in-repository Route Handlers backed by the local SQLite file `.data/local.db`. R3 screens (notifications, messages, blocks, hire directory, services) use the in-browser mock store (`src/services/mock/`), which persists to `localStorage`. Both layers use the same people, teams, shots, companies and jobs.
- **Demo content.** Before today, the local database held only R1 seed content (people, teams, shots, likes, views), so the job board, follower lists, collections and comment threads were empty. `npm run db:seed-demo` now adds interconnected R2 content: 86 follows, 14 collections, 150 comments with replies and likes, 11 jobs from 11 companies, and realistic bios. It also recomputes every counter, so the stats on every screen agree.
- **Images.** Every shot still uses generated flat-colour placeholder art, and avatars are initials. **No supplied images have been received yet.** The intake pipeline is built and tested (§4).

## 2. Running the demo

```bash
npm run dev                 # http://localhost:3000
# First time on a fresh machine:
npm run db:reset            # migrate + R1 seed + demo content (destroys local data)
# On an existing database that already has the R1 seed:
npm run db:seed-demo        # adds demo content once (it refuses to run twice)
```

**Sign in (prototype, A-28).** On `/login`, click **Continue with the demo account**, or sign in as `demo@seed.trippple.test` with the password `Trippple2026`. Every seed person uses `<username>@seed.trippple.test` with the same password. **Sign up** on `/signup` with any email and a password of at least 8 characters, then choose a username. After that you can upload at `/uploads/new`. The demo account is a moderator, so `/admin/reports` is also available. (With `PROTOTYPE_PASSWORD_AUTH` off, the production email-code flow returns; `npm run demo:code` prints codes.)

**Suggested demo path:**
1. Home feed and filters.
2. A shot detail page: like it, save it to a collection, comment, share.
3. Designer profile, then their followers and collections.
4. Search for designers.
5. Job board, then post a job.
6. Hire directory and services.
7. Messages and notifications.
8. Upload a new shot (`/uploads/new`).
9. Settings.

**Resetting mock state.** R3 mock changes, such as sent messages and new services, are kept in `localStorage`. Run `window.__tripppleMock.reset()` in the browser console, or clear site data, to start over.

## 3. Work completed this session

| Item | Detail | Files |
|---|---|---|
| Demo content for R2 tables | Follows, collections, comments (with author replies and comment likes) and jobs, plus real bios, skills and languages; counters recomputed. Data only: no service code changed | `scripts/seed-demo.ts`, `npm run db:seed-demo`, appended to `db:reset` |
| Supplied-image intake | Processes supplied images like real uploads: EXIF rotation, sRGB, 4:3 attention crops, full-width variants without enlargement, 7-colour palette. Assigns them to the most popular shots first, or per category or per manifest. Avatars are matched by username | `scripts/apply-images.ts`, `npm run images:apply`, `public/images/*` |
| Mock layer uses the same avatars | The intake writes `src/services/mock/assets.generated.ts`, and the fixtures read it | `src/services/mock/fixtures.ts` |
| Signature loading animation | Tri-fold mark ported from the `/ani.html` study into the Trippple palette: charcoal side blades, crimson "T" and a gold axis rule on a neumorphic plate. The timeline is enter, breathe, converge, then lift (about 2 s). It is pure CSS, so it also completes without JavaScript, and it never blocks input. It shows on the first visit per tab only, and is skipped under automation. Under `prefers-reduced-motion` it does not move and fades out after 0.5 s | `src/components/brand/TrippleMark.tsx`, `src/app/brand.css`, `src/app/layout.tsx` |
| Avatar photo crop | Supplied photos fill the avatar circle with `object-fit: cover`, biased toward faces | `src/app/features.css` |
| Presenter helper | `npm run demo:code` prints the latest sign-in code | `scripts/demo-code.ts` |

**Tried and reverted:** a group-wide `loading.tsx` route loader. A loading boundary makes Next stream the response before `redirect()` and `notFound()` run, which broke the canonical-slug 308 redirect, 404 statuses and the mobile journey (J2, J7, J8 failed). The route loader was removed, and the existing per-screen skeletons (`GridSkeleton`, `ListSkeleton`) remain the loading states.

## 4. Supplied images: how they are used

Put the files in these folders, then run `npm run images:apply`. Add `-- --dry` to preview the assignments first.

| Folder | Used for | Rule |
|---|---|---|
| `public/images/projects/` | Shot artwork (feed cards, shot detail, collections, profile Work tab, services covers) | Assigned to the most popular shots first, so the home feed shows them first |
| `public/images/projects/<category>/` | Artwork for one category: `product-design`, `web-design`, `animation`, `branding`, `illustration`, `mobile`, `typography`, `print` | Assigned to shots of that category. Extra images become the second image on the same shot |
| `public/images/avatars/<username>.jpg` | Profile pictures, for example `mei-tanaka.jpg` or `northfield.png` | Files with other names go to accounts without a picture, in order |
| `public/images/manifest.json` (optional) | Per-file overrides: `{ "projects/x.jpg": { "shot": 12, "title": "Coffee roaster website" } }` | Overrides the shot and title |
| `public/images/banners/`, `categories/`, `general/` | Reserved | **No screen uses these yet.** Confirm their purpose before they are placed |

Originals stay in `public/images/`. The derived variants go to the git-ignored `public/seed-media/`. Assignments are recorded in `.data/image-assignments.json`, so re-runs are stable. `npm run db:reset` restores the generated art.

## 5. Status and open items

| Area | Status |
|---|---|
| All R1–R3 screens (about 60 routes) | Built. Awaiting your review (G4/G6) |
| Supplied images | **Applied (2026-11-14):** 65 images from `image/` organised into `public/images/projects/<category>/` (8 per category filter; the user asked for them to be shared across all filters) with titles in `public/images/manifest.json`; all 64 shots use them, the 65th is a second image. Avatars still use initials (no avatar images supplied) |
| Colour palette | Resolved by the v3 redesign (A-27): navy, slate, pale grey, vibrant red, deep crimson |
| Colour search, video teasers (SCR-59, SCR-61) | Blocked on backend colour search (P09-24) and the video pipeline (D-18). The palette is shown for display only |
| Avatar and company-logo upload UI | Not built. The endpoints exist |
| SEO JSON-LD, analytics client (P10-25) | Not started |
| R3 live wiring | Blocked on the backend R3 slices. Mock in the meantime |
| Tailwind and `next/font` Inter (P10-01) | Deferred (A-21). The system font stack is used |

## 5b. UI redesign v3 (A-27, later on 2026-11-14)

The whole interface moved to the new identity and the reference composition: glass header pill, two-column hero, single filter track, and neumorphic portfolio cards in an aspect-adaptive masonry grid. See CHANGELOG for the full list. Placeholder covers now come in mixed shapes (`npm run db:shape-placeholders`), so the masonry shows tall, square, wide and small cards. Supplied images keep their real proportions automatically.

Not built, because it would invent features absent from the reverse engineering: a "Following" feed filter, and video/motion cards (they need the video pipeline, D-18). Card "category" text is not shown because the card API does not return it. The shot title is shown instead.

## 6. Tests executed (2026-11-14)

| Suite | Result |
|---|---|
| `tsc --noEmit` | Pass |
| Unit tests (`vitest run tests/unit`) | 87/87 pass |
| `next build` | Pass |
| Playwright `frontend.spec.ts` | All pass, on a production build with its own freshly seeded database |
| Playwright `journeys.spec.ts` | 10/10 pass after the `loading.tsx` revert. Before the revert, 5 failed: J2, J3b, J7, and J8 on desktop and mobile |
| Route smoke (`scripts/fe-smoke.ts`), signed in as the demo member | 30 routes × 6 widths (1440, 1280, 1024, 768, 390, 360) = 180 page loads: 0 horizontal overflow, 0 console errors apart from the intentional 404 test page. Screenshots are in `docs/08-testing/frontend/screenshots/` |
| Splash animation | Captured at 0.35 s, 1.0 s, 1.85 s and 2.7 s at 1440 and 390 px. It is skipped on the second navigation, with no console errors |
| Image intake | Run end to end on a throwaway copy of the database with sample JPEGs: covers, palette, avatar and mock-key output verified, then cleaned up. **Not yet run on supplied images** |
