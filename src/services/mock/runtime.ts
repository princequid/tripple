/**
 * Mock runtime: simulated latency, forced states for testing, and the mock viewer.
 * `?__state=empty` makes list reads return no items; `?__state=error` makes every read fail (500 INTERNAL).
 * Mutations are not affected by `__state`, so forms can still be exercised.
 */
import type { ApiResult } from '@/lib/api-client';

export type MockViewer = { username: string; displayName: string; avatarKey: string | null; role: 'member' | 'moderator' | 'admin' } | null;

let viewer: MockViewer = null;
export const setMockViewer = (v: MockViewer) => {
  viewer = v;
};
export const mockViewer = () => viewer;

const scenario = (): 'empty' | 'error' | null => {
  if (typeof window === 'undefined') return null;
  const s = new URLSearchParams(window.location.search).get('__state');
  return s === 'empty' || s === 'error' ? s : null;
};
export const forcedEmpty = () => scenario() === 'empty';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => 180 + Math.floor(Math.random() * 220);

export function ok<T>(data: T, page?: { nextCursor: string | null; limit: number }): ApiResult<T> {
  return { ok: true, status: 200, data, page };
}
export function fail<T>(status: number, code: string, message: string, fields?: Record<string, string>): ApiResult<T> {
  return { ok: false, status, code, message, fields };
}

/** Wraps a read: latency, then the forced error state, then the handler. */
export async function read<T>(fn: () => ApiResult<T> | Promise<ApiResult<T>>): Promise<ApiResult<T>> {
  await wait(latency());
  if (scenario() === 'error') return fail(500, 'INTERNAL', 'Something went wrong on our side.');
  return fn();
}

/** Wraps a mutation: latency, then a sign-in check unless `anonymous`. */
export async function write<T>(fn: (me: NonNullable<MockViewer>) => ApiResult<T> | Promise<ApiResult<T>>, opts: { anonymous?: boolean } = {}): Promise<ApiResult<T>> {
  await wait(latency());
  if (!viewer && !opts.anonymous) return fail(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  return fn(viewer as NonNullable<MockViewer>);
}

/** Cursor pagination over an in-memory array (opaque numeric offset). */
export function paginate<T>(items: T[], cursor: string | null | undefined, limit: number) {
  const start = cursor ? Number(atob(cursor)) || 0 : 0;
  const slice = forcedEmpty() ? [] : items.slice(start, start + limit);
  const next = start + limit < items.length && !forcedEmpty() ? btoa(String(start + limit)) : null;
  return ok({ items: slice, nextCursor: next }, { nextCursor: next, limit });
}
