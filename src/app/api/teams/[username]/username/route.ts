import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** PUT /api/teams/:username/username { username } (BR-23, BR-58): owner only. */
export const PUT = route<{ username: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.changeUsername(viewer, params.username, await readJson(req)));
});
