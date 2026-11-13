import 'server-only';
import { sql, type SQL } from 'drizzle-orm';
import { getDb } from '@/server/db/client';

/** Jobs board (J-01…J-03). Owned tables: jobs, companies (specialties is reference data). */
export type JobRow = {
  id: number;
  posterId: number;
  title: string;
  slug: string;
  descriptionHtml: string;
  location: string | null;
  workplaceType: 'remote' | 'on-site' | 'hybrid';
  employmentType: 'full-time' | 'freelance-contract';
  applyUrl: string;
  publishedAt: number;
  expiresAt: number;
  closedAt: number | null;
  hiddenAt: number | null;
  deletedAt: number | null;
  specialtySlug: string;
  specialtyName: string;
  companyName: string;
  companyWebsite: string;
  companyLogoKey: string | null;
  companyLogoMediaId: string | null;
  posterGone: number;
};

const select = sql`
  SELECT j.id AS id, j.poster_id AS posterId, j.title AS title, j.slug AS slug, j.description_html AS descriptionHtml,
         j.location AS location, j.workplace_type AS workplaceType, j.employment_type AS employmentType, j.apply_url AS applyUrl,
         j.published_at AS publishedAt, j.expires_at AS expiresAt, j.closed_at AS closedAt, j.hidden_at AS hiddenAt, j.deleted_at AS deletedAt,
         sp.slug AS specialtySlug, sp.name AS specialtyName,
         c.name AS companyName, c.website_url AS companyWebsite, m.storage_key AS companyLogoKey, c.logo_media_id AS companyLogoMediaId,
         (p.suspended_at IS NOT NULL OR p.deleted_at IS NOT NULL) AS posterGone
  FROM jobs j JOIN specialties sp ON sp.id = j.specialty_id JOIN companies c ON c.id = j.company_id
  JOIN profiles p ON p.id = j.poster_id LEFT JOIN media m ON m.id = c.logo_media_id`;

export const activeSql = (now: number) => sql`j.closed_at IS NULL AND j.expires_at > ${now} AND j.hidden_at IS NULL AND j.deleted_at IS NULL
  AND p.suspended_at IS NULL AND p.deleted_at IS NULL`;

export async function findById(id: number): Promise<JobRow | null> {
  const db = await getDb();
  const r = await db.all<JobRow>(sql`${select} WHERE j.id = ${id} LIMIT 1`);
  return r[0] ?? null;
}

const like = (s: string) => `%${s.replace(/[%_\\]/g, '\\$&')}%`;

export type Filter = { q?: string; specialtyIds?: number[]; location?: string; remote?: boolean; employment?: string[] };

/** BR-75 filters over active jobs, newest first (keyset on published_at, id). */
export async function listActive(f: Filter, now: number, after: (string | number)[] | null, limit: number): Promise<JobRow[]> {
  const db = await getDb();
  const w: SQL[] = [activeSql(now)];
  if (f.specialtyIds?.length) w.push(sql`j.specialty_id IN (${sql.join(f.specialtyIds.map((i) => sql`${i}`), sql`, `)})`);
  if (f.employment?.length) w.push(sql`j.employment_type IN (${sql.join(f.employment.map((e) => sql`${e}`), sql`, `)})`);
  if (f.location && f.remote) w.push(sql`(lower(coalesce(j.location, '')) LIKE ${like(f.location.toLowerCase())} ESCAPE '\\' OR j.workplace_type = 'remote')`);
  else if (f.location) w.push(sql`lower(coalesce(j.location, '')) LIKE ${like(f.location.toLowerCase())} ESCAPE '\\'`);
  else if (f.remote) w.push(sql`j.workplace_type = 'remote'`);
  if (f.q) {
    const q = like(f.q.toLowerCase());
    w.push(sql`(lower(j.title) LIKE ${q} ESCAPE '\\' OR lower(c.name) LIKE ${q} ESCAPE '\\' OR lower(j.description_text) LIKE ${q} ESCAPE '\\')`);
  }
  if (after && after.length === 2) w.push(sql`(j.published_at, j.id) < (${after[0]}, ${after[1]})`);
  return db.all<JobRow>(sql`${select} WHERE ${sql.join(w, sql` AND `)} ORDER BY j.published_at DESC, j.id DESC LIMIT ${limit}`);
}

