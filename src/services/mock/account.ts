import type { AccountSettings, OnboardingDetails, ProfileSettings, SessionRow, TeamAdmin, TeamInvitation, TeamMembership, TeamRole } from '../contracts';
import { fixturePerson, getDb, nextId, now, person, save, type TeamRow } from './db';
import { fail, mockViewer, ok, read, write } from './runtime';
import { checkUsernameShape, normaliseUsername } from '@/lib/username';
import { ALL_PROFILES } from './fixtures';

const DAY = 86_400_000;

/** Starts from the real public profile (GET /api/users/:u, R1) and overlays saved mock edits. */
export const getProfileSettings = () =>
  read(async () => {
    const me = mockViewer();
    if (!me) return fail<ProfileSettings>(401, 'UNAUTHENTICATED', 'Sign in.');
    const d = await getDb();
    let base: Partial<ProfileSettings> = {};
    try {
      const r = await fetch(`/api/users/${encodeURIComponent(me.username)}`, { headers: { Accept: 'application/json' } });
      if (r.ok) {
        const p = ((await r.json()) as { data: Record<string, unknown> }).data;
        base = {
          displayName: String(p.displayName ?? ''), headline: String(p.headline ?? ''), bio: String(p.bio ?? ''), location: String(p.location ?? ''),
          websiteUrl: String(p.websiteUrl ?? ''), publicEmail: String(p.publicEmail ?? ''), skills: (p.skills as string[]) ?? [], languages: (p.languages as string[]) ?? [],
          avatarKey: (p.avatarKey as string | null) ?? null, socialLinks: (p.socialLinks as ProfileSettings['socialLinks']) ?? [],
        };
      }
    } catch {
      /* fall back to the viewer */
    }
    const f = fixturePerson(me.username);
    return ok<ProfileSettings>({
      displayName: me.displayName, headline: '', bio: '', location: '', websiteUrl: '', publicEmail: '', skills: [], languages: [], intents: [],
      avatarKey: me.avatarKey, socialLinks: [], ...base, ...(d.profiles[me.username] as Partial<ProfileSettings> | undefined),
    });
  });

export function validateProfile(p: ProfileSettings): Record<string, string> {
  const e: Record<string, string> = {};
  if (p.displayName.trim().length < 1 || p.displayName.trim().length > 50) e.displayName = 'Use 1–50 characters.';
  if (p.headline.length > 120) e.headline = 'Use at most 120 characters.';
  if (p.bio.length > 1000) e.bio = 'Use at most 1,000 characters.';
  if (p.location.length > 80) e.location = 'Use at most 80 characters.';
  if (p.websiteUrl && !/^https?:\/\/[^\s]+\.[^\s]+$/.test(p.websiteUrl.trim())) e.websiteUrl = 'Enter a full link starting with https://';
  if (p.publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.publicEmail.trim())) e.publicEmail = 'Enter a valid email address.';
  return e;
}

export const saveProfileSettings = (p: ProfileSettings) =>
  write(async (me) => {
    const errors = validateProfile(p);
    if (Object.keys(errors).length) return fail<ProfileSettings>(400, 'VALIDATION', 'Check the highlighted fields.', errors);
    const d = await getDb();
    d.profiles[me.username] = { ...p };
    save();
    return ok(p);
  });

export const getAccount = () =>
  read(async () => {
    const me = mockViewer();
    if (!me) return fail<AccountSettings>(401, 'UNAUTHENTICATED', 'Sign in.');
    const d = await getDb();
    const changed = (d.profiles[me.username]?.usernameChangedAt as string | undefined) ?? null;
    // The sign-in email is never exposed by the R1 API (BR-78); the live endpoint returns it masked.
    const email = null;
    return ok<AccountSettings>({ username: me.username, email, usernameChangedAt: changed, canChangeUsernameAt: changed ? new Date(new Date(changed).getTime() + 30 * DAY).toISOString() : null });
  });

/** BR-23: username change once per 30 days; same shape rules as onboarding. Mock only records the request. */
export const changeUsername = (next: string) =>
  write(async (me) => {
    const name = normaliseUsername(next);
    const shape = checkUsernameShape(name);
    if (shape) return fail<{ username: string }>(400, 'VALIDATION', shape === 'reserved' ? 'That username is reserved.' : 'Use 3–30 lower-case letters, numbers, "_" or "-".', { username: 'invalid' });
    if (ALL_PROFILES.some((p) => p.username === name)) return fail<{ username: string }>(409, 'USERNAME_TAKEN', 'That username is taken.', { username: 'taken' });
    const d = await getDb();
    const changed = d.profiles[me.username]?.usernameChangedAt as string | undefined;
    if (changed && Date.now() - new Date(changed).getTime() < 30 * DAY) return fail<{ username: string }>(429, 'TOO_SOON', 'You can change your username once every 30 days.');
    d.profiles[me.username] = { ...d.profiles[me.username], usernameChangedAt: now(), pendingUsername: name };
    save();
    return ok({ username: name });
  });

