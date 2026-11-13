import { getViewer } from '@/modules/auth/service';
import * as collections from '@/modules/collections/service';
import { pageQuery } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

/** GET /api/users/:username/collections (P-03, FR-56). Public ones; the owner also sees private ones (BR-54). */
export const GET = route<{ username: string }>(async (req, { params }) => {
  const q = pageQuery.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  return jsonPage(await collections.listForProfile(params.username, viewer, q), q.limit);
});
