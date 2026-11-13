import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/me/email { email, code } (FR-19): confirms the change. 400 INVALID_OTP/OTP_EXPIRED, 403 TOO_MANY_ATTEMPTS, 409 CONFLICT. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.confirmEmailChange(viewer, await readJson(req)));
});
