import { getViewer } from '@/modules/auth/service';
import * as collections from '@/modules/collections/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, readJson, route } from '@/server/route';

/** GET /api/collections/:id (FR-56): CollectionDetail with the first page of shots. Private/hidden → 404 (BR-54). */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const viewer = await getViewer(req.headers);
  return json(await collections.detail(parseId(params.id), viewer));
});

/** PATCH /api/collections/:id { name?, description?, isPrivate? } (FR-46): owner only. */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  const body = await readJson(req) as Parameters<typeof collections.update>[2];
  return json(await collections.update(viewer, id, body));
});

/** DELETE /api/collections/:id (FR-46, BR-55): owner only; items removed and saves decremented. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await collections.remove(viewer, id));
});
