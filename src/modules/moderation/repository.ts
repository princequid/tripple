import 'server-only';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db/client';
import { moderationActions } from '@/server/db/schema';

export type TargetType = 'profile' | 'shot' | 'comment' | 'collection' | 'job';

export type AuditInput = {
  actorProfileId: number | null;
  actorLabel: string;
  targetType: TargetType;
  targetId: string;
  action: 'suspend' | 'unsuspend' | 'hide' | 'unhide' | 'grant_role' | 'revoke_role' | 'set_featured' | 'unset_featured' | 'delete_account';
  reason: string;
};

/** Append-only audit log (BR-67, BR-68). There is no update or delete function by design. */
export async function insertAction(a: AuditInput, now: number) {
  const db = await getDb();
  await db.insert(moderationActions).values({ ...a, createdAt: new Date(now) });
}

// ---------- Reports (BR-69, R2). Owned table: reports. ----------

/** One report per (reporter, target): returns false when it already existed (no new row). */
export async function insertReport(r: { reporterId: number; targetType: TargetType; targetId: string; reason: string; note: string | null }, now: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.run(sql`INSERT INTO reports (reporter_id, target_type, target_id, reason, note, status, created_at)
    VALUES (${r.reporterId}, ${r.targetType}, ${r.targetId}, ${r.reason}, ${r.note}, 'open', ${now}) ON CONFLICT DO NOTHING`);
  return res.rowsAffected === 1;
}

export type QueueRow = {
  id: number;
  targetType: TargetType;
  targetId: string;
  reason: string;
  note: string | null;
  createdAt: number;
  status: string;
  reportsCount: number;
  reporterId: number;
  reporterUsername: string;
  reporterName: string;
  reporterAvatar: string | null;
};

/**
 * Moderator queue (BR-69): one row per reported target, represented by its oldest report in the requested
 * status, oldest first; `reportsCount` counts that target's reports in the same status.
 */
export async function queue(status: string, after: (string | number)[] | null, limit: number): Promise<QueueRow[]> {
  const db = await getDb();
  const cur = after && after.length === 2 ? sql`AND (r.created_at, r.id) > (${after[0]}, ${after[1]})` : sql``;
  return db.all<QueueRow>(sql`
    SELECT r.id AS id, r.target_type AS targetType, r.target_id AS targetId, r.reason AS reason, r.note AS note,
           r.created_at AS createdAt, r.status AS status,
           (SELECT COUNT(*) FROM reports x WHERE x.target_type = r.target_type AND x.target_id = r.target_id AND x.status = r.status) AS reportsCount,
           p.id AS reporterId, p.username AS reporterUsername, p.display_name AS reporterName, m.storage_key AS reporterAvatar
    FROM reports r JOIN profiles p ON p.id = r.reporter_id LEFT JOIN media m ON m.id = p.avatar_media_id
    WHERE r.status = ${status}
      AND r.id = (SELECT MIN(y.id) FROM reports y WHERE y.target_type = r.target_type AND y.target_id = r.target_id AND y.status = r.status)
      ${cur}
    ORDER BY r.created_at ASC, r.id ASC LIMIT ${limit}`);
}

export async function findReport(id: number) {
  const db = await getDb();
  const rows = await db.all<{ id: number; targetType: TargetType; targetId: string; status: string }>(sql`
    SELECT id, target_type AS targetType, target_id AS targetId, status FROM reports WHERE id = ${id}`);
  return rows[0] ?? null;
}

/** Resolves every open report on the target at once. */
export async function resolveTarget(targetType: TargetType, targetId: string, status: 'hidden' | 'suspended' | 'dismissed', byId: number, now: number): Promise<number> {
  const db = await getDb();
  const res = await db.run(sql`UPDATE reports SET status = ${status}, resolved_by_id = ${byId}, resolved_at = ${now}
    WHERE target_type = ${targetType} AND target_id = ${targetId} AND status = 'open'`);
  return res.rowsAffected;
}
