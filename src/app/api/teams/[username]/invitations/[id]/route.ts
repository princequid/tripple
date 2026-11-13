import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/** DELETE /api/teams/:username/invitations/:id (BR-58): owner/admin revokes a pending invitation. */
export const DELETE = route<{ username: string; id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.revokeInvitation(viewer, params.username, parseId(params.id)));
});
