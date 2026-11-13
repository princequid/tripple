/**
 * In-browser mock store. Seeded from fixtures plus the real R1 shot pool (GET /api/shots), persisted to
 * localStorage so mutations survive navigation. Reset with `resetMockDb()` (exposed at window.__tripppleMock).
 * Business rules the backend will own are mirrored only as far as the UI needs to behave (limits, idempotency).
 */
import type { PersonRef, ShotCard } from '../contracts';
import { ALL_PROFILES, COMMENT_LINES, JOB_SEEDS, PEOPLE, SERVICE_SEEDS, TEAMS, jobDescription } from './fixtures';
import { SERVICE_CATEGORIES, SPECIALTIES } from '../reference';
import { mockViewer } from './runtime';
import { slugify } from '@/lib/slug';

const KEY = 'trippple.mock.v1';
const DAY = 86_400_000;

export type CollectionRow = { id: number; owner: string; name: string; description: string | null; isPrivate: boolean; shotIds: number[]; updatedAt: string };
export type CommentRow = { id: number; shotId: number; author: string; body: string; createdAt: string; editedAt: string | null; deleted: boolean; parentId: number | null; likes: string[] };
export type ReportRow = { id: number; reporter: string; targetType: string; targetId: number; targetLabel: string; targetHref: string; reason: string; note: string | null; createdAt: string; status: 'open' | 'hidden' | 'dismissed' | 'suspended' };
export type JobRow = {
  id: number; owner: string; title: string; descriptionHtml: string; location: string; workplaceType: string; specialtySlug: string; employmentType: string;
  applyUrl: string; companyName: string; companyWebsite: string; companyLogoKey: string | null; postedAt: string; expiresAt: string; closed: boolean;
};
export type NotificationRow = { id: number; recipient: string; type: string; actors: string[]; target: { label: string; href: string; shotId: number | null } | null; createdAt: string; readAt: string | null };
export type ThreadRow = { id: number; members: [string, string]; context: { label: string; href: string } | null };
export type MessageRow = { id: number; threadId: number; from: string; body: string; createdAt: string; readBy: string[] };
export type ServiceRow = { id: number; seller: string; title: string; description: string; categorySlug: string; priceCents: number; deliveryDays: number; revisions: number; includes: string[]; coverShotId: number | null; coverKey: string | null; createdAt: string };
export type TeamRow = { username: string; displayName: string; headline: string | null; websiteUrl: string | null; members: { username: string; role: 'owner' | 'admin' | 'member'; joinedAt: string }[]; pending: { username: string; role: 'admin' | 'member'; createdAt: string }[] };
export type DraftRow = { id: number; owner: string; status: 'draft' | 'published'; data: unknown; updatedAt: string };

export type DB = {
  v: 1;
  seq: number;
  follows: string[]; // "follower>followee"
  blocks: string[]; // "blocker>blocked"
  collections: CollectionRow[];
  comments: CommentRow[];
  commentsDisabled: number[];
  reports: ReportRow[];
  jobs: JobRow[];
  notifications: NotificationRow[];
  threads: ThreadRow[];
  messages: MessageRow[];
  services: ServiceRow[];
  teams: TeamRow[];
  invitations: { id: number; team: string; invitedBy: string; invitee: string; role: 'admin' | 'member'; createdAt: string }[];
  profiles: Record<string, Record<string, unknown>>;
  sessionsRevoked: string[];
  drafts: DraftRow[];
  seededInbox: string[];
  seededComments: number[];
};

let pool: ShotCard[] | null = null;
let poolPromise: Promise<ShotCard[]> | null = null;

