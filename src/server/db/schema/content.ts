// Identity-profile and content tables (RE doc 06 §2.1–2.2, re-expressed for libSQL per A-09).
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  primaryKey,
  check,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { ts, bool } from './_helpers';
import { user } from './auth';

/**
 * An account's public identity. Individuals have a `user_id` (Better Auth); teams have none and act through
 * members (BR-57, RE doc 10 §4.1). A signed-in user with no profile row is a "pending member" (BR-16).
 * Owned by the `users` module.
 */
export const profiles = sqliteTable(
  'profiles',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .unique()
      .references(() => user.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['individual', 'team'] })
      .notNull()
      .default('individual'),
    username: text('username').notNull().unique(),
    displayName: text('display_name').notNull(),
    headline: text('headline'),
    bio: text('bio'),
    location: text('location'),
    websiteUrl: text('website_url'),
    publicEmail: text('public_email'),
    avatarMediaId: text('avatar_media_id').references((): AnySQLiteColumn => media.id, { onDelete: 'set null' }),
    skills: text('skills', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    languages: text('languages', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    role: text('role', { enum: ['member', 'moderator', 'admin'] })
      .notNull()
      .default('member'),
    isFeaturedStudio: bool('is_featured_studio').notNull().default(false),
    shotsCount: integer('shots_count').notNull().default(0),
    likesReceivedCount: integer('likes_received_count').notNull().default(0),
    followersCount: integer('followers_count').notNull().default(0),
    followingCount: integer('following_count').notNull().default(0),
    suspendedAt: ts('suspended_at'),
    deletedAt: ts('deleted_at'),
    /** BR-23: last username change (at most one change per 30 days). R2. */
    usernameChangedAt: ts('username_changed_at'),
    /** FR-18 full onboarding: what the member wants to do ("share work", "hire designers", …). R2. */
    intents: text('intents', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    check(
      'profiles_counters_nonneg',
      sql`${t.shotsCount} >= 0 AND ${t.likesReceivedCount} >= 0 AND ${t.followersCount} >= 0 AND ${t.followingCount} >= 0`,
    ),
    check('profiles_username_lower', sql`${t.username} = lower(${t.username})`),
    check('profiles_team_no_user', sql`${t.kind} = 'individual' OR ${t.userId} IS NULL`),
  ],
);

export const userSocialLinks = sqliteTable(
  'user_social_links',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: integer('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    platform: text('platform', { enum: ['x', 'instagram', 'linkedin', 'github', 'behance', 'website', 'other'] }).notNull(),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
  },
  (t) => [uniqueIndex('social_links_profile_platform_uq').on(t.profileId, t.platform)],
);

/** Team membership (BR-57, BR-58). Read in R1 ("{Author} for {Team}"); managed from R2. */
export const teamMemberships = sqliteTable(
  'team_memberships',
  {
    teamId: integer('team_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    memberId: integer('member_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['owner', 'admin', 'member'] })
      .notNull()
      .default('member'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.memberId] }), index('team_memberships_member_idx').on(t.memberId)],
);

/**
 * Team invitations (BR-58, FR-58): sent to a username, expire after 14 days, accepted or declined in
 * Settings › Teams. At most one pending invitation per (team, invitee). Owned by the `teams` module. R2.
 */
