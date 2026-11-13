/**
 * Social features (R2: follows, collections, comments, reports; R3: blocks). Each function returns ApiResult<T>.
 * Live endpoints are listed in FRONTEND_API_INTEGRATION_REQUIREMENTS §3; the mock store is used until then.
 */
import { api, type ApiResult } from '@/lib/api-client';
import { isMock } from './config';
import * as m from './mock/social';
import type {
  BlockedRow, CollectionDetail, CollectionInput, CollectionSummary, CommentDto, CommentThread, FollowState, Paged, PersonSummary, ProfileSocial,
  ReportDecision, ReportInput, ReportResult, ReportRow, SaveTarget, ShotCard, ShotNeighbours,
} from './contracts';

const json = (body: unknown) => ({ body: JSON.stringify(body) });
const u = encodeURIComponent;

/** Live list endpoints return `{ data: T[], page }`; screens consume `Paged<T>`. */
async function paged<T>(path: string): Promise<ApiResult<Paged<T>>> {
  const r = await api<T[]>(path);
  return r.ok ? { ...r, data: { items: r.data, nextCursor: r.page?.nextCursor ?? null } } : r;
}
const withCursor = (path: string, cursor: string | null) => (cursor ? `${path}${path.includes('?') ? '&' : '?'}cursor=${u(cursor)}` : path);

// Follows (S-03)
export const getSocial = async (username: string): Promise<ApiResult<ProfileSocial>> => {
  if (isMock('follows')) return m.getSocial(username);
  const r = await api<{ stats: { followers: number; following: number }; isFollowing: boolean | null }>(`/api/users/${u(username)}`);
  return r.ok ? { ...r, data: { followersCount: r.data.stats.followers, followingCount: r.data.stats.following, isFollowing: r.data.isFollowing, isBlocked: false } } : r;
};
export const setFollow = (username: string, follow: boolean) =>
  isMock('follows') ? m.setFollow(username, follow) : api<FollowState>(`/api/users/${u(username)}/follow`, { method: follow ? 'PUT' : 'DELETE' });
export const listFollows = (username: string, which: 'followers' | 'following', cursor: string | null = null) =>
  isMock('follows') ? m.listFollows(username, which, cursor) : paged<PersonSummary>(withCursor(`/api/users/${u(username)}/${which}`, cursor));

// Collections (S-02, P-03)
/** Live: POST /api/collections, then PUT the shot into it (the endpoint takes no shotId). */
async function createAndSave(input: CollectionInput, shotId?: number): Promise<ApiResult<CollectionSummary>> {
  const r = await api<CollectionSummary>('/api/collections', { method: 'POST', ...json(input) });
  if (r.ok && shotId) {
    const s = await api(`/api/collections/${r.data.id}/shots/${shotId}`, { method: 'PUT' });
    if (s.ok) return { ...r, data: { ...r.data, shotsCount: r.data.shotsCount + 1 } };
  }
  return r;
}
export const listCollections = (username: string) => (isMock('collections') ? m.listCollections(username) : api<CollectionSummary[]>(`/api/users/${u(username)}/collections`));
export const getCollection = (id: number) => (isMock('collections') ? m.getCollection(id) : api<CollectionDetail>(`/api/collections/${id}`));
export const collectionShots = (id: number, cursor: string | null) => paged<ShotCard>(withCursor(`/api/collections/${id}/shots`, cursor));
export const createCollection = (input: CollectionInput, shotId?: number) =>
  isMock('collections') ? m.createCollection(input, shotId) : createAndSave(input, shotId);
export const updateCollection = (id: number, input: CollectionInput) =>
  isMock('collections') ? m.updateCollection(id, input) : api<CollectionSummary>(`/api/collections/${id}`, { method: 'PATCH', ...json(input) });
export const deleteCollection = (id: number) => (isMock('collections') ? m.deleteCollection(id) : api<null>(`/api/collections/${id}`, { method: 'DELETE' }));
export const saveTargets = (shotId: number) => (isMock('collections') ? m.saveTargets(shotId) : api<SaveTarget[]>(`/api/me/collections?shotId=${shotId}`));
export const setSaved = (collectionId: number, shotId: number, saved: boolean) =>
  isMock('collections') ? m.setSaved(collectionId, shotId, saved) : api<{ saved: boolean }>(`/api/collections/${collectionId}/shots/${shotId}`, { method: saved ? 'PUT' : 'DELETE' });
