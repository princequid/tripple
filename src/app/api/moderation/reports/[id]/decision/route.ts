import { getViewer } from '@/modules/auth/service';
import * as reports from '@/modules/moderation/reports';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, readJson, route } from '@/server/route';

/**
 * POST /api/moderation/reports/:id/decision { action: hide|suspend|dismiss, reason ≥ 10 chars } (BR-68/69):
 * staff only; resolves every open report on the same target; audited. 409 if already handled.
 */
export const POST = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const id = parseId(params.id);
  const viewer = await getViewer(req.headers);
  return json(await reports.decide(viewer, id, await readJson(req)));
});
