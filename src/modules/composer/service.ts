import 'server-only';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit, quota } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { CATEGORIES, categoryBySlug } from '@/lib/catalog';
import { shotPath, slugify, tagSlug } from '@/lib/slug';
import { requireMember } from '@/modules/auth/service';
import type { Viewer } from '@/modules/auth/types';
import * as media from '@/modules/media/service';
import * as uploads from '@/modules/media/uploads';
import * as shots from '@/modules/shots/service';
import * as teams from '@/modules/teams/service';
import * as likes from '@/modules/likes/service';
import * as collections from '@/modules/collections/service';
import * as comments from '@/modules/comments/service';
import type { MediaRef } from '@/modules/shots/types';
import * as repo from './repository';
import type { BlockInput } from './repository';

/**
 * Shot composer (C-04, C-05, FR-63, FR-64; BR-40, BR-59, BR-64…BR-66). Drafts are private to their author;
 * publishing validates the full BR-64 rules once and sets `published_at` for good; deleting is a soft delete
 * that removes likes, saves and comments with their counters, purged after 30 days with the stored objects.
 */
export const MAX_DRAFTS = 50;

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const plain = (max: number, msg: string) =>
  z
    .string()
    .max(max * 2)
    .transform((s) => s.replace(/\r\n?/g, '\n').replace(CONTROL, '').trim())
    .pipe(z.string().max(max, msg));

/** BR-40 tag: trimmed, lower-cased, 2–30 letters, digits, spaces and hyphens. */
const tagSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase().replace(/\s+/g, ' '))
  .pipe(z.string().regex(/^[\p{L}\p{N}][\p{L}\p{N} -]{0,28}[\p{L}\p{N}]$/u, 'Tags are 2–30 letters, numbers, spaces or hyphens.'));

const blockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    mediaId: z.string().min(1).max(64),
    alt: plain(250, 'Alt text: use at most 250 characters.').nullish().transform((s) => (s ? s : null)),
    isFullWidth: z.boolean().default(false),
  }),
  z.object({ type: z.literal('text'), text: plain(5000, 'Text blocks are at most 5,000 characters.').pipe(z.string().min(1, 'A text block cannot be empty.')) }),
]);

const tagsSchema = z
  .array(tagSchema)
  .max(20, 'Use at most 20 tags.')
  .transform((list) => {
    const seen = new Set<string>();
    return list.filter((t) => (seen.has(tagSlug(t)) ? false : (seen.add(tagSlug(t)), true)));
  });

/** Field rules without defaults, so a PATCH never resets omitted fields (Zod `.partial()` keeps defaults). */
const shotFields = {
  title: plain(100, 'Use at most 100 characters.').pipe(z.string().min(1, 'Add a title.')),
  description: plain(5000, 'Use at most 5,000 characters.').nullish().transform((s) => (s ? s : null)),
  categorySlug: z.enum(CATEGORIES.map((c) => c.slug) as [string, ...string[]], { message: 'Choose a category.' }),
  tags: tagsSchema,
  teamUsername: z.string().max(60).nullish().transform((s) => (s ? s.trim().toLowerCase() : null)),
  blocks: z.array(blockSchema).max(20, 'Use at most 20 blocks.'),
  commentsDisabled: z.boolean(),
};
export const shotInput = z.object({
  ...shotFields,
  tags: tagsSchema.default([]),
  blocks: shotFields.blocks.default([]),
  commentsDisabled: z.boolean().default(false),
});
export const shotPatch = z.object(shotFields).partial();

export type ComposerBlock =
  | { type: 'image'; mediaId: string; alt: string | null; isFullWidth: boolean; media: MediaRef | null }
  | { type: 'text'; text: string };

export type ShotDraft = {
  id: number;
  status: 'draft' | 'published';
  title: string;
  slug: string;
  description: string | null;
  categorySlug: string;
  tags: string[];
  teamUsername: string | null;
  commentsDisabled: boolean;
  blocks: ComposerBlock[];
  updatedAt: string;
  publishedAt: string | null;
  canonicalPath: string;
};

/** BR-64 publish rules, applied at publish time and to every edit of a published shot. */
function assertPublishable(blocks: { type: string }[]) {
  if (blocks.length < 1 || !blocks.some((b) => b.type === 'image')) {
    throw new AppError('VALIDATION', 'Add at least one image.', { fields: { blocks: 'Add at least one image.' } });
  }
}

/** Image blocks: the member's own ready shot uploads, each used by no other shot. */
async function checkMedia(profileId: number, blocks: BlockInput[], shotId: number | null) {
  const ids = blocks.flatMap((b) => (b.type === 'image' ? [b.mediaId] : []));
  if (new Set(ids).size !== ids.length) throw new AppError('VALIDATION', 'Each image can be used once per shot.', { fields: { blocks: 'Duplicate image.' } });
  const metas = new Map<string, { palette: string[] | null }>();
  for (const [i, id] of ids.entries()) {
    const m = await media.requireOwnedReady(id, profileId, ['shot'], `blocks.${i}.mediaId`);
    metas.set(id, { palette: m.palette });
  }
  const used = await repo.mediaUsedElsewhere(ids, shotId);
  if (used.length) throw new AppError('CONFLICT', 'An image is already used in another shot.', { fields: { blocks: 'Image already used.' } });
  return metas;
}

