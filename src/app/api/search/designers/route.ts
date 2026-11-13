import { getViewer } from '@/modules/auth/service';
import * as search from '@/modules/search/service';
import * as follows from '@/modules/follows/service';
import { searchQuery } from '@/modules/feed/schemas';
import { queryOf, route } from '@/server/route';

/**
 * GET /api/search/designers?q&cursor (D-08, FR-35): active individuals and teams whose username or name
 * matches; PersonSummary list + `term`. Name/username prefix matches first, then followers, then shots.
 */
export const GET = route(async (req) => {
  const q = searchQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  const { items, nextCursor, term } = await search.searchDesigners(q.q, q.cursor, viewer, (ids) => follows.followingAmong(viewer, ids));
  return new Response(JSON.stringify({ data: items, page: { nextCursor, limit: 24 }, term }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
});
