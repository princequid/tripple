import * as teams from '@/modules/teams/service';
import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { assertSameOrigin, route } from '@/server/route';

/** GET /api/teams/:username (FR-58 team settings): TeamAdmin for any member (pending invitations only for owner/admin). Non-member → 403. */
export const GET = route<{ username: string }>(async (req, { params }) => {
  const viewer = await getViewer(req.headers);
  return json(await teams.admin(viewer, params.username));
});

/** DELETE /api/teams/:username (BR-58): owner only. Team profile removed; team shots keep their authors (BR-60). */
export const DELETE = route<{ username: string }>(async (req, { params }) => {
  assertSameOrigin(req);
  const viewer = await getViewer(req.headers);
  return json(await teams.remove(viewer, params.username));
});
