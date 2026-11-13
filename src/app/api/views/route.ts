import { after } from 'next/server';
import { getViewer } from '@/modules/auth/service';
import * as views from '@/modules/views/service';
import { viewBody } from '@/modules/views/schemas';
import { clientIp, noContent } from '@/server/http';
import { readJson, route } from '@/server/route';

/**
 * POST /api/views (M-10, D-10, BR-29…BR-31). Always 204: counting runs after the response (`after()`), is
 * de-duplicated per viewer/shot/UTC day, ignores bots and authors, and over-limit calls are dropped silently
 * (RL-VIEW, BR-76). Only a malformed body is an error (400), so broken clients are visible in logs.
 */
export const POST = route(async (req) => {
  const { shotId } = viewBody.parse(await readJson(req));
  const viewer = await getViewer(req.headers);
  const ip = clientIp(req.headers);
  const ua = req.headers.get('user-agent');
  after(() => views.recordSafely({ shotId, viewer, ip, ua }));
  return noContent();
});
