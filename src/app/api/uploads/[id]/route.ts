import * as uploads from '@/modules/media/uploads';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

/** GET /api/uploads/:id (FR-62): the upload's status and analysis (owner only). */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const viewer = await getViewer(req.headers);
  return json(await uploads.get(viewer, params.id));
});

/** DELETE /api/uploads/:id (FR-61 Remove): owner only; 409 while attached to a shot, avatar or logo. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await uploads.remove(viewer, params.id));
});
