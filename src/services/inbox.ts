/** Notifications (S-05, BR-83) and messaging (S-07, BR-82). R3. */
import { api } from '@/lib/api-client';
import { isMock } from './config';
import * as m from './mock/inbox';
import type { MessageDto, NewMessageInput, NotificationDto, Paged, ThreadDetail, ThreadSummary, UnreadCounts } from './contracts';

export const unreadCounts = () => (isMock('notifications') ? m.counts() : api<UnreadCounts>('/api/me/unread'));
export const listNotifications = (filter: 'all' | 'unread' = 'all', cursor: string | null = null, limit = 20) =>
  isMock('notifications')
    ? m.listNotifications(filter, cursor, limit)
    : api<Paged<NotificationDto>>(`/api/notifications?filter=${filter}&limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
export const markNotificationsRead = (ids: number[] | 'all') =>
  isMock('notifications') ? m.markRead(ids) : api<null>('/api/notifications/read', { method: 'POST', body: JSON.stringify({ ids }) });

export const listThreads = () => (isMock('messages') ? m.listThreads() : api<ThreadSummary[]>('/api/messages'));
export const getThread = (id: number) => (isMock('messages') ? m.getThread(id) : api<ThreadDetail>(`/api/messages/${id}`));
export const replyToThread = (id: number, body: string) =>
  isMock('messages') ? m.reply(id, body) : api<MessageDto>(`/api/messages/${id}`, { method: 'POST', body: JSON.stringify({ body }) });
export const startThread = (input: NewMessageInput, context?: { label: string; href: string }) =>
  isMock('messages') ? m.startThread(input, context) : api<{ threadId: number }>('/api/messages', { method: 'POST', body: JSON.stringify(input) });

/** BR-82: open threads poll for new messages at most every 15 s. */
export const MESSAGE_POLL_MS = 15_000;