/** Every published seed shot, read once from the live R1 API (two pages of 48). */
export function shotPool(): Promise<ShotCard[]> {
  if (pool) return Promise.resolve(pool);
  poolPromise ??= (async () => {
    const out: ShotCard[] = [];
    let cursor: string | null = null;
    try {
      for (let i = 0; i < 3; i++) {
        const res: Response = await fetch(`/api/shots?sort=recent&limit=48${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { headers: { Accept: 'application/json' } });
        if (!res.ok) break;
        const body = (await res.json()) as { data: ShotCard[]; page?: { nextCursor: string | null } };
        out.push(...body.data);
        cursor = body.page?.nextCursor ?? null;
        if (!cursor) break;
      }
    } catch {
      /* offline: mock screens render without shot artwork */
    }
    pool = out;
    return out;
  })();
  return poolPromise;
}
export const shotById = (id: number) => pool?.find((s) => s.id === id) ?? null;

let db: DB | null = null;

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();

function seed(shots: ShotCard[]): DB {
  const d: DB = {
    v: 1, seq: 1000, follows: [], blocks: [], collections: [], comments: [], commentsDisabled: [], reports: [], jobs: [], notifications: [], threads: [], messages: [],
    services: [], teams: [], invitations: [], profiles: {}, sessionsRevoked: [], drafts: [], seededInbox: [], seededComments: [],
  };
  const ids = shots.map((s) => s.id);
  const pickIds = (start: number, n: number) => Array.from({ length: Math.min(n, ids.length) }, (_, i) => ids[(start + i * 7) % Math.max(1, ids.length)]!).filter((v, i, a) => a.indexOf(v) === i);
  // A small social graph between seed people.
  PEOPLE.forEach((a, i) => PEOPLE.forEach((b, j) => a !== b && (i + j) % 3 === 0 && d.follows.push(`${a.username}>${b.username}`)));
  TEAMS.forEach((t) => PEOPLE.slice(0, 8).forEach((pp) => d.follows.push(`${pp.username}>${t.username}`)));
  // Collections for the first people.
  const names = [
    ['Calm dashboards', 'Interfaces that stay quiet so the data can speak.'],
    ['Type I keep returning to', null],
    ['Packaging ideas', 'Labels, boxes and the small joys of unboxing.'],
    ['Onboarding flows', 'First-run experiences worth studying.'],
    ['Illustration crush', null],
    ['Colour studies', 'Palettes to borrow from.'],
    ['Mobile patterns', null],
  ] as const;
  names.forEach(([name, desc], i) => {
    const owner = PEOPLE[i % 8]!.username;
    d.collections.push({ id: ++d.seq, owner, name, description: desc, isPrivate: false, shotIds: pickIds(i * 5, 4 + (i % 4) * 3), updatedAt: iso((i + 1) * DAY) });
  });
  // Jobs.
  JOB_SEEDS.forEach((j) => {
    const posted = Date.now() - j.days * DAY;
    d.jobs.push({
      id: ++d.seq, owner: j.owner, title: j.title, descriptionHtml: jobDescription(j.title, j.company), location: j.location, workplaceType: j.workplace, specialtySlug: j.specialty,
      employmentType: j.employment, applyUrl: `${j.site}/careers`, companyName: j.company, companyWebsite: j.site, companyLogoKey: null,
      postedAt: new Date(posted).toISOString(), expiresAt: new Date(posted + 30 * DAY).toISOString(), closed: false,
    });
  });
  // Services.
  SERVICE_SEEDS.forEach((s, i) => {
    const authored = shots.filter((sh) => sh.author.username === s.seller);
    const cover = authored[0] ?? shots[i % Math.max(1, shots.length)] ?? null;
    d.services.push({
      id: ++d.seq, seller: s.seller, title: s.title, categorySlug: s.category, priceCents: s.price, deliveryDays: s.days, revisions: s.revisions, includes: [...s.includes],
      description: `${s.title}. I work closely with you from brief to final files, sharing progress at each step so there are no surprises. Tell me about your project and timeline in a message and I will reply within two working days.`,
      coverShotId: cover?.id ?? null, coverKey: null, createdAt: iso((i + 2) * DAY),
    });
  });
  // Teams (management state).
  TEAMS.forEach((t) => d.teams.push({ username: t.username, displayName: t.displayName, headline: t.headline, websiteUrl: null, members: t.members.map((m, i) => ({ ...m, joinedAt: iso((40 - i) * DAY) })), pending: [] }));
  // Open reports for the staff queue.
  shots.slice(0, 3).forEach((s, i) =>
    d.reports.push({ id: ++d.seq, reporter: PEOPLE[(i + 3) % 11]!.username, targetType: 'shot', targetId: s.id, targetLabel: s.title, targetHref: `/shots/${s.id}-${s.slug}`, reason: (['spam', 'ip', 'other'] as const)[i]!, note: i === 2 ? 'Looks like a copy of another designer’s poster.' : null, createdAt: iso((i + 1) * 3_600_000), status: 'open' }),
  );
  return d;
}

export async function getDb(): Promise<DB> {
  if (db) return db;
  const shots = await shotPool();
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DB;
        if (parsed.v === 1) db = parsed;
      }
    } catch {
      /* storage blocked: in-memory only */
    }
  }
  db ??= seed(shots);
  if (typeof window !== 'undefined') (window as unknown as { __tripppleMock: unknown }).__tripppleMock = { reset: resetMockDb, db };
  return db;
}

export function save() {
  if (!db || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* quota or blocked storage */
  }
}

export function resetMockDb() {
  db = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const nextId = (d: DB) => ++d.seq;
export const now = () => new Date().toISOString();

/** PersonRef for any username: fixture person/team, the viewer, or a neutral fallback. */
export function person(username: string): PersonRef {
  const f = ALL_PROFILES.find((x) => x.username === username);
  if (f) return { id: f.id, username: f.username, displayName: f.displayName, avatarKey: f.avatarKey, isTeam: f.isTeam, isFeaturedStudio: f.isFeaturedStudio };
  const team = db?.teams.find((t) => t.username === username);
  if (team) return { id: 900 + username.length, username, displayName: team.displayName, avatarKey: null, isTeam: true, isFeaturedStudio: false };
  const me = mockViewer();
  if (me && me.username === username) return { id: 999, username, displayName: me.displayName, avatarKey: me.avatarKey, isTeam: false, isFeaturedStudio: false };
  return { id: 0, username, displayName: username, avatarKey: null, isTeam: false, isFeaturedStudio: false };
}
export const fixturePerson = (username: string) => ALL_PROFILES.find((x) => x.username === username) ?? null;
export const specialtyBySlug = (s: string) => SPECIALTIES.find((x) => x.slug === s) ?? SPECIALTIES[0];
export const serviceCategory = (s: string) => SERVICE_CATEGORIES.find((x) => x.slug === s) ?? SERVICE_CATEGORIES[0];
export const jobSlug = (title: string) => slugify(title);

/** Deterministic seed comments for a shot, created the first time its thread is read. */
export function ensureComments(d: DB, shotId: number, ownerUsername: string) {
  if (d.seededComments.includes(shotId)) return;
  d.seededComments.push(shotId);
  const n = shotId % 4;
  for (let i = 0; i < n; i++) {
    const author = PEOPLE[(shotId + i * 3) % 11]!.username;
    if (author === ownerUsername) continue;
    const id = nextId(d);
    d.comments.push({ id, shotId, author, body: COMMENT_LINES[(shotId + i) % COMMENT_LINES.length]!, createdAt: iso((n - i) * 5 * 3_600_000), editedAt: null, deleted: false, parentId: null, likes: i === 0 ? [PEOPLE[2]!.username] : [] });
    if (i === 0 && ownerUsername) {
      d.comments.push({ id: nextId(d), shotId, author: ownerUsername, body: `@${author} thank you, that means a lot!`, createdAt: iso((n - i) * 4 * 3_600_000), editedAt: null, deleted: false, parentId: id, likes: [] });
    }
  }
}

/** Inbox content (notifications + threads) for a viewer, created on first use. */
export function ensureInbox(d: DB, me: string) {
  if (d.seededInbox.includes(me)) return;
  d.seededInbox.push(me);
  const shots = (pool ?? []).slice(0, 6);
  const others = PEOPLE.filter((x) => x.username !== me);
  const n = (type: string, actors: string[], target: NotificationRow['target'], hoursAgo: number, read = false) =>
    d.notifications.push({ id: nextId(d), recipient: me, type, actors, target, createdAt: iso(hoursAgo * 3_600_000), readAt: read ? iso(hoursAgo * 3_000_000) : null });
  const t = (i: number) => (shots[i] ? { label: shots[i]!.title, href: `/shots/${shots[i]!.id}-${shots[i]!.slug}`, shotId: shots[i]!.id } : null);
  n('like', [others[0]!.username, others[1]!.username, others[2]!.username], t(0), 0.3);
  n('follow', [others[3]!.username], null, 2);
  n('comment', [others[4]!.username], t(1), 5);
  n('save', [others[5]!.username], t(2), 26, true);
  n('reply', [others[6]!.username], t(1), 30, true);
  n('team-invite', [TEAMS[1]!.members[0]!.username], { label: TEAMS[1]!.displayName, href: '/settings/teams', shotId: null }, 50, true);
  if (!d.invitations.some((x) => x.invitee === me)) {
    d.invitations.push({ id: nextId(d), team: TEAMS[1]!.username, invitedBy: TEAMS[1]!.members[0]!.username, invitee: me, role: 'member', createdAt: iso(50 * 3_600_000) });
  }
  const convo: [string, string[], number][] = [
    [others[1]!.username, ['Hi! I saw your latest shot. Are you open to freelance work next month?', 'Yes, I have some time from the 10th. What is the project?', 'A small brand refresh for a tea shop. I will send the brief tomorrow.'], 1],
    [others[5]!.username, ['Thanks for the follow! Your colour work is great.'], 1],
    [others[7]!.username, ['Would you be up for a quick critique swap this week?', 'Sounds good. Thursday works for me.'], 0],
  ];
  convo.forEach(([other, lines, unread], ti) => {
    const id = nextId(d);
    d.threads.push({ id, members: [me, other], context: ti === 0 && shots[0] ? { label: shots[0].title, href: `/shots/${shots[0].id}-${shots[0].slug}` } : null });
    lines.forEach((body, li) => {
      const fromMe = li % 2 === 1;
      const isUnread = !fromMe && li >= lines.length - unread;
      d.messages.push({ id: nextId(d), threadId: id, from: fromMe ? me : other, body, createdAt: iso(((ti + 1) * 20 - li * 3) * 3_600_000), readBy: isUnread ? [other] : [me, other] });
    });
  });
}
