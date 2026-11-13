import { getViewer } from '@/modules/auth/service';
import * as search from '@/modules/search/service';
import { searchQuery } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

/**
 * GET /api/search/shots?q&cursor (D-06, BR-38, BR-39). Public. The normalised term is echoed in `term`; when
 * a search has no results, `relatedTags` is included so the empty state can suggest something (FR-32).
 */
export const GET = route(async (req) => {
  const q = searchQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  const page = await search.searchShots(q.q, q.cursor, viewer);
  const extra: Record<string, unknown> = { term: page.term };
  if (!q.cursor) extra.relatedTags = await search.relatedTags(page.term);
  return jsonPage(page, 24, extra);
});
