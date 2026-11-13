import 'server-only';
import { sql, type SQL } from 'drizzle-orm';

/**
 * BR-37 eligibility as a raw-SQL fragment for repositories that page by their own key (collection items by
 * save time, likes by like time). Expects `shots s` joined with `SHOT_OWNER_JOINS` (author `a`, team `t`).
 * The Drizzle twin is `shots/repository.eligible()`; search keeps its own copy (ADR-001). Change all three
 * together; tests/integration/collections.test.ts and feed-search.test.ts cover them.
 */
export const SHOT_OWNER_JOINS = sql`JOIN profiles a ON a.id = s.author_id LEFT JOIN profiles t ON t.id = s.team_id`;

export const eligibleShotSql = (now: number): SQL => sql`
  s.status = 'published' AND s.published_at <= ${now} AND s.hidden_at IS NULL AND s.deleted_at IS NULL
  AND a.suspended_at IS NULL AND a.deleted_at IS NULL
  AND (s.team_id IS NULL OR (t.suspended_at IS NULL AND t.deleted_at IS NULL))`;