export const likedShots = (username: string, cursor: string | null = null) =>
  paged<ShotCard>( // live: likes are R1 data (GET /api/users/:u/likes, owner only)
  withCursor(`/api/users/${u(username)}/likes`, cursor));

// Comments (S-04)
/** Live: `{ data: CommentThread, page }` with 24 top-level comments per page (BR-49 nesting). */
export const listComments = (shotId: number, ownerUsername: string, cursor: string | null = null) =>
  isMock('comments') ? m.listComments(shotId, ownerUsername) : api<CommentThread>(withCursor(`/api/shots/${shotId}/comments`, cursor));
export const postComment = (shotId: number, ownerUsername: string, body: string, parentId: number | null) =>
  isMock('comments') ? m.postComment(shotId, ownerUsername, body, parentId) : api<CommentDto>(`/api/shots/${shotId}/comments`, { method: 'POST', ...json({ body, parentId }) });
export const editComment = (id: number, body: string) => (isMock('comments') ? m.editComment(id, body) : api<CommentDto>(`/api/comments/${id}`, { method: 'PATCH', ...json({ body }) }));
export const deleteComment = (id: number) => (isMock('comments') ? m.deleteComment(id) : api<{ deleted: true; placeholder: boolean }>(`/api/comments/${id}`, { method: 'DELETE' }));
export const likeComment = (id: number, like: boolean) =>
  isMock('comments') ? m.likeComment(id, like) : api<{ liked: boolean; likesCount: number }>(`/api/comments/${id}/like`, { method: like ? 'PUT' : 'DELETE' });
export const setCommentsDisabled = async (shotId: number, disabled: boolean): Promise<ApiResult<{ disabled: boolean }>> => {
  if (isMock('comments')) return m.setCommentsDisabled(shotId, disabled);
  const r = await api<{ commentsDisabled: boolean }>(`/api/shots/${shotId}/comments-setting`, { method: 'PUT', ...json({ disabled }) });
  return r.ok ? { ...r, data: { disabled: r.data.commentsDisabled } } : r;
};

// Shot extras (SD-05): GET /api/shots/:id/neighbours (prev = newer, next = older among the owner's shots).
export const neighbours = (shotId: number, _ownerUsername: string) => api<ShotNeighbours>(`/api/shots/${shotId}/neighbours`);

// Reports (BR-69) and the staff queue (API_SPECIFICATION §5.9)
export const createReport = (input: ReportInput, label: string, href: string) =>
  isMock('reports') ? m.createReport(input, label, href) : api<ReportResult>('/api/reports', { method: 'POST', ...json(input) });
/** "Resolved" merges the three closed statuses (the live list is one status per request). */
export async function reportQueue(status: 'open' | 'closed'): Promise<ApiResult<ReportRow[]>> {
  if (isMock('reports')) return m.reportQueue(status);
  const statuses = status === 'open' ? ['open'] : ['hidden', 'suspended', 'dismissed'];
  const rs = await Promise.all(statuses.map((st) => api<ReportRow[]>(`/api/moderation/reports?status=${st}`)));
  const bad = rs.find((r) => !r.ok);
  if (bad && !bad.ok) return bad;
  const rows = rs.flatMap((r) => (r.ok ? r.data : [])).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
  return { ok: true, status: 200, data: rows };
}
/** Live: reason ≥ 10 characters; 409 if another moderator already handled it. */
export const decideReport = (id: number, decision: ReportDecision) =>
  isMock('reports') ? m.decideReport(id, decision) : api<{ status: string; resolved: number }>(`/api/moderation/reports/${id}/decision`, { method: 'POST', ...json(decision) });
export const REPORT_DECISION_MIN = 10;

// Blocks (S-06)
export const setBlocked = (username: string, blocked: boolean) =>
  isMock('blocks') ? m.setBlocked(username, blocked) : api<{ blocked: boolean }>(`/api/users/${u(username)}/block`, { method: blocked ? 'PUT' : 'DELETE' });
export const listBlocked = () => (isMock('blocks') ? m.listBlocked() : api<BlockedRow[]>('/api/me/blocks'));
