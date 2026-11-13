import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/me/email/code { email } (FR-19): sends a 6-digit code to the NEW address. 429 per-email limits (BR-05/06). */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.requestEmailChange(viewer, await readJson(req)));
});
