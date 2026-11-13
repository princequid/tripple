import * as composer from '@/modules/composer/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, parseId, route } from '@/server/route';

/** POST /api/shots/:id/publish (FR-64, BR-64/65): validates and publishes once; 422 QUOTA_EXCEEDED (10/day, retryAfter). Repeat = same result. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await composer.publish(viewer, parseId(params.id)));
});
