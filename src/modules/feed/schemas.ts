import { z } from 'zod';

/**
 * Query schemas for list endpoints (API_RESPONSE_CONVENTIONS §4). Enumerations are validated here
 * (invalid value of a known parameter → 400 VALIDATION); unknown parameters are ignored.
 */
export const limitSchema = z.coerce.number().int().min(1).max(48).default(24);
export const cursorSchema = z.string().min(1).max(512).optional();

export const feedQuery = z.object({
  sort: z.enum(['popular', 'recent']).default('popular'),
  category: z.string().max(40).optional(),
  timeframe: z.enum(['now', 'week', 'month', 'year', 'ever']).default('now'),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const profileShotsQuery = z.object({
  sort: z.enum(['popular', 'recent']).default('recent'),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const searchQuery = z.object({
  q: z.string().max(200).default(''),
  cursor: cursorSchema,
});

export const tagShotsQuery = z.object({
  sort: z.enum(['popular', 'recent']).default('popular'),
  cursor: cursorSchema,
});

/** Generic cursor page (R2 lists: followers, collections, comments, likes, jobs…). */
export const pageQuery = z.object({
  cursor: cursorSchema,
  limit: limitSchema,
});
