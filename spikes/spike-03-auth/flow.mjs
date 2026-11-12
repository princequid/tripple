// THROWAWAY SPIKE-03 flow test: email OTP sign-up/sign-in, session in RSC, wrong-code attempts, hashed storage, sign-out, rate limit.
import fs from 'node:fs';
import { createClient } from '@libsql/client';
const BASE = 'http://localhost:3103';
const H = { 'content-type': 'application/json', origin: BASE };
const out = {};
const email = 'spike.user@example.test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 40; i++) { try { await fetch(BASE); break; } catch { await sleep(500); } }
const lastOtp = () => { const l = fs.readFileSync('otp-outbox.log', 'utf8').trim().split('\n'); return JSON.parse(l[l.length - 1]); };
const cookieOf = (res) => (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
const session = async (cookie) => (await (await fetch(BASE + '/', { headers: cookie ? { cookie } : {} })).text()).match(/<pre id="session">(.*?)<\/pre>/s)?.[1]?.replace(/&quot;/g, '"');

out.anon_session = await session();
// 1. request OTP (sign-in type creates the user if sign-up is allowed)
let r = await fetch(BASE + '/api/auth/email-otp/send-verification-otp', { method: 'POST', headers: H, body: JSON.stringify({ email, type: 'sign-in' }) });
out.send_otp_status = r.status;
const sent = lastOtp(); out.otp_length = sent.otp.length; out.otp_type = sent.type;
// 2. stored value must not equal plain OTP (hashed)
const db = createClient({ url: 'file:spike03.db' });
const ver = (await db.execute('SELECT identifier, value FROM verification ORDER BY created_at DESC LIMIT 1')).rows[0];
out.verification_identifier = ver?.identifier;
out.otp_stored_hashed = ver ? !String(ver.value).includes(sent.otp) : 'no row';
// 3. wrong code attempts
const wrong = [];
for (let i = 0; i < 6; i++) {
  const w = await fetch(BASE + '/api/auth/sign-in/email-otp', { method: 'POST', headers: H, body: JSON.stringify({ email, otp: '000000' === sent.otp ? '111111' : '000000' }) });
  wrong.push(w.status + ':' + ((await w.json().catch(() => ({})))?.code || ''));
}
out.wrong_code_attempts = wrong;
// 4. correct code after exceeding attempts (should be rejected -> must request a new code)
r = await fetch(BASE + '/api/auth/sign-in/email-otp', { method: 'POST', headers: H, body: JSON.stringify({ email, otp: sent.otp }) });
out.correct_code_after_lockout = r.status + ':' + ((await r.json().catch(() => ({})))?.code || 'ok');
// 5. fresh OTP -> sign in
await sleep(200);
r = await fetch(BASE + '/api/auth/email-otp/send-verification-otp', { method: 'POST', headers: H, body: JSON.stringify({ email, type: 'sign-in' }) });
const otp2 = lastOtp().otp;
r = await fetch(BASE + '/api/auth/sign-in/email-otp', { method: 'POST', headers: H, body: JSON.stringify({ email, otp: otp2 }) });
out.sign_in_status = r.status;
const setCookies = r.headers.getSetCookie?.() || [];
out.session_cookie_attrs = setCookies.map((c) => c.replace(/=([^;]+)/, '=<redacted>'));
const cookie = cookieOf(r);
out.rsc_session_after_sign_in = await session(cookie);
out.user_rows = (await db.execute('SELECT count(*) n, max(email_verified) v FROM user')).rows[0];
// 6. reuse of consumed OTP
r = await fetch(BASE + '/api/auth/sign-in/email-otp', { method: 'POST', headers: H, body: JSON.stringify({ email, otp: otp2 }) });
out.reuse_consumed_otp = r.status;
// 7. CSRF/origin check: POST from foreign origin
r = await fetch(BASE + '/api/auth/email-otp/send-verification-otp', { method: 'POST', headers: { ...H, origin: 'https://evil.example' }, body: JSON.stringify({ email, type: 'sign-in' }) });
out.foreign_origin_post = r.status;
// 8. sign-out
r = await fetch(BASE + '/api/auth/sign-out', { method: 'POST', headers: { ...H, cookie }, body: '{}' });
out.sign_out_status = r.status;
out.rsc_session_after_sign_out_old_cookie = await session(cookie);
// 9. rate limit on OTP sending
const codes = [];
for (let i = 0; i < 8; i++) codes.push((await fetch(BASE + '/api/auth/email-otp/send-verification-otp', { method: 'POST', headers: H, body: JSON.stringify({ email: 'rl@example.test', type: 'sign-in' }) })).status);
out.otp_send_burst_statuses = codes;
out.rate_limit_rows = (await db.execute('SELECT key, count FROM rate_limit')).rows.map((x) => x.key + '=' + x.count);
console.log(JSON.stringify(out, null, 2));
