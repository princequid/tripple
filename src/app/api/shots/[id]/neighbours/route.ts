import * as shots from '@/modules/shots/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { parseId, route } from '@/server/route';

/** GET /api/shots/:id/neighbours (SD-05, FR-44): { prev, next } within the owner's eligible shots in Work-tab (recent) order; null at either end. */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const viewer = await getViewer(req.headers);
  return json(await shots.neighbours(parseId(params.id), viewer));
});
