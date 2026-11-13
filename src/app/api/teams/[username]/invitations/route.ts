import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/teams/:username/invitations { username, role? } (BR-58): owner/admin (admins invite members only). 201. 409 already member/invited, 422 QUOTA_EXCEEDED (100 members). */
export const POST = route<{ username: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.invite(viewer, params.username, await readJson(req)), { status: 201 });
});
