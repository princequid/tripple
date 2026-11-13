import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';
import type { Db } from '@/server/db/client';
import { auth } from '@/server/auth';
import { OUTBOX_FILE } from '@/server/email';
import { setupTestDb, makeProfile, makeShot } from '../helpers/db';
import * as onboardingRoute from '@/app/api/onboarding/route';
import * as followRoute from '@/app/api/users/[username]/follow/route';
import * as followersRoute from '@/app/api/users/[username]/followers/route';
import * as userRoute from '@/app/api/users/[username]/route';
import * as collectionsRoute from '@/app/api/collections/route';
import * as collectionShotRoute from '@/app/api/collections/[id]/shots/[shotId]/route';
import * as collectionRoute from '@/app/api/collections/[id]/route';
import * as commentsRoute from '@/app/api/shots/[id]/comments/route';
import * as shotRoute from '@/app/api/shots/[id]/route';
import * as shotsRoute from '@/app/api/shots/route';
import * as publishRoute from '@/app/api/shots/[id]/publish/route';
import * as uploadsRoute from '@/app/api/uploads/route';
import * as uploadFileRoute from '@/app/api/uploads/[id]/file/route';
import * as uploadCompleteRoute from '@/app/api/uploads/[id]/complete/route';
import * as jobsRoute from '@/app/api/jobs/route';
import * as reportsRoute from '@/app/api/reports/route';
import * as meProfileRoute from '@/app/api/me/profile/route';
import * as moderationRoute from '@/app/api/moderation/reports/route';
import * as suggestRoute from '@/app/api/search/suggest/route';
import * as specialtiesRoute from '@/app/api/specialties/route';

/**
 * HTTP contract for the R2 Route Handlers (API_SPECIFICATION §5): real Better Auth session cookie, Origin
 * checks, status codes, envelopes and problem details — no server process needed.
 */
