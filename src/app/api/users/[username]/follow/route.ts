import { getViewer } from '@/modules/auth/service';
import * as follows from '@/modules/follows/service';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

/**
 * PUT /api/users/:username/follow → follow · DELETE → unfollow (S-03, FR-48, BR-56). Set semantics: repeats
 * return the same state. 401/403 ONBOARDING_REQUIRED, 403 CANNOT_FOLLOW_SELF, 404 hidden/unknown, 429
 * RL-SOCIAL. Same-origin required.
 */
function handler(on: boolean) {
  return route<{ username: string }>(async (req, { params }) => {
    assertSameOrigin(req);
    const viewer = await getViewer(req.headers);
    return json(await follows.setFollow(viewer, params.username, on));
  });
}

export const PUT = handler(true);
export const DELETE = handler(false);
