import 'server-only';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit } from '@/server/rate-limit';
import {
  USERNAME_HINT,
  checkDisplayName,
  checkUsernameShape,
  normaliseUsername,
  usernameBaseFromEmail,
} from '@/lib/username';
import type { Viewer } from '@/modules/auth/types';
import { isStaff } from '@/modules/auth/types';
import * as repo from './repository';
import type { PublicProfile, UsernameCheck } from './types';

/**
 * Public profile (FR-54, FR-55). Suspended or deleted → NOT_FOUND except for staff (BR-25, BR-68).
 * `followLookup` (from the follows service) fills `isFollowing`; without it the field is null.
 */
export async function getPublicProfile(
  rawUsername: string,
  viewer: Viewer,
  followLookup?: (profileId: number) => Promise<boolean | null>,
): Promise<PublicProfile> {
  const username = normaliseUsername(rawUsername);
  if (checkUsernameShape(username) === 'invalid') throw new AppError('NOT_FOUND');
  const p = await repo.findByUsername(username);
  if (!p) throw new AppError('NOT_FOUND');
  if (p.deletedAt) throw new AppError('NOT_FOUND');
  if (p.suspendedAt && !isStaff(viewer)) throw new AppError('NOT_FOUND');
  const [links, people, isFollowing] = await Promise.all([
    repo.socialLinks(p.id),
    repo.teamPeople(p.id, p.kind === 'team' ? 'members' : 'teams'),
    followLookup ? followLookup(p.id) : Promise.resolve(null),
  ]);
  const visiblePeople = people
    .filter((x) => !x.suspendedAt && !x.deletedAt)
    .map((x) => ({ id: x.id, username: x.username, displayName: x.displayName, avatarKey: x.avatarKey, role: x.role }));
  return {
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    isTeam: p.kind === 'team',
    isFeaturedStudio: p.isFeaturedStudio,
    headline: p.headline,
    bio: p.bio,
    location: p.location,
    websiteUrl: p.websiteUrl,
    publicEmail: p.publicEmail,
    skills: p.skills ?? [],
    languages: p.languages ?? [],
    avatarKey: p.avatarKey,
    memberSince: p.createdAt.toISOString(),
    stats: { shots: p.shotsCount, likesReceived: p.likesReceivedCount, followers: p.followersCount, following: p.followingCount },
    socialLinks: links,
    members: p.kind === 'team' ? visiblePeople : [],
    teams: p.kind === 'team' ? [] : visiblePeople,
    isOwn: viewer.kind === 'member' && viewer.profileId === p.id,
    isFollowing,
    suspended: Boolean(p.suspendedAt),
  };
}

/** Username availability (FR-17, BR-18…BR-20). Rate limited RL-ACCOUNT (60/min for checks). */
export async function checkUsername(viewer: Viewer, raw: string): Promise<UsernameCheck> {
  if (viewer.kind === 'visitor') throw new AppError('UNAUTHENTICATED');
  await limit('RL-ACCOUNT-CHECK', `u:${viewer.userId}`);
  const username = normaliseUsername(raw);
  const problem = checkUsernameShape(username);
  if (problem) return { username, available: false, problem };
  const taken = await repo.isUsernameTaken(username);
  return { username, available: !taken, problem: taken ? 'taken' : null };
}

/** BR-21: suggestion from the email local part, with 2–4 random digits when taken or reserved. */
export async function suggestUsername(email: string): Promise<string> {
  const base = usernameBaseFromEmail(email);
  if (!checkUsernameShape(base) && !(await repo.isUsernameTaken(base))) return base;
  const existing = await repo.usernamesWithPrefix(base);
  for (let digits = 2; digits <= 4; digits++) {
    for (let i = 0; i < 10; i++) {
      const candidate = `${base}${randomInt(10 ** (digits - 1), 10 ** digits)}`;
      if (!checkUsernameShape(candidate) && !existing.has(candidate)) return candidate;
    }
  }
  return `${base}${randomInt(10_000, 99_999)}`.slice(0, 30);
}

export const onboardingSchema = z.object({
  username: z.string().max(60),
  displayName: z.string().max(200),
});

/**
 * Completes onboarding (BR-16, BR-18…BR-22): creates the profile. Idempotent for the same name (returns ok);
 * a name claimed by someone else → USERNAME_TAKEN, including a lost race on the unique index (BR-19).
 */
