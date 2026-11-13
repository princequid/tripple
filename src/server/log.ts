import 'server-only';
import { createHash } from 'node:crypto';

/**
 * Structured JSON logger (BACKEND_ARCHITECTURE §8). Never logs emails, codes, tokens, cookies, raw IPs,
 * full user agents or request bodies (BR-79): those keys are redacted before writing.
 */
const REDACT = new Set(['email', 'otp', 'code', 'token', 'cookie', 'cookies', 'ip', 'ipAddress', 'userAgent', 'ua', 'body', 'password', 'authorization', 'secret']);

type Level = 'debug' | 'info' | 'warn' | 'error';

export function redact(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (REDACT.has(k)) out[k] = '[redacted]';
    else if (k === 'userId' && typeof v === 'string') out[k] = hashId(v);
    else out[k] = v;
  }
  return out;
}

export const hashId = (id: string) => createHash('sha256').update(id).digest('hex').slice(0, 12);

function write(level: Level, event: string, fields: Record<string, unknown> = {}) {
  if (process.env.APP_ENV === 'test' && level === 'debug') return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...redact(fields) });
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => write('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => write('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => write('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => write('error', event, fields),
};
