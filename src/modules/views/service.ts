import 'server-only';
import { createHmac } from 'node:crypto';
import { AppError } from '@/server/errors';
import { check } from '@/server/rate-limit';
import { log } from '@/server/log';
import type { Viewer } from '@/modules/auth/types';
import * as shots from '@/modules/shots/service';
import * as repo from './repository';

/**
 * View counting (BR-29…BR-31). Called from the client beacon endpoint after hydration; the endpoint runs
 * `recordSafely` inside `after()` so it never blocks a response. Failures are dropped and logged without
 * personal data.
 */
const BOT_UA = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python-requests|httpclient|headless|lighthouse|monitor|scan/i;

export const isBotUserAgent = (ua: string | null | undefined) => !ua || BOT_UA.test(ua);

export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);

/** BR-30: user ID when signed in; otherwise HMAC(ip, ua) under a secret that rotates daily. No cookie, no raw IP. */
export function viewerKey(viewer: Viewer, ip: string, ua: string, day: string): string {
  if (viewer.kind !== 'visitor') return `u:${viewer.userId}`;
  const base = process.env.VIEW_HMAC_SECRET;
  if (!base) throw new Error('VIEW_HMAC_SECRET is not configured');
  const daily = createHmac('sha256', base).update(day).digest();
  return `a:${createHmac('sha256', daily).update(`${ip}\n${ua}`).digest('base64url')}`;
}

export type ViewOutcome = 'counted' | 'duplicate' | 'ignored';

export async function record(input: {
  shotId: number;
  viewer: Viewer;
  ip: string;
  ua: string | null;
  now?: number;
}): Promise<ViewOutcome> {
  const now = input.now ?? Date.now();
  if (isBotUserAgent(input.ua)) return 'ignored';
  const day = utcDay(now);
  const key = viewerKey(input.viewer, input.ip, input.ua ?? '', day);
  const rl = await check('RL-VIEW', key, now);
  if (!rl.ok) return 'ignored';
  let shot: { id: number; authorId: number };
  try {
    shot = await shots.requireEligible(input.shotId);
  } catch (e) {
    if (e instanceof AppError && e.code === 'NOT_FOUND') return 'ignored';
    throw e;
  }
  // BR-29: author views are not counted. Suspended accounts resolve to visitors in auth.getViewer.
  if (input.viewer.kind === 'member' && input.viewer.profileId === shot.authorId) return 'ignored';
  return (await repo.record(key, shot.id, day, now)) ? 'counted' : 'duplicate';
}

/** Wrapper for `after()`: never throws. */
export async function recordSafely(input: Parameters<typeof record>[0]): Promise<void> {
  try {
    await record(input);
  } catch (e) {
    log.warn('views.record_failed', { shotId: input.shotId, error: e instanceof Error ? e.name : 'unknown' });
  }
}

export const purgeDedup = (now = Date.now()) => repo.purgeDedup(now - 48 * 3_600_000);
export const reconcile = () => repo.reconcile();
