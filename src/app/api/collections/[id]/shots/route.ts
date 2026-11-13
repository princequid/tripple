import { getViewer } from '@/modules/auth/service';
import * as collections from '@/modules/collections/service';
import { pageQuery } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { parseId, queryOf, route } from '@/server/route';

/** GET /api/collections/:id/shots?cursor&limit (FR-56): eligible shots, newest save first. */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const id = parseId(params.id);
  const q = pageQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  return jsonPage(await collections.shotsPage(id, viewer, q), q.limit);
});
