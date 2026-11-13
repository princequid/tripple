import { z } from 'zod';
import { getViewer } from '@/modules/auth/service';
import * as users from '@/modules/users/service';
import { json } from '@/server/http';
import { queryOf, route } from '@/server/route';

/** GET /api/onboarding/username?u= (M-07, FR-17, BR-18…BR-20). Signed-in only; RL-ACCOUNT-CHECK 60/min. */
const q = z.object({ u: z.string().max(60) });

export const GET = route(async (req) => {
  const { u } = q.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  return json(await users.checkUsername(viewer, u));
});
