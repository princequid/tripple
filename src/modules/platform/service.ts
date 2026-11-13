import 'server-only';
import { purgeExpired as purgeRateLimits } from '@/server/rate-limit';
import { log } from '@/server/log';
import * as auth from '@/modules/auth/service';
import * as views from '@/modules/views/service';
import * as likes from '@/modules/likes/service';
import * as shots from '@/modules/shots/service';
import * as search from '@/modules/search/service';
import * as follows from '@/modules/follows/service';
import * as collections from '@/modules/collections/service';
import * as comments from '@/modules/comments/service';
import * as users from '@/modules/users/service';
import * as uploads from '@/modules/media/uploads';
import * as composer from '@/modules/composer/service';
import * as account from '@/modules/account/service';
import { purgeExpiredKeys } from '@/server/idempotency';
import * as repo from './repository';

/**
 * Platform jobs (BACKEND_ARCHITECTURE §3.1). Tables owned by other modules are touched only through
 * those modules' services, so the table-ownership rule (§2.2.3) holds.
 */
export async function health(): Promise<{ ok: boolean; db: 'up' | 'down' }> {
  try {
    await repo.ping();
    return { ok: true, db: 'up' };
  } catch {
    return { ok: false, db: 'down' };
  }
}

/** BR-79 retention. Runs from the daily cron. */
export async function cleanup(now = Date.now()) {
  const [authRows, rateLimits, viewKeys, idempotencyKeys, usernameHolds] = await Promise.all([
    auth.purgeExpired(now),
    purgeRateLimits(now),
    views.purgeDedup(now),
    purgeExpiredKeys(now), // API_RESPONSE_CONVENTIONS §5: 24 h
    users.purgeExpiredHolds(), // BR-23: held usernames are released after 30 days
  ]);
  const unattachedUploads = await uploads.purgeUnattached(now); // BR-66: 24 h
  const result = { ...authRows, rateLimits, viewKeys, idempotencyKeys, usernameHolds, unattachedUploads };
  log.info('platform.cleanup', result);
  return result;
}

/** BR-27 nightly reconciliation: recompute every counter from its source rows. Returns rows corrected. */
export async function reconcileCounters() {
  const result = {
    likes: await likes.reconcile(),
    views: await views.reconcile(),
    shotsCount: await shots.reconcileShotsCount(),
    tags: await search.reconcileTagCounts(),
    // R2 counters (BR-27)
    follows: await follows.reconcile(),
    saves: await collections.reconcile(),
    comments: await comments.reconcile(),
  };
  log.info('platform.reconcile', result);
  return result;
}

/** BR-65 / BR-24 purges: soft-deleted shots and accounts older than 30 days, with their stored objects. */
export async function purge(now = Date.now()) {
  const result = {
    shots: await composer.purgeDeleted(now),
    accounts: await account.purgeDeletedAccounts(now, (profileId) => uploads.deleteObjectsOf(profileId)),
  };
  log.info('platform.purge', result);
  return result;
}

/** Daily cron body (Vercel Hobby allows one daily run, D-09): popularity, retention, purges, then counters. */
export async function daily(now = Date.now()) {
  const popularity = await shots.recomputePopularity(now);
  const cleaned = await cleanup(now);
  const purged = await purge(now);
  const reconciled = await reconcileCounters();
  return { popularity, cleaned, purged, reconciled };
}
