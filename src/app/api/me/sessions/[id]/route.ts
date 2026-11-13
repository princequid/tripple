import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

/** DELETE /api/me/sessions/:id (FR-19): revoke one other session; the current one → 403 (use sign-out); unknown → 404. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.revokeSession(viewer, req.headers, params.id));
});
