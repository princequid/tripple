// Views, rate limiting and the moderation audit log (R1).
import { sqliteTable, text, integer, primaryKey, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { ts } from './_helpers';
import { profiles, shots } from './content';

/** Per-viewer, per-shot, per-UTC-day de-duplication keys (BR-30); purged after 48 h (BR-31). Owned by `views`. */
export const viewDedup = sqliteTable(
  'view_dedup',
  {
    viewerKey: text('viewer_key').notNull(),
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.viewerKey, t.shotId, t.day] }), index('view_dedup_created_idx').on(t.createdAt)],
);

/** Daily view aggregate (RE doc 06 `shot_view_daily`). Owned by `views`. */
export const shotViewDaily = sqliteTable(
  'shot_view_daily',
  {
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    views: integer('views').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.shotId, t.day] })],
);

/** Fixed-window counters for non-auth rate-limit classes (D-12, ADR-009). Key = class:subject:windowStart. */
export const appRateLimits = sqliteTable(
  'app_rate_limits',
  {
    key: text('key').primaryKey(),
    count: integer('count').notNull().default(0),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('app_rate_limits_expires_idx').on(t.expiresAt)],
);

/** Append-only moderation audit log (BR-67, BR-68). `actor_profile_id` is null for operator scripts. */
export const moderationActions = sqliteTable(
  'moderation_actions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    actorProfileId: integer('actor_profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    actorLabel: text('actor_label').notNull(),
    targetType: text('target_type', { enum: ['profile', 'shot', 'comment', 'collection', 'job'] }).notNull(),
    targetId: text('target_id').notNull(),
    action: text('action', {
      enum: [
        'suspend',
        'unsuspend',
        'hide',
        'unhide',
        'grant_role',
        'revoke_role',
        'set_featured',
        'unset_featured',
        'delete_account',
      ],
    }).notNull(),
    reason: text('reason').notNull(),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [
    check('moderation_reason_len', sql`length(${t.reason}) >= 10`),
    index('moderation_target_idx').on(t.targetType, t.targetId),
  ],
);

/**
 * Content reports (BR-69, P09-30): one per (reporter, target); queue is oldest first. Owned by `moderation`. R2.
 */
export const reports = sqliteTable(
  'reports',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reporterId: integer('reporter_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['shot', 'comment', 'profile', 'collection', 'job'] }).notNull(),
    targetId: text('target_id').notNull(),
    reason: text('reason', { enum: ['spam', 'harassment', 'ip', 'explicit', 'other'] }).notNull(),
    note: text('note'),
    status: text('status', { enum: ['open', 'hidden', 'suspended', 'dismissed'] })
      .notNull()
      .default('open'),
    resolvedById: integer('resolved_by_id').references(() => profiles.id, { onDelete: 'set null' }),
    resolvedAt: ts('resolved_at'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('reports_reporter_target_uq').on(t.reporterId, t.targetType, t.targetId),
    index('reports_queue_idx').on(t.status, t.createdAt),
    index('reports_target_idx').on(t.targetType, t.targetId),
    check('reports_note_len', sql`${t.note} IS NULL OR length(${t.note}) <= 500`),
  ],
);

/**
 * Idempotency keys for creates (API_RESPONSE_CONVENTIONS §5): the first result for (actor, scope, key) is
 * replayed for 24 h. Owned by `platform`. R2.
 */
export const idempotencyKeys = sqliteTable(
  'idempotency_keys',
  {
    actorProfileId: integer('actor_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    scope: text('scope').notNull(),
    key: text('key').notNull(),
    status: integer('status').notNull(),
    result: text('result', { mode: 'json' }).$type<unknown>(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.actorProfileId, t.scope, t.key] }), index('idempotency_expires_idx').on(t.expiresAt)],
);
