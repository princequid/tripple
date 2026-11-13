/**
 * Usernames (BR-18…BR-21) and the reserved-word list (BUSINESS_RULES §13).
 * tests/unit/reserved-routes.test.ts fails if a top-level app route is missing from RESERVED_USERNAMES.
 */
export const USERNAME_RE = /^(?!\d+$)[a-z0-9](?:[a-z0-9]|[_-](?=[a-z0-9])){1,28}[a-z0-9]$/;

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // R1 routes
  'shots', 'search', 'tags', 'login', 'signup', 'logout', 'onboarding', 'auth', 'api', 'terms', 'privacy', 'cookies', 'about', 'contact',
  // R2 routes
  'uploads', 'settings', 'account', 'jobs', 'collections', 'teams', 'likes', 'followers', 'following', 'admin', 'moderation', 'reports',
  // R3 routes
  'notifications', 'messages', 'hire', 'designers', 'services', 'sitemap', 'sitemaps',
  // Later routes
  'pro', 'hiring', 'advertise', 'challenges', 'rebounds', 'briefs', 'proposals', 'stories', 'blog', 'resources', 'places',
  'directories', 'billing', 'checkout', 'payments', 'orders', 'reviews', 'featured', 'for-designers', 'design-agency',
  // Framework and files
  '_next', 'static', 'assets', 'media', 'images', 'img', 'cdn', 'fonts', 'favicon-ico', 'robots-txt', 'sitemap-xml', 'manifest',
  'health', 'well-known', 'seed-media',
  // Auth and account words
  'signin', 'sign-in', 'sign-up', 'register', 'join', 'verify', 'callback', 'oauth', 'reset', 'password', 'session', 'sessions',
  'me', 'self', 'user', 'users', 'profile', 'dashboard',
  // Generic and impersonation
  'www', 'mail', 'email', 'root', 'system', 'support', 'help', 'security', 'status', 'staff', 'team', 'official', 'moderator',
  'administrator', 'null', 'undefined', 'home', 'index', 'feed', 'explore', 'popular', 'recent', 'new', 'edit', 'delete', 'app',
  'trippple',
]);

export type UsernameProblem = 'invalid' | 'reserved';

export function normaliseUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Returns null when the (already normalised) name is acceptable, else the problem. */
export function checkUsernameShape(name: string): UsernameProblem | null {
  if (!USERNAME_RE.test(name)) return 'invalid';
  if (RESERVED_USERNAMES.has(name) || /-jobs-in-/.test(name)) return 'reserved';
  return null;
}

export const USERNAME_HINT =
  'Use 3–30 lower-case letters, numbers, "_" or "-". Start and end with a letter or number, and do not use only numbers.';

/** BR-21: suggestion base from an email local part (random digits are added by the server if taken). */
export function usernameBaseFromEmail(email: string): string {
  const local = (email.split('@')[0] ?? '').toLowerCase();
  let base = local
    .replace(/[^a-z0-9_-]+/g, '')
    .replace(/[_-]{2,}/g, '-')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 26)
    .replace(/[_-]+$/g, '');
  if (base.length < 3) base = `${base}${'des'}`.slice(0, 3);
  if (/^\d+$/.test(base)) base = `u${base}`.slice(0, 26);
  return base;
}

/** BR-22: display name 1–50 characters after trimming, no control characters. */
export function checkDisplayName(raw: string): string | null {
  const v = raw.trim();
  if (v.length < 1 || v.length > 50) return 'Enter a display name of 1–50 characters.';
  if (/[\u0000-\u001f\u007f]/.test(v)) return 'The display name contains characters that are not allowed.';
  return null;
}
