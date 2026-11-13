import { getViewer } from '@/modules/auth/service';
import * as reports from '@/modules/moderation/reports';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/**
 * POST /api/reports { targetType, targetId, reason, note? } (BR-69): 201 `{ status: "created" }`, or 200
 * `{ status: "already-reported" }` for a repeat (nothing created). 403 own content, 404 unknown target,
 * 400 VALIDATION (note required for "other"), 429 RL-REPORT (20/day).
 */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  const result = await reports.report(viewer, await readJson(req));
  return json(result, { status: result.status === 'created' ? 201 : 200 });
});
