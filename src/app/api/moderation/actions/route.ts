import { getViewer } from '@/modules/auth/service';
import * as reports from '@/modules/moderation/reports';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/**
 * POST /api/moderation/actions { targetType, targetId, action: hide|unhide|suspend|unsuspend, reason } (BR-68):
 * staff only; hide applies to shots, comments, collections and jobs; suspend applies to the target's owner. Audited.
 */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await reports.act(viewer, await readJson(req)));
});
