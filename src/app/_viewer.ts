import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getViewer } from '@/modules/auth/service';
import { AppError } from '@/server/errors';

/** One session lookup per request, shared by the layout and the page (React `cache`). */
export const currentViewer = cache(async () => getViewer(await headers()));

/** Page-level error mapping (BACKEND_ARCHITECTURE §4.2): NOT_FOUND (and invalid input on a page path) → 404. */
export async function orNotFound<T>(p: Promise<T>): Promise<T> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof AppError && (e.code === 'NOT_FOUND' || e.code === 'INVALID_CURSOR' || e.code === 'VALIDATION')) notFound();
    throw e;
  }
}

/** First value of a search param. */
export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
