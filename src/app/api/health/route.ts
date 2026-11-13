import * as platform from '@/modules/platform/service';
import { route } from '@/server/route';

/** GET /api/health (FR-07): 200 when the database answers, 503 SERVICE_UNAVAILABLE otherwise. Public, no data. */
export const GET = route(async () => {
  const h = await platform.health();
  return new Response(JSON.stringify({ data: h }), {
    status: h.ok ? 200 : 503,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
});
