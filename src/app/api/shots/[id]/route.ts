import { getViewer } from '@/modules/auth/service';
import * as shots from '@/modules/shots/service';
import * as likes from '@/modules/likes/service';
import * as collections from '@/modules/collections/service';
import * as follows from '@/modules/follows/service';
import { AppError } from '@/server/errors';
import { json } from '@/server/http';
import { shotIdParam } from '@/modules/shots/schemas';
import { assertSameOrigin, parseId, readJson, route } from '@/server/route';
import * as composer from '@/modules/composer/service';

/**
 * GET /api/shots/:id (SD-01, BR-37). Ineligible, hidden (non-staff) or malformed id → 404.
 * R2 adds savesCount, commentsCount, commentsDisabled, isSaved, isFollowingOwner (additive).
 */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const parsed = shotIdParam.safeParse(params.id);
  if (!parsed.success) throw new AppError('NOT_FOUND');
  const id = parsed.data;
  const viewer = await getViewer(req.headers);
  const [liked, saved] = await Promise.all([
    viewer.kind === 'member' ? likes.likedAmong(viewer, [id]) : Promise.resolve(new Set<number>()),
    collections.savedAmong(viewer, [id]),
  ]);
  const detail = await shots.getDetail(id, viewer, viewer.kind === 'member' ? liked.has(id) : null, { isSaved: saved.has(id) });
  const owner = detail.team ?? detail.author;
  return json({ ...detail, isFollowingOwner: await follows.lookupFor(viewer)(owner.id) });
});

/** PATCH /api/shots/:id (FR-63): author only; partial ShotDraftInput. Published shots must keep ≥ 1 image; team fixed after publish. */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await composer.update(viewer, id, await readJson(req)));
});

/** DELETE /api/shots/:id (FR-64, BR-65): author only; soft delete (404 at once), purge after 30 days. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await composer.remove(viewer, id));
});
