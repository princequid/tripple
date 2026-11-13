import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

/** POST /api/me/sessions/revoke-others (FR-19): signs out every other session. `{ revoked }`. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.revokeOtherSessions(viewer, req.headers));
});