export async function completeOnboarding(viewer: Viewer, input: z.infer<typeof onboardingSchema>): Promise<{ username: string }> {
  if (viewer.kind === 'visitor') throw new AppError('UNAUTHENTICATED');
  const { username: rawName, displayName: rawDisplay } = onboardingSchema.parse(input);
  const username = normaliseUsername(rawName);
  if (viewer.kind === 'member') {
    if (viewer.username === username) return { username };
    throw new AppError('FORBIDDEN', 'Your account is already set up.');
  }
  await limit('RL-ACCOUNT', `u:${viewer.userId}`);
  const shape = checkUsernameShape(username);
  if (shape === 'invalid') throw new AppError('VALIDATION', USERNAME_HINT, { fields: { username: USERNAME_HINT } });
  if (shape === 'reserved') {
    throw new AppError('USERNAME_RESERVED', 'This username is not available.', { fields: { username: 'This username is not available.' } });
  }
  const nameProblem = checkDisplayName(rawDisplay);
  if (nameProblem) throw new AppError('VALIDATION', nameProblem, { fields: { displayName: nameProblem } });
  try {
    await repo.insertProfile(viewer.userId, username, rawDisplay.trim(), Date.now());
  } catch (e) {
    const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? '')}` : '';
    if (!/UNIQUE constraint failed: profiles\.(username|user_id)/i.test(msg)) throw e;
    // A double submit by the same user violates both unique indexes and SQLite reports `username` first,
    // so check this user's own profile before blaming someone else (API_RESPONSE_CONVENTIONS §5: idempotent).
    const existing = await repo.findMemberByUserId(viewer.userId);
    if (existing?.username === username) return { username };
    if (existing) throw new AppError('FORBIDDEN', 'Your account is already set up.');
    throw new AppError('USERNAME_TAKEN', 'This username is taken.', { fields: { username: 'This username is taken.' } });
  }
  return { username };
}

export const findMemberByUserId = (userId: string) => repo.findMemberByUserId(userId);
export const findById = (id: number) => repo.findById(id);
export const findByUsername = (username: string) => repo.findByUsername(normaliseUsername(username));
export const setSuspended = (id: number, suspended: boolean) => repo.setSuspended(id, suspended, Date.now());
export const setRole = (id: number, role: 'member' | 'moderator' | 'admin') => repo.setRole(id, role, Date.now());
export const setFeatured = (id: number, featured: boolean) => repo.setFeatured(id, featured, Date.now());
export const teamRole = (teamId: number, memberId: number) => repo.teamRole(teamId, memberId);

/** BR-50, BR-51, BR-60: the shot's author, or an owner/admin of the shot's team, may manage it. */
export async function canManageShot(profileId: number, shot: { authorId: number; teamId: number | null }): Promise<boolean> {
  if (shot.authorId === profileId) return true;
  if (!shot.teamId) return false;
  const role = await repo.teamRole(shot.teamId, profileId);
  return role === 'owner' || role === 'admin';
}

// ---------------------------------------------------------------------------------------------------------
// R2: profile settings (FR-59), full onboarding (FR-18), username change (BR-23)
// ---------------------------------------------------------------------------------------------------------

const CONTROL_CHARS = /[\u0000-\u0008\u000b-\u001f\u007f]/;
const optText = (max: number, label: string) =>
  z
    .string()
    .max(max * 4)
    .transform((s) => s.trim())
    .pipe(z.string().max(max, `${label}: use at most ${max} characters.`))
    .refine((s) => !CONTROL_CHARS.test(s.replace(/\n/g, '')), `${label} contains characters that are not allowed.`)
    .nullish()
    .transform((s) => (s ? s : null));
const httpUrl = z
  .string()
  .trim()
  .max(255, 'Use at most 255 characters.')
  .refine((s) => {
    try {
      const u = new URL(s);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch {
      return false;
    }
  }, 'Enter a full web address starting with https://');
const wordList = (maxItems: number, label: string) =>
  z
    .array(z.string().trim().min(1).max(40, `${label}: each entry is at most 40 characters.`))
    .max(maxItems, `${label}: at most ${maxItems} entries.`)
    .transform((list) => {
      const seen = new Set<string>();
      return list.filter((x) => {
        const k = x.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    });

export const SOCIAL_PLATFORMS = ['x', 'instagram', 'linkedin', 'github', 'behance', 'website', 'other'] as const;
/** FR-18 intents. FR-18 names "share work" and "hire designers"; `discover` and `find-work` come from the frontend design (DECISION_LOG A-24). */
export const INTENTS = ['share', 'discover', 'hire', 'find-work'] as const;

export const profileSettingsInput = z
  .object({
    displayName: z.string().max(200),
    headline: optText(160, 'Headline'),
    bio: optText(1000, 'Bio'),
    location: optText(120, 'Location'),
    websiteUrl: z.union([z.literal(''), httpUrl]).nullish().transform((s) => (s ? s : null)),
    publicEmail: z
      .union([z.literal(''), z.string().trim().toLowerCase().max(254).email('Enter a valid email address.')])
      .nullish()
      .transform((s) => (s ? s : null)),
    skills: wordList(20, 'Skills'),
    languages: wordList(10, 'Languages'),
    socialLinks: z
      .array(z.object({ platform: z.enum(SOCIAL_PLATFORMS), url: httpUrl }))
      .max(6, 'Add at most 6 links.')
      .refine((l) => new Set(l.map((x) => x.platform)).size === l.length, 'One link per platform.'),
    avatarMediaId: z.string().max(64).nullable(),
  })
  .partial();

export const onboardingDetailsInput = z.object({
  headline: optText(160, 'Headline'),
  location: optText(120, 'Location'),
  intents: z.array(z.enum(INTENTS)).max(INTENTS.length).default([]),
  skills: wordList(20, 'Skills').default([]),
  avatarMediaId: z.string().max(64).nullish(),
});

export type ProfileSettings = {
  displayName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  skills: string[];
  languages: string[];
  intents: string[];
  avatarMediaId: string | null;
  avatarKey: string | null;
  socialLinks: { platform: string; url: string }[];
};

/** The editable profile (FR-59). Teams are edited through the teams module with the same shape. */
export async function settingsOf(profileId: number): Promise<ProfileSettings> {
  const p = await repo.settingsOf(profileId);
  if (!p) throw new AppError('NOT_FOUND');
  return {
    displayName: p.displayName,
    headline: p.headline,
    bio: p.bio,
    location: p.location,
    websiteUrl: p.websiteUrl,
    publicEmail: p.publicEmail,
    skills: p.skills ?? [],
    languages: p.languages ?? [],
    intents: p.intents ?? [],
    avatarMediaId: p.avatarMediaId,
    avatarKey: p.avatarKey,
    socialLinks: await repo.socialLinks(profileId),
  };
}

function validateInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const fields: Record<string, string> = {};
  for (const i of r.error.issues) fields[i.path.join('.') || '_'] ??= i.message;
  throw new AppError('VALIDATION', Object.values(fields)[0] ?? 'Invalid request.', { fields });
}

/**
 * Applies a validated settings patch to a profile (the caller has authorised the actor). `checkAvatar`
 * verifies the media belongs to the actor and is a ready avatar (media service).
 */
export async function applySettings(
  profileId: number,
  input: unknown,
  checkAvatar: (mediaId: string) => Promise<unknown>,
  refreshSearch: (displayName: string, username: string) => Promise<unknown>,
): Promise<ProfileSettings> {
  const v = validateInput(profileSettingsInput, input);
  const patch: repo.ProfilePatch = {};
  if (v.displayName !== undefined) {
    const problem = checkDisplayName(v.displayName);
    if (problem) throw new AppError('VALIDATION', problem, { fields: { displayName: problem } });
    patch.displayName = v.displayName.trim();
  }
  for (const k of ['headline', 'bio', 'location', 'websiteUrl', 'publicEmail', 'skills', 'languages'] as const) {
    if (v[k] !== undefined) (patch as Record<string, unknown>)[k] = v[k];
  }
  if (v.avatarMediaId !== undefined) {
    if (v.avatarMediaId !== null) await checkAvatar(v.avatarMediaId);
    patch.avatarMediaId = v.avatarMediaId;
  }
  await repo.updateProfile(profileId, patch, v.socialLinks, Date.now());
  if (patch.displayName) {
    const p = await repo.settingsOf(profileId);
    if (p) await refreshSearch(p.displayName, p.username);
  }
  return settingsOf(profileId);
}

export const parseOnboardingDetails = (input: unknown) => validateInput(onboardingDetailsInput, input);

export async function applyOnboardingDetails(profileId: number, v: z.output<typeof onboardingDetailsInput>) {
  await repo.updateProfile(
    profileId,
    {
      headline: v.headline,
      location: v.location,
      intents: v.intents,
      skills: v.skills,
      ...(v.avatarMediaId !== undefined ? { avatarMediaId: v.avatarMediaId } : {}),
    },
    undefined,
    Date.now(),
  );
  return settingsOf(profileId);
}

export const USERNAME_CHANGE_INTERVAL_MS = 30 * 86_400_000;

/** When the profile may change its username next (BR-23), or null if it may now. */
export function nextUsernameChangeAt(changedAt: Date | null, now = Date.now()): Date | null {
  if (!changedAt) return null;
  const next = changedAt.getTime() + USERNAME_CHANGE_INTERVAL_MS;
  return next > now ? new Date(next) : null;
}

/**
 * BR-23 username change: at most once per 30 days; same rules as onboarding (BR-18…BR-20); the old name is
 * held for this profile for 30 days; old URLs 404 (no redirects). Team usernames use the same function.
 */
export async function changeUsername(profileId: number, raw: string, refreshSearch: (displayName: string, username: string) => Promise<unknown>) {
  const p = await repo.settingsOf(profileId);
  if (!p) throw new AppError('NOT_FOUND');
  const username = normaliseUsername(String(raw ?? ''));
  if (username === p.username) return { username, changedAt: p.usernameChangedAt?.toISOString() ?? null };
  const next = nextUsernameChangeAt(p.usernameChangedAt);
  if (next) {
    throw new AppError('QUOTA_EXCEEDED', `You can change your username again on ${next.toISOString().slice(0, 10)}.`, {
      retryAfter: Math.ceil((next.getTime() - Date.now()) / 1000),
      fields: { username: 'Usernames can be changed once every 30 days.' },
    });
  }
  const shape = checkUsernameShape(username);
  if (shape === 'invalid') throw new AppError('VALIDATION', USERNAME_HINT, { fields: { username: USERNAME_HINT } });
  if (shape === 'reserved') {
    throw new AppError('USERNAME_RESERVED', 'This username is not available.', { fields: { username: 'This username is not available.' } });
  }
  if (await repo.isUsernameTaken(username, profileId)) {
    throw new AppError('USERNAME_TAKEN', 'This username is taken.', { fields: { username: 'This username is taken.' } });
  }
  const now = Date.now();
  try {
    await repo.changeUsername(profileId, p.username, username, now + USERNAME_CHANGE_INTERVAL_MS, now);
  } catch (e) {
    const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? '')}` : '';
    if (/UNIQUE constraint failed: profiles\.username/i.test(msg)) {
      throw new AppError('USERNAME_TAKEN', 'This username is taken.', { fields: { username: 'This username is taken.' } });
    }
    throw e;
  }
  await refreshSearch(p.displayName, username);
  return { username, changedAt: new Date(now).toISOString() };
}

