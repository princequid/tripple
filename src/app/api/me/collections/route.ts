import { z } from 'zod';
import { getViewer } from '@/modules/auth/service';
import * as collections from '@/modules/collections/service';
import { json } from '@/server/http';
import { queryOf, route } from '@/server/route';

const query = z.object({ shotId: z.coerce.number().int().positive().optional() });

/** GET /api/me/collections?shotId= (FR-47 save picker): the viewer's collections with `contains`. Members only. */
export const GET = route(async (req) => {
  const q = query.parse(queryOf(req));
  const viewer = await getViewer(req.headers);
  return json(await collections.picker(viewer, q.shotId ?? null));
});
