import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError } from './errors';

/**
 * Opaque, tamper-evident cursors (BR-35, API_RESPONSE_CONVENTIONS §4.1):
 * base64url(JSON { v, k: feedKey, a: after-tuple }) + "." + HMAC-SHA-256. A cursor is valid only for the
 * feed key that produced it; any mismatch → INVALID_CURSOR (400).
 */
type Payload = { v: 1; k: string; a: (string | number)[] };

const secret = () => {
  const s = process.env.CURSOR_HMAC_SECRET;
  if (!s) throw new Error('CURSOR_HMAC_SECRET is not configured');
  return s;
};

const sign = (body: string) => createHmac('sha256', secret()).update(body).digest('base64url');

export function encodeCursor(feedKey: string, after: (string | number)[]): string {
  const body = Buffer.from(JSON.stringify({ v: 1, k: feedKey, a: after } satisfies Payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function decodeCursor(cursor: string | null | undefined, feedKey: string): (string | number)[] | null {
  if (!cursor) return null;
  const [body, mac] = cursor.split('.');
  if (!body || !mac) throw new AppError('INVALID_CURSOR', 'Invalid cursor.');
  const want = Buffer.from(sign(body));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) throw new AppError('INVALID_CURSOR', 'Invalid cursor.');
  let p: Payload;
  try {
    p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Payload;
  } catch {
    throw new AppError('INVALID_CURSOR', 'Invalid cursor.');
  }
  if (p.v !== 1 || p.k !== feedKey || !Array.isArray(p.a)) throw new AppError('INVALID_CURSOR', 'Invalid cursor.');
  return p.a;
}
