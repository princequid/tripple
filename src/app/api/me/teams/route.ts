import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { route } from '@/server/route';

/** GET /api/me/teams (FR-58): the member's teams with role and member count (composer team picker, Settings › Teams). */
export const GET = route(async (req) => {
  const viewer = await getViewer(req.headers);
  return json(await teams.myTeams(viewer));
});
