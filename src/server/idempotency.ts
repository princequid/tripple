import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from './db/client';

/**
 * Idempotent creates (API_RESPONSE_CONVENTIONS §5): a client may send `Idempotency-Key: <uuid>` on a create
 * (shot, job, comment, collection, team, report). The first successful result for (actor, scope, key) is
 * stored for 24 h; a repeat returns that same result instead of creating a second row. Infrastructure table
 * `idempotency_keys`, like `app_rate_limits`. Without a key the create simply runs.
 *
 * Concurrency: two identical requests racing both miss the lookup; the second insert of the stored result
 * hits the primary key and is ignored, so at worst both run. Every create we guard also has a natural guard
 * (unique indexes, quotas), so this is accepted (documented in API_SPECIFICATION §1.4).
 */
const TTL_MS = 24 * 3_600_000;
const keySchema = z.string().uuid();

export function idempotencyKeyFrom(req: Request): string | null {
  const raw = req.headers.get('idempotency-key');
  if (!raw) return null;
  const parsed = keySchema.safeParse(raw.trim());
  return parsed.success ? parsed.data.toLowerCase() : null;
}

export async function withIdempotency<T>(
  actorProfileId: number,
  scope: string,
  key: string | null,
  fn: () => Promise<T>,
  now = Date.now(),
): Promise<{ result: T; replayed: boolean }> {
  if (!key) return { result: await fn(), replayed: false };
  const db = await getDb();
  const [hit] = await db.all<{ result: string | null }>(
    sql`SELECT result FROM idempotency_keys WHERE actor_profile_id = ${actorProfileId} AND scope = ${scope} AND key = ${key} AND expires_at > ${now}`,
  );
  if (hit) return { result: JSON.parse(hit.result ?? 'null') as T, replayed: true };
  const result = await fn();
  await db.run(sql`INSERT INTO idempotency_keys (actor_profile_id, scope, key, status, result, expires_at)
    VALUES (${actorProfileId}, ${scope}, ${key}, 201, ${JSON.stringify(result)}, ${now + TTL_MS})
    ON CONFLICT DO UPDATE SET result = excluded.result, status = excluded.status, expires_at = excluded.expires_at
    WHERE idempotency_keys.expires_at <= ${now}`);
  return { result, replayed: false };
}

/** BR-79-style retention: expired keys are removed by the daily cleanup. */
export async function purgeExpiredKeys(now = Date.now()): Promise<number> {
  const db = await getDb();
  const res = await db.run(sql`DELETE FROM idempotency_keys WHERE expires_at <= ${now}`);
  return res.rowsAffected;
}
