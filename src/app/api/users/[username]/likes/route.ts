import { getViewer } from '@/modules/auth/service';
import * as likes from '@/modules/likes/service';
import { pageQuery } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

/** GET /api/users/:username/likes (P-04, FR-57): owner only, newest like first; anyone else 404. */
export const GET = route<{ username: string }>(async (req, { params }) => {
  const q = pageQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  return jsonPage(await likes.likedShots(viewer, params.username, q), q.limit);
});
