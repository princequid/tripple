/**
 * Browser-side caller for our Route Handlers (API_SPECIFICATION §1). Normalises success and problem-details
 * bodies into one result type so components branch on `code` only (API_RESPONSE_CONVENTIONS §1.2).
 */
export type ApiResult<T> =
  | { ok: true; status: number; data: T; page?: { nextCursor: string | null; limit: number } }
  | { ok: false; status: number; code: string; message: string; fields?: Record<string, string>; retryAfter?: number };

export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      credentials: 'same-origin',
    });
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Check your connection and try again.' };
  }
  if (res.status === 204) return { ok: true, status: 204, data: undefined as T };
  const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (res.ok) {
    return { ok: true, status: res.status, data: body?.data as T, page: body?.page as { nextCursor: string | null; limit: number } | undefined };
  }
  return {
    ok: false,
    status: res.status,
    // Our problem details carry `code`; Better Auth errors carry `code` too (API_RESPONSE_CONVENTIONS §8).
    code: String(body?.code ?? (res.status === 429 ? 'RATE_LIMITED' : 'INTERNAL')),
    message: String(body?.title ?? body?.message ?? 'Something went wrong. Try again.'),
    fields: body?.fields as Record<string, string> | undefined,
    retryAfter: Number(body?.retryAfter ?? res.headers.get('Retry-After') ?? res.headers.get('X-Retry-After')) || undefined,
  };
}

/** Login URL that brings the user back (BR-14) and optionally completes an intent (BR-15). */
export function loginHref(returnTo: string, intent?: { name: string; target: string | number }) {
  const p = new URLSearchParams({ returnTo });
  if (intent) {
    p.set('intent', intent.name);
    p.set('target', String(intent.target));
  }
  return `/login?${p.toString()}`;
}
