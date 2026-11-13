import { getViewer } from '@/modules/auth/service';
import { json } from '@/server/http';
import { route } from '@/server/route';

/**
 * GET /api/me (A-03): who the caller is. `{ kind: 'visitor' }`, `{ kind: 'pending' }` (must finish onboarding,
 * BR-16) or `{ kind: 'member', username, displayName, avatarKey, role }`. Never includes the email (BR-78)
 * except to a pending user, who needs it for the username suggestion.
 */
export const GET = route(async (req) => {
  const v = await getViewer(req.headers);
  if (v.kind === 'visitor') return json({ kind: 'visitor' });
  if (v.kind === 'pending') return json({ kind: 'pending', name: v.name });
  return json({ kind: 'member', username: v.username, displayName: v.displayName, avatarKey: v.avatarKey, role: v.role });
});
