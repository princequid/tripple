import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** PATCH /api/teams/:username/profile (BR-58): owner/admin; same body and rules as PATCH /api/me/profile. */
export const PATCH = route<{ username: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.updateProfile(viewer, params.username, await readJson(req)));
});
