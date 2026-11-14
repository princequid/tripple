import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { nextCookies, toNextJsHandler } from 'better-auth/next-js';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { dbSync, ensureDbReady } from '../db/client';
import * as schema from '../db/schema';
import { env } from '../env';
import { sendOtpEmail } from '../email';
import { check as checkLimit } from '../rate-limit';
import { hashId } from '../log';
import { AppError } from '../errors';

/**
 * Better Auth instance (D-03, D-04, ADR-003). Email OTP is the only first-party method (BR-09, BR-12).
 * Configuration baseline proven in SPIKE-03: hashed OTP, 6 digits, 10 min, 5 attempts, DB rate limiter.
 */
// No I/O at import: `next build` imports this module in parallel workers. Connection setup runs lazily
// (`ensureDbReady`) before the first request reaches Better Auth (route handler and getViewer).
const db = dbSync();

const SEND_PATH = '/email-otp/send-verification-otp';
const VERIFY_PATH = '/sign-in/email-otp';
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const normaliseEmail = (raw: unknown) => (typeof raw === 'string' ? raw.trim().toLowerCase() : '');

function apiError(status: 'BAD_REQUEST' | 'FORBIDDEN' | 'TOO_MANY_REQUESTS' | 'SERVICE_UNAVAILABLE', code: string, message: string, extra: Record<string, unknown> = {}) {
  return new APIError(status, { code, message, ...extra });
}

export const auth = betterAuth({
  appName: 'Trippple',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  // BR-12: no passwords in R1–R3. A-28: the demo prototype may switch on email + password (PROTOTYPE_PASSWORD_AUTH=1,
  // refused in production by env.ts), so people can sign up and sign in without an email provider.
  emailAndPassword: { enabled: env.PROTOTYPE_PASSWORD_AUTH === '1', minPasswordLength: 8, maxPasswordLength: 128, autoSignIn: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // BR-13: 30 days (SR-3)
    updateAge: 60 * 60 * 24, // renewed when used more than 24 h after the last renewal
  },
  account: {
    // BR-11: a verified Google email matching an existing account is linked to it.
    accountLinking: { enabled: true, trustedProviders: ['google'] },
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            prompt: 'select_account',
            mapProfileToUser: (profile) => {
              // BR-11: only Google-verified emails; profile photos are not imported.
              if (!profile.email_verified) {
                throw apiError('FORBIDDEN', 'FORBIDDEN', 'Use a Google account with a verified email address.');
              }
              return { image: undefined, email: normaliseEmail(profile.email) };
            },
          },
        }
      : {},
  advanced: {
    ipAddress: { ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'] }, // ADR-003 §3: trusted proxy header
    useSecureCookies: env.BETTER_AUTH_URL.startsWith('https://'),
  },
  rateLimit: {
    enabled: true,
    storage: 'database', // F-07 / D-12: the in-memory default is unsafe on serverless
    window: 60,
    max: 100,
    customRules: {
      [SEND_PATH]: { window: 3600, max: 20 }, // BR-06 per IP 20/hour
      [VERIFY_PATH]: { window: 600, max: 30 }, // BR-07 per IP 30/10 min
      '/sign-in/social': { window: 600, max: 30 }, // RL-AUTH-OAUTH
      '/sign-in/email': { window: 600, max: 30 }, // A-28 prototype password sign-in, same budget as code checks
      '/sign-up/email': { window: 3600, max: 20 },
      '/callback/*': { window: 600, max: 30 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SEND_PATH && ctx.path !== VERIFY_PATH && ctx.path !== '/sign-in/email' && ctx.path !== '/sign-up/email') return;
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const email = normaliseEmail(body.email);
      // BR-10: server-side validation of the normalised email.
      if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
        throw apiError('BAD_REQUEST', 'VALIDATION', 'Please enter a valid email address.');
      }
      if (ctx.path === SEND_PATH) {
        if (body.type !== 'sign-in') throw apiError('BAD_REQUEST', 'VALIDATION', 'Unsupported code type.');
        // BR-08: Cloudflare Turnstile removed (user directive 2026-11-13). Bot protection on code sends is the
        // per-IP Better Auth limiter plus the per-email limits below.
        // BR-05 / BR-06 per-email limits: 1 per 60 s, 5 per hour, 10 per 24 h. Same response for unknown emails.
        const r = await checkLimit('RL-AUTH-SEND', hashId(email));
        if (!r.ok) {
          throw apiError('TOO_MANY_REQUESTS', 'RATE_LIMITED', `Try again in ${r.retryAfter} seconds.`, { retryAfter: r.retryAfter });
        }
      }
      // Return the normalised email to the endpoint.
      return { context: { ...ctx, body: { ...body, email } } };
    }),
  },
  databaseHooks: {
    session: {
      create: {
        // BR-25: a suspended or deleted account cannot sign in (generic message, no detail).
        before: async (session) => {
          const [p] = await db
            .select({ suspendedAt: schema.profiles.suspendedAt, deletedAt: schema.profiles.deletedAt })
            .from(schema.profiles)
            .where(eq(schema.profiles.userId, session.userId))
            .limit(1);
          if (p && (p.suspendedAt || p.deletedAt)) {
            throw apiError('FORBIDDEN', 'ACCOUNT_SUSPENDED', 'This account is unavailable.');
          }
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6, // BR-01
      expiresIn: 600, // BR-03: 10 minutes
      allowedAttempts: 5, // BR-04
      storeOTP: 'hashed', // BR-02 / F-07
      disableSignUp: false, // BR-09: one flow; verifying a code for an unknown email creates the account
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await sendOtpEmail({ to: email, code: otp, purpose: type === 'sign-in' ? 'sign-in' : 'email-verification' });
        } catch (e) {
          if (e instanceof AppError) throw apiError('SERVICE_UNAVAILABLE', 'EMAIL_UNAVAILABLE', e.message);
          throw e;
        }
      },
    }),
    nextCookies(), // must stay last
  ],
});

export type Auth = typeof auth;

/** Next.js route handlers for `/api/auth/[...all]`, with the lazy connection setup run first. */
const nextHandlers = toNextJsHandler(auth);
export const authRouteHandlers = {
  GET: async (req: Request) => {
    await ensureDbReady();
    return nextHandlers.GET(req);
  },
  POST: async (req: Request) => {
    await ensureDbReady();
    return nextHandlers.POST(req);
  },
};
