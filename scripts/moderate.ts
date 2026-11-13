/**
 * Operator moderation script (FR-09, BR-25, BR-67, BR-68; SECURITY_ARCHITECTURE M-12, M-13). R1 has no staff UI.
 *
 *   npm run moderate -- suspend <username> --reason "<at least 10 characters>" [--actor <staff username>]
 *   npm run moderate -- unsuspend <username> --reason "…"
 *   npm run moderate -- hide <shotId> --reason "…"
 *   npm run moderate -- unhide <shotId> --reason "…"
 *   npm run moderate -- role <username> <member|moderator|admin> --reason "…"     (operator only, no --actor)
 *   npm run moderate -- feature|unfeature <username> --reason "…"
 *
 * Every action writes an append-only audit row. `--actor` records which staff member asked for the action and
 * must name a moderator or admin; without it the actor is recorded as the operator.
 */
import os from 'node:os';
import { loadLocalEnv } from './_env';
loadLocalEnv();

const moderation = await import('../src/modules/moderation/service');
const users = await import('../src/modules/users/service');

const argv = process.argv.slice(2);
const flag = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const reason = flag('reason') ?? '';
const actorName = flag('actor');
const [command, target, extra] = argv;

function usage(msg?: string): never {
  if (msg) console.error(msg);
  console.error('Usage: npm run moderate -- <suspend|unsuspend|hide|unhide|role|feature|unfeature> <target> [role] --reason "…" [--actor <staff>]');
  process.exit(2);
}
if (!command || !target) usage();

let actor = { profileId: null as number | null, label: `operator:${os.userInfo().username}` };
if (actorName) {
  if (command === 'role') usage('Roles are granted by the operator only (BR-67); do not pass --actor.');
  const p = await users.findByUsername(actorName);
  if (!p || (p.role !== 'moderator' && p.role !== 'admin')) usage(`--actor @${actorName} is not a moderator or admin.`);
  actor = { profileId: p.id, label: `staff:${p.username}` };
}

const shotId = () => {
  const n = Number(target);
  if (!Number.isSafeInteger(n) || n <= 0) usage('Shot ID must be a positive integer.');
  return n;
};

try {
  let result: unknown;
  switch (command) {
    case 'suspend':
    case 'unsuspend':
      result = await moderation.setUserSuspended(actor, target, command === 'suspend', reason);
      break;
    case 'hide':
    case 'unhide':
      result = await moderation.setShotHidden(actor, shotId(), command === 'hide', reason);
      break;
    case 'role':
      if (extra !== 'member' && extra !== 'moderator' && extra !== 'admin') usage('Role must be member, moderator or admin.');
      result = await moderation.setRole(actor, target, extra, reason);
      break;
    case 'feature':
    case 'unfeature':
      result = await moderation.setFeatured(actor, target, command === 'feature', reason);
      break;
    default:
      usage(`Unknown command "${command}".`);
  }
  console.log(`${command} ${target}: done`, result);
  process.exit(0);
} catch (e) {
  const err = e as { code?: string; message?: string };
  console.error(`${command} ${target}: ${err.code ?? 'ERROR'} ${err.message ?? ''}`);
  process.exit(1);
}
