import * as composer from '@/modules/composer/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { parseId, route } from '@/server/route';

/** GET /api/shots/:id/edit (FR-63): ShotDraft for the composer; author only (drafts are private, others 404). */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const viewer = await getViewer(req.headers);
  return json(await composer.getForEdit(viewer, parseId(params.id)));
});
