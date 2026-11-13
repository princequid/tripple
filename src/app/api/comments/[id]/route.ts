import { getViewer } from '@/modules/auth/service';
import * as comments from '@/modules/comments/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, readJson, route } from '@/server/route';

/** PATCH /api/comments/:id { body } (BR-50): author only, within 15 minutes; else 403. */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await comments.edit(viewer, id, (await readJson(req)) as Parameters<typeof comments.edit>[2]));
});

/** DELETE /api/comments/:id (BR-50): author, shot author, team owner/admin or staff. `{ deleted, placeholder }`. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await comments.remove(viewer, id));
});
