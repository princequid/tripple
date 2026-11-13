import { getViewer } from '@/modules/auth/service';
import * as search from '@/modules/search/service';
import { tagShotsQuery } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

/** GET /api/tags/:tag/shots?sort&cursor (D-07, BR-41). 404 when the tag has no eligible shots. Public. */
export const GET = route<{ tag: string }>(async (req, { params }) => {
  const q = tagShotsQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  const { tag, count, ...page } = await search.tagPage(params.tag, q, viewer);
  return jsonPage(page, 24, { tag, count });
});
