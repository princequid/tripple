import type { MessageDto, NewMessageInput, NotificationDto, ThreadDetail, ThreadSummary, UnreadCounts } from '../contracts';
import { ensureInbox, getDb, nextId, now, person, save, shotById, shotPool, type DB, type ThreadRow } from './db';
import { fail, forcedEmpty, mockViewer, ok, paginate, read, write } from './runtime';

const meOrNull = () => mockViewer()?.username ?? null;

async function inbox(): Promise<{ d: DB; me: string } | null> {
  const me = meOrNull();
  if (!me) return null;
  const d = await getDb();
  await shotPool();
  ensureInbox(d, me);
  save();
  return { d, me };
}

const unreadIn = (d: DB, t: ThreadRow, me: string) => d.messages.filter((m) => m.threadId === t.id && !m.readBy.includes(me)).length;

export const counts = () =>
  read(async () => {
    const ctx = await inbox();
    if (!ctx) return ok<UnreadCounts>({ notifications: 0, messages: 0 });
    const { d, me } = ctx;
    return ok<UnreadCounts>({
      notifications: Math.min(99, d.notifications.filter((n) => n.recipient === me && !n.readAt).length),
      messages: d.threads.filter((t) => t.members.includes(me)).reduce((a, t) => a + unreadIn(d, t, me), 0),
    });
  });

export const listNotifications = (filter: 'all' | 'unread', cursor: string | null, limit = 20) =>
  read(async () => {
    const ctx = await inbox();
    if (!ctx) return fail<{ items: NotificationDto[]; nextCursor: string | null }>(401, 'UNAUTHENTICATED', 'Sign in.');
    const { d, me } = ctx;
    const rows = d.notifications
      .filter((n) => n.recipient === me && (filter === 'all' || !n.readAt))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map<NotificationDto>((n) => {
        const shot = n.target?.shotId ? shotById(n.target.shotId) : null;
        return {
          id: n.id,
          type: n.type as NotificationDto['type'],
          actors: n.actors.map(person),
          target: n.target ? { label: shot?.title ?? n.target.label, href: shot ? `/shots/${shot.id}-${shot.slug}` : n.target.href, cover: shot?.cover ?? null } : null,
          createdAt: n.createdAt,
          readAt: n.readAt,
        };
      });
    return paginate(rows, cursor, limit);
  });

export const markRead = (ids: number[] | 'all') =>
  write(async (me) => {
    const d = await getDb();
    d.notifications.forEach((n) => {
      if (n.recipient === me.username && !n.readAt && (ids === 'all' || ids.includes(n.id))) n.readAt = now();
    });
    save();
    return ok(null);
  });

function threadSummary(d: DB, t: ThreadRow, me: string): ThreadSummary {
  const msgs = d.messages.filter((m) => m.threadId === t.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const last = msgs[msgs.length - 1];
  return {
    id: t.id,
    other: person(t.members.find((x) => x !== me) ?? me),
    lastMessage: last ? { body: last.body, at: last.createdAt, fromMe: last.from === me } : null,
    unread: unreadIn(d, t, me),
    context: t.context,
  };
}

export const listThreads = () =>
  read(async () => {
    const ctx = await inbox();
    if (!ctx) return fail<ThreadSummary[]>(401, 'UNAUTHENTICATED', 'Sign in.');
    const { d, me } = ctx;
    const rows = d.threads.filter((t) => t.members.includes(me)).map((t) => threadSummary(d, t, me));
    rows.sort((a, b) => (b.lastMessage?.at ?? '').localeCompare(a.lastMessage?.at ?? ''));
    return ok(forcedEmpty() ? [] : rows);
  });

const toMessage = (m: DB['messages'][number], me: string): MessageDto => ({ id: m.id, threadId: m.threadId, from: person(m.from), body: m.body, createdAt: m.createdAt, fromMe: m.from === me });

export const getThread = (id: number) =>
  read(async () => {
    const ctx = await inbox();
    if (!ctx) return fail<ThreadDetail>(401, 'UNAUTHENTICATED', 'Sign in.');
    const { d, me } = ctx;
    const t = d.threads.find((x) => x.id === id && x.members.includes(me));
    if (!t) return fail<ThreadDetail>(404, 'NOT_FOUND', 'Conversation not found.');
    d.messages.forEach((m) => m.threadId === id && !m.readBy.includes(me) && m.readBy.push(me));
    save();
    const other = t.members.find((x) => x !== me)!;
    return ok<ThreadDetail>({
      thread: threadSummary(d, t, me),
      messages: d.messages.filter((m) => m.threadId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((m) => toMessage(m, me)),
      canReply: !d.blocks.includes(`${other}>${me}`),
    });
  });

const validBody = (b: string) => b.trim().length >= 1 && b.trim().length <= 5000;

export const reply = (threadId: number, body: string) =>
  write(async (me) => {
    const d = await getDb();
    const t = d.threads.find((x) => x.id === threadId && x.members.includes(me.username));
    if (!t) return fail<MessageDto>(404, 'NOT_FOUND', 'Conversation not found.');
    if (!validBody(body)) return fail<MessageDto>(400, 'VALIDATION', 'Messages are 1–5,000 characters.');
    const other = t.members.find((x) => x !== me.username)!;
    if (d.blocks.includes(`${other}>${me.username}`)) return fail<MessageDto>(403, 'BLOCKED', 'You can’t message this member.');
    const row = { id: nextId(d), threadId, from: me.username, body: body.trim(), createdAt: now(), readBy: [me.username] };
    d.messages.push(row);
    save();
    return ok(toMessage(row, me.username));
  });

/** Starts (or reuses) a thread with `toUsername` (OV-09). */
export const startThread = (input: NewMessageInput, contextLabel?: { label: string; href: string }) =>
  write(async (me) => {
    const d = await getDb();
    if (input.toUsername === me.username) return fail<{ threadId: number }>(400, 'VALIDATION', 'You can’t message yourself.');
    if (!validBody(input.body)) return fail<{ threadId: number }>(400, 'VALIDATION', 'Messages are 1–5,000 characters.', { body: 'Messages are 1–5,000 characters.' });
    if (d.blocks.includes(`${input.toUsername}>${me.username}`)) return fail<{ threadId: number }>(403, 'BLOCKED', 'You can’t message this member.');
    ensureInbox(d, me.username);
    let t = d.threads.find((x) => x.members.includes(me.username) && x.members.includes(input.toUsername));
    if (!t) {
      t = { id: nextId(d), members: [me.username, input.toUsername], context: contextLabel ?? null };
      d.threads.push(t);
    }
    d.messages.push({ id: nextId(d), threadId: t.id, from: me.username, body: input.body.trim(), createdAt: now(), readBy: [me.username] });
    save();
    return ok({ threadId: t.id });
  });
