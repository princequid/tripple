import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/** POST /api/onboarding/details { headline?, location?, intents?, skills?, avatarMediaId? } (FR-18 optional step). Members only. */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await account.onboardingDetails(viewer, await readJson(req)));
});
