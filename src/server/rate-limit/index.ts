import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { AppError } from '../errors';

/**
 * Window-counter rate limiter on a Turso table (D-12, ADR-009, BACKEND_ARCHITECTURE §7).
 * One upsert per check; the check happens before any side effect (BR-77).
 * Auth classes (RL-AUTH-*) are enforced by Better Auth's database limiter instead (src/server/auth).
 */
export type LimitClass =
  | 'RL-AUTH-SEND'
  | 'RL-ACCOUNT'
  | 'RL-ACCOUNT-CHECK'
  | 'RL-SOCIAL'
  | 'RL-VIEW'
  | 'RL-MODERATION'
  // R2 classes (BUSINESS_RULES §12.2)
  | 'RL-COMMENT'
  | 'RL-CONTENT'
  | 'RL-UPLOAD'
  | 'RL-REPORT'
  | 'RL-SEARCH-SUGGEST'
  // R2 quotas expressed as windows (BR-66 publish per day, BR-73 job posts per day)
  | 'Q-PUBLISH'
  | 'Q-JOB-POST';

type Window = { windowMs: number; max: number };

// BUSINESS_RULES §12.2 defaults.
export const LIMITS: Record<LimitClass, Window[]> = {
  // Per-email part of RL-AUTH-SEND (BR-05, BR-06); the per-IP part is Better Auth's DB limiter.
  'RL-AUTH-SEND': [
    { windowMs: 60_000, max: 1 },
    { windowMs: 3_600_000, max: 5 },
    { windowMs: 86_400_000, max: 10 },
  ],
  'RL-ACCOUNT': [{ windowMs: 3_600_000, max: 30 }],
  'RL-ACCOUNT-CHECK': [{ windowMs: 60_000, max: 60 }],
  'RL-SOCIAL': [
    { windowMs: 60_000, max: 60 },
    { windowMs: 86_400_000, max: 1_000 },
  ],
  'RL-VIEW': [{ windowMs: 60_000, max: 120 }],
  'RL-MODERATION': [{ windowMs: 3_600_000, max: 300 }],
  'RL-COMMENT': [
    { windowMs: 60_000, max: 10 },
    { windowMs: 86_400_000, max: 200 },
  ],
  'RL-CONTENT': [{ windowMs: 3_600_000, max: 30 }],
  // BR-66: 30 files per hour and 200 per day.
  'RL-UPLOAD': [
    { windowMs: 3_600_000, max: 30 },
    { windowMs: 86_400_000, max: 200 },
  ],
  'RL-REPORT': [{ windowMs: 86_400_000, max: 20 }],
  // FR-35 autocomplete fires while typing; generous per-IP ceiling (anonymous reads have no limiter otherwise).
  'RL-SEARCH-SUGGEST': [{ windowMs: 60_000, max: 120 }],
  'Q-PUBLISH': [{ windowMs: 86_400_000, max: 10 }],
  'Q-JOB-POST': [{ windowMs: 86_400_000, max: 5 }],
};

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

export async function check(cls: LimitClass, subject: string, now = Date.now()): Promise<LimitResult> {
  const db = await getDb();
  let worst: LimitResult = { ok: true };
  for (const w of LIMITS[cls]) {
    // The window starts at the subject's first request (not at a clock boundary), so "1 per 60 s" (BR-05)
    // really means 60 s after the previous accepted request. One atomic upsert per window.
    const key = `${cls}:${subject}:${w.windowMs}`;
    const fresh = now + w.windowMs;
    const rows = await db.all<{ count: number; expires_at: number }>(
      sql`INSERT INTO app_rate_limits (key, count, expires_at) VALUES (${key}, 1, ${fresh})
          ON CONFLICT(key) DO UPDATE SET
            count = CASE WHEN app_rate_limits.expires_at <= ${now} THEN 1 ELSE app_rate_limits.count + 1 END,
            expires_at = CASE WHEN app_rate_limits.expires_at <= ${now} THEN ${fresh} ELSE app_rate_limits.expires_at END
          RETURNING count, expires_at`,
    );
    const count = Number(rows[0]?.count ?? 1);
    const expiresAt = Number(rows[0]?.expires_at ?? fresh);
    if (count > w.max) {
      const retryAfter = Math.max(1, Math.ceil((expiresAt - now) / 1000));
      if (worst.ok || retryAfter > worst.retryAfter) worst = { ok: false, retryAfter };
    }
  }
  return worst;
}

/** Throws AppError RATE_LIMITED (429 + retryAfter) when over the limit. */
export async function limit(cls: LimitClass, subject: string): Promise<void> {
  const r = await check(cls, subject);
  if (!r.ok) throw new AppError('RATE_LIMITED', `Too many requests. Try again in ${r.retryAfter} seconds.`, { retryAfter: r.retryAfter });
}

/**
 * Quota variant (BR-66 publishes per day, BR-73 job posts per day): over the window → 422 QUOTA_EXCEEDED with
 * `retryAfter`, because a quota is a business rule, not abuse protection (API_RESPONSE_CONVENTIONS §3.2).
 */
export async function quota(cls: 'Q-PUBLISH' | 'Q-JOB-POST', subject: string, message: string): Promise<void> {
  const r = await check(cls, subject);
  if (!r.ok) throw new AppError('QUOTA_EXCEEDED', message, { retryAfter: r.retryAfter });
}

/** BR-79: rows are removed 24 h after their window ends. */
export async function purgeExpired(now = Date.now()): Promise<number> {
  const db = await getDb();
  const res = await db.run(sql`DELETE FROM app_rate_limits WHERE expires_at < ${now - 86_400_000}`);
  return res.rowsAffected;
}

/** Tests only: clear every counter. */
export async function resetLimitsForTests(): Promise<void> {
  const db = await getDb();
  await db.run(sql`DELETE FROM app_rate_limits`);
}
