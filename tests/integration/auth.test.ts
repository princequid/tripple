import fs from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import type { Db } from '@/server/db/client';
import { auth } from '@/server/auth';
import { OUTBOX_FILE } from '@/server/email';
import { getViewer, requireMember, requirePending, requireStaff } from '@/modules/auth/service';
import { resetLimitsForTests } from '@/server/rate-limit';
import { setupTestDb, makeProfile, errorCode, visitor } from '../helpers/db';

/**
 * Auth architecture (A-01, A-03, BR-01…BR-25) through Better Auth's real HTTP handler, without a server:
 * code request → outbox → verify → cookie → getViewer, plus guards and suspension.
 */
let db: Db;
beforeAll(async () => {
  db = await setupTestDb();
});

const ORIGIN = 'http://localhost:3000';
const post = (path: string, body: unknown, cookie?: string) =>
  auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-forwarded-for': `10.9.${Math.floor(Math.random() * 250)}.1`, ...(cookie ? { cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
const lastCode = (email: string) =>
  fs.readFileSync(OUTBOX_FILE, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { to: string; code: string }).filter((m) => m.to === email).pop()!.code;
const cookieOf = (res: Response) => res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

async function signIn(email: string) {
  expect((await post('/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
  const res = await post('/sign-in/email-otp', { email, otp: lastCode(email) });
  expect(res.status).toBe(200);
  return cookieOf(res);
}

describe('sign-in and the request viewer', () => {
  it('a new email becomes a pending viewer; the code is stored hashed (BR-02)', async () => {
    const email = `auth-${Date.now()}@example.test`;
    expect((await post('/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
    const code = lastCode(email);
    const rows = await db.all<{ value: string }>(sql`SELECT value FROM verification`);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.value.includes(code))).toBe(false);
    const res = await post('/sign-in/email-otp', { email, otp: code });
    const v = await getViewer(new Headers({ cookie: cookieOf(res) }));
    expect(v).toMatchObject({ kind: 'pending', email });
    expect(requirePending(v).email).toBe(email);
  });

  it('emails are normalised (BR-10) and a wrong code is INVALID_OTP', async () => {
    const email = `Mixed.${Date.now()}@Example.TEST`;
    await post('/email-otp/send-verification-otp', { email, type: 'sign-in' });
    const wrong = await post('/sign-in/email-otp', { email, otp: '000000' });
    if (wrong.status !== 200) expect((await wrong.json()).code).toBe('INVALID_OTP');
    const ok = await post('/sign-in/email-otp', { email, otp: lastCode(email.toLowerCase()) });
    expect(ok.status).toBe(200);
  });

  it('a member with a profile resolves to member; guards behave', async () => {
    const email = `member-${Date.now()}@example.test`;
    const cookie = await signIn(email);
    const [u] = await db.all<{ id: string }>(sql`SELECT id FROM user WHERE email = ${email}`);
    const now = Date.now();
    await db.run(sql`INSERT INTO profiles (user_id, username, display_name, created_at, updated_at) VALUES (${u!.id}, ${`m${now.toString(36)}`}, 'Member', ${now}, ${now})`);
    const v = await getViewer(new Headers({ cookie }));
    expect(v.kind).toBe('member');
    expect(requireMember(v).displayName).toBe('Member');
    expect(await errorCode(async () => requireStaff(v))).toBe('FORBIDDEN');
    expect(await errorCode(async () => requireMember(visitor))).toBe('UNAUTHENTICATED');
    expect(await errorCode(async () => requirePending(v))).toBe('CONFLICT');
  });

  it('a suspended account is a visitor and cannot start a new session (BR-25)', async () => {
    const email = `sus-${Date.now()}@example.test`;
    const cookie = await signIn(email);
    const [u] = await db.all<{ id: string }>(sql`SELECT id FROM user WHERE email = ${email}`);
    const now = Date.now();
    await db.run(sql`INSERT INTO profiles (user_id, username, display_name, suspended_at, created_at, updated_at) VALUES (${u!.id}, ${`s${now.toString(36)}`}, 'S', ${now}, ${now}, ${now})`);
    // An existing session no longer counts.
    expect((await getViewer(new Headers({ cookie }))).kind).toBe('visitor');
    // A fresh, valid code is refused at session creation (generic ACCOUNT_SUSPENDED, no session cookie).
    await resetLimitsForTests(); // BR-05 per-email 60 s window
    expect((await post('/email-otp/send-verification-otp', { email, type: 'sign-in' })).status).toBe(200);
    const again = await post('/sign-in/email-otp', { email, otp: lastCode(email) });
    expect(again.status).toBe(403);
    expect((await again.json()).code).toBe('ACCOUNT_SUSPENDED');
    expect(again.headers.getSetCookie().some((c) => c.includes('session_token=') && !c.includes('Max-Age=0'))).toBe(false);
  });

  it('staff guard accepts moderators and admins', async () => {
    const staff = await makeProfile(db, { role: 'admin' });
    expect(requireStaff(staff.viewer).role).toBe('admin');
  });

  it('no cookie → visitor', async () => {
    expect(await getViewer(new Headers())).toEqual({ kind: 'visitor' });
  });
});