export const teamInvitations = sqliteTable(
  'team_invitations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    teamId: integer('team_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    inviteeId: integer('invitee_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    invitedById: integer('invited_by_id').references(() => profiles.id, { onDelete: 'set null' }),
    role: text('role', { enum: ['admin', 'member'] })
      .notNull()
      .default('member'),
    status: text('status', { enum: ['pending', 'accepted', 'declined', 'revoked'] })
      .notNull()
      .default('pending'),
    expiresAt: ts('expires_at').notNull(),
    respondedAt: ts('responded_at'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('team_invitations_pending_uq').on(t.teamId, t.inviteeId).where(sql`${t.status} = 'pending'`),
    index('team_invitations_invitee_idx').on(t.inviteeId, t.status),
  ],
);

/**
 * BR-23: after a username change the old name is held for the same profile for 30 days; nobody else can claim
 * it until `expires_at`. Owned by the `users` module. R2.
 */
export const usernameHolds = sqliteTable(
  'username_holds',
  {
    username: text('username').primaryKey(),
    profileId: integer('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    expiresAt: ts('expires_at').notNull(),
  },
  (t) => [index('username_holds_expires_idx').on(t.expiresAt)],
);

/** Media objects; binaries live in object storage, never in the DB (A-03). Owned by the `media` module. */
export const media = sqliteTable(
  'media',
  {
    id: text('id').primaryKey(),
    ownerProfileId: integer('owner_profile_id').references((): AnySQLiteColumn => profiles.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['image'] })
      .notNull()
      .default('image'),
    storageKey: text('storage_key').notNull().unique(),
    mimeType: text('mime_type').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    bytes: integer('bytes').notNull(),
    dominantColor: text('dominant_color'),
    status: text('status', { enum: ['pending', 'ready', 'failed'] })
      .notNull()
      .default('pending'),
    /** R2 uploads: what the file is for (BR-61/62 limits differ: company logos ≤ 5 MB, BR-71). */
    purpose: text('purpose', { enum: ['shot', 'avatar', 'logo', 'seed'] })
      .notNull()
      .default('seed'),
    /** Storage provider's own file id (ImageKit `fileId`), needed to delete the object (BR-62, BR-65, BR-66). */
    providerFileId: text('provider_file_id'),
    /** 7-colour palette (hex) extracted at finalisation (BR-63); copied into shot_colors with Lab at publish. */
    palette: text('palette', { mode: 'json' }).$type<string[]>(),
    /** Why a file was rejected (shown to its owner). */
    failureReason: text('failure_reason'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => [index('media_owner_idx').on(t.ownerProfileId)],
);

/** Exactly 8 fixed categories (BR-36). */
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  position: integer('position').notNull(),
});

/**
 * Shots. `search_tags` and `search_author` are denormalised for the FTS5 external-content index
 * (custom migration, ADR-001; BR-39 weights title 3 / tags 2 / description 1 / author 1).
 * Owned by the `shots` module.
 */
export const shots = sqliteTable(
  'shots',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    authorId: integer('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    teamId: integer('team_id').references(() => profiles.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    coverMediaId: text('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    publishedAt: ts('published_at'),
    commentsDisabled: bool('comments_disabled').notNull().default(false),
    likesCount: integer('likes_count').notNull().default(0),
    savesCount: integer('saves_count').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    viewsCount: integer('views_count').notNull().default(0),
    popularityScore: real('popularity_score').notNull().default(0),
    searchTags: text('search_tags').notNull().default(''),
    searchAuthor: text('search_author').notNull().default(''),
    hiddenAt: ts('hidden_at'),
    deletedAt: ts('deleted_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    check(
      'shots_counters_nonneg',
      sql`${t.likesCount} >= 0 AND ${t.savesCount} >= 0 AND ${t.commentsCount} >= 0 AND ${t.viewsCount} >= 0`,
    ),
    check('shots_title_len', sql`length(${t.title}) BETWEEN 1 AND 100`),
    check('shots_published_has_date', sql`${t.status} = 'draft' OR ${t.publishedAt} IS NOT NULL`),
    index('shots_recent_idx').on(t.status, t.publishedAt, t.id),
    index('shots_popular_idx').on(t.status, t.popularityScore),
    index('shots_cat_recent_idx').on(t.categoryId, t.status, t.publishedAt),
    index('shots_cat_popular_idx').on(t.categoryId, t.status, t.popularityScore),
    index('shots_author_idx').on(t.authorId, t.publishedAt),
    index('shots_team_idx').on(t.teamId, t.publishedAt),
  ],
);

/** Ordered content blocks (RE doc 05 §7 `contentBlocks`). R1/R2: image and text blocks only (BR-64). */
export const contentBlocks = sqliteTable(
  'content_blocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type', { enum: ['image', 'text'] }).notNull(),
    mediaId: text('media_id').references(() => media.id, { onDelete: 'set null' }),
    textBody: text('text_body'),
    alt: text('alt'),
    isFullWidth: bool('is_full_width').notNull().default(false),
  },
  (t) => [
    uniqueIndex('content_blocks_shot_pos_uq').on(t.shotId, t.position),
    check(
      'content_blocks_shape',
      sql`(${t.type} = 'image' AND ${t.mediaId} IS NOT NULL) OR (${t.type} = 'text' AND ${t.textBody} IS NOT NULL)`,
    ),
  ],
);

/** 7-colour palette per shot, stored with CIELAB for R3 colour search (BR-63, BR-80). */
export const shotColors = sqliteTable(
  'shot_colors',
  {
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    hex: text('hex').notNull(),
    labL: real('lab_l').notNull(),
    labA: real('lab_a').notNull(),
    labB: real('lab_b').notNull(),
  },
  (t) => [primaryKey({ columns: [t.shotId, t.position] })],
);

/** Tags (BR-40). Owned by the `search` module. */
export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    shotsCount: integer('shots_count').notNull().default(0),
  },
  (t) => [check('tags_count_nonneg', sql`${t.shotsCount} >= 0`)],
);

export const shotTags = sqliteTable(
  'shot_tags',
  {
    shotId: integer('shot_id')
      .notNull()
      .references(() => shots.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.shotId, t.tagId] }), index('shot_tags_tag_idx').on(t.tagId, t.shotId)],
);
