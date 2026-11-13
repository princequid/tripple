import { getViewer } from '@/modules/auth/service';
import * as jobs from '@/modules/jobs/service';
import { jsonPage } from '@/server/http';
import { route } from '@/server/route';

/** GET /api/me/jobs?cursor (FR-70): the member's own job posts, every status, newest first. */
export const GET = route(async (req) => {
  const viewer = await getViewer(req.headers);
  return jsonPage(await jobs.mine(viewer, { cursor: new URL(req.url).searchParams.get('cursor') }), jobs.PAGE_SIZE);
});
