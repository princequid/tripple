// Jobs board (R2, free posting only: J-01…J-03, BR-71…BR-75). Owned by the `jobs` module.
import { sqliteTable, text, integer, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { ts } from './_helpers';
import { profiles, media } from './content';

/** The 9 fixed specialties (RE doc 06 §2.4, BR-71). Reference data, seeded in every environment. */
export const specialties = sqliteTable('specialties', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  position: integer('position').notNull(),
});

/**
 * Hiring companies (RE doc 06 `companies`). One row per (poster, company name), reused by later posts from the
 * same poster. `name_key` = lower(trim(name)) for case-insensitive reuse.
 */
export const companies = sqliteTable(
  'companies',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ownerProfileId: integer('owner_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    websiteUrl: text('website_url').notNull(),
    logoMediaId: text('logo_media_id').references(() => media.id, { onDelete: 'set null' }),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    uniqueIndex('companies_owner_name_uq').on(t.ownerProfileId, t.nameKey),
    check('companies_name_len', sql`length(${t.name}) BETWEEN 1 AND 80`),
  ],
);

/**
 * Job posts. A free job is active for 30 days from `published_at` (`expires_at`), then expired (BR-73);
 * `closed_at` marks an early close by the poster. Expired/closed jobs keep their detail page (noindex).
 * `description_html` is sanitised on every write (BR-72); `description_text` is its plain text (length rule
 * BR-71 and keyword search BR-75).
 */
export const jobs = sqliteTable(
  'jobs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    posterId: integer('poster_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id),
    specialtyId: integer('specialty_id')
      .notNull()
      .references(() => specialties.id),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    descriptionHtml: text('description_html').notNull(),
    descriptionText: text('description_text').notNull(),
    location: text('location'),
    workplaceType: text('workplace_type', { enum: ['remote', 'on-site', 'hybrid'] }).notNull(),
    employmentType: text('employment_type', { enum: ['full-time', 'freelance-contract'] }).notNull(),
    applyUrl: text('apply_url').notNull(),
    publishedAt: ts('published_at').notNull(),
    expiresAt: ts('expires_at').notNull(),
    closedAt: ts('closed_at'),
    hiddenAt: ts('hidden_at'),
    deletedAt: ts('deleted_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => [
    check('jobs_title_len', sql`length(${t.title}) BETWEEN 5 AND 100`),
    index('jobs_board_idx').on(t.expiresAt, t.publishedAt),
    index('jobs_specialty_idx').on(t.specialtyId, t.publishedAt),
    index('jobs_poster_idx').on(t.posterId, t.publishedAt),
  ],
);
