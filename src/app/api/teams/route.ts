import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/teams { username, displayName } (FR-58, BR-57): creator becomes owner. 201 TeamMembership. 422 USERNAME_TAKEN/RESERVED, QUOTA_EXCEEDED (10 teams). */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.create(viewer, await readJson(req)), { status: 201 });
});
