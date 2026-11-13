import { sql } from 'drizzle-orm';
import { getDb, type Db } from '@/server/db/client';
import { runMigrations } from '@/server/db/migrate';
import { ensureReferenceData } from '@/server/db/reference-data';
import type { Viewer } from '@/modules/auth/types';

/** Migrates this file's fresh database and loads reference data. Call once in `beforeAll`. */
export async function setupTestDb(): Promise<Db> {
  await runMigrations();
  const db = await getDb();
  await ensureReferenceData(db);
  return db;
}

/** Deletes all content rows (keeps schema and categories). Use in `beforeEach` when tests need isolation. */
export async function clearContent(db: Db): Promise<void> {
  for (const t of [
    // R2 tables first (children before parents)
    'comment_likes', 'comments', 'collection_items', 'collections', 'follows', 'reports', 'idempotency_keys',
    'team_invitations', 'username_holds', 'jobs', 'companies',
    'likes', 'view_dedup', 'shot_view_daily', 'shot_tags', 'tags', 'shot_colors', 'content_blocks', 'shots',
    'team_memberships', 'user_social_links', 'moderation_actions', 'profiles', 'media', 'app_rate_limits',
    'session', 'account', 'verification', 'rate_limit', 'user',
  ]) {
    await db.run(sql.raw(`DELETE FROM ${t}`));
  }
}

const HOUR = 3_600_000;
let seq = 0;
const next = () => ++seq;

export type ProfileOpts = { username?: string; displayName?: string; kind?: 'individual' | 'team'; withUser?: boolean; role?: 'member' | 'moderator' | 'admin' };

/** Inserts a Better Auth user (optional) and a profile. Returns ids plus a ready-made member Viewer. */
export async function makeProfile(db: Db, o: ProfileOpts = {}) {
  const n = next();
  const username = o.username ?? `user${n}`;
  const now = Date.now();
  const kind = o.kind ?? 'individual';
  let userId: string | null = null;
  if (kind === 'individual' && o.withUser !== false) {
    userId = `u-${n}-${username}`;
    await db.run(sql`INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
      VALUES (${userId}, ${username}, ${`${username}@example.test`}, 1, ${now}, ${now})`);
  }
  const rows = await db.all<{ id: number }>(sql`INSERT INTO profiles (user_id, kind, username, display_name, role, created_at, updated_at)
    VALUES (${userId}, ${kind}, ${username}, ${o.displayName ?? `Name ${username}`}, ${o.role ?? 'member'}, ${now}, ${now}) RETURNING id`);
  const profileId = Number(rows[0]!.id);
  const viewer: Viewer =
    userId === null
      ? { kind: 'visitor' }
      : { kind: 'member', userId, profileId, username, displayName: o.displayName ?? `Name ${username}`, avatarKey: null, role: o.role ?? 'member' };
  return { profileId, userId, username, viewer };
}

export type ShotOpts = {
  authorId: number;
  teamId?: number | null;
  title?: string;
  description?: string;
  categoryId?: number;
  status?: 'draft' | 'published';
  ageHours?: number;
  tags?: string[];
  likes?: number;
  views?: number;
  popularity?: number;
  hidden?: boolean;
  deleted?: boolean;
  withCover?: boolean;
};

/** Inserts a shot (published `ageHours` ago, default 1 h) with a ready cover, an image block and tags. */
export async function makeShot(db: Db, o: ShotOpts) {
  const n = next();
  const now = Date.now();
  const title = o.title ?? `Shot ${n}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shot';
  const status = o.status ?? 'published';
  const publishedAt = status === 'published' ? now - (o.ageHours ?? 1) * HOUR : null;
  const mediaId = `m-${n}`;
  if (o.withCover !== false) {
    await db.run(sql`INSERT INTO media (id, owner_profile_id, storage_key, mime_type, width, height, bytes, dominant_color, status, created_at)
      VALUES (${mediaId}, ${o.authorId}, ${`test/${mediaId}`}, 'image/webp', 1600, 1200, 1000, '#cccccc', 'ready', ${now})`);
  }
  const author = await db.all<{ name: string; username: string }>(sql`SELECT display_name AS name, username FROM profiles WHERE id = ${o.authorId}`);
  const tags = (o.tags ?? []).map((t) => t.trim().toLowerCase());
  const rows = await db.all<{ id: number }>(sql`INSERT INTO shots
      (author_id, team_id, title, slug, description, category_id, cover_media_id, status, published_at,
       likes_count, views_count, popularity_score, search_tags, search_author, hidden_at, deleted_at, created_at, updated_at)
    VALUES (${o.authorId}, ${o.teamId ?? null}, ${title}, ${slug}, ${o.description ?? null}, ${o.categoryId ?? 1},
       ${o.withCover !== false ? mediaId : null}, ${status}, ${publishedAt}, ${o.likes ?? 0}, ${o.views ?? 0}, ${o.popularity ?? 0},
       ${tags.join(' ')}, ${`${author[0]?.name ?? ''} ${author[0]?.username ?? ''}`}, ${o.hidden ? now : null}, ${o.deleted ? now : null}, ${now}, ${now})
    RETURNING id`);
  const id = Number(rows[0]!.id);
  if (o.withCover !== false) {
    await db.run(sql`INSERT INTO content_blocks (shot_id, position, type, media_id, alt) VALUES (${id}, 0, 'image', ${mediaId}, ${title})`);
  }
  for (const t of tags) {
    const slugT = t.replace(/[\s-]+/g, '-');
    await db.run(sql`INSERT INTO tags (name, slug, shots_count) VALUES (${t}, ${slugT}, 1)
      ON CONFLICT(name) DO UPDATE SET shots_count = shots_count + 1`);
    await db.run(sql`INSERT INTO shot_tags (shot_id, tag_id) SELECT ${id}, id FROM tags WHERE name = ${t}`);
  }
  if (status === 'published' && !o.deleted) {
    await db.run(sql`UPDATE profiles SET shots_count = shots_count + 1 WHERE id = ${o.authorId}`);
  }
  return { id, slug, title };
}

export const visitor: Viewer = { kind: 'visitor' };

/** Captures the AppError code of a rejected promise (or null when it resolves). */
export async function errorCode(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? String(e);
  }
}
