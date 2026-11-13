import 'server-only';
import { randomUUID } from 'node:crypto';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { log } from './log';
import { zodFields } from './action-result';

/** Problem-details responses for Route Handlers (API_RESPONSE_CONVENTIONS §3.1, RFC 9457). */
export function problem(e: unknown, requestId: string = randomUUID()): Response {
  let err: AppError;
  if (e instanceof AppError) err = e;
  else if (e instanceof ZodError) err = new AppError('VALIDATION', 'Invalid request.', { fields: zodFields(e) });
  else {
    log.error('route.unhandled', { requestId, err: e instanceof Error ? e.message : String(e) });
    err = new AppError('INTERNAL', 'Something went wrong.');
  }
  const slug = err.code.toLowerCase().replace(/_/g, '-');
  const body = {
    type: `https://trippple.app/problems/${slug}`,
    title: err.code === 'INTERNAL' ? 'Internal error' : err.message,
    status: err.status,
    code: err.code,
    ...(err.details.retryAfter ? { retryAfter: err.details.retryAfter } : {}),
    ...(err.details.fields ? { fields: err.details.fields } : {}),
    requestId,
  };
  const headers: Record<string, string> = {
    'Content-Type': 'application/problem+json',
    'Cache-Control': 'no-store',
    'x-request-id': requestId,
  };
  if (err.details.retryAfter) headers['Retry-After'] = String(err.details.retryAfter);
  return new Response(JSON.stringify(body), { status: err.status, headers });
}

export function json(data: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify({ data }), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...init.headers },
  });
}

/** List envelope (API_RESPONSE_CONVENTIONS §2.1): `{ data: [...], page: { nextCursor, limit } }`. */
export function jsonPage<T>(page: { items: T[]; nextCursor: string | null }, limit: number, extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ data: page.items, page: { nextCursor: page.nextCursor, limit }, ...extra }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const noContent = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

/** Client IP from the trusted proxy header (ADR-003 §3). Never stored raw (BR-30). */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? '0.0.0.0';
}

/** Constant-time bearer check for cron/internal endpoints. */
export function bearerMatches(headers: Headers, secret: string | undefined): boolean {
  if (!secret) return false;
  const got = headers.get('authorization') ?? '';
  const want = `Bearer ${secret}`;
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}
