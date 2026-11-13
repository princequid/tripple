import { getViewer } from '@/modules/auth/service';
import * as users from '@/modules/users/service';
import * as follows from '@/modules/follows/service';
import { json } from '@/server/http';
import { route } from '@/server/route';

/**
 * GET /api/users/:username (P-01, P-02). Public profile; never the sign-in email (BR-78). Suspended → 404.
 * R2: `stats.followers/following` and `isFollowing` (FR-48).
 */
export const GET = route<{ username: string }>(async (req, { params }) => {
  const viewer = await getViewer(req.headers);
  return json(await users.getPublicProfile(params.username, viewer, follows.lookupFor(viewer)));
});
