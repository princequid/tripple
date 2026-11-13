import { getViewer } from '@/modules/auth/service';
import * as jobs from '@/modules/jobs/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, readJson, route } from '@/server/route';

/** GET /api/jobs/:id (J-02, FR-68, BR-73/74): expired/closed jobs stay reachable with applyUrl null and noindex. */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const viewer = await getViewer(req.headers);
  return json(await jobs.get(viewer, parseId(params.id)));
});

/** PATCH /api/jobs/:id (BR-73): poster only, active jobs only; full JobInput; re-sanitised (BR-72). */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await jobs.update(viewer, id, await readJson(req)));
});
