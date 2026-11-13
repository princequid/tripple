import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** PATCH /api/teams/:username/members/:member { role: admin|member } (BR-58): owner only. */
export const PATCH = route<{ username: string; member: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.setMemberRole(viewer, params.username, params.member, await readJson(req)));
});

/** DELETE /api/teams/:username/members/:member (BR-58, BR-60): remove (owner/admin) or leave (self). Owner cannot leave or be removed. */
export const DELETE = route<{ username: string; member: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.removeMember(viewer, params.username, params.member));
});
