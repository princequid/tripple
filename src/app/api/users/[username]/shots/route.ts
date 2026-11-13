import { getViewer } from '@/modules/auth/service';
import * as users from '@/modules/users/service';
import * as feed from '@/modules/feed/service';
import { profileShotsQuery } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

/** GET /api/users/:username/shots?sort&cursor&limit (P-01 Work tab, BR-59). Public. */
export const GET = route<{ username: string }>(async (req, { params }) => {
  const q = profileShotsQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  const profile = await users.getPublicProfile(params.username, viewer);
  return jsonPage(await feed.byProfile(profile.id, q, viewer), q.limit);
});
