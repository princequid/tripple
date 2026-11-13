import 'server-only';
import { randomUUID } from 'node:crypto';
import { AppError } from './errors';
import { problem } from './http';

/**
 * Route Handler wrapper (API_SPECIFICATION §1, API_RESPONSE_CONVENTIONS §2–3, §7). Every handler gets a request
 * ID, and every thrown error becomes a problem-details response with no internal detail. The ID is echoed in
 * `x-request-id` on success and in the body on errors.
 */
export type RouteCtx<P> = { params: Promise<P> };

export function route<P = Record<string, never>>(
  fn: (req: Request, ctx: { params: P; requestId: string }) => Promise<Response>,
) {
  return async (req: Request, ctx: RouteCtx<P>): Promise<Response> => {
    const requestId = req.headers.get('x-request-id') ?? randomUUID();
    try {
      const res = await fn(req, { params: await ctx.params, requestId });
      res.headers.set('x-request-id', requestId);
      return res;
    } catch (e) {
      return problem(e, requestId);
    }
  };
}

/**
 * CSRF defence for cookie-authenticated mutations (SECURITY_ARCHITECTURE §5). The session cookie is
 * SameSite=Lax (BR-13); on top of that, every state-changing request must carry an Origin (or Referer) from
 * the app's own origin. Missing or foreign → 403 ORIGIN_REJECTED.
 */
export function assertSameOrigin(req: Request): void {
  const allowed = new Set<string>([new URL(req.url).origin]);
  if (process.env.BETTER_AUTH_URL) allowed.add(new URL(process.env.BETTER_AUTH_URL).origin);
  const origin = req.headers.get('origin');
  if (origin) {
    if (!allowed.has(origin)) throw new AppError('ORIGIN_REJECTED', 'Cross-origin request rejected.');
    return;
  }
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      if (allowed.has(new URL(referer).origin)) return;
    } catch {
      /* fall through */
    }
  }
  throw new AppError('ORIGIN_REJECTED', 'Cross-origin request rejected.');
}

/** Parses a JSON body; malformed JSON is a 400 VALIDATION, not a 500. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError('VALIDATION', 'The request body must be JSON.');
  }
}

/** Query string as a plain object (first value wins; unknown keys are ignored by the schemas). */
export const queryOf = (req: Request) => Object.fromEntries(new URL(req.url).searchParams);

/** Numeric path id (shots, collections, comments, jobs…): anything but a positive safe integer is 404. */
export function parseId(raw: string): number {
  if (!/^\d{1,15}$/.test(raw)) throw new AppError('NOT_FOUND');
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) throw new AppError('NOT_FOUND');
  return n;
}
