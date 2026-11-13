import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

/** POST /api/me/deletion/code (BR-24): emails a confirmation code to the sign-in address. 403 if the member owns a team. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.requestDeletion(viewer));
});
