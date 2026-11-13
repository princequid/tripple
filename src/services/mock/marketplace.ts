import type { DesignerCard, DesignerQuery, PersonSummary, ServiceDetail, ServiceInput, ServiceQuery, ServiceSummary, ShotCard, Suggestion } from '../contracts';
import { ALL_PROFILES, SEARCH_VOCABULARY } from './fixtures';
import { fixturePerson, getDb, nextId, now, person, save, serviceCategory, shotById, shotPool, type DB, type ServiceRow } from './db';
import { personSummary } from './social';
import { fail, forcedEmpty, mockViewer, ok, paginate, read, write } from './runtime';
import { validateService } from '../reference';
import { slugify, tagSlug } from '@/lib/slug';

function toService(s: ServiceRow): ServiceSummary {
  const cover = s.coverShotId ? shotById(s.coverShotId)?.cover ?? null : null;
  return { id: s.id, slug: slugify(s.title), title: s.title, seller: person(s.seller), category: { ...serviceCategory(s.categorySlug) }, priceCents: s.priceCents, deliveryDays: s.deliveryDays, cover };
}

export const listServices = (q: ServiceQuery) =>
  read(async () => {
    const d = await getDb();
    await shotPool();
    const kw = q.q?.trim().toLowerCase();
    let rows = d.services
      .filter((s) => !kw || [s.title, s.description, serviceCategory(s.categorySlug).name, person(s.seller).displayName].some((x) => x.toLowerCase().includes(kw)))
      .filter((s) => !q.category || s.categorySlug === q.category)
      .filter((s) => !q.maxPriceCents || s.priceCents <= q.maxPriceCents)
      .filter((s) => !q.maxDays || s.deliveryDays <= q.maxDays);
    rows = [...rows].sort((a, b) =>
      q.sort === 'price-asc' ? a.priceCents - b.priceCents : q.sort === 'price-desc' ? b.priceCents - a.priceCents : q.sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.id - b.id,
    );
    return paginate(rows.map(toService), q.cursor, 12);
  });

export const servicesBy = (username: string) =>
  read(async () => {
    const d = await getDb();
    await shotPool();
    return ok<ServiceSummary[]>(forcedEmpty() ? [] : d.services.filter((s) => s.seller === username).map(toService));
  });

export const getService = (id: number) =>
  read(async () => {
    const d = await getDb();
    await shotPool();
    const s = d.services.find((x) => x.id === id);
    if (!s) return fail<ServiceDetail>(404, 'NOT_FOUND', 'This service does not exist.');
    const f = fixturePerson(s.seller);
    return ok<ServiceDetail>({ ...toService(s), description: s.description, revisions: s.revisions, includes: s.includes, isOwn: s.seller === mockViewer()?.username, sellerHeadline: f?.headline ?? null, sellerLocation: f?.location ?? null });
  });

export const saveService = (id: number | null, input: ServiceInput) =>
  write(async (me) => {
    const d = await getDb();
    const errors = validateService(input);
    if (Object.keys(errors).length) return fail<{ id: number; slug: string }>(400, 'VALIDATION', 'Check the highlighted fields.', errors);
    let row = id ? d.services.find((s) => s.id === id && s.seller === me.username) : undefined;
    if (id && !row) return fail<{ id: number; slug: string }>(404, 'NOT_FOUND', 'Service not found.');
    const ownShot = (await shotPool()).find((s) => s.author.username === me.username);
    if (!row) {
      row = { id: nextId(d), seller: me.username, createdAt: now(), coverShotId: ownShot?.id ?? null, coverKey: null, title: '', description: '', categorySlug: '', priceCents: 0, deliveryDays: 1, revisions: 0, includes: [] };
      d.services.push(row);
    }
    Object.assign(row, { title: input.title.trim(), description: input.description.trim(), categorySlug: input.categorySlug, priceCents: input.priceCents, deliveryDays: input.deliveryDays, revisions: input.revisions, includes: input.includes });
    save();
    return ok({ id: row.id, slug: slugify(row.title) });
  });