export async function listByPoster(posterId: number, after: (string | number)[] | null, limit: number): Promise<JobRow[]> {
  const db = await getDb();
  const cur = after && after.length === 2 ? sql`AND (j.published_at, j.id) < (${after[0]}, ${after[1]})` : sql``;
  return db.all<JobRow>(sql`${select} WHERE j.poster_id = ${posterId} AND j.deleted_at IS NULL ${cur} ORDER BY j.published_at DESC, j.id DESC LIMIT ${limit}`);
}

export async function countActiveByPoster(posterId: number, now: number): Promise<number> {
  const db = await getDb();
  const r = await db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM jobs WHERE poster_id = ${posterId}
    AND closed_at IS NULL AND expires_at > ${now} AND deleted_at IS NULL`);
  return Number(r[0]?.n ?? 0);
}

/** One company per (poster, name, case-insensitive); website and logo follow the latest post. */
export async function upsertCompany(posterId: number, name: string, website: string, logoMediaId: string | null, now: number): Promise<number> {
  const db = await getDb();
  const r = await db.all<{ id: number }>(sql`INSERT INTO companies (owner_profile_id, name, name_key, website_url, logo_media_id, created_at, updated_at)
    VALUES (${posterId}, ${name}, ${name.toLowerCase()}, ${website}, ${logoMediaId}, ${now}, ${now})
    ON CONFLICT(owner_profile_id, name_key) DO UPDATE SET name = excluded.name, website_url = excluded.website_url,
      logo_media_id = excluded.logo_media_id, updated_at = excluded.updated_at
    RETURNING id`);
  return Number(r[0]!.id);
}

export type JobWrite = {
  companyId: number;
  specialtyId: number;
  title: string;
  slug: string;
  descriptionHtml: string;
  descriptionText: string;
  location: string | null;
  workplaceType: string;
  employmentType: string;
  applyUrl: string;
};

export async function insert(posterId: number, v: JobWrite, now: number, ttlMs: number): Promise<number> {
  const db = await getDb();
  const r = await db.all<{ id: number }>(sql`INSERT INTO jobs (poster_id, company_id, specialty_id, title, slug, description_html, description_text,
      location, workplace_type, employment_type, apply_url, published_at, expires_at, created_at, updated_at)
    VALUES (${posterId}, ${v.companyId}, ${v.specialtyId}, ${v.title}, ${v.slug}, ${v.descriptionHtml}, ${v.descriptionText},
      ${v.location}, ${v.workplaceType}, ${v.employmentType}, ${v.applyUrl}, ${now}, ${now + ttlMs}, ${now}, ${now}) RETURNING id`);
  return Number(r[0]!.id);
}

/** BR-73: edits never change `published_at` / `expires_at`. */
export async function update(id: number, v: JobWrite, now: number) {
  const db = await getDb();
  await db.run(sql`UPDATE jobs SET company_id = ${v.companyId}, specialty_id = ${v.specialtyId}, title = ${v.title}, slug = ${v.slug},
    description_html = ${v.descriptionHtml}, description_text = ${v.descriptionText}, location = ${v.location},
    workplace_type = ${v.workplaceType}, employment_type = ${v.employmentType}, apply_url = ${v.applyUrl}, updated_at = ${now}
    WHERE id = ${id}`);
}

export async function close(id: number, now: number) {
  const db = await getDb();
  await db.run(sql`UPDATE jobs SET closed_at = ${now}, updated_at = ${now} WHERE id = ${id} AND closed_at IS NULL`);
}

export async function setHidden(id: number, hidden: boolean, now: number): Promise<boolean> {
  const db = await getDb();
  const r = await db.run(sql`UPDATE jobs SET hidden_at = ${hidden ? now : null} WHERE id = ${id}`);
  return r.rowsAffected > 0;
}
