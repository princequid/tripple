import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** GET /api/me/profile (FR-59): the member's editable profile (ProfileSettings). */
export const GET = route(async (req) => {
  const viewer = await getViewer(req.headers);
  return json(await account.profileSettings(viewer));
});

/** PATCH /api/me/profile (FR-59, BR-22, BR-78): partial update; 400 VALIDATION with fields, 422 UNSUPPORTED_MEDIA (avatar), 429 RL-ACCOUNT. */
export const PATCH = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.updateProfileSettings(viewer, await readJson(req)));
});
