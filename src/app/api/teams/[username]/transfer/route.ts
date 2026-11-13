import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/teams/:username/transfer { username } (BR-58): owner hands ownership to a current member; previous owner becomes admin. */
export const POST = route<{ username: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.transfer(viewer, params.username, await readJson(req)));
});
