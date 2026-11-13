import * as account from '@/modules/account/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { route } from '@/server/route';

/** GET /api/me/sessions (FR-19): active sessions, newest activity first; `current` marks this one. No IPs or raw user agents. */
export const GET = route(async (req) => {
  const viewer = await getViewer(req.headers);
  return json(await account.sessions(viewer, req.headers));
});
