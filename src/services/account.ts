/** Settings (A-07, P-06), sessions, teams (P-05, BR-57/58), full onboarding (FR-18). R2. Live: API_SPECIFICATION §5.6–5.7. */
import { api, type ApiResult } from '@/lib/api-client';
import { isMock } from './config';
import * as m from './mock/account';
import type { AccountSettings, OnboardingDetails, ProfileSettings, SessionRow, TeamAdmin, TeamInvitation, TeamMembership } from './contracts';

export type { TeamOp } from './mock/account';
import type { TeamOp } from './mock/account';
export { validateProfile } from './mock/account';

const send = (method: string, body?: unknown): RequestInit => ({ method, body: JSON.stringify(body ?? {}) });
const u = encodeURIComponent;

/** Live ProfileSettings uses null for empty text; forms use ''. */
type LiveProfile = Omit<ProfileSettings, 'headline' | 'bio' | 'location' | 'websiteUrl' | 'publicEmail'> & {
  headline: string | null; bio: string | null; location: string | null; websiteUrl: string | null; publicEmail: string | null;
};
const fromLive = (p: LiveProfile): ProfileSettings => ({
  ...p,
  headline: p.headline ?? '', bio: p.bio ?? '', location: p.location ?? '', websiteUrl: p.websiteUrl ?? '', publicEmail: p.publicEmail ?? '',
  intents: p.intents ?? [], socialLinks: p.socialLinks ?? [],
});

export async function getProfileSettings(): Promise<ApiResult<ProfileSettings>> {
  if (isMock('settings')) return m.getProfileSettings();
  const r = await api<LiveProfile>('/api/me/profile');
  return r.ok ? { ...r, data: fromLive(r.data) } : r;
}
/** PATCH with the editable fields only; empty strings clear a field on the server. */
export async function saveProfileSettings(p: ProfileSettings): Promise<ApiResult<ProfileSettings>> {
  if (isMock('settings')) return m.saveProfileSettings(p);
  const { displayName, headline, bio, location, websiteUrl, publicEmail, skills, languages, socialLinks } = p;
  const r = await api<LiveProfile>('/api/me/profile', send('PATCH', { displayName, headline, bio, location, websiteUrl, publicEmail, skills, languages, socialLinks }));
  return r.ok ? { ...r, data: fromLive(r.data) } : r;
}

export const getAccount = () => (isMock('settings') ? m.getAccount() : api<AccountSettings>('/api/me/account'));
export const changeUsername = (username: string) => (isMock('settings') ? m.changeUsername(username) : api<{ username: string }>('/api/me/username', send('PUT', { username })));
/** Sends a code to the NEW address (live: POST /api/me/email/code). */
export const requestEmailChange = (email: string) => (isMock('settings') ? m.requestEmailChange(email) : api<{ sent: boolean }>('/api/me/email/code', send('POST', { email })));
/** Confirms an email change (`email` required) or the account deletion. */
export const confirmCode = (purpose: 'email' | 'delete', code: string, email?: string) =>
  isMock('settings') ? m.confirmCode(purpose, code) : api<{ done?: boolean }>(purpose === 'email' ? '/api/me/email' : '/api/me/deletion', send('POST', purpose === 'email' ? { email, code } : { code }));
export const requestDeletionCode = () => (isMock('settings') ? m.requestEmailChange('delete@confirm.test') : api<{ sent: boolean }>('/api/me/deletion/code', send('POST')));
export const listSessions = () => (isMock('settings') ? m.listSessions() : api<SessionRow[]>('/api/me/sessions'));
export const revokeSessions = (id: string | 'others') =>
  isMock('settings') ? m.revokeSessions(id) : id === 'others' ? api<{ revoked: number }>('/api/me/sessions/revoke-others', send('POST')) : api<null>(`/api/me/sessions/${u(id)}`, { method: 'DELETE' });

export async function myTeams(): Promise<ApiResult<{ teams: TeamMembership[]; invitations: TeamInvitation[] }>> {
  if (isMock('teams')) return m.myTeams();
  const [t, i] = await Promise.all([api<TeamMembership[]>('/api/me/teams'), api<TeamInvitation[]>('/api/me/invitations')]);
  if (!t.ok) return t;
  if (!i.ok) return i;
  return { ok: true, status: 200, data: { teams: t.data, invitations: i.data } };
}
export const answerInvitation = (id: number, accept: boolean) =>
  isMock('teams') ? m.answerInvitation(id, accept) : api<{ status: string }>(`/api/me/invitations/${id}/${accept ? 'accept' : 'decline'}`, send('POST'));
export async function createTeam(username: string, displayName: string): Promise<ApiResult<{ username: string }>> {
  if (isMock('teams')) return m.createTeam(username, displayName);
  const r = await api<TeamMembership>('/api/teams', send('POST', { username: username.trim().toLowerCase(), displayName: displayName.trim() }));
  return r.ok ? { ...r, data: { username: r.data.team.username } } : r;
}
export const getTeamAdmin = (username: string) => (isMock('teams') ? m.getTeamAdmin(username) : api<TeamAdmin>(`/api/teams/${u(username)}`));

/** Maps one admin action onto the team endpoints (BR-58 permissions are enforced by the server). */
export function teamAction(team: string, a: TeamOp): Promise<ApiResult<unknown>> {
  if (isMock('teams')) return m.teamAction(team, a);
  const base = `/api/teams/${u(team)}`;
  switch (a.op) {
    case 'invite':
      return api(`${base}/invitations`, send('POST', { username: a.username, role: a.role }));
    case 'cancel-invite':
      return api(`${base}/invitations/${a.id}`, { method: 'DELETE' });
    case 'role':
      return api(`${base}/members/${u(a.username)}`, send('PATCH', { role: a.role }));
    case 'remove':
      return api(`${base}/members/${u(a.username)}`, { method: 'DELETE' });
    case 'leave':
      return api(`${base}/members/${u(a.username)}`, { method: 'DELETE' });
    case 'transfer':
      return api(`${base}/transfer`, send('POST', { username: a.username }));
    case 'delete':
      return api(base, { method: 'DELETE' });
    case 'profile':
      return api(`${base}/profile`, send('PATCH', { displayName: a.displayName, headline: a.headline, websiteUrl: a.websiteUrl }));
  }
}

export const saveOnboardingDetails = (d: OnboardingDetails) => (isMock('onboarding') ? m.saveOnboardingDetails(d) : api<ProfileSettings>('/api/onboarding/details', send('POST', d)));
