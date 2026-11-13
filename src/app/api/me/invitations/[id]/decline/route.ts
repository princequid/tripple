import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/** POST /api/me/invitations/:id/decline (BR-58). */
export const POST = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.respond(viewer, parseId(params.id), false));
});
