import { getViewer } from '@/modules/auth/service';
import * as follows from '@/modules/follows/service';
import { pageQuery } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

/** GET /api/users/:username/followers?cursor&limit (FR-48, BR-56): public, newest first. Hidden profile → 404. */
export const GET = route<{ username: string }>(async (req, { params }) => {
  const q = pageQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  return jsonPage(await follows.listPeople(viewer, params.username, 'followers', q), q.limit);
});
