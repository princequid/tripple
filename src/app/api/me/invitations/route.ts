import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { route } from '@/server/route';

/** GET /api/me/invitations (BR-58): pending, unexpired team invitations for the member. */
export const GET = route(async (req) => {
  const viewer = await getViewer(req.headers);
  return json(await teams.myInvitations(viewer));
});