let db: Db;
const ORIGIN = 'http://localhost:3000';
let cookie = '';

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;
async function call(h: unknown, method: string, path: string, opts: { body?: unknown; raw?: BodyInit; params?: Record<string, string>; cookie?: string | null; origin?: string | null; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { 'x-forwarded-for': `10.20.${Math.floor(Math.random() * 250)}.1`, ...(opts.headers ?? {}) };
  if (opts.origin !== null) headers.origin = opts.origin ?? ORIGIN;
  const c = opts.cookie === undefined ? cookie : opts.cookie;
  if (c) headers.cookie = c;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  const req = new Request(`${ORIGIN}${path}`, { method, headers, body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined) });
  const res = await (h as Handler)(req, { params: Promise.resolve(opts.params ?? {}) });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

const authPost = (path: string, body: unknown) =>
  auth.handler(new Request(`${ORIGIN}/api/auth${path}`, { method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-forwarded-for': '10.30.0.1' }, body: JSON.stringify(body) }));

beforeAll(async () => {
  db = await setupTestDb();
  const email = `api-r2-${Date.now()}@example.test`;
  expect((await authPost('/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
  const code = fs.readFileSync(OUTBOX_FILE, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { to: string; code: string }).filter((m) => m.to === email).pop()!.code;
  const res = await authPost('/sign-in/email-otp', { email, otp: code });
  cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const ob = await call(onboardingRoute.POST, 'POST', '/api/onboarding', { body: { username: 'api-user', displayName: 'Api User' } });
  expect(ob.status).toBe(201);
});

describe('R2 HTTP contracts', () => {
  it('cross-cutting: origin check, 401 for visitors, problem details with requestId, 404 for malformed ids', async () => {
    const other = await makeProfile(db, { username: 'target-x' });
    const noOrigin = await call(followRoute.PUT, 'PUT', '/api/users/target-x/follow', { params: { username: other.username }, origin: null });
    expect(noOrigin.status).toBe(403);
    expect(noOrigin.body).toMatchObject({ code: 'ORIGIN_REJECTED', status: 403 });
    expect(noOrigin.headers.get('content-type')).toBe('application/problem+json');
    expect(noOrigin.body.requestId).toBe(noOrigin.headers.get('x-request-id'));
    const evil = await call(followRoute.PUT, 'PUT', '/api/users/target-x/follow', { params: { username: other.username }, origin: 'https://evil.example' });
    expect(evil.status).toBe(403);
    const anon = await call(followRoute.PUT, 'PUT', '/api/users/target-x/follow', { params: { username: other.username }, cookie: null });
    expect(anon).toMatchObject({ status: 401, body: { code: 'UNAUTHENTICATED' } });
    expect((await call(collectionRoute.GET, 'GET', '/api/collections/abc', { params: { id: 'abc' } })).status).toBe(404);
    const bad = await call(collectionsRoute.POST, 'POST', '/api/collections', { body: { name: '' } });
    expect(bad).toMatchObject({ status: 400, body: { code: 'VALIDATION', fields: { name: expect.any(String) } } });
  });

  it('follow → profile counts → followers list envelope', async () => {
    await makeProfile(db, { username: 'star-x' });
    const f = await call(followRoute.PUT, 'PUT', '/api/users/star-x/follow', { params: { username: 'star-x' } });
    expect(f).toMatchObject({ status: 200, body: { data: { following: true, followersCount: 1 } } });
    const self = await call(followRoute.PUT, 'PUT', '/api/users/api-user/follow', { params: { username: 'api-user' } });
    expect(self).toMatchObject({ status: 403, body: { code: 'CANNOT_FOLLOW_SELF' } });
    const p = await call(userRoute.GET, 'GET', '/api/users/star-x', { params: { username: 'star-x' } });
    expect(p.body.data).toMatchObject({ isFollowing: true, stats: { followers: 1, following: 0 } });
    const list = await call(followersRoute.GET, 'GET', '/api/users/star-x/followers', { params: { username: 'star-x' } });
    expect(list.body).toMatchObject({ data: [{ username: 'api-user', isOwn: true, isFollowing: null }], page: { nextCursor: null, limit: 24 } });
  });

  it('collections with Idempotency-Key replay, save, and shot detail isSaved/savesCount', async () => {
    const author = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const key = randomUUID();
    const c1 = await call(collectionsRoute.POST, 'POST', '/api/collections', { body: { name: 'Inspo' }, headers: { 'idempotency-key': key } });
    const c2 = await call(collectionsRoute.POST, 'POST', '/api/collections', { body: { name: 'Inspo' }, headers: { 'idempotency-key': key } });
    expect(c1.status).toBe(201);
    expect(c2).toMatchObject({ status: 201, body: { data: { id: c1.body.data.id } } }); // replayed, not a 409
    expect((await call(collectionsRoute.POST, 'POST', '/api/collections', { body: { name: 'inspo' } })).status).toBe(409);
    const id = String(c1.body.data.id);
    const saved = await call(collectionShotRoute.PUT, 'PUT', `/api/collections/${id}/shots/${s.id}`, { params: { id, shotId: String(s.id) } });
    expect(saved.body.data).toMatchObject({ saved: true, savesCount: 1 });
    const d = await call(shotRoute.GET, 'GET', `/api/shots/${s.id}`, { params: { id: String(s.id) } });
    expect(d.body.data).toMatchObject({ isSaved: true, savesCount: 1, commentsCount: 0, commentsDisabled: false, isFollowingOwner: false });
  });

  it('comments: POST 201 then GET thread envelope', async () => {
    const author = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    const params = { id: String(s.id) };
    const posted = await call(commentsRoute.POST, 'POST', `/api/shots/${s.id}/comments`, { body: { body: 'Great work' }, params });
    expect(posted).toMatchObject({ status: 201, body: { data: { body: 'Great work', canEdit: true, replies: [] } } });
    const thread = await call(commentsRoute.GET, 'GET', `/api/shots/${s.id}/comments`, { params, cookie: null });
    expect(thread.body).toMatchObject({ data: { total: 1, disabled: false, canModerate: false, comments: [{ body: 'Great work', isLiked: null }] }, page: { nextCursor: null, limit: 24 } });
  });

  it('upload (local provider) → draft → publish → public detail', async () => {
    const bytes = await sharp({ create: { width: 900, height: 700, channels: 3, background: '#118866' } }).png().toBuffer();
    const slot = await call(uploadsRoute.POST, 'POST', '/api/uploads', { body: { purpose: 'shot', fileName: 'x.png', mimeType: 'image/png', size: bytes.length } });
    expect(slot).toMatchObject({ status: 201, body: { data: { provider: 'local', method: 'PUT', fields: {} } } });
    const mediaId = slot.body.data.mediaId as string;
    const put = await call(uploadFileRoute.PUT, 'PUT', slot.body.data.uploadUrl, { raw: bytes, params: { id: mediaId } });
    expect(put.body.data.received).toBe(bytes.length);
    const done = await call(uploadCompleteRoute.POST, 'POST', `/api/uploads/${mediaId}/complete`, { body: {}, params: { id: mediaId } });
    expect(done.body.data).toMatchObject({ status: 'ready', width: 900, height: 700 });
    const draft = await call(shotsRoute.POST, 'POST', '/api/shots', { body: { title: 'Green study', categorySlug: 'illustration', tags: ['green'], blocks: [{ type: 'image', mediaId }] } });
    expect(draft).toMatchObject({ status: 201, body: { data: { status: 'draft' } } });
    const id = String(draft.body.data.id);
    expect((await call(shotRoute.GET, 'GET', `/api/shots/${id}`, { params: { id }, cookie: null })).status).toBe(404);
    const pub = await call(publishRoute.POST, 'POST', `/api/shots/${id}/publish`, { params: { id } });
    expect(pub.body.data.status).toBe('published');
    const detail = await call(shotRoute.GET, 'GET', `/api/shots/${id}`, { params: { id }, cookie: null });
    expect(detail.body.data).toMatchObject({ title: 'Green study', isSaved: null, tags: [{ name: 'green', slug: 'green' }] });
  });

  it('jobs, reports, profile settings, staff queue guard, suggest, specialties', async () => {
    const job = await call(jobsRoute.POST, 'POST', '/api/jobs', {
      body: {
        title: 'Brand Designer',
        descriptionHtml: '<p>Join a small team building a brand system for climate products across print and web.</p>',
        workplaceType: 'remote',
        specialtySlug: 'brand-graphic-design',
        employmentType: 'full-time',
        applyUrl: 'https://jobs.example/brand',
        companyName: 'Leaf',
        companyWebsite: 'https://leaf.example',
      },
    });
    expect(job).toMatchObject({ status: 201, body: { data: { status: 'active', isOwn: true } } });
    expect(job.headers.get('location')).toBe(`/jobs/${job.body.data.id}-brand-designer`);
    const board = await call(jobsRoute.GET, 'GET', '/api/jobs?specialty=brand-graphic-design&remote=true', { cookie: null });
    expect(board.body).toMatchObject({ data: [{ title: 'Brand Designer' }], page: { limit: 20 } });
    const author = await makeProfile(db);
    const s = await makeShot(db, { authorId: author.profileId });
    expect((await call(reportsRoute.POST, 'POST', '/api/reports', { body: { targetType: 'shot', targetId: s.id, reason: 'spam' } })).status).toBe(201);
    expect(await call(reportsRoute.POST, 'POST', '/api/reports', { body: { targetType: 'shot', targetId: s.id, reason: 'spam' } })).toMatchObject({ status: 200, body: { data: { status: 'already-reported' } } });
    expect((await call(moderationRoute.GET, 'GET', '/api/moderation/reports')).status).toBe(403);
    const prof = await call(meProfileRoute.PATCH, 'PATCH', '/api/me/profile', { body: { headline: 'Brand + motion' } });
    expect(prof.body.data).toMatchObject({ headline: 'Brand + motion', displayName: 'Api User' });
    expect(JSON.stringify(prof.body)).not.toContain('@example.test'); // the sign-in email is not in profile settings
    expect((await call(suggestRoute.GET, 'GET', '/api/search/suggest?q=ap', { cookie: null })).body.data[0]).toMatchObject({ kind: 'designer', href: '/api-user' });
    expect((await call(specialtiesRoute.GET, 'GET', '/api/specialties', { cookie: null })).body.data).toHaveLength(9);
  });
});
