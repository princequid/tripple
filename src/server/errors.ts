import 'server-only';

/**
 * Error vocabulary from API_RESPONSE_CONVENTIONS §3.2. Every code has exactly one HTTP status.
 * tests/unit/error-codes.test.ts checks this list against the conventions table.
 */
export const ERROR_STATUS = {
  VALIDATION: 400,
  INVALID_CURSOR: 400,
  INVALID_OTP: 400,
  OTP_EXPIRED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ONBOARDING_REQUIRED: 403,
  TOO_MANY_ATTEMPTS: 403,
  ACCOUNT_SUSPENDED: 403,
  CANNOT_LIKE_OWN: 403,
  CANNOT_FOLLOW_SELF: 403,
  COMMENTS_DISABLED: 403,
  ORIGIN_REJECTED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  USERNAME_TAKEN: 422,
  USERNAME_RESERVED: 422,
  QUOTA_EXCEEDED: 422,
  UNSUPPORTED_MEDIA: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  EMAIL_UNAVAILABLE: 503,
  BOT_CHECK_UNAVAILABLE: 503,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details: { fields?: Record<string, string>; retryAfter?: number } = {},
  ) {
    super(message ?? code);
    this.name = 'AppError';
    this.status = ERROR_STATUS[code];
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
