import 'server-only';
import { z } from 'zod';

/**
 * Validated configuration (BACKEND_ARCHITECTURE §9, SECURITY_ARCHITECTURE §8).
 * Parsed once; the app fails fast when a required variable is missing or unsafe.
 * Variables for accounts that do not exist yet (Google B-16, Resend B-09) are optional
 * outside production and required in production.
 */
// Production-only rules are enforced when the server starts, not while `next build` collects page data
// (route modules are imported at build time, where production secrets are not, and should not be, present).
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const isProd = process.env.NODE_ENV === 'production' && process.env.APP_ENV !== 'test' && !isBuild;

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1).default('file:.data/local.db'),
    DATABASE_AUTH_TOKEN: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    EMAIL_TRANSPORT: z.enum(['outbox', 'resend']).default('outbox'),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('Trippple <no-reply@example.com>'),
    NEXT_PUBLIC_MEDIA_PROVIDER: z.enum(['local', 'imagekit']).default('local'),
    NEXT_PUBLIC_MEDIA_BASE_URL: z.string().min(1).default('/seed-media'),
    // ImageKit API keys: needed only for uploads (release R2). The public URL endpoint is NEXT_PUBLIC_MEDIA_BASE_URL.
    IMAGEKIT_PUBLIC_KEY: z.string().optional(),
    IMAGEKIT_PRIVATE_KEY: z.string().optional(),
    VIEW_HMAC_SECRET: z.string().min(16),
    CURSOR_HMAC_SECRET: z.string().min(16),
    CRON_SECRET: z.string().min(16),
    INTERNAL_SECRET: z.string().min(16),
  })
  .superRefine((env, ctx) => {
    if (!isProd) return;
    // ADR-010 / A-19: local media is a development fallback only; production serves from ImageKit.
    if (env.NEXT_PUBLIC_MEDIA_PROVIDER !== 'imagekit') {
      ctx.addIssue({ code: 'custom', path: ['NEXT_PUBLIC_MEDIA_PROVIDER'], message: 'must be "imagekit" in production' });
    }
    if (!/^https:\/\//.test(env.NEXT_PUBLIC_MEDIA_BASE_URL)) {
      ctx.addIssue({ code: 'custom', path: ['NEXT_PUBLIC_MEDIA_BASE_URL'], message: 'must be the ImageKit https URL endpoint in production' });
    }
    // The outbox transport writes codes to disk: never in production (BR-02).
    if (env.EMAIL_TRANSPORT !== 'resend' || !env.RESEND_API_KEY) {
      ctx.addIssue({ code: 'custom', path: ['EMAIL_TRANSPORT'], message: 'production requires EMAIL_TRANSPORT=resend and RESEND_API_KEY' });
    }
    if (!env.BETTER_AUTH_URL.startsWith('https://')) {
      ctx.addIssue({ code: 'custom', path: ['BETTER_AUTH_URL'], message: 'must be https in production (BR-13 Secure cookie)' });
    }
  });

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return Object.freeze(parsed.data);
}

export const env: Env = load();
