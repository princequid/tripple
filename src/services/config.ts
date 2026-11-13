/**
 * Data source per feature. `live` = the documented Route Handler (FRONTEND_API_INTEGRATION_REQUIREMENTS);
 * `mock` = the in-browser mock store. R1 features (feeds, shot detail, likes, views, search, tags, profiles, auth,
 * onboarding username) always use the real API and are not listed here.
 *
 * Switching a feature to the backend: implement its endpoints, then add it to NEXT_PUBLIC_API_LIVE
 * (comma-separated, e.g. `follows,collections`) or flip the default below. No component changes are needed.
 */
export const FEATURES = [
  'follows',
  'collections',
  'comments',
  'reports',
  'composer',
  'settings',
  'teams',
  'onboarding',
  'jobs',
  'notifications',
  'messages',
  'blocks',
  'hire',
  'services',
  'search',
] as const;
export type Feature = (typeof FEATURES)[number];

/** Features whose Route Handlers exist in this repository (backend slices delivered 2026-11-13). */
const DEFAULT_LIVE: Feature[] = ['follows', 'collections'];
const env = process.env.NEXT_PUBLIC_API_LIVE;
/** NEXT_PUBLIC_API_LIVE overrides the default list (`none` forces every feature to the mock). */
const LIVE = new Set<string>(env === undefined ? DEFAULT_LIVE : env.split(',').map((s) => s.trim()).filter((s) => s && s !== 'none'));

export const sourceOf = (f: Feature): 'live' | 'mock' => (LIVE.has(f) ? 'live' : 'mock');
export const isMock = (f: Feature) => sourceOf(f) === 'mock';
