import 'server-only';
import { and, asc, desc, eq, inArray, isNull, lte, gte, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import { getDb } from '@/server/db/client';
import { shots, profiles, media, categories, contentBlocks, shotColors, shotTags, tags } from '@/server/db/schema';

/**
 * Shot queries. Owned tables: shots, content_blocks, shot_colors (tags/shot_tags are read here for the
 * detail view; written by `search`). Business rules live in service.ts.
 */
export const author = alias(profiles, 'author');
export const team = alias(profiles, 'team');
const authorAvatar = alias(media, 'author_avatar');
const teamAvatar = alias(media, 'team_avatar');

/** BR-37 eligibility, applied to every public list and count. */
export function eligible(now: number): SQL {
  return and(
    eq(shots.status, 'published'),
    lte(shots.publishedAt, new Date(now)),
    isNull(shots.hiddenAt),
    isNull(shots.deletedAt),
    isNull(author.suspendedAt),
    isNull(author.deletedAt),
    sql`(${shots.teamId} IS NULL OR (${team.suspendedAt} IS NULL AND ${team.deletedAt} IS NULL))`,
  )!;
}

const cardColumns = {
  id: shots.id,
  title: shots.title,
  slug: shots.slug,
  likesCount: shots.likesCount,
  viewsCount: shots.viewsCount,
  publishedAt: shots.publishedAt,
  popularityScore: shots.popularityScore,
  coverKey: media.storageKey,
  coverWidth: media.width,
  coverHeight: media.height,
  coverColor: media.dominantColor,
  authorId: author.id,
  authorUsername: author.username,
  authorName: author.displayName,
  authorAvatarKey: authorAvatar.storageKey,
  authorKind: author.kind,
  authorFeatured: author.isFeaturedStudio,
  teamId: team.id,
  teamUsername: team.username,
  teamName: team.displayName,
  teamAvatarKey: teamAvatar.storageKey,
  teamFeatured: team.isFeaturedStudio,
};

export type CardRow = {
  id: number;
  title: string;
  slug: string;
  likesCount: number;
  viewsCount: number;
  publishedAt: Date | null;
  popularityScore: number;
  coverKey: string | null;
  coverWidth: number | null;
  coverHeight: number | null;
  coverColor: string | null;
  authorId: number;
  authorUsername: string;
  authorName: string;
  authorAvatarKey: string | null;
  authorKind: 'individual' | 'team';
  authorFeatured: boolean;
  teamId: number | null;
  teamUsername: string | null;
  teamName: string | null;
  teamAvatarKey: string | null;
  teamFeatured: boolean | null;
};

export type CardOrder = 'recent' | 'popular' | 'likes';

export type CardFilter = {
  now: number;
  categoryId?: number;
  tagId?: number;
  /** Shots authored by, or attributed to, this profile (profile Work tab, BR-59). */
  profileId?: number;
  publishedSince?: number;
  excludeIds?: number[];
  ids?: number[];
};

/** Order keys, all DESC, ending with id for a total order (BR-32…BR-34). */
function orderKeys(order: CardOrder) {
  if (order === 'recent') return [shots.publishedAt, shots.id] as const;
  if (order === 'popular') return [shots.popularityScore, shots.publishedAt, shots.id] as const;
  return [shots.likesCount, shots.publishedAt, shots.id] as const;
}

export function cursorTuple(row: CardRow, order: CardOrder): (number | string)[] {
  const pub = row.publishedAt ? row.publishedAt.getTime() : 0;
  if (order === 'recent') return [pub, row.id];
  if (order === 'popular') return [row.popularityScore, pub, row.id];
  return [row.likesCount, pub, row.id];
}

function whereFor(f: CardFilter): SQL[] {
  const w: SQL[] = [eligible(f.now)];
  if (f.categoryId) w.push(eq(shots.categoryId, f.categoryId));
  if (f.profileId) w.push(sql`(${shots.authorId} = ${f.profileId} OR ${shots.teamId} = ${f.profileId})`);
  if (f.publishedSince) w.push(gte(shots.publishedAt, new Date(f.publishedSince)));
  if (f.excludeIds?.length) w.push(sql`${shots.id} NOT IN (${sql.join(f.excludeIds.map((i) => sql`${i}`), sql`, `)})`);
  if (f.ids) w.push(f.ids.length ? inArray(shots.id, f.ids) : sql`0`);
  if (f.tagId) w.push(sql`EXISTS (SELECT 1 FROM ${shotTags} st WHERE st.shot_id = ${shots.id} AND st.tag_id = ${f.tagId})`);
  return w;
}

function baseCardQuery(db: Awaited<ReturnType<typeof getDb>>) {
  return db
    .select(cardColumns)
    .from(shots)
    .innerJoin(author, eq(author.id, shots.authorId))
    .leftJoin(team, eq(team.id, shots.teamId))
    .leftJoin(media, eq(media.id, shots.coverMediaId))
    .leftJoin(authorAvatar, eq(authorAvatar.id, author.avatarMediaId))
    .leftJoin(teamAvatar, eq(teamAvatar.id, team.avatarMediaId));
}

export async function listCards(f: CardFilter, order: CardOrder, after: (number | string)[] | null, limit: number): Promise<CardRow[]> {
  const db = await getDb();
  const keys = orderKeys(order);
  const w = whereFor(f);
  if (after && after.length === keys.length) {
    // Row-value comparison: every key is DESC, so "after" means strictly smaller tuple.
    const cols = sql.join(keys.map((k) => sql`${k}`), sql`, `);
    const vals = sql.join(after.map((v) => sql`${v}`), sql`, `);
    w.push(sql`(${cols}) < (${vals})`);
  }
  return (await baseCardQuery(db)
    .where(and(...w))
    .orderBy(...keys.map((k) => desc(k)))
    .limit(limit)) as CardRow[];
}

export async function cardsByIds(ids: number[], now: number): Promise<CardRow[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  return (await baseCardQuery(db).where(and(...whereFor({ now, ids })))) as CardRow[];
}

export async function countEligible(f: CardFilter): Promise<number> {
  const db = await getDb();
  const [r] = await db
    .select({ n: sql<number>`count(*)` })
    .from(shots)
    .innerJoin(author, eq(author.id, shots.authorId))
    .leftJoin(team, eq(team.id, shots.teamId))
    .where(and(...whereFor(f)));
  return Number(r?.n ?? 0);
}

/** Detail read: one batch (NFR-09: ≤ 3 round trips per page). Visibility is decided by the service. */
export async function findDetail(id: number) {
  const db = await getDb();
  const [head, blocks, colors, tagRows] = await db.batch([
    db
      .select({
        ...cardColumns,
        description: shots.description,
        savesCount: shots.savesCount,
        commentsCount: shots.commentsCount,
        commentsDisabled: shots.commentsDisabled,
        status: shots.status,
        hiddenAt: shots.hiddenAt,
        deletedAt: shots.deletedAt,
        authorSuspendedAt: author.suspendedAt,
        authorDeletedAt: author.deletedAt,
        teamSuspendedAt: team.suspendedAt,
        teamDeletedAt: team.deletedAt,
        authorUserId: author.userId,
        categorySlug: categories.slug,
        categoryName: categories.name,
      })
      .from(shots)
      .innerJoin(author, eq(author.id, shots.authorId))
      .leftJoin(team, eq(team.id, shots.teamId))
      .leftJoin(media, eq(media.id, shots.coverMediaId))
      .leftJoin(authorAvatar, eq(authorAvatar.id, author.avatarMediaId))
      .leftJoin(teamAvatar, eq(teamAvatar.id, team.avatarMediaId))
      .innerJoin(categories, eq(categories.id, shots.categoryId))
      .where(eq(shots.id, id))
      .limit(1),
    db
      .select({
        id: contentBlocks.id,
        position: contentBlocks.position,
        type: contentBlocks.type,
        textBody: contentBlocks.textBody,
        alt: contentBlocks.alt,
        isFullWidth: contentBlocks.isFullWidth,
        key: media.storageKey,
        width: media.width,
        height: media.height,
        color: media.dominantColor,
      })
      .from(contentBlocks)
      .leftJoin(media, eq(media.id, contentBlocks.mediaId))
      .where(eq(contentBlocks.shotId, id))
      .orderBy(asc(contentBlocks.position)),
    db.select({ hex: shotColors.hex }).from(shotColors).where(eq(shotColors.shotId, id)).orderBy(asc(shotColors.position)),
    db
      .select({ name: tags.name, slug: tags.slug })
      .from(shotTags)
      .innerJoin(tags, eq(tags.id, shotTags.tagId))
      .where(eq(shotTags.shotId, id))
      .orderBy(asc(tags.name)),
  ]);
  return { head: head[0] ?? null, blocks, colors, tags: tagRows };
}

/** Owner/author check data for mutations on a shot (likes, saves, comments). */
export async function findForMutation(id: number, now: number) {
  const db = await getDb();
  const [row] = await db
    .select({ id: shots.id, authorId: shots.authorId, teamId: shots.teamId, commentsDisabled: shots.commentsDisabled, likesCount: shots.likesCount })
    .from(shots)
    .innerJoin(author, eq(author.id, shots.authorId))
    .leftJoin(team, eq(team.id, shots.teamId))
    .where(and(eq(shots.id, id), eligible(now)))
    .limit(1);
  return row ?? null;
}

export async function likesCountOf(id: number): Promise<number> {
  const db = await getDb();
  const [r] = await db.select({ n: shots.likesCount }).from(shots).where(eq(shots.id, id)).limit(1);
  return r?.n ?? 0;
}

export async function setHidden(id: number, hidden: boolean, now: number) {
  const db = await getDb();
  return db
    .update(shots)
    .set({ hiddenAt: hidden ? new Date(now) : null, updatedAt: new Date(now) })
    .where(eq(shots.id, id))
    .returning({ id: shots.id });
}

/** Popularity inputs for the recompute job (BR-33), in bounded chunks. */
export async function popularityInputs(afterId: number, chunk: number) {
  const db = await getDb();
  return db
    .select({
      id: shots.id,
      likes: shots.likesCount,
      views: shots.viewsCount,
      saves: shots.savesCount,
      // BR-33 R2: comments by people other than the author (visible only). Read-only cross-table subquery.
      comments: sql<number>`(SELECT COUNT(*) FROM comments c WHERE c.shot_id = shots.id AND c.author_id <> shots.author_id
        AND c.deleted_at IS NULL AND c.hidden_at IS NULL)`,
      publishedAt: shots.publishedAt,
    })
    .from(shots)
    .where(and(eq(shots.status, 'published'), sql`${shots.id} > ${afterId}`))
    .orderBy(asc(shots.id))
    .limit(chunk);
}

export async function writePopularity(scores: { id: number; score: number }[]) {
  if (scores.length === 0) return;
  const db = await getDb();
  const stmts = scores.map((s) => db.update(shots).set({ popularityScore: s.score }).where(eq(shots.id, s.id)));
  await db.batch(stmts as [(typeof stmts)[number], ...typeof stmts]);
}

export async function listIdsByProfile(profileId: number) {
  const db = await getDb();
  return db
    .select({ id: shots.id })
    .from(shots)
    .where(sql`${shots.authorId} = ${profileId} OR ${shots.teamId} = ${profileId}`);
}

/** BR-27: profiles.shots_count = published, non-deleted shots authored by or attributed to the profile. */
export async function reconcileShotsCount(): Promise<number> {
  const db = await getDb();
  const n = sql`(SELECT COUNT(*) FROM shots s WHERE (s.author_id = profiles.id OR s.team_id = profiles.id) AND s.status = 'published' AND s.deleted_at IS NULL)`;
  const res = await db.run(sql`UPDATE profiles SET shots_count = ${n} WHERE shots_count <> ${n}`);
  return res.rowsAffected;
}

export async function setCommentsDisabled(id: number, disabled: boolean, now: number) {
  const db = await getDb();
  await db.update(shots).set({ commentsDisabled: disabled, updatedAt: new Date(now) }).where(eq(shots.id, id));
}

/** Keeps the FTS author column in step with a renamed profile (BR-39; FTS trigger fires on search_author). */
export async function refreshSearchAuthor(profileId: number, text: string) {
  const db = await getDb();
  await db.update(shots).set({ searchAuthor: text }).where(eq(shots.authorId, profileId));
}

/**
 * BR-60 / team deletion: shots keep their individual author; the team attribution is removed and the team's
 * shots_count drops by the number of its published, non-deleted shots that were detached (same batch).
 */
export async function clearTeam(where: { teamId?: number; shotId?: number }, now: number) {
  const db = await getDb();
  const cond = where.shotId ? sql`id = ${where.shotId} AND team_id IS NOT NULL` : sql`team_id = ${where.teamId!}`;
  const [, res] = await db.batch([
    db.run(sql`UPDATE profiles SET shots_count = MAX(shots_count - (SELECT COUNT(*) FROM shots WHERE ${cond} AND status = 'published' AND deleted_at IS NULL), 0)
      WHERE id IN (SELECT team_id FROM shots WHERE ${cond})`),
    db.run(sql`UPDATE shots SET team_id = NULL, updated_at = ${now} WHERE ${cond}`),
  ]);
  return res.rowsAffected;
}

/** SD-05 / FR-44: neighbours within a profile's eligible shots in Work-tab (recent) order. */
export async function neighbours(profileId: number, publishedAt: Date, id: number, now: number) {
  const db = await getDb();
  const own = sql`(${shots.authorId} = ${profileId} OR ${shots.teamId} = ${profileId})`;
  const pub = publishedAt.getTime();
  const base = () =>
    db
      .select({ id: shots.id, slug: shots.slug, title: shots.title })
      .from(shots)
      .innerJoin(author, eq(author.id, shots.authorId))
      .leftJoin(team, eq(team.id, shots.teamId));
  const [newer, older] = await Promise.all([
    base()
      .where(and(eligible(now), own, sql`(${shots.publishedAt}, ${shots.id}) > (${pub}, ${id})`))
      .orderBy(asc(shots.publishedAt), asc(shots.id))
      .limit(1),
    base()
      .where(and(eligible(now), own, sql`(${shots.publishedAt}, ${shots.id}) < (${pub}, ${id})`))
      .orderBy(desc(shots.publishedAt), desc(shots.id))
      .limit(1),
  ]);
  return { prev: newer[0] ?? null, next: older[0] ?? null };
}

export async function personById(id: number) {
  const db = await getDb();
  const [row] = await db
    .select({ id: profiles.id, username: profiles.username, deletedAt: profiles.deletedAt })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);
  return row && !row.deletedAt ? { id: row.id, username: row.username } : null;
}

/** Moderation/report target lookup (any status except purged). */
export async function findBasic(id: number) {
  const db = await getDb();
  const [row] = await db
    .select({ id: shots.id, title: shots.title, slug: shots.slug, authorId: shots.authorId, status: shots.status, deletedAt: shots.deletedAt })
    .from(shots)
    .where(eq(shots.id, id))
    .limit(1);
  return row ?? null;
}
