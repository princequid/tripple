/**
 * BR-14: `returnTo` is accepted only as a same-origin relative path. Anything else becomes "/".
 */
const LOOP_PREFIXES = ['/login', '/signup', '/onboarding', '/api/auth'];

export function safeReturnTo(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return '/';
  let v: string;
  try {
    v = decodeURIComponent(raw);
  } catch {
    return '/';
  }
  if (v.length > 512) return '/';
  if (!v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return '/';
  if (v.includes('\\') || /[\u0000-\u001f\u007f]/.test(v)) return '/';
  if (/^\/[^/]*:/.test(v) && /^[a-z][a-z0-9+.-]*:/i.test(v.slice(1))) return '/';
  const pathOnly = v.split(/[?#]/)[0] ?? '/';
  if (LOOP_PREFIXES.some((p) => pathOnly === p || pathOnly.startsWith(`${p}/`))) return '/';
  return v;
}

/** BR-15: auth-gate intents by release. Unknown intents are ignored. */
export const INTENTS = ['like-shot', 'save-shot', 'follow-user', 'comment-shot', 'post-job', 'message-user'] as const;
export type Intent = (typeof INTENTS)[number];

export function parseIntent(raw: string | null | undefined): Intent | null {
  return (INTENTS as readonly string[]).includes(raw ?? '') ? (raw as Intent) : null;
}
