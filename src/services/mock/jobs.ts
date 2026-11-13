import type { JobDetail, JobInput, JobQuery, JobSummary } from '../contracts';
import { getDb, jobSlug, nextId, now, save, specialtyBySlug, type JobRow } from './db';
import { fail, mockViewer, ok, paginate, read, write } from './runtime';
import { validateJob } from '../reference';

const DAY = 86_400_000;
const status = (j: JobRow): JobSummary['status'] => (j.closed ? 'closed' : new Date(j.expiresAt).getTime() < Date.now() ? 'expired' : 'active');

const toSummary = (j: JobRow): JobSummary => ({
  id: j.id,
  slug: jobSlug(j.title),
  title: j.title,
  company: { name: j.companyName, websiteUrl: j.companyWebsite, logoKey: j.companyLogoKey },
  location: j.location || null,
  workplaceType: j.workplaceType as JobSummary['workplaceType'],
  employmentType: j.employmentType as JobSummary['employmentType'],
  specialty: { ...specialtyBySlug(j.specialtySlug) },
  postedAt: j.postedAt,
  expiresAt: j.expiresAt,
  status: status(j),
});

/** BR-75 filter semantics. */
export const listJobs = (q: JobQuery) =>
  read(async () => {
    const d = await getDb();
    const kw = q.q?.trim().toLowerCase();
    const loc = q.location?.trim().toLowerCase();
    const rows = d.jobs
      .filter((j) => status(j) === 'active')
      .filter((j) => !kw || [j.title, j.companyName, j.descriptionHtml.replace(/<[^>]+>/g, ' ')].some((s) => s.toLowerCase().includes(kw)))
      .filter((j) => !q.specialties?.length || q.specialties.includes(j.specialtySlug))
      .filter((j) => !q.employment?.length || q.employment.includes(j.employmentType as JobSummary['employmentType']))
      .filter((j) => !loc || j.location.toLowerCase().includes(loc) || (q.remote && j.workplaceType === 'remote'))
      .filter((j) => loc || !q.remote || j.workplaceType === 'remote')
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    return paginate(rows.map(toSummary), q.cursor, 20);
  });

export const getJob = (id: number) =>
  read(async () => {
    const d = await getDb();
    const j = d.jobs.find((x) => x.id === id);
    if (!j) return fail<JobDetail>(404, 'NOT_FOUND', 'This job does not exist.');
    return ok<JobDetail>({ ...toSummary(j), descriptionHtml: j.descriptionHtml, applyUrl: j.applyUrl, isOwn: j.owner === mockViewer()?.username });
  });

export const myJobs = () =>
  read(async () => {
    const d = await getDb();
    const me = mockViewer()?.username;
    return ok<JobSummary[]>(d.jobs.filter((j) => j.owner === me).sort((a, b) => b.postedAt.localeCompare(a.postedAt)).map(toSummary));
  });

export const createJob = (input: JobInput) =>
  write(async (me) => {
    const d = await getDb();
    const errors = validateJob(input);
    if (Object.keys(errors).length) return fail<JobDetail>(400, 'VALIDATION', 'Check the highlighted fields.', errors);
    if (d.jobs.filter((j) => j.owner === me.username && status(j) === 'active').length >= 3) return fail<JobDetail>(409, 'LIMIT_REACHED', 'You can have at most 3 active free jobs. Close one to post another.');
    const posted = Date.now();
    const row: JobRow = {
      id: nextId(d), owner: me.username, title: input.title.trim(), descriptionHtml: input.descriptionHtml, location: input.location.trim(), workplaceType: input.workplaceType,
      specialtySlug: input.specialtySlug, employmentType: input.employmentType, applyUrl: input.applyUrl.trim(), companyName: input.companyName.trim(),
      companyWebsite: input.companyWebsite.trim(), companyLogoKey: input.companyLogoKey, postedAt: new Date(posted).toISOString(), expiresAt: new Date(posted + 30 * DAY).toISOString(), closed: false,
    };
    d.jobs.push(row);
    save();
    return ok<JobDetail>({ ...toSummary(row), descriptionHtml: row.descriptionHtml, applyUrl: row.applyUrl, isOwn: true });
  });

export const updateJob = (id: number, input: JobInput) =>
  write(async (me) => {
    const d = await getDb();
    const j = d.jobs.find((x) => x.id === id && x.owner === me.username);
    if (!j) return fail<JobDetail>(404, 'NOT_FOUND', 'Job not found.');
    const errors = validateJob(input);
    if (Object.keys(errors).length) return fail<JobDetail>(400, 'VALIDATION', 'Check the highlighted fields.', errors);
    Object.assign(j, {
      title: input.title.trim(), descriptionHtml: input.descriptionHtml, location: input.location.trim(), workplaceType: input.workplaceType, specialtySlug: input.specialtySlug,
      employmentType: input.employmentType, applyUrl: input.applyUrl.trim(), companyName: input.companyName.trim(), companyWebsite: input.companyWebsite.trim(), companyLogoKey: input.companyLogoKey,
    });
    save();
    return ok<JobDetail>({ ...toSummary(j), descriptionHtml: j.descriptionHtml, applyUrl: j.applyUrl, isOwn: true });
  });

export const closeJob = (id: number) =>
  write(async (me) => {
    const d = await getDb();
    const j = d.jobs.find((x) => x.id === id && x.owner === me.username);
    if (!j) return fail<null>(404, 'NOT_FOUND', 'Job not found.');
    j.closed = true;
    j.expiresAt = now();
    save();
    return ok(null);
  });
