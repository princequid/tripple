import 'server-only';
import { AppError } from '@/server/errors';
import * as auth from '@/modules/auth/service';
import * as users from '@/modules/users/service';
import * as shots from '@/modules/shots/service';
import * as repo from './repository';

/**
 * Moderation (FR-09, BR-67, BR-68). R1 entry point is the operator script `scripts/moderate.ts`; staff UI
 * arrives in R2. Every action writes an audit row with a reason of at least 10 characters.
 */
export type Actor = { profileId: number | null; label: string };

function requireReason(reason: string): string {
  const r = reason.trim();
  if (r.length < 10) throw new AppError('VALIDATION', 'A reason of at least 10 characters is required.', { fields: { reason: 'Too short' } });
  return r;
}

async function profileByUsername(username: string) {
  const p = await users.findByUsername(username);
  if (!p) throw new AppError('NOT_FOUND', `No profile @${username}.`);
  return p;
}

export async function setUserSuspended(actor: Actor, username: string, suspended: boolean, reason: string) {
  const why = requireReason(reason);
  const p = await profileByUsername(username);
  await users.setSuspended(p.id, suspended);
  // BR-25: suspension signs the account out everywhere.
  if (suspended && p.userId) await auth.revokeAllSessions(p.userId);
  await repo.insertAction(
    { actorProfileId: actor.profileId, actorLabel: actor.label, targetType: 'profile', targetId: String(p.id), action: suspended ? 'suspend' : 'unsuspend', reason: why },
    Date.now(),
  );
  return { profileId: p.id };
}

export async function setShotHidden(actor: Actor, shotId: number, hidden: boolean, reason: string) {
  const why = requireReason(reason);
  if (!(await shots.setHidden(shotId, hidden))) throw new AppError('NOT_FOUND', `No shot ${shotId}.`);
  await repo.insertAction(
    { actorProfileId: actor.profileId, actorLabel: actor.label, targetType: 'shot', targetId: String(shotId), action: hidden ? 'hide' : 'unhide', reason: why },
    Date.now(),
  );
  return { shotId };
}

export async function setRole(actor: Actor, username: string, role: 'member' | 'moderator' | 'admin', reason: string) {
  const why = requireReason(reason);
  const p = await profileByUsername(username);
  await users.setRole(p.id, role);
  await repo.insertAction(
    { actorProfileId: actor.profileId, actorLabel: actor.label, targetType: 'profile', targetId: String(p.id), action: role === 'member' ? 'revoke_role' : 'grant_role', reason: `${role}: ${why}` },
    Date.now(),
  );
  return { profileId: p.id, role };
}

export async function setFeatured(actor: Actor, username: string, featured: boolean, reason: string) {
  const why = requireReason(reason);
  const p = await profileByUsername(username);
  await users.setFeatured(p.id, featured);
  await repo.insertAction(
    { actorProfileId: actor.profileId, actorLabel: actor.label, targetType: 'profile', targetId: String(p.id), action: featured ? 'set_featured' : 'unset_featured', reason: why },
    Date.now(),
  );
  return { profileId: p.id };
}
