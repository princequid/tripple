import { NextResponse, type NextRequest } from 'next/server';

/**
 * Request proxy (Next 16 name for middleware; FRONTEND_ARCHITECTURE §2). Cheap, no I/O:
 * - `x-request-id` for log correlation (API_RESPONSE_CONVENTIONS §7);
 * - `x-pathname` so layouts can build `returnTo` for the onboarding redirect (BR-16);
 * - baseline security headers (SECURITY_ARCHITECTURE §7). The per-request nonce CSP (ADR-006) is not enabled
 *   yet; see BACKEND_PROGRESS_REPORT "Deferred".
 */
export function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  const requestId = headers.get('x-request-id') ?? crypto.randomUUID();
  headers.set('x-request-id', requestId);
  headers.set('x-pathname', req.nextUrl.pathname + req.nextUrl.search);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('x-request-id', requestId);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|seed-media|favicon.ico).*)'],
};
