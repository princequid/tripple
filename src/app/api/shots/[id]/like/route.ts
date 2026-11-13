import { getViewer } from '@/modules/auth/service';
import * as likes from '@/modules/likes/service';
import { shotIdParam } from '@/modules/shots/schemas';
import { AppError } from '@/server/errors';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

/**
 * PUT /api/shots/:id/like → like · DELETE → unlike (S-01, M-09). Set semantics: repeats are no-ops and return
 * the same state (API_RESPONSE_CONVENTIONS §5). Members only (401/403), own shot 403 CANNOT_LIKE_OWN,
 * ineligible 404, RL-SOCIAL 429. Same-origin required.
 */
function handler(liked: boolean) {
  return route<{ id: string }>(async (req, { params }) => {
    assertSameOrigin(req);
    const id = shotIdParam.safeParse(params.id);
    if (!id.success) throw new AppError('NOT_FOUND');
    const viewer = await getViewer(req.headers);
    return json(await likes.setLike(viewer, id.data, liked));
  });
}

export const PUT = handler(true);
export const DELETE = handler(false);