export const deleteService = (id: number) =>
  write(async (me) => {
    const d = await getDb();
    const n = d.services.length;
    d.services = d.services.filter((s) => !(s.id === id && s.seller === me.username));
    if (n === d.services.length) return fail<null>(404, 'NOT_FOUND', 'Service not found.');
    save();
    return ok(null);
  });

function designerCard(d: DB, username: string, shots: ShotCard[]): DesignerCard {
  const f = fixturePerson(username);
  const prices = d.services.filter((s) => s.seller === username).map((s) => s.priceCents);
  return {
    ...personSummary(d, username),
    skills: f?.skills ?? [],
    recentShots: shots.filter((s) => s.author.username === username || s.team?.username === username).slice(0, 3),
    servicesCount: prices.length,
    startingPriceCents: prices.length ? Math.min(...prices) : null,
  };
}

export const listDesigners = (q: DesignerQuery) =>
  read(async () => {
    const d = await getDb();
    const shots = await shotPool();
    const kw = q.q?.trim().toLowerCase();
    const loc = q.location?.trim().toLowerCase();
    const rows = ALL_PROFILES.filter((p) => p.username !== 'demo')
      .filter((p) => (q.kind === 'team' ? p.isTeam : q.kind === 'individual' ? !p.isTeam : true))
      .filter((p) => !kw || [p.displayName, p.username, p.headline, ...p.skills].some((x) => x.toLowerCase().includes(kw)))
      .filter((p) => !q.skill || p.skills.some((s) => s.toLowerCase() === q.skill!.toLowerCase()))
      .filter((p) => !loc || p.location.toLowerCase().includes(loc))
      .map((p) => designerCard(d, p.username, shots));
    return paginate(rows, q.cursor, 12);
  });

export const searchDesigners = (term: string, cursor: string | null) =>
  read(async () => {
    const d = await getDb();
    const kw = term.toLowerCase();
    const rows = ALL_PROFILES.filter((p) => p.username !== 'demo' && [p.displayName, p.username, p.headline, ...p.skills].some((x) => x.toLowerCase().includes(kw)));
    return paginate<PersonSummary>(rows.map((p) => personSummary(d, p.username)), cursor, 24);
  });

export const suggest = (term: string, type: 'shots' | 'designers' | 'services') =>
  read(async () => {
    const kw = term.trim().toLowerCase();
    if (kw.length < 2) return ok<Suggestion[]>([]);
    const out: Suggestion[] = [];
    if (type === 'designers') {
      ALL_PROFILES.filter((p) => p.username !== 'demo' && (p.displayName.toLowerCase().includes(kw) || p.username.includes(kw)))
        .slice(0, 8)
        .forEach((p) => out.push({ kind: 'designer', label: p.displayName, href: `/${p.username}`, avatar: person(p.username) }));
      return ok(out);
    }
    if (type === 'services') {
      const d = await getDb();
      d.services.filter((s) => s.title.toLowerCase().includes(kw)).slice(0, 8).forEach((s) => out.push({ kind: 'term', label: s.title, href: `/services/${s.id}-${slugify(s.title)}` }));
      return ok(out);
    }
    SEARCH_VOCABULARY.filter((v) => v.includes(kw)).slice(0, 5).forEach((v) => out.push({ kind: 'term', label: v, href: `/search/${tagSlug(v)}` }));
    SEARCH_VOCABULARY.filter((v) => v.startsWith(kw)).slice(0, 2).forEach((v) => out.push({ kind: 'tag', label: `#${v}`, href: `/tags/${tagSlug(v)}` }));
    ALL_PROFILES.filter((p) => p.username !== 'demo' && p.displayName.toLowerCase().includes(kw)).slice(0, 2).forEach((p) => out.push({ kind: 'designer', label: p.displayName, href: `/${p.username}`, avatar: person(p.username) }));
    return ok(out.slice(0, 8));
  });
