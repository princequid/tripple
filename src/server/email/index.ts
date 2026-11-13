import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { log } from '../log';
import { AppError } from '../errors';

/**
 * EmailService (D-08). Transports:
 * - `resend`: production (needs RESEND_API_KEY; account B-09 pending).
 * - `outbox`: development and tests only. Appends to `.data/outbox.jsonl` (git-ignored) so a developer or an
 *   E2E test can read the code. The env schema rejects it in production. Codes are never written to logs (BR-02).
 */
export type OtpEmail = {
  to: string;
  code: string;
  purpose: 'sign-in' | 'email-verification' | 'forget-password' | 'account-deletion' | 'email-change';
};

export const OUTBOX_FILE = path.join(process.cwd(), '.data', 'outbox.jsonl');

function otpText(code: string, purpose: OtpEmail['purpose'] = 'sign-in') {
  if (purpose === 'account-deletion') {
    return {
      subject: `${code} is your Trippple account deletion code`,
      text: `Someone (hopefully you) asked to delete your Trippple account. Your confirmation code is ${code}.

It expires in 10 minutes. If you did not ask for this, ignore this email and your account stays as it is.`,
    };
  }
  if (purpose === 'email-change') {
    return {
      subject: `${code} is your Trippple email confirmation code`,
      text: `Use ${code} to confirm this address for your Trippple account.

It expires in 10 minutes. If you did not ask for this, you can ignore this email.`,
    };
  }
  return {
    subject: `${code} is your Trippple sign-in code`,
    text: `Your Trippple sign-in code is ${code}.\n\nIt expires in 10 minutes and can be used once. If you did not ask for it, you can ignore this email.`,
  };
}

export async function sendOtpEmail(msg: OtpEmail): Promise<void> {
  const transport = process.env.EMAIL_TRANSPORT ?? 'outbox';
  const { subject, text } = otpText(msg.code, msg.purpose);
  if (transport === 'outbox') {
    if (process.env.NODE_ENV === 'production' && process.env.APP_ENV !== 'test') {
      throw new AppError('EMAIL_UNAVAILABLE', 'Email is not configured.');
    }
    fs.mkdirSync(path.dirname(OUTBOX_FILE), { recursive: true });
    fs.appendFileSync(OUTBOX_FILE, JSON.stringify({ to: msg.to, subject, code: msg.code, at: Date.now() }) + '\n');
    log.info('email.sent', { transport: 'outbox', purpose: msg.purpose });
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject, text }),
  }).catch(() => null);
  if (!res || !res.ok) {
    log.error('email.failed', { transport: 'resend', status: res?.status ?? 0 });
    throw new AppError('EMAIL_UNAVAILABLE', 'We could not send the email. Try again in a moment.');
  }
  log.info('email.sent', { transport: 'resend', purpose: msg.purpose });
}
