import 'server-only';
import { ZodError } from 'zod';
import { AppError, type ErrorCode } from './errors';
import { log } from './log';
import { randomUUID } from 'node:crypto';

/** API_RESPONSE_CONVENTIONS §2.2: Server Actions never throw expected errors to the client. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message?: string; fields?: Record<string, string>; retryAfter?: number; requestId?: string };

export function zodFields(e: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.join('.') || '_';
    fields[k] ??= i.message;
  }
  return fields;
}

export function toActionError(e: unknown, event: string): Extract<ActionResult<never>, { ok: false }> {
  if (e instanceof AppError) {
    return { ok: false, code: e.code, message: e.message, fields: e.details.fields, retryAfter: e.details.retryAfter };
  }
  if (e instanceof ZodError) {
    return { ok: false, code: 'VALIDATION', message: 'Check the highlighted fields.', fields: zodFields(e) };
  }
  const requestId = randomUUID();
  log.error(event, { requestId, err: e instanceof Error ? e.message : String(e) });
  return { ok: false, code: 'INTERNAL', message: 'Something went wrong. Try again.', requestId };
}

export async function runAction<T>(event: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    // Next.js control-flow errors (redirect/notFound) must propagate.
    if (e && typeof e === 'object' && 'digest' in e && typeof (e as { digest: unknown }).digest === 'string') {
      const d = (e as { digest: string }).digest;
      if (d.startsWith('NEXT_REDIRECT') || d.startsWith('NEXT_HTTP_ERROR_FALLBACK') || d === 'NEXT_NOT_FOUND') throw e;
    }
    return toActionError(e, event);
  }
}
