import { z } from 'zod';
import { getViewer } from '@/modules/auth/service';
import * as composer from '@/modules/composer/service';
import { cursorSchema, limitSchema } from '@/modules/feed/schemas';
import { jsonPage } from '@/server/http';
import { queryOf, route } from '@/server/route';

const query = z.object({ status: z.enum(['draft', 'published']).default('draft'), cursor: cursorSchema, limit: limitSchema });

/** GET /api/me/shots?status=draft|published (FR-64): the member's own shots, newest update first. */
export const GET = route(async (req) => {
  const q = query.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  return jsonPage(await composer.listOwn(viewer, q.status, q), q.limit);
});
