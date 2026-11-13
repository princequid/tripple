import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** PUT /api/me/username { username } (BR-23): once per 30 days (422 QUOTA_EXCEEDED + retryAfter); 422 USERNAME_TAKEN/RESERVED; 400 VALIDATION. */
export const PUT = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.changeUsername(viewer, await readJson(req)));
});
