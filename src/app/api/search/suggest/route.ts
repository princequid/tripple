import { z } from 'zod';
import * as search from '@/modules/search/service';
import { clientIp, json } from '@/server/http';
import { hashId } from '@/server/log';
import { limit } from '@/server/rate-limit';
import { queryOf, route } from '@/server/route';

const query = z.object({ q: z.string().max(200).default('') });

/** GET /api/search/suggest?q (FR-35): up to 8 suggestions (tags, designers) from 2 characters. Per-IP limit (hashed). */
export const GET = route(async (req) => {
  const q = query.parse(queryOf(req));
  await limit('RL-SEARCH-SUGGEST', `ip:${hashId(clientIp(req.headers))}`);
  return json(await search.suggest(q.q));
});
