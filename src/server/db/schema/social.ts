// Social graph tables. R1: likes. R2: follows, collections, collection items, comments, comment likes.
import { sqliteTable, integer, text, primaryKey, index, uniqueIndex, check, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { ts, bool } from './_helpers';
import { profiles, shots } from './content';

/** One like per member per shot (BR-46); set semantics. Owned by the `likes` module. */
export const likes = sqliteTable(
  'likes',
  {
    profileId: integer('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.profileId, t.shotId] }),
    index('likes_shot_idx').on(t.shotId, t.createdAt),
    // R2 Liked Shots tab (FR-57): a member's likes, newest first.
    index('likes_profile_recent_idx').on(t.profileId, t.createdAt),
  ],
);

/** Follow graph (S-03, BR-56). Set semantics; no self-follow. Owned by the `follows` module. R2. */
export const follows = sqliteTable(
  'follows',
  {
    followerId: integer('follower_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    followeeId: integer('followee_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followeeId] }),
    check('follows_not_self', sql`${t.followerId} <> ${t.followeeId}`),
    index('follows_followee_idx').on(t.followeeId, t.createdAt),
    index('follows_follower_idx').on(t.followerId, t.createdAt),
  ],
);

/**
 * Collections (S-02, BR-53…BR-55; "buckets" renamed, BR-88). Names are unique per owner case-insensitively
 * (`name_key` = lower(trim(name))). Private collections are visible only to their owner (BR-54).
 * Owned by the `collections` module. R2.
 */
export const collections = sqliteTable(
  'collections',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    description: text('description'),
    isPrivate: bool('is_private').notNull().default(false),
    shotsCount: integer('shots_count').notNull().default(0),
    hiddenAt: ts('hidden_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    uniqueIndex('collections_owner_name_uq').on(t.ownerId, t.nameKey),
    index('collections_owner_idx').on(t.ownerId, t.updatedAt),
    check('collections_name_len', sql`length(${t.name}) BETWEEN 1 AND 60`),
    check('collections_desc_len', sql`${t.description} IS NULL OR length(${t.description}) <= 300`),
    check('collections_count_nonneg', sql`${t.shotsCount} >= 0`),
  ],
);

export const collectionItems = sqliteTable(
  'collection_items',
  {
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.shotId] }),
    index('collection_items_shot_idx').on(t.shotId),
    index('collection_items_recent_idx').on(t.collectionId, t.createdAt),
  ],
);

/**
 * Comments (S-04, BR-48…BR-51): one level of replies (`parent_id` always points at a top-level comment).
 * A deleted comment that has replies stays as a "Comment removed" placeholder (`deleted_at` set, body
 * cleared); one without replies is removed. Owned by the `comments` module. R2.
 */
export const comments = sqliteTable(
  'comments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    authorId: integer('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id').references((): AnySQLiteColumn => comments.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    likesCount: integer('likes_count').notNull().default(0),
    editedAt: ts('edited_at'),
    hiddenAt: ts('hidden_at'),
    deletedAt: ts('deleted_at'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [
    index('comments_thread_idx').on(t.shotId, t.parentId, t.createdAt),
    index('comments_author_idx').on(t.authorId),
    check('comments_body_len', sql`${t.deletedAt} IS NOT NULL OR length(${t.body}) BETWEEN 1 AND 2000`),
    check('comments_likes_nonneg', sql`${t.likesCount} >= 0`),
  ],
);

export const commentLikes = sqliteTable(
  'comment_likes',
  {
    profileId: integer('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    commentId: integer('comment_id')
      .notNull()
      .references(() => comments.id, { onDelete: 'cascade' }),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.commentId] }), index('comment_likes_comment_idx').on(t.commentId)],
);
