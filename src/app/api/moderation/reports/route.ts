import { getViewer } from '@/modules/auth/service';
import * as reports from '@/modules/moderation/reports';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

/** GET /api/moderation/reports?status=open|hidden|suspended|dismissed&cursor (BR-69, P10-27): staff only (403). */
export const GET = route(async (req) => {
  const viewer = await getViewer(req.headers);
  return jsonPage(await reports.queue(viewer, queryOf(req)), 24);
});
