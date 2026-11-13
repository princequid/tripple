/** Jobs (R2: J-01…J-03, BR-71…75). Live: API_SPECIFICATION §5.8. */
import { api, type ApiResult } from '@/lib/api-client';
import { isMock } from './config';
import * as m from './mock/jobs';
import type { JobDetail, JobInput, JobQuery, JobSummary, Paged } from './contracts';

const qs = (q: JobQuery) => {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  q.specialties?.forEach((s) => p.append('specialty', s));
  if (q.location) p.set('location', q.location);
  if (q.remote) p.set('remote', 'true');
  q.employment?.forEach((s) => p.append('employment', s));
  if (q.cursor) p.set('cursor', q.cursor);
  return p.toString();
};

/** Request body: the logo is referenced by an own upload id (`companyLogoMediaId`), never by a storage key. */
const body = (i: JobInput) => {
  const { companyLogoKey: _key, ...rest } = i;
  return JSON.stringify({ ...rest, location: rest.location.trim() || undefined, companyLogoMediaId: null });
};

export async function listJobs(q: JobQuery): Promise<ApiResult<Paged<JobSummary>>> {
  if (isMock('jobs')) return m.listJobs(q);
  const r = await api<JobSummary[]>(`/api/jobs?${qs(q)}`);
  return r.ok ? { ...r, data: { items: r.data, nextCursor: r.page?.nextCursor ?? null } } : r;
}
export const getJob = (id: number) => (isMock('jobs') ? m.getJob(id) : api<JobDetail>(`/api/jobs/${id}`));
export const myJobs = () => (isMock('jobs') ? m.myJobs() : api<JobSummary[]>('/api/me/jobs'));
export const createJob = (input: JobInput) => (isMock('jobs') ? m.createJob(input) : api<JobDetail>('/api/jobs', { method: 'POST', body: body(input) }));
export const updateJob = (id: number, input: JobInput) => (isMock('jobs') ? m.updateJob(id, input) : api<JobDetail>(`/api/jobs/${id}`, { method: 'PATCH', body: body(input) }));
export const closeJob = (id: number) => (isMock('jobs') ? m.closeJob(id) : api<JobDetail>(`/api/jobs/${id}/close`, { method: 'POST', body: '{}' }));
export const jobPath = (j: { id: number; slug: string }) => `/jobs/${j.id}-${j.slug}`;