export const requestEmailChange = (email: string) =>
  write(async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail<{ sent: boolean }>(400, 'VALIDATION', 'Enter a valid email address.', { email: 'invalid' });
    return ok({ sent: true });
  });

/** Codes are 6 digits; the mock accepts any 6-digit code except 000000 (to exercise the error path). */
export const confirmCode = (purpose: 'email' | 'delete', code: string) =>
  write(async () => {
    if (!/^\d{6}$/.test(code)) return fail<{ done: boolean }>(400, 'VALIDATION', 'Enter the 6-digit code.');
    if (code === '000000') return fail<{ done: boolean }>(400, 'INVALID_CODE', 'That code is not correct. Check the email and try again.');
    return ok({ done: true, purpose });
  });

export const listSessions = () =>
  read(async () => {
    const me = mockViewer();
    if (!me) return fail<SessionRow[]>(401, 'UNAUTHENTICATED', 'Sign in.');
    const d = await getDb();
    const ua = typeof navigator === 'undefined' ? 'This browser' : /Mobile/.test(navigator.userAgent) ? 'Mobile browser' : 'Desktop browser';
    const all: SessionRow[] = [
      { id: 'current', device: `${ua} (this device)`, location: null, lastActiveAt: now(), current: true },
      { id: 's-phone', device: 'Safari on iPhone', location: 'Lyon, France', lastActiveAt: new Date(Date.now() - 2 * DAY).toISOString(), current: false },
      { id: 's-laptop', device: 'Firefox on Windows', location: 'Paris, France', lastActiveAt: new Date(Date.now() - 9 * DAY).toISOString(), current: false },
    ];
    return ok(all.filter((s) => !d.sessionsRevoked.includes(`${me.username}:${s.id}`)));
  });

export const revokeSessions = (id: string | 'others') =>
  write(async (me) => {
    const d = await getDb();
    const ids = id === 'others' ? ['s-phone', 's-laptop'] : [id];
    ids.forEach((x) => d.sessionsRevoked.push(`${me.username}:${x}`));
    save();
    return ok(null);
  });

// ---------- teams ----------
const roleOf = (t: TeamRow, u: string) => t.members.find((m) => m.username === u)?.role ?? null;

export const myTeams = () =>
  read(async () => {
    const me = mockViewer();
    if (!me) return fail<{ teams: TeamMembership[]; invitations: TeamInvitation[] }>(401, 'UNAUTHENTICATED', 'Sign in.');
    const d = await getDb();
    return ok({
      teams: d.teams.filter((t) => roleOf(t, me.username)).map<TeamMembership>((t) => ({ team: person(t.username), role: roleOf(t, me.username)!, membersCount: t.members.length })),
      invitations: d.invitations.filter((i) => i.invitee === me.username).map<TeamInvitation>((i) => ({ id: i.id, team: person(i.team), invitedBy: person(i.invitedBy), role: i.role, createdAt: i.createdAt })),
    });
  });

export const answerInvitation = (id: number, accept: boolean) =>
  write(async (me) => {
    const d = await getDb();
    const inv = d.invitations.find((i) => i.id === id && i.invitee === me.username);
    if (!inv) return fail<null>(404, 'NOT_FOUND', 'Invitation not found.');
    d.invitations = d.invitations.filter((i) => i !== inv);
    const team = d.teams.find((t) => t.username === inv.team);
    if (accept && team) {
      if (d.teams.filter((t) => roleOf(t, me.username)).length >= 10) return fail<null>(409, 'LIMIT_REACHED', 'You can belong to at most 10 teams.');
      team.members.push({ username: me.username, role: inv.role, joinedAt: now() });
    }
    save();
    return ok(null);
  });

export const createTeam = (username: string, displayName: string) =>
  write(async (me) => {
    const name = normaliseUsername(username);
    const shape = checkUsernameShape(name);
    const errors: Record<string, string> = {};
    if (shape) errors.username = shape === 'reserved' ? 'That username is reserved.' : 'Use 3–30 lower-case letters, numbers, "_" or "-".';
    const d = await getDb();
    if (!shape && (ALL_PROFILES.some((p) => p.username === name) || d.teams.some((t) => t.username === name) || name === me.username)) errors.username = 'That username is taken.';
    if (displayName.trim().length < 1 || displayName.trim().length > 50) errors.displayName = 'Use 1–50 characters.';
    if (Object.keys(errors).length) return fail<{ username: string }>(400, 'VALIDATION', 'Check the highlighted fields.', errors);
    if (d.teams.filter((t) => roleOf(t, me.username)).length >= 10) return fail<{ username: string }>(409, 'LIMIT_REACHED', 'You can belong to at most 10 teams.');
    d.teams.push({ username: name, displayName: displayName.trim(), headline: null, websiteUrl: null, members: [{ username: me.username, role: 'owner', joinedAt: now() }], pending: [] });
    save();
    return ok({ username: name });
  });