const coverOf = (blocks: BlockInput[]) => blocks.find((b): b is Extract<BlockInput, { type: 'image' }> => b.type === 'image')?.mediaId ?? null;

async function toDraft(id: number): Promise<ShotDraft> {
  const s = await repo.findOwned(id);
  if (!s) throw new AppError('NOT_FOUND');
  const [blocks, tags, team] = await Promise.all([repo.blocksOf(id), repo.tagNamesOf(id), s.teamId ? shots.personById(s.teamId) : Promise.resolve(null)]);
  return {
    id: s.id,
    status: s.status,
    title: s.title,
    slug: s.slug,
    description: s.description,
    categorySlug: CATEGORIES.find((c) => c.id === s.categoryId)?.slug ?? '',
    tags,
    teamUsername: team?.username ?? null,
    commentsDisabled: Boolean(s.commentsDisabled),
    blocks: blocks.map((b, i): ComposerBlock =>
      b.type === 'image'
        ? {
            type: 'image',
            mediaId: b.mediaId ?? '',
            alt: b.alt,
            isFullWidth: Boolean(b.isFullWidth),
            media: b.key ? { key: b.key, width: b.width ?? 0, height: b.height ?? 0, dominantColor: b.color, alt: b.alt || `${s.title}, image ${i + 1}` } : null,
          }
        : { type: 'text', text: b.textBody ?? '' },
    ),
    updatedAt: new Date(s.updatedAt).toISOString(),
    publishedAt: s.publishedAt ? new Date(s.publishedAt).toISOString() : null,
    canonicalPath: shotPath(s.id, s.slug),
  };
}

async function own(viewer: Viewer, id: number) {
  const m = requireMember(viewer);
  const s = await repo.findOwned(id);
  // Drafts are visible only to their author (BR-65); never reveal someone else's draft.
  if (!s || s.deletedAt || s.authorId !== m.profileId) throw new AppError('NOT_FOUND');
  return { m, s };
}

async function resolveTeam(profileId: number, teamUsername: string | null | undefined): Promise<number | null> {
  if (!teamUsername) return null;
  return teams.canPublishFor(profileId, teamUsername);
}

const searchTags = (tags: string[]) => tags.join(' ');

/** FR-63 create a draft. RL-CONTENT; at most 50 drafts (BR-66). */
export async function create(viewer: Viewer, input: unknown): Promise<ShotDraft> {
  const m = requireMember(viewer);
  const v = validate(shotInput, input);
  await limit('RL-CONTENT', `p:${m.profileId}`);
  if ((await repo.countDrafts(m.profileId)) >= MAX_DRAFTS) throw new AppError('QUOTA_EXCEEDED', `You can keep at most ${MAX_DRAFTS} drafts.`);
  const teamId = await resolveTeam(m.profileId, v.teamUsername);
  await checkMedia(m.profileId, v.blocks, null);
  const tagIds = await repo.ensureTags(v.tags.map((t) => ({ name: t, slug: tagSlug(t) })));
  const id = await repo.insertDraft(
    m.profileId,
    {
      title: v.title,
      slug: slugify(v.title),
      description: v.description,
      categoryId: categoryBySlug(v.categorySlug)!.id,
      teamId,
      commentsDisabled: v.commentsDisabled,
      searchTags: searchTags(v.tags),
      searchAuthor: `${m.displayName} ${m.username}`,
    },
    v.blocks,
    tagIds,
    coverOf(v.blocks),
    Date.now(),
  );
  return toDraft(id);
}

