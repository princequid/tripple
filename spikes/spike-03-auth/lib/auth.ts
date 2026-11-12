import 'server-only';
import fs from 'node:fs';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';
import * as schema from './auth-schema';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'sqlite', schema }),
  emailAndPassword: { enabled: false },
  socialProviders: process.env.GOOGLE_CLIENT_ID
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } }
    : {},
  rateLimit: { enabled: !process.env.SPIKE_RL_OFF, storage: 'database', window: 60, max: 100 },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      storeOTP: 'hashed',
      async sendVerificationOTP({ email, otp, type }) {
        // Spike stand-in for the EmailService (Resend). Never log OTPs in the real app.
        fs.appendFileSync('otp-outbox.log', JSON.stringify({ email, otp, type, at: Date.now() }) + '\n');
      },
    }),
    nextCookies(),
  ],
});
