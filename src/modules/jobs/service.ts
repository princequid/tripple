import 'server-only';
import { z } from 'zod';
import { AppError } from '@/server/errors';
import { limit, quota } from '@/server/rate-limit';
import { validate } from '@/server/validation';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { htmlToText, sanitizeJobHtml } from '@/server/sanitize';
import { SPECIALTIES, specialtyBySlug } from '@/lib/catalog';
import { slugify } from '@/lib/slug';
import { requireMember } from '@/modules/auth/service';
import { isStaff, type Viewer } from '@/modules/auth/types';
import * as media from '@/modules/media/service';
import type { Page } from '@/modules/shots/types';
import * as repo from './repository';

/**
 * Jobs board, free posting only (J-01…J-03, FR-67…FR-70; BR-71…BR-75). A job is active for 30 days, then
 * expired; its page stays reachable with no apply link and `noindex`. Paid tiers are Later (payment approval).
 */
export const ACTIVE_DAYS = 30;
export const MAX_ACTIVE = 3;
export const PAGE_SIZE = 20;

export type JobStatus = 'active' | 'expired' | 'closed';
export type JobSummary = {
  id: number;
  slug: string;
  title: string;
  company: { name: string; websiteUrl: string; logoKey: string | null };
  location: string | null;
  workplaceType: 'remote' | 'on-site' | 'hybrid';
  employmentType: 'full-time' | 'freelance-contract';
  specialty: { slug: string; name: string };
  postedAt: string;
  expiresAt: string;
  status: JobStatus;
};
export type JobDetail = JobSummary & {
  descriptionHtml: string;
  /** null unless active (BR-73: no apply button on expired/closed jobs). */
  applyUrl: string | null;
  isOwn: boolean;
  /** BR-73: expired/closed pages are `noindex`. */
  noindex: boolean;
  hidden: boolean;
};

const statusOf = (r: repo.JobRow, now: number): JobStatus => (r.closedAt ? 'closed' : r.expiresAt <= now ? 'expired' : 'active');

function summary(r: repo.JobRow, now: number): JobSummary {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    company: { name: r.companyName, websiteUrl: r.companyWebsite, logoKey: r.companyLogoKey },
    location: r.location,
    workplaceType: r.workplaceType,
    employmentType: r.employmentType,
    specialty: { slug: r.specialtySlug, name: r.specialtyName },
    postedAt: new Date(r.publishedAt).toISOString(),
    expiresAt: new Date(r.expiresAt).toISOString(),
    status: statusOf(r, now),
  };
}

function detail(r: repo.JobRow, viewer: Viewer, now: number): JobDetail {
  const status = statusOf(r, now);
  return {
    ...summary(r, now),
    descriptionHtml: r.descriptionHtml,
    applyUrl: status === 'active' ? r.applyUrl : null,
    isOwn: viewer.kind === 'member' && viewer.profileId === r.posterId,
    noindex: status !== 'active' || Boolean(r.hiddenAt),
    hidden: Boolean(r.hiddenAt),
  };
}