/** FR-63 edit (author only). A published shot keeps `published_at`; a new title changes the slug (BR-42/65). */
export async function update(viewer: Viewer, id: number, input: unknown): Promise<ShotDraft> {
  const { m, s } = await own(viewer, id);
  const v = validate(shotPatch, input);
  await limit('RL-CONTENT', `p:${m.profileId}`);
  const published = s.status === 'published';
  if (v.blocks && published) assertPublishable(v.blocks);
  let teamId: number | null | undefined;
  if (v.teamUsername !== undefined) {
    const next = await resolveTeam(m.profileId, v.teamUsername);
    if (published && next !== s.teamId) {
      throw new AppError('VALIDATION', 'The team cannot be changed after publishing.', { fields: { teamUsername: 'Cannot change after publishing.' } });
    }
    teamId = next;
  }
  const metas = v.blocks ? await checkMedia(m.profileId, v.blocks, id) : null;
  const before = v.tags ? await repo.tagIdsOf(id) : [];
  const tagIds = v.tags ? await repo.ensureTags(v.tags.map((t) => ({ name: t, slug: tagSlug(t) }))) : null;
  const cover = v.blocks ? coverOf(v.blocks) : undefined;
  await repo.updateShot(
    id,
    {
      title: v.title,
      slug: v.title !== undefined ? slugify(v.title) : undefined,
      description: v.description,
      categoryId: v.categorySlug ? categoryBySlug(v.categorySlug)!.id : undefined,
      teamId,
      commentsDisabled: v.commentsDisabled,
      searchTags: v.tags ? searchTags(v.tags) : undefined,
    },
    v.blocks ?? null,
    tagIds,
    cover,
    Date.now(),
  );
  if (published) {
    if (tagIds) await repo.recountTags([...new Set([...before, ...tagIds])]);
    if (cover && cover !== s.coverMediaId) await repo.setPalette(id, metas?.get(cover)?.palette ?? []);
  }
  return toDraft(id);
}

/** FR-64 publish (BR-64, BR-65): validated once; 10 per day (422 QUOTA_EXCEEDED); idempotent for a published shot. */
export async function publish(viewer: Viewer, id: number): Promise<ShotDraft> {
  const { m, s } = await own(viewer, id);
  if (s.status === 'published') return toDraft(id);
  const blocks = await repo.blocksOf(id);
  assertPublishable(blocks);
  // Media may have been removed or failed since the draft was saved.
  if (blocks.some((b) => b.type === 'image' && !b.key)) throw new AppError('VALIDATION', 'An image in this draft is missing. Replace it first.', { fields: { blocks: 'Missing image.' } });
  if (s.teamId) {
    const team = await shots.personById(s.teamId);
    if (!team) throw new AppError('VALIDATION', 'The team no longer exists.', { fields: { teamUsername: 'Team gone.' } });
    await teams.canPublishFor(m.profileId, team.username); // BR-60: former members cannot publish for the team
  }
  await quota('Q-PUBLISH', `p:${m.profileId}`, 'You can publish at most 10 shots per day.');
  const cover = s.coverMediaId ? await media.describe(s.coverMediaId) : null;
  const palette = (cover && (await media.paletteOf(cover.id))) ?? [];
  const now = Date.now();
  await repo.publish(id, m.profileId, s.teamId, palette, shots.popularityScore(0, 0, new Date(now), now), now);
  await repo.recountTags(await repo.tagIdsOf(id));
  return toDraft(id);
}

/** FR-64 delete (author only, BR-65): 404 at once; likes, saves and comments removed with counters. */
export async function remove(viewer: Viewer, id: number): Promise<{ deleted: true }> {
  const { m, s } = await own(viewer, id);
  await limit('RL-CONTENT', `p:${m.profileId}`);
  await likes.removeAllOnShot(id);
  await collections.removeShotEverywhere(id);
  await comments.removeAllOnShot(id);
  await repo.softDelete(id, s.authorId, s.teamId, s.status === 'published', Date.now());
  await repo.recountTags(await repo.tagIdsOf(id));
  return { deleted: true };
}

export async function getForEdit(viewer: Viewer, id: number): Promise<ShotDraft> {
  await own(viewer, id);
  return toDraft(id);
}

export type OwnShotRow = { id: number; title: string; slug: string; status: 'draft' | 'published'; updatedAt: string; cover: MediaRef | null };

/** FR-64: the member's drafts (or published shots) for the Work-tab owner area, newest update first. */
export async function listOwn(viewer: Viewer, status: 'draft' | 'published', q: { cursor?: string | null; limit?: number }) {
  const m = requireMember(viewer);
  const size = Math.min(Math.max(q.limit ?? 24, 1), 48);
  const key = `own:${m.profileId}:${status}`;
  const rows = await repo.listOwn(m.profileId, status, decodeCursor(q.cursor, key), size + 1);
  const page = rows.slice(0, size);
  const last = page[page.length - 1];
  return {
    items: page.map(
      (r): OwnShotRow => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        status: r.status,
        updatedAt: new Date(r.updatedAt).toISOString(),
        cover: r.key ? { key: r.key, width: r.width ?? 0, height: r.height ?? 0, dominantColor: r.color, alt: r.title } : null,
      }),
    ),
    nextCursor: rows.length > size && last ? encodeCursor(key, [last.updatedAt, last.id]) : null,
  };
}

/** BR-65 purge (daily job): soft-deleted shots older than 30 days, with their stored objects. */
export async function purgeDeleted(now = Date.now()): Promise<number> {
  const due = await repo.deletedBefore(now - 30 * 86_400_000, 100);
  for (const { id } of due) {
    const ids = (await repo.mediaOfShot(id)).map((r) => r.id);
    for (const mid of ids) await uploads.deleteObjectById(mid);
    await repo.hardDelete(id, ids);
  }
  return due.length;
}
