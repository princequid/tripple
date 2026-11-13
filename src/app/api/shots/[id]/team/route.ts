import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/** DELETE /api/shots/:id/team (BR-60): team owner/admin removes the team attribution; the shot stays on its author's profile. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.removeAttribution(viewer, parseId(params.id)));
});
