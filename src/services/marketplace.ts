/** Hire directory (H-01), services (M-01, BR-84), designer search + autocomplete (D-08, FR-35). */
import { api, type ApiResult } from '@/lib/api-client';
import { isMock } from './config';
import * as m from './mock/marketplace';
import type { DesignerCard, DesignerQuery, Paged, PersonSummary, SearchType, ServiceDetail, ServiceInput, ServiceQuery, ServiceSummary, Suggestion } from './contracts';

const qs = (o: Record<string, unknown>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && v !== false && p.set(k, String(v)));
  return p.toString();
};

export const listDesigners = (q: DesignerQuery) => (isMock('hire') ? m.listDesigners(q) : api<Paged<DesignerCard>>(`/api/designers?${qs(q)}`));
export const listServices = (q: ServiceQuery) => (isMock('services') ? m.listServices(q) : api<Paged<ServiceSummary>>(`/api/services?${qs(q)}`));
export const servicesBy = (username: string) => (isMock('services') ? m.servicesBy(username) : api<ServiceSummary[]>(`/api/users/${encodeURIComponent(username)}/services`));
export const getService = (id: number) => (isMock('services') ? m.getService(id) : api<ServiceDetail>(`/api/services/${id}`));
export const saveService = (id: number | null, input: ServiceInput) =>
  isMock('services')
    ? m.saveService(id, input)
    : api<{ id: number; slug: string }>(id ? `/api/services/${id}` : '/api/services', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(input) });
export const deleteService = (id: number) => (isMock('services') ? m.deleteService(id) : api<null>(`/api/services/${id}`, { method: 'DELETE' }));
export const servicePath = (s: { id: number; slug: string }) => `/services/${s.id}-${s.slug}`;

export async function searchDesigners(term: string, cursor: string | null = null): Promise<ApiResult<Paged<PersonSummary>>> {
  if (isMock('search')) return m.searchDesigners(term, cursor);
  const r = await api<PersonSummary[]>(`/api/search/designers?${qs({ q: term, cursor })}`);
  return r.ok ? { ...r, data: { items: r.data, nextCursor: r.page?.nextCursor ?? null } } : r;
}
/** Live (§5.10): tags then designers, ≤ 8, nothing under 2 characters. Services suggestions stay on the R3 mock. */
export async function suggest(term: string, type: SearchType): Promise<ApiResult<Suggestion[]>> {
  if (isMock('search') || (type === 'services' && isMock('services'))) return m.suggest(term, type);
  const r = await api<Suggestion[]>(`/api/search/suggest?${qs({ q: term })}`);
  return r.ok && type === 'designers' ? { ...r, data: r.data.filter((s) => s.kind === 'designer') } : r;
}
