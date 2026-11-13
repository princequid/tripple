import 'server-only';
import type { z } from 'zod';
import { AppError } from './errors';
import { zodFields } from './action-result';

/** Parses with a Zod schema; failure → AppError VALIDATION with per-field messages (API_RESPONSE_CONVENTIONS §3). */
export function validate<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const fields = zodFields(r.error);
  const first = Object.values(fields)[0];
  throw new AppError('VALIDATION', first ?? 'Invalid request.', { fields });
}