export const getTeamAdmin = (username: string) =>
  read(async () => {
    const me = mockViewer();
    const d = await getDb();
    const t = d.teams.find((x) => x.username === username);
    const role = t && me ? roleOf(t, me.username) : null;
    if (!t || !role) return fail<TeamAdmin>(404, 'NOT_FOUND', 'Team not found.');
    return ok<TeamAdmin>({
      team: { ...person(t.username), displayName: t.displayName, isTeam: true, headline: t.headline, websiteUrl: t.websiteUrl },
      myRole: role,
      members: t.members.map((m) => ({ person: person(m.username), role: m.role, joinedAt: m.joinedAt })),
      pending: t.pending,
    });
  });

type TeamOp =
  | { op: 'invite'; username: string; role: 'admin' | 'member' }
  | { op: 'cancel-invite'; id?: number; username: string }
  | { op: 'role'; username: string; role: 'admin' | 'member' }
  | { op: 'remove'; username: string }
  | { op: 'transfer'; username: string }
  | { op: 'leave'; username: string }
  | { op: 'delete' }
  | { op: 'profile'; displayName: string; headline: string; websiteUrl: string };

/** BR-58 role rules: owner does everything; admins invite/remove members and edit the profile. */
export const teamAction = (team: string, action: TeamOp) =>
  write(async (me) => {
    const d = await getDb();
    const t = d.teams.find((x) => x.username === team);
    const role = t ? roleOf(t, me.username) : null;
    if (!t || !role) return fail<null>(404, 'NOT_FOUND', 'Team not found.');
    const admin = role === 'owner' || role === 'admin';
    const deny = () => fail<null>(403, 'FORBIDDEN', 'You don’t have permission to do that.');
    switch (action.op) {
      case 'invite': {
        if (!admin) return deny();
        const name = normaliseUsername(action.username);
        if (!ALL_PROFILES.some((p) => p.username === name && !p.isTeam)) return fail<null>(404, 'NOT_FOUND', `No member is called @${name}.`, { username: 'not-found' });
        if (t.members.some((m) => m.username === name) || t.pending.some((p) => p.username === name)) return fail<null>(409, 'CONFLICT', `@${name} is already in the team or invited.`, { username: 'exists' });
        if (t.members.length + t.pending.length >= 100) return fail<null>(409, 'LIMIT_REACHED', 'Teams have at most 100 members.');
        t.pending.push({ username: name, role: action.role, createdAt: now() });
        d.invitations.push({ id: nextId(d), team, invitedBy: me.username, invitee: name, role: action.role, createdAt: now() });
        break;
      }
      case 'cancel-invite':
        if (!admin) return deny();
        t.pending = t.pending.filter((p) => p.username !== action.username);
        d.invitations = d.invitations.filter((i) => !(i.team === team && i.invitee === action.username));
        break;
      case 'role':
        if (role !== 'owner') return deny();
        t.members.forEach((m) => m.username === action.username && m.role !== 'owner' && (m.role = action.role));
        break;
      case 'remove': {
        const target = roleOf(t, action.username);
        if (!admin || target === 'owner' || (role === 'admin' && target === 'admin')) return deny();
        t.members = t.members.filter((m) => m.username !== action.username);
        break;
      }
      case 'transfer':
        if (role !== 'owner') return deny();
        t.members.forEach((m) => {
          if (m.username === action.username) m.role = 'owner';
          else if (m.username === me.username) m.role = 'admin';
        });
        break;
      case 'leave':
        if (role === 'owner') return fail<null>(409, 'OWNER_MUST_TRANSFER', 'Transfer ownership before leaving the team.');
        t.members = t.members.filter((m) => m.username !== me.username);
        break;
      case 'delete':
        if (role !== 'owner') return deny();
        d.teams = d.teams.filter((x) => x !== t);
        break;
      case 'profile':
        if (!admin) return deny();
        if (action.displayName.trim().length < 1 || action.displayName.trim().length > 50) return fail<null>(400, 'VALIDATION', 'Check the highlighted fields.', { displayName: 'Use 1–50 characters.' });
        if (action.websiteUrl && !/^https?:\/\/[^\s]+\.[^\s]+$/.test(action.websiteUrl)) return fail<null>(400, 'VALIDATION', 'Check the highlighted fields.', { websiteUrl: 'Enter a full link starting with https://' });
        Object.assign(t, { displayName: action.displayName.trim(), headline: action.headline.trim() || null, websiteUrl: action.websiteUrl.trim() || null });
        break;
    }
    save();
    return ok(null);
  });
export type { TeamOp, TeamRole };

export const saveOnboardingDetails = (details: OnboardingDetails) =>
  write(async (me) => {
    const d = await getDb();
    if (details.headline.length > 120) return fail<null>(400, 'VALIDATION', 'Check the highlighted fields.', { headline: 'Use at most 120 characters.' });
    d.profiles[me.username] = { ...d.profiles[me.username], headline: details.headline, location: details.location, skills: details.skills, onboarding: details };
    save();
    return ok(null);
  });
