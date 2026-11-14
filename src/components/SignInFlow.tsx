'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Icon } from './Icon';
import { PasswordAuth } from './PasswordAuth';

/**
 * C34 SignInFlow (A-01, FR-10…FR-12, FR-20). One email-code flow for sign-in and sign-up (BR-09):
 * 1. POST /api/auth/email-otp/send-verification-otp { email, type: 'sign-in' }
 * 2. POST /api/auth/sign-in/email-otp { email, otp } → session cookie
 * 3. GET /api/me → pending users go to onboarding (BR-16); members return to `returnTo` (BR-14).
 * A pending intent (BR-15, `like-shot`) is completed right after sign-in for members.
 * Google sign-in (A-02) is hidden until the OAuth client exists (B-16) — `googleEnabled`.
 */
type Props = { mode: 'login' | 'signup'; returnTo: string; intent: string | null; target: string | null; googleEnabled: boolean; passwordAuth?: boolean; inModal?: boolean };

const ERRORS: Record<string, string> = {
  INVALID_OTP: 'That code is not right. Check it and try again.',
  OTP_EXPIRED: 'That code has expired. Request a new one.',
  TOO_MANY_ATTEMPTS: 'Too many wrong codes. Request a new one.',
  VALIDATION: 'Please enter a valid email address.',
  ACCOUNT_SUSPENDED: 'This account is unavailable.',
  EMAIL_UNAVAILABLE: 'We could not send the email. Try again in a moment.',
  NETWORK: 'Check your connection and try again.',
};

/** Prototype (A-28): with PROTOTYPE_PASSWORD_AUTH=1 the email + password form replaces the code flow. */
export function SignInFlow(props: Props) {
  if (props.passwordAuth) return <PasswordAuth {...props} />;
  return <EmailCodeFlow {...props} />;
}

function EmailCodeFlow({ mode, returnTo, intent, target, googleEnabled }: Props) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const send = async () => {
    setBusy(true);
    setError('');
    const r = await api('/api/auth/email-otp/send-verification-otp', { method: 'POST', body: JSON.stringify({ email, type: 'sign-in' }) });
    setBusy(false);
    if (!r.ok) {
      setError(r.code === 'RATE_LIMITED' ? `Too many requests. Try again in ${r.retryAfter ?? 60} seconds.` : (ERRORS[r.code] ?? r.message));
      if (r.code === 'RATE_LIMITED' && r.retryAfter) setCooldown(r.retryAfter);
      return;
    }
    setStep('code');
    setCooldown(60); // BR-05
    setNotice(`We sent a 6-digit code to ${email.trim().toLowerCase()}.`);
  };

  const verify = async (otp: string) => {
    setBusy(true);
    setError('');
    const r = await api('/api/auth/sign-in/email-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
    if (!r.ok) {
      setBusy(false);
      setCode('');
      setError(r.code === 'RATE_LIMITED' ? `Too many attempts. Try again in ${r.retryAfter ?? 60} seconds.` : (ERRORS[r.code] ?? 'That code did not work. Try again.'));
      return;
    }
    const me = await api<{ kind: string }>('/api/me');
    if (me.ok && me.data.kind === 'pending') {
      router.replace(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (intent === 'like-shot' && target && /^\d+$/.test(target)) {
      await api(`/api/shots/${target}/like`, { method: 'PUT' }); // BR-15: best effort; the page shows the result
    }
    router.replace(returnTo);
    router.refresh();
  };

  const title = mode === 'signup' ? 'Create your account' : 'Sign in to Trippple';

  return (
    <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-5, 1.25rem)' }}>
      <h1 className="t-h2">{title}</h1>
      {intent === 'like-shot' && <p className="text-secondary">Sign in and your like will be saved.</p>}
      {googleEnabled && step === 'email' && (
        <>
          <a className="ui-btn ui-btn--on-glass ui-btn--block ui-btn--lg" href={`/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(returnTo)}`}>
            Continue with Google
          </a>
          <div className="ui-divider">or</div>
        </>
      )}

      {step === 'email' ? (
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="ui-field">
            <label className="ui-field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="ui-input ui-input--lg neu-field"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'email-err' : 'email-hint'}
            />
            {error ? (
              <span id="email-err" className="ui-field__error">
                <Icon name="alert" size={16} strokeWidth={2} />
                {error}
              </span>
            ) : (
              <span id="email-hint" className="ui-field__hint">
                We&apos;ll email you a 6-digit code. No password needed.
              </span>
            )}
          </div>
          <button className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg" type="submit" disabled={busy || cooldown > 0 || !email.includes('@')} aria-busy={busy || undefined}>
            {cooldown > 0 ? `Try again in ${cooldown} s` : 'Send code'}
          </button>
        </form>
      ) : (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) void verify(code);
          }}
        >
          {notice && (
            <div className="ui-alert ui-alert--success" role="status">
              <Icon name="check" strokeWidth={2} />
              {notice}
            </div>
          )}
          <p className="t-label" id="otp-label">
            Enter the 6-digit code
          </p>
          <div className="ui-otp">
            <input
              ref={codeRef}
              className="ui-otp__input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              aria-labelledby="otp-label"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'otp-err' : undefined}
              value={code}
              disabled={busy}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(v);
                if (v.length === 6) void verify(v);
              }}
            />
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={`ui-otp__cell neu-field${i === Math.min(code.length, 5) ? ' is-active' : ''}`} aria-hidden="true">
                {code[i] ?? ''}
              </span>
            ))}
          </div>
          {error && (
            <div id="otp-err" className="ui-alert ui-alert--error" role="alert">
              <Icon name="alert" strokeWidth={2} />
              {error}
            </div>
          )}
          <button className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg" type="submit" disabled={busy || code.length !== 6} aria-busy={busy || undefined}>
            Continue
          </button>
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <button className="ui-btn ui-btn--ghost" type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }}>
              Use a different email
            </button>
            <button className="ui-btn ui-btn--ghost" type="button" disabled={cooldown > 0 || busy} onClick={() => void send()}>
              {cooldown > 0 ? `Resend in ${cooldown} s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
      <noscript>
        <p className="ui-alert ui-alert--error">Signing in needs JavaScript.</p>
      </noscript>
    </div>
  );
}
