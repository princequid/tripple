import type {
  CollectionDetail, CollectionInput, CollectionSummary, CommentDto, CommentThread, FollowState, Paged, PersonSummary, ProfileSocial,
  ReportDecision, ReportInput, ReportResult, ReportRow, SaveTarget, ShotCard, ShotNeighbours, BlockedRow,
} from '../contracts';
import { ensureComments, fixturePerson, getDb, nextId, now, person, save, shotById, shotPool, type CollectionRow, type CommentRow, type DB } from './db';
import { fail, forcedEmpty, mockViewer, ok, paginate, read, write } from './runtime';
import { slugify } from '@/lib/slug';

const edge = (a: string, b: string) => `${a}>${b}`;
const followersOf = (d: DB, u: string) => d.follows.filter((f) => f.endsWith(`>${u}`)).map((f) => f.split('>')[0]!);
const followingOf = (d: DB, u: string) => d.follows.filter((f) => f.startsWith(`${u}>`)).map((f) => f.split('>')[1]!);

function summary(d: DB, username: string): PersonSummary {
  const me = mockViewer()?.username;
  const f = fixturePerson(username);
  return {
    ...person(username),
    headline: f?.headline ?? null,
    location: f?.location ?? null,
    followersCount: followersOf(d, username).length,
    isFollowing: me && me !== username ? d.follows.includes(edge(me, username)) : null,
    isOwn: me === username,
  };
}
export const personSummary = summary;

// ---------- follows ----------
export const getSocial = (username: string) =>
  read(async () => {
    const d = await getDb();
    const me = mockViewer()?.username;
    return ok<ProfileSocial>({
      followersCount: followersOf(d, username).length,
      followingCount: followingOf(d, username).length,
      isFollowing: me && me !== username ? d.follows.includes(edge(me, username)) : null,
      isBlocked: Boolean(me && d.blocks.includes(edge(me, username))),
    });
  });

export const setFollow = (username: string, follow: boolean) =>
  write(async (me) => {
    const d = await getDb();
    if (me.username === username) return fail<FollowState>(400, 'CANNOT_FOLLOW_SELF', 'You cannot follow yourself.');
    if (fixturePerson(username)?.isTeam === false && d.blocks.includes(edge(username, me.username))) return fail<FollowState>(403, 'BLOCKED', 'You can’t follow this member.');
    const e = edge(me.username, username);
    d.follows = d.follows.filter((x) => x !== e);
    if (follow) {
      d.follows.push(e);
      d.notifications.push({ id: nextId(d), recipient: username, type: 'follow', actors: [me.username], target: null, createdAt: now(), readAt: null });
    }
    save();
    return ok<FollowState>({ following: follow, followersCount: followersOf(d, username).length });
  });

export const listFollows = (username: string, which: 'followers' | 'following', cursor: string | null) =>
  read(async () => {
    const d = await getDb();
    const names = which === 'followers' ? followersOf(d, username) : followingOf(d, username);
    return paginate(names.map((n) => summary(d, n)), cursor, 24);
  });

// ---------- collections ----------
async function toSummary(c: CollectionRow): Promise<CollectionSummary> {
  await shotPool();
  const shots = c.shotIds.map(shotById).filter((s): s is ShotCard => Boolean(s));
  return {
    id: c.id,
    name: c.name,
    slug: slugify(c.name),
    description: c.description,
    isPrivate: c.isPrivate,
    owner: person(c.owner),
    shotsCount: c.shotIds.length,
    designersCount: new Set(shots.map((s) => s.author.username)).size,
    covers: shots.slice(0, 4).flatMap((s) => (s.cover ? [s.cover] : [])),
    updatedAt: c.updatedAt,
  };
}

