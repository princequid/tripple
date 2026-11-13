import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { route } from '@/server/route';

/** GET /api/me/account (FR-19): username, own sign-in email (owner only, BR-78), username-change dates (BR-23). */
export const GET = route(async (req) => {
  const viewer = await getViewer(req.headers);
  return json(await account.accountSettings(viewer));
});
