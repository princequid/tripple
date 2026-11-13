import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/** POST /api/me/invitations/:id/accept (BR-58): 409 CONFLICT if expired or no longer pending; 422 QUOTA_EXCEEDED (10 teams). */
export const POST = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.respond(viewer, parseId(params.id), true));
});
