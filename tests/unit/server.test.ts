import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { encodeCursor, decodeCursor } from '@/server/cursor';
import { ERROR_STATUS, AppError } from '@/server/errors';
import { problem } from '@/server/http';
import { redact } from '@/server/log';
import { toActionError } from '@/server/action-result';
import { z } from 'zod';

describe('BR-35 signed cursors', () => {
  it('round-trips for the same feed key', () => {
    const c = encodeCursor('feed:popular:now:all', [1.5, 1000, 7]);
    expect(decodeCursor(c, 'feed:popular:now:all')).toEqual([1.5, 1000, 7]);
    expect(decodeCursor(null, 'k')).toBeNull();
  });
  it('rejects another feed key, tampering and garbage with INVALID_CURSOR', () => {
    const c = encodeCursor('a', [1]);
    const code = (fn: () => unknown) => {
      try {
        fn();
        return null;
      } catch (e) {
        return (e as AppError).code;
      }
    };
    expect(code(() => decodeCursor(c, 'b'))).toBe('INVALID_CURSOR');
    expect(code(() => decodeCursor(`x${c}`, 'a'))).toBe('INVALID_CURSOR');
    expect(code(() => decodeCursor('nonsense', 'a'))).toBe('INVALID_CURSOR');
  });
});

describe('Error vocabulary matches API_RESPONSE_CONVENTIONS §3.2', () => {
  it('every code in the conventions table exists with the same status', () => {
    const doc = fs.readFileSync(path.join(process.cwd(), 'docs/04-api/API_RESPONSE_CONVENTIONS.md'), 'utf8');
    const section = doc.split('### 3.2')[1]!.split('### 3.3')[0]!;
    const rows = [...section.matchAll(/^\|[^|]*\|\s*\**(\d{3})\**\s*\|\s*`([A-Z_]+)`/gm)].map((m) => [m[2]!, Number(m[1])] as const);
    expect(rows.length).toBeGreaterThanOrEqual(20);
    for (const [code, status] of rows) {
      expect(ERROR_STATUS[code as keyof typeof ERROR_STATUS], code).toBe(status);
    }
  });
});

describe('problem details (RFC 9457) and action errors', () => {
  it('maps AppError with Retry-After', async () => {
    const r = problem(new AppError('RATE_LIMITED', 'Slow down', { retryAfter: 42 }), 'req-1');
    expect(r.status).toBe(429);
    expect(r.headers.get('Retry-After')).toBe('42');
    expect(r.headers.get('content-type')).toBe('application/problem+json');
    expect(await r.json()).toMatchObject({ code: 'RATE_LIMITED', retryAfter: 42, requestId: 'req-1', status: 429 });
  });
  it('never leaks internal messages', async () => {
    const r = problem(new Error('SQLITE_ERROR: secret table'), 'req-2');
    const body = await r.json();
    expect(r.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('SQLITE');
  });
  it('maps Zod errors to VALIDATION with fields', () => {
    const e = z.object({ shotId: z.number() }).safeParse({ shotId: 'x' }).error!;
    expect(toActionError(e, 't')).toMatchObject({ ok: false, code: 'VALIDATION', fields: { shotId: expect.any(String) } });
  });
});

describe('BR-79 log redaction', () => {
  it('redacts personal data and hashes user ids', () => {
    const out = redact({ email: 'a@b.c', otp: '123456', ip: '1.2.3.4', userAgent: 'x', userId: 'abc', shotId: 3 });
    expect(out).toMatchObject({ email: '[redacted]', otp: '[redacted]', ip: '[redacted]', userAgent: '[redacted]', shotId: 3 });
    expect(out.userId).toMatch(/^[0-9a-f]{12}$/);
  });
});