export const ownedTeams = (profileId: number) => repo.ownedTeams(profileId);
export const softDelete = (profileId: number) => repo.softDelete(profileId, Date.now());
export const deletedBefore = (before: number, limit: number) => repo.deletedBefore(before, limit);
export const hardDelete = (profileId: number) => repo.hardDelete(profileId);
export const purgeExpiredHolds = () => repo.purgeExpiredHolds(Date.now());
export const isUsernameTaken = (username: string) => repo.isUsernameTaken(username);

/** BR-20/BR-57: validates a new team username and display name, then inserts the team profile. */
export async function createTeamProfile(rawUsername: string, rawDisplayName: string): Promise<{ id: number; username: string }> {
  const username = normaliseUsername(String(rawUsername ?? ''));
  const shape = checkUsernameShape(username);
  if (shape === 'invalid') throw new AppError('VALIDATION', USERNAME_HINT, { fields: { username: USERNAME_HINT } });
  if (shape === 'reserved') throw new AppError('USERNAME_RESERVED', 'This username is not available.', { fields: { username: 'This username is not available.' } });
  const nameProblem = checkDisplayName(String(rawDisplayName ?? ''));
  if (nameProblem) throw new AppError('VALIDATION', nameProblem, { fields: { displayName: nameProblem } });
  if (await repo.isUsernameTaken(username)) throw new AppError('USERNAME_TAKEN', 'This username is taken.', { fields: { username: 'This username is taken.' } });
  try {
    return { id: await repo.insertTeamProfile(username, String(rawDisplayName).trim(), Date.now()), username };
  } catch (e) {
    const msg = e instanceof Error ? `${e.message} ${String((e as { cause?: unknown }).cause ?? '')}` : '';
    if (/UNIQUE constraint failed: profiles\.username/i.test(msg)) {
      throw new AppError('USERNAME_TAKEN', 'This username is taken.', { fields: { username: 'This username is taken.' } });
    }
    throw e;
  }
}
