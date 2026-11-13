import { getViewer } from '@/modules/auth/service';
import * as comments from '@/modules/comments/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/** PUT /api/comments/:id/like → like · DELETE → unlike (BR-52). Own comment → 403 CANNOT_LIKE_OWN. RL-COMMENT. */
function handler(on: boolean) {
  return route<{ id: string }>(async (req, { params }) => {
    assertSameOrigin(req);
    const id = parseId(params.id);
    const viewer = await getViewer(req.headers);
    return json(await comments.setLike(viewer, id, on));
  });
}
export const PUT = handler(true);
export const DELETE = handler(false);
