import { getViewer } from '@/modules/auth/service';
import * as collections from '@/modules/collections/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/**
 * PUT /api/collections/:id/shots/:shotId → save · DELETE → remove (FR-47, BR-55). Set semantics. Owner only;
 * saving an ineligible shot → 404; full collection → 422 QUOTA_EXCEEDED; 429 RL-SOCIAL.
 */
function handler(on: boolean) {
  return route<{ id: string; shotId: string }>(async (req, { params }) => {
    assertSameOrigin(req);
    const id = parseId(params.id);
    const shotId = parseId(params.shotId);
    const viewer = await getViewer(req.headers);
    return json(await collections.setSaved(viewer, id, shotId, on));
  });
}

export const PUT = handler(true);
export const DELETE = handler(false);
