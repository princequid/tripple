import 'server-only';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { slugify } from '@/lib/slug';
import { requireMember } from '@/modules/auth/service';
import { isStaff, type Viewer } from '@/modules/auth/types';
import * as users from '@/modules/users/service';
import * as shots from '@/modules/shots/service';
import * as likes from '@/modules/likes/service';
import type { Page, ShotCard } from '@/modules/shots/types';
import * as repo from './repository';
import type { CollectionDetail, CollectionSummary, SaveResult, SaveTarget } from './types';

/**
 * Collections (S-02, P-03, FR-46, FR-47, FR-56; BR-53…BR-55). Public by default; a private or hidden
 * collection is 404 to everyone but its owner (staff also see hidden ones, BR-68).
 */
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/;

export const collectionInput = z.object({
  name: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, 'Enter a name of 1–60 characters.').max(60, 'Enter a name of 1–60 characters.'))
    .refine((s) => !CONTROL.test(s), 'The name contains characters that are not allowed.'),
  description: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(300, 'Use at most 300 characters.'))
    .nullish()
    .transform((s) => (s ? s : null)),
  isPrivate: z.boolean().default(false),
});
/** No defaults in the patch (Zod `.partial()` would apply `isPrivate: false` to every rename). */
export const collectionPatch = collectionInput
  .extend({ isPrivate: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');

function summary(r: repo.CollectionRow, stats: Awaited<ReturnType<typeof repo.statsFor>>): CollectionSummary {
  const st = stats.get(r.id) ?? { count: 0, designers: 0, covers: [] };
  return {
    id: r.id,
    name: r.name,
    slug: slugify(r.name) === 'shot' && !/shot/i.test(r.name) ? 'collection' : slugify(r.name),
    description: r.description,
    isPrivate: r.isPrivate,
    owner: {
      id: r.ownerId,
      username: r.ownerUsername,
      displayName: r.ownerName,
      avatarKey: r.ownerAvatarKey,
      isTeam: r.ownerKind === 'team',
      isFeaturedStudio: r.ownerFeatured,
    },
    shotsCount: st.count,
    designersCount: st.designers,
    covers: st.covers.map((c) => ({ key: c.key, width: c.width, height: c.height, dominantColor: c.color, alt: c.title })),
    updatedAt: new Date(r.updatedAt).toISOString(),
  };
}

/** Visible to this viewer? Owner: always. Staff: unless the owner is deleted. Others: public, not hidden, owner active. */
async function visible(id: number, viewer: Viewer): Promise<repo.CollectionRow> {
  const r = await repo.findById(id);
  if (!r || r.ownerDeletedAt) throw new AppError('NOT_FOUND');
  const own = viewer.kind === 'member' && viewer.profileId === r.ownerId;
  if (own) return r;
  if (isStaff(viewer)) return r;
  if (r.isPrivate || r.hiddenAt || r.ownerSuspendedAt) throw new AppError('NOT_FOUND');
  return r;
}

async function owned(id: number, viewer: Viewer) {
  const member = requireMember(viewer);
  const r = await repo.findById(id);
  if (!r || r.ownerDeletedAt) throw new AppError('NOT_FOUND');
  if (r.ownerId !== member.profileId) {
    // Others never learn that a private collection exists (BR-54); a visible one is 403 (FR-46).
    if (r.isPrivate || r.hiddenAt) throw new AppError('NOT_FOUND');
    throw new AppError('FORBIDDEN', 'This collection belongs to someone else.');
  }
  return { member, row: r };
}

function uniqueViolation(e: unknown) {
  const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? '')}` : '';
  return /UNIQUE constraint failed: collections\.owner_id, collections\.name_key/i.test(msg);
}

/** Profile Collections tab (FR-56). Owner sees private ones too. */
export async function listForProfile(username: string, viewer: Viewer, q: { cursor?: string | null; limit?: number }): Promise<Page<CollectionSummary>> {
  const profile = await users.getPublicProfile(username, viewer);
  const own = viewer.kind === 'member' && viewer.profileId === profile.id;
  const size = Math.min(Math.max(q.limit ?? 24, 1), 48);
  const key = `collections:${profile.id}:${own ? 'own' : 'public'}`;
  const rows = await repo.listByOwner(profile.id, own, decodeCursor(q.cursor, key), size + 1);
  const page = rows.slice(0, size);
  const stats = await repo.statsFor(page.map((r) => r.id), Date.now());
  const last = page[page.length - 1];
  return { items: page.map((r) => summary(r, stats)), nextCursor: rows.length > size && last ? encodeCursor(key, [last.updatedAt, last.id]) : null };
}

export async function create(viewer: Viewer, input: z.input<typeof collectionInput>): Promise<CollectionSummary> {
  const member = requireMember(viewer);
  const v = validate(collectionInput, input);
  await limit('RL-CONTENT', `p:${member.profileId}`);
  let id: number | null;
  try {
    id = await repo.insert(member.profileId, v.name, v.description, v.isPrivate, Date.now());
  } catch (e) {
    if (uniqueViolation(e)) throw new AppError('CONFLICT', 'You already have a collection with this name.', { fields: { name: 'You already have a collection with this name.' } });
    throw e;
  }
  if (id === null) throw new AppError('QUOTA_EXCEEDED', `You can have at most ${repo.MAX_COLLECTIONS} collections.`);
  const row = (await repo.findById(id))!;
  return summary(row, await repo.statsFor([id], Date.now()));
}

export async function update(viewer: Viewer, id: number, input: z.input<typeof collectionPatch>): Promise<CollectionSummary> {
  const { member } = await owned(id, viewer);
  const v = validate(collectionPatch, input);
  await limit('RL-CONTENT', `p:${member.profileId}`);
  try {
    await repo.update(id, v, Date.now());
  } catch (e) {
    if (uniqueViolation(e)) throw new AppError('CONFLICT', 'You already have a collection with this name.', { fields: { name: 'You already have a collection with this name.' } });
    throw e;
  }
  const row = (await repo.findById(id))!;
  return summary(row, await repo.statsFor([id], Date.now()));
}

export async function remove(viewer: Viewer, id: number): Promise<{ deleted: true }> {
  const { member } = await owned(id, viewer);
  await limit('RL-CONTENT', `p:${member.profileId}`);
  await repo.remove(id);
  return { deleted: true };
}

export async function shotsPage(id: number, viewer: Viewer, q: { cursor?: string | null; limit?: number }): Promise<Page<ShotCard>> {
  await visible(id, viewer);
  const size = Math.min(Math.max(q.limit ?? 24, 1), 48);
  const key = `collection:${id}`;
  const rows = await repo.pageShotIds(id, Date.now(), decodeCursor(q.cursor, key), size + 1);
  const page = rows.slice(0, size);
  const items = await shots.cardsInOrder(page.map((r) => r.id), viewer, likes.lookupFor(viewer));
  const last = page[page.length - 1];
  return { items, nextCursor: rows.length > size && last ? encodeCursor(key, [last.at, last.id]) : null };
}

export async function detail(id: number, viewer: Viewer): Promise<CollectionDetail> {
  const r = await visible(id, viewer);
  const [stats, first] = await Promise.all([repo.statsFor([id], Date.now()), shotsPage(id, viewer, {})]);
  return {
    ...summary(r, stats),
    isOwn: viewer.kind === 'member' && viewer.profileId === r.ownerId,
    shots: first.items,
    shotsNextCursor: first.nextCursor,
  };
}

/** Save / unsave (FR-47, BR-55). Saving needs an eligible shot (404); removing always works. RL-SOCIAL. */
export async function setSaved(viewer: Viewer, collectionId: number, shotId: number, on: boolean): Promise<SaveResult> {
  const { member } = await owned(collectionId, viewer);
  await limit('RL-SOCIAL', `p:${member.profileId}`);
  if (on) await shots.requireEligible(shotId);
  const r = await repo.setItem(collectionId, shotId, on, Date.now());
  if (on && !r.inside) throw new AppError('QUOTA_EXCEEDED', `A collection holds at most ${repo.MAX_ITEMS} shots.`);
  return { collectionId, saved: r.inside, savesCount: r.savesCount, collectionShotsCount: r.shotsCount };
}

/** The viewer's collections for the save picker, with membership of `shotId` (FR-47). */
export async function picker(viewer: Viewer, shotId: number | null): Promise<SaveTarget[]> {
  const member = requireMember(viewer);
  const rows = await repo.pickerFor(member.profileId, shotId);
  return rows.map((r) => ({ id: Number(r.id), name: r.name, isPrivate: Boolean(r.isPrivate), contains: Boolean(r.contains), shotsCount: Number(r.n) }));
}

export async function savedAmong(viewer: Viewer, shotIds: number[]): Promise<Set<number>> {
  if (viewer.kind !== 'member') return new Set();
  return repo.savedAmong(viewer.profileId, shotIds);
}

export const setHidden = (id: number, hidden: boolean) => repo.setHidden(id, hidden, Date.now());
export const exists = async (id: number) => Boolean(await repo.findById(id));
export const ownerOf = async (id: number) => (await repo.findById(id))?.ownerId ?? null;
export const removeAllFor = (ownerId: number) => repo.removeAllFor(ownerId);
export const removeShotEverywhere = (shotId: number) => repo.removeShotEverywhere(shotId);
export const reconcile = () => repo.reconcile();
export const findTarget = (id: number) => repo.findById(id);