const httpsUrl = (msg: string) =>
  z
    .string()
    .trim()
    .max(512, 'Use at most 512 characters.')
    .refine((s) => {
      try {
        return new URL(s).protocol === 'https:';
      } catch {
        return false;
      }
    }, msg);
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9-]+)+$/;
const applySchema = z
  .string()
  .trim()
  .max(512, 'Use at most 512 characters.')
  .transform((s) => (EMAIL_RE.test(s) ? `mailto:${s}` : s))
  .refine((s) => {
    if (s.startsWith('mailto:')) return EMAIL_RE.test(s.slice(7));
    try {
      return new URL(s).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Enter an https:// link or an email address.');

/** BR-71 required and optional fields. Description length is checked on the sanitised text. */
export const jobInput = z.object({
  title: z.string().trim().min(5, 'Use 5–100 characters.').max(100, 'Use 5–100 characters.'),
  descriptionHtml: z.string().max(200_000, 'The description is too long.'),
  location: z.string().trim().max(120, 'Use at most 120 characters.').nullish().transform((s) => (s ? s : null)),
  workplaceType: z.enum(['remote', 'on-site', 'hybrid'], { message: 'Choose a workplace type.' }),
  specialtySlug: z.enum(SPECIALTIES.map((s) => s.slug) as [string, ...string[]], { message: 'Choose a specialty.' }),
  employmentType: z.enum(['full-time', 'freelance-contract'], { message: 'Choose an employment type.' }),
  applyUrl: applySchema,
  companyName: z.string().trim().min(1, 'Enter the company name.').max(80, 'Use at most 80 characters.'),
  companyWebsite: httpsUrl('Enter an https:// link.'),
  companyLogoMediaId: z.string().max(64).nullish(),
});

async function toWrite(posterId: number, input: unknown): Promise<repo.JobWrite> {
  const v = validate(jobInput, input);
  const html = sanitizeJobHtml(v.descriptionHtml);
  const text = htmlToText(html);
  if (text.length < 50 || text.length > 20_000) {
    throw new AppError('VALIDATION', 'The description must be 50–20,000 characters.', { fields: { descriptionHtml: 'Use 50–20,000 characters.' } });
  }
  if (v.companyLogoMediaId) await media.requireOwnedReady(v.companyLogoMediaId, posterId, ['logo'], 'companyLogoMediaId');
  const companyId = await repo.upsertCompany(posterId, v.companyName, v.companyWebsite, v.companyLogoMediaId ?? null, Date.now());
  return {
    companyId,
    specialtyId: specialtyBySlug(v.specialtySlug)!.id,
    title: v.title,
    slug: slugify(v.title),
    descriptionHtml: html,
    descriptionText: text,
    location: v.location,
    workplaceType: v.workplaceType,
    employmentType: v.employmentType,
    applyUrl: v.applyUrl,
  };
}

/** FR-69 post a free job (BR-73): published at once for 30 days; ≤ 3 active per member; 5 posts per day. */
export async function create(viewer: Viewer, input: unknown): Promise<JobDetail> {
  const m = requireMember(viewer);
  await limit('RL-CONTENT', `p:${m.profileId}`);
  const now = Date.now();
  if ((await repo.countActiveByPoster(m.profileId, now)) >= MAX_ACTIVE) {
    throw new AppError('QUOTA_EXCEEDED', `You can have at most ${MAX_ACTIVE} active job posts. Close one first.`);
  }
  const w = await toWrite(m.profileId, input);
  await quota('Q-JOB-POST', `p:${m.profileId}`, 'You can post at most 5 jobs per day.');
  const id = await repo.insert(m.profileId, w, now, ACTIVE_DAYS * 86_400_000);
  return detail((await repo.findById(id))!, viewer, now);
}

async function ownActive(viewer: Viewer, id: number) {
  const m = requireMember(viewer);
  const r = await repo.findById(id);
  if (!r || r.deletedAt || r.posterId !== m.profileId) throw new AppError('NOT_FOUND');
  if (statusOf(r, Date.now()) !== 'active') throw new AppError('FORBIDDEN', 'This job is no longer active.');
  return { m, r };
}

/** BR-73 edit an active job (posted date unchanged); sanitised again (BR-72). */
export async function update(viewer: Viewer, id: number, input: unknown): Promise<JobDetail> {
  const { m } = await ownActive(viewer, id);
  await limit('RL-CONTENT', `p:${m.profileId}`);
  await repo.update(id, await toWrite(m.profileId, input), Date.now());
  return detail((await repo.findById(id))!, viewer, Date.now());
}

export async function close(viewer: Viewer, id: number): Promise<JobDetail> {
  const { m } = await ownActive(viewer, id);
  await limit('RL-CONTENT', `p:${m.profileId}`);
  await repo.close(id, Date.now());
  return detail((await repo.findById(id))!, viewer, Date.now());
}

/** FR-68 detail: any non-deleted job (expired/closed included, BR-73); hidden or poster gone → 404 except staff. */
export async function get(viewer: Viewer, id: number): Promise<JobDetail> {
  const r = await repo.findById(id);
  if (!r || r.deletedAt) throw new AppError('NOT_FOUND');
  const own = viewer.kind === 'member' && viewer.profileId === r.posterId;
  if ((r.hiddenAt || r.posterGone) && !isStaff(viewer) && !own) throw new AppError('NOT_FOUND');
  return detail(r, viewer, Date.now());
}

export const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  specialty: z.union([z.string(), z.array(z.string())]).optional(),
  location: z.string().trim().max(120).optional(),
  remote: z.enum(['true', 'false', '1', '0']).optional(),
  employment: z.union([z.string(), z.array(z.string())]).optional(),
  cursor: z.string().max(512).optional(),
});

const asList = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** FR-67 board (BR-75): multi-select specialties/employment (repeat the parameter), newest first, 20 per page. */
export async function list(viewer: Viewer, raw: z.input<typeof listQuery>): Promise<Page<JobSummary>> {
  const q = validate(listQuery, raw);
  const specialtyIds = asList(q.specialty).map((s) => {
    const sp = specialtyBySlug(s);
    if (!sp) throw new AppError('VALIDATION', 'Unknown specialty.', { fields: { specialty: 'Unknown specialty.' } });
    return sp.id;
  });
  const employment = asList(q.employment);
  if (employment.some((e) => e !== 'full-time' && e !== 'freelance-contract')) {
    throw new AppError('VALIDATION', 'Unknown employment type.', { fields: { employment: 'Unknown employment type.' } });
  }
  const f: repo.Filter = { q: q.q || undefined, specialtyIds, employment, location: q.location || undefined, remote: q.remote === 'true' || q.remote === '1' };
  const key = `jobs:${JSON.stringify(f)}`;
  const now = Date.now();
  const rows = await repo.listActive(f, now, decodeCursor(q.cursor, key), PAGE_SIZE + 1);
  const page = rows.slice(0, PAGE_SIZE);
  const last = page[page.length - 1];
  void viewer;
  return { items: page.map((r) => summary(r, now)), nextCursor: rows.length > PAGE_SIZE && last ? encodeCursor(key, [last.publishedAt, last.id]) : null };
}

/** The member's own posts, all statuses (FR-70 manage). */
export async function mine(viewer: Viewer, q: { cursor?: string | null }): Promise<Page<JobSummary>> {
  const m = requireMember(viewer);
  const key = `myjobs:${m.profileId}`;
  const now = Date.now();
  const rows = await repo.listByPoster(m.profileId, decodeCursor(q.cursor, key), PAGE_SIZE + 1);
  const page = rows.slice(0, PAGE_SIZE);
  const last = page[page.length - 1];
  return { items: page.map((r) => summary(r, now)), nextCursor: rows.length > PAGE_SIZE && last ? encodeCursor(key, [last.publishedAt, last.id]) : null };
}

export const specialties = () => SPECIALTIES.map((s) => ({ slug: s.slug, name: s.name }));
export const setHidden = (id: number, hidden: boolean) => repo.setHidden(id, hidden, Date.now());
export const findTarget = (id: number) => repo.findById(id);
