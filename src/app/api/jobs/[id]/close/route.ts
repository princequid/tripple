import { getViewer } from '@/modules/auth/service';
import * as jobs from '@/modules/jobs/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/** POST /api/jobs/:id/close (BR-73): poster closes an active job early. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await jobs.close(viewer, id));
});
