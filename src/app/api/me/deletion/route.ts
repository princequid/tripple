import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/me/deletion { code } (BR-24): deletes the account now (soft) and purges personal data after 30 days. Sessions end. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.confirmDeletion(viewer, await readJson(req)));
});
