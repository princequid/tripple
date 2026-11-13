import { getViewer } from '@/modules/auth/service';
import * as users from '@/modules/users/service';
import { json } from '@/server/http';
import { assertSameOrigin, readJson, route } from '@/server/route';

/**
 * POST /api/onboarding { username, displayName } (A-06 minimal, M-08, BR-16…BR-22). Pending users only.
 * 201 with `{ username }`; idempotent for the same user and name; 422 USERNAME_TAKEN / USERNAME_RESERVED,
 * 400 VALIDATION with `fields`, 429 RL-ACCOUNT. Same-origin required.
 */
export const POST = route(async (req) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  const body = users.onboardingSchema.parse(await readJson(req));
  const result = await users.completeOnboarding(viewer, body);
  return json(result, { status: 201, headers: { Location: `/${result.username}` } });
});