export const listCollections = (username: string) =>
  read(async () => {
    const d = await getDb();
    const me = mockViewer()?.username;
    const rows = d.collections.filter((c) => c.owner === username && (!c.isPrivate || c.owner === me)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return ok<CollectionSummary[]>(forcedEmpty() ? [] : await Promise.all(rows.map(toSummary)));
  });

export const getCollection = (id: number) =>
  read(async () => {
    const d = await getDb();
    const c = d.collections.find((x) => x.id === id);
    const me = mockViewer()?.username;
    if (!c || (c.isPrivate && c.owner !== me)) return fail<CollectionDetail>(404, 'NOT_FOUND', 'This collection does not exist or is private.');
    const s = await toSummary(c);
    const shots = forcedEmpty() ? [] : c.shotIds.map(shotById).filter((x): x is ShotCard => Boolean(x));
    return ok<CollectionDetail>({ ...s, isOwn: c.owner === me, shots });
  });

const validName = (d: DB, owner: string, name: string, exceptId?: number) => {
  const n = name.trim();
  if (n.length < 1 || n.length > 60) return 'Use 1–60 characters.';
  if (d.collections.some((c) => c.owner === owner && c.id !== exceptId && c.name.toLowerCase() === n.toLowerCase())) return 'You already have a collection with this name.';
  return null;
};

export const createCollection = (input: CollectionInput, shotId?: number) =>
  write(async (me) => {
    const d = await getDb();
    const err = validName(d, me.username, input.name);
    if (err) return fail<CollectionSummary>(400, 'VALIDATION', err, { name: err });
    if (d.collections.filter((c) => c.owner === me.username).length >= 100) return fail<CollectionSummary>(409, 'LIMIT_REACHED', 'You can own at most 100 collections.');
    const row: CollectionRow = { id: nextId(d), owner: me.username, name: input.name.trim(), description: input.description?.trim() || null, isPrivate: input.isPrivate, shotIds: shotId ? [shotId] : [], updatedAt: now() };
    d.collections.push(row);
    save();
    return ok(await toSummary(row));
  });

export const updateCollection = (id: number, input: CollectionInput) =>
  write(async (me) => {
    const d = await getDb();
    const c = d.collections.find((x) => x.id === id && x.owner === me.username);
    if (!c) return fail<CollectionSummary>(404, 'NOT_FOUND', 'Collection not found.');
    const err = validName(d, me.username, input.name, id);
    if (err) return fail<CollectionSummary>(400, 'VALIDATION', err, { name: err });
    Object.assign(c, { name: input.name.trim(), description: input.description?.trim() || null, isPrivate: input.isPrivate, updatedAt: now() });
    save();
    return ok(await toSummary(c));
  });

export const deleteCollection = (id: number) =>
  write(async (me) => {
    const d = await getDb();
    const before = d.collections.length;
    d.collections = d.collections.filter((x) => !(x.id === id && x.owner === me.username));
    if (d.collections.length === before) return fail<null>(404, 'NOT_FOUND', 'Collection not found.');
    save();
    return ok(null);
  });

export const saveTargets = (shotId: number) =>
  read(async () => {
    const d = await getDb();
    const me = mockViewer()?.username;
    if (!me) return fail<SaveTarget[]>(401, 'UNAUTHENTICATED', 'Sign in to save shots.');
    return ok<SaveTarget[]>(
      d.collections.filter((c) => c.owner === me).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((c) => ({ id: c.id, name: c.name, isPrivate: c.isPrivate, contains: c.shotIds.includes(shotId), shotsCount: c.shotIds.length })),
    );
  });

export const setSaved = (collectionId: number, shotId: number, saved: boolean) =>
  write(async (me) => {
    const d = await getDb();
    const c = d.collections.find((x) => x.id === collectionId && x.owner === me.username);
    if (!c) return fail<{ saved: boolean }>(404, 'NOT_FOUND', 'Collection not found.');
    c.shotIds = c.shotIds.filter((x) => x !== shotId);
    if (saved) {
      if (c.shotIds.length >= 1000) return fail<{ saved: boolean }>(409, 'LIMIT_REACHED', 'A collection holds at most 1,000 shots.');
      c.shotIds.unshift(shotId);
    }
    c.updatedAt = now();
    save();
    return ok({ saved });
  });

export const likedShots = (username: string, cursor: string | null) =>
  read(async () => {
    // Liked shots are real R1 data; the live endpoint is GET /api/users/:u/likes (owner only). The mock lists the
    // shots the viewer has liked in the R1 pool (isLiked comes from the live feed for the signed-in viewer).
    const shots = await shotPool();
    const me = mockViewer()?.username;
    if (me !== username) return fail<Paged<ShotCard>>(404, 'NOT_FOUND', 'Not found.');
    return paginate(shots.filter((s) => s.isLiked), cursor, 24);
  });

// ---------- comments ----------
function toComment(d: DB, row: CommentRow, ownerUsername: string, me: string | undefined, all: CommentRow[]): CommentDto {
  const age = Date.now() - new Date(row.createdAt).getTime();
  return {
    id: row.id,
    shotId: row.shotId,
    author: person(row.author),
    body: row.deleted ? '' : row.body,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    deleted: row.deleted,
    likesCount: row.likes.length,
    isLiked: me ? row.likes.includes(me) : null,
    canEdit: !row.deleted && me === row.author && age < 15 * 60_000,
    canDelete: !row.deleted && Boolean(me) && (me === row.author || me === ownerUsername),
    replies: all.filter((r) => r.parentId === row.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((r) => toComment(d, r, ownerUsername, me, all)),
  };
}

export const listComments = (shotId: number, ownerUsername: string) =>
  read(async () => {
    const d = await getDb();
    ensureComments(d, shotId, ownerUsername);
    save();
    const me = mockViewer()?.username;
    const all = d.comments.filter((c) => c.shotId === shotId);
    const top = forcedEmpty() ? [] : all.filter((c) => c.parentId === null && !(c.deleted && !all.some((r) => r.parentId === c.id))).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return ok<CommentThread>({
      comments: top.map((c) => toComment(d, c, ownerUsername, me, all)),
      total: forcedEmpty() ? 0 : all.filter((c) => !c.deleted).length,
      disabled: d.commentsDisabled.includes(shotId),
      canModerate: me === ownerUsername,
    });
  });

const cleanBody = (s: string) => s.trim().replace(/\n{4,}/g, '\n\n\n');

export const postComment = (shotId: number, ownerUsername: string, body: string, parentId: number | null) =>
  write(async (me) => {
    const d = await getDb();
    const text = cleanBody(body);
    if (text.length < 1 || text.length > 2000) return fail<CommentDto>(400, 'VALIDATION', 'Comments are 1–2,000 characters.', { body: 'Comments are 1–2,000 characters.' });
    if (d.commentsDisabled.includes(shotId)) return fail<CommentDto>(403, 'COMMENTS_DISABLED', 'Comments are turned off for this shot.');
    if (d.blocks.includes(edge(ownerUsername, me.username))) return fail<CommentDto>(403, 'BLOCKED', 'You can’t comment on this shot.');
    // BR-49: a reply to a reply attaches to the top-level comment.
    let parent = parentId ? d.comments.find((c) => c.id === parentId) ?? null : null;
    let prefix = '';
    if (parent?.parentId) {
      prefix = `@${parent.author} `;
      parent = d.comments.find((c) => c.id === parent!.parentId) ?? null;
    }
    const row: CommentRow = { id: nextId(d), shotId, author: me.username, body: prefix + text, createdAt: now(), editedAt: null, deleted: false, parentId: parent?.id ?? null, likes: [] };
    d.comments.push(row);
    if (ownerUsername !== me.username) d.notifications.push({ id: nextId(d), recipient: ownerUsername, type: parent ? 'reply' : 'comment', actors: [me.username], target: { label: 'your shot', href: `/shots/${shotId}`, shotId }, createdAt: now(), readAt: null });
    save();
    return ok(toComment(d, row, ownerUsername, me.username, d.comments));
  });

export const editComment = (id: number, body: string) =>
  write(async (me) => {
    const d = await getDb();
    const c = d.comments.find((x) => x.id === id && x.author === me.username && !x.deleted);
    if (!c) return fail<null>(404, 'NOT_FOUND', 'Comment not found.');
    if (Date.now() - new Date(c.createdAt).getTime() > 15 * 60_000) return fail<null>(403, 'EDIT_WINDOW_CLOSED', 'Comments can be edited for 15 minutes.');
    const text = cleanBody(body);
    if (text.length < 1 || text.length > 2000) return fail<null>(400, 'VALIDATION', 'Comments are 1–2,000 characters.');
    c.body = text;
    c.editedAt = now();
    save();
    return ok(null);
  });

export const deleteComment = (id: number) =>
  write(async () => {
    const d = await getDb();
    const c = d.comments.find((x) => x.id === id);
    if (!c) return fail<null>(404, 'NOT_FOUND', 'Comment not found.');
    c.deleted = true;
    save();
    return ok(null);
  });

export const likeComment = (id: number, like: boolean) =>
  write(async (me) => {
    const d = await getDb();
    const c = d.comments.find((x) => x.id === id);
    if (!c) return fail<{ liked: boolean; likesCount: number }>(404, 'NOT_FOUND', 'Comment not found.');
    if (c.author === me.username) return fail<{ liked: boolean; likesCount: number }>(400, 'CANNOT_LIKE_OWN', 'You can’t like your own comment.');
    c.likes = c.likes.filter((u) => u !== me.username);
    if (like) c.likes.push(me.username);
    save();
    return ok({ liked: like, likesCount: c.likes.length });
  });

export const setCommentsDisabled = (shotId: number, disabled: boolean) =>
  write(async () => {
    const d = await getDb();
    d.commentsDisabled = d.commentsDisabled.filter((x) => x !== shotId);
    if (disabled) d.commentsDisabled.push(shotId);
    save();
    return ok({ disabled });
  });

// ---------- shot extras ----------
export const neighbours = (shotId: number, authorUsername: string) =>
  read(async () => {
    const shots = (await shotPool()).filter((s) => s.author.username === authorUsername).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    const i = shots.findIndex((s) => s.id === shotId);
    const ref = (s: ShotCard | undefined) => (s ? { id: s.id, slug: s.slug, title: s.title } : null);
    return ok<ShotNeighbours>(i < 0 ? { prev: null, next: null } : { prev: ref(shots[i - 1]), next: ref(shots[i + 1]) });
  });

// ---------- reports ----------
export const createReport = (input: ReportInput, label: string, href: string) =>
  write(async (me) => {
    const d = await getDb();
    if (input.note && input.note.length > 500) return fail<ReportResult>(400, 'VALIDATION', 'Notes are at most 500 characters.', { note: 'Notes are at most 500 characters.' });
    if (d.reports.some((r) => r.reporter === me.username && r.targetType === input.targetType && r.targetId === input.targetId)) return ok<ReportResult>({ status: 'already-reported' });
    d.reports.push({ id: nextId(d), reporter: me.username, targetType: input.targetType, targetId: input.targetId, targetLabel: label, targetHref: href, reason: input.reason, note: input.note?.trim() || null, createdAt: now(), status: 'open' });
    save();
    return ok<ReportResult>({ status: 'created' });
  });

export const reportQueue = (status: 'open' | 'closed') =>
  read(async () => {
    const d = await getDb();
    if (mockViewer()?.role === 'member' || !mockViewer()) return fail<ReportRow[]>(404, 'NOT_FOUND', 'Not found.');
    const rows = d.reports.filter((r) => (status === 'open' ? r.status === 'open' : r.status !== 'open')).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return ok<ReportRow[]>(
      forcedEmpty()
        ? []
        : rows.map((r) => ({
            ...r,
            reason: r.reason as ReportRow['reason'],
            targetType: r.targetType as ReportRow['targetType'],
            reporter: person(r.reporter),
            reportsCount: d.reports.filter((x) => x.targetType === r.targetType && x.targetId === r.targetId).length,
          })),
    );
  });

export const decideReport = (id: number, decision: ReportDecision) =>
  write(async (me) => {
    const d = await getDb();
    if (me.role === 'member') return fail<null>(403, 'FORBIDDEN', 'Staff only.');
    const r = d.reports.find((x) => x.id === id);
    if (!r) return fail<null>(404, 'NOT_FOUND', 'Report not found.');
    const status = decision.action === 'hide' ? 'hidden' : decision.action === 'suspend' ? 'suspended' : 'dismissed';
    d.reports.filter((x) => x.targetType === r.targetType && x.targetId === r.targetId).forEach((x) => (x.status = status));
    save();
    return ok(null);
  });

// ---------- blocks ----------
export const setBlocked = (username: string, blocked: boolean) =>
  write(async (me) => {
    const d = await getDb();
    if (me.username === username) return fail<{ blocked: boolean }>(400, 'VALIDATION', 'You cannot block yourself.');
    const e = edge(me.username, username);
    d.blocks = d.blocks.filter((x) => x !== e);
    if (blocked) {
      d.blocks.push(e);
      d.follows = d.follows.filter((f) => f !== edge(me.username, username) && f !== edge(username, me.username)); // BR-81
    }
    save();
    return ok({ blocked });
  });

export const listBlocked = () =>
  read(async () => {
    const d = await getDb();
    const me = mockViewer()?.username;
    if (!me) return fail<BlockedRow[]>(401, 'UNAUTHENTICATED', 'Sign in.');
    return ok<BlockedRow[]>(forcedEmpty() ? [] : d.blocks.filter((b) => b.startsWith(`${me}>`)).map((b) => ({ person: person(b.split('>')[1]!), blockedAt: now() })));
  });
