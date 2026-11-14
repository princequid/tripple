'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Icon } from './Icon';
import { TrippleMark } from './brand/TrippleMark';

/**
 * Prototype sign-in / sign-up (A-28): email + password through Better Auth, enabled only when
 * PROTOTYPE_PASSWORD_AUTH=1 (never in production; production keeps the email-code flow, BR-12).
 * - Sign up: POST /api/auth/sign-up/email → session → onboarding (pending, BR-16).
 * - Sign in: POST /api/auth/sign-in/email { rememberMe } → returnTo (BR-14); a `like-shot` intent completes (BR-15).
 * - "Continue with the demo account" signs in to the seeded demo member (password set by db:seed-passwords).
 * Google appears only when its OAuth client is configured (B-16).
 */
export const DEMO_EMAIL = 'demo@seed.trippple.test';
const DEMO_PASSWORD = 'Trippple2026';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'That email and password don’t match. Check them and try again.',
  USER_ALREADY_EXISTS: 'An account with this email already exists. Sign in instead.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists. Sign in instead.',
  PASSWORD_TOO_SHORT: 'Use at least 8 characters for your password.',
  PASSWORD_TOO_LONG: 'Use 128 characters or fewer.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  VALIDATION: 'Please enter a valid email address.',
  ACCOUNT_SUSPENDED: 'This account is unavailable.',
  NETWORK: 'Check your connection and try again.',
};

type Mode = 'login' | 'signup';
type Props = { mode: Mode; returnTo: string; intent: string | null; target: string | null; googleEnabled: boolean; inModal?: boolean };

export function PasswordAuth({ mode: initialMode, returnTo, intent, target, googleEnabled, inModal = false }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState<'form' | 'demo' | null>(null);
  const router = useRouter();
  const signup = mode === 'signup';

  const finish = async () => {
    const me = await api<{ kind: string }>('/api/me');
    if (me.ok && me.data.kind === 'pending') {
      router.replace(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (intent === 'like-shot' && target && /^\d+$/.test(target)) await api(`/api/shots/${target}/like`, { method: 'PUT' });
    router.replace(returnTo);
    router.refresh();
  };

  const submit = async (creds: { email: string; password: string }, kind: Mode, which: 'form' | 'demo') => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(creds.email.trim())) next.email = 'Please enter a valid email address.';
    if (kind === 'signup' ? creds.password.length < 8 : !creds.password) next.password = kind === 'signup' ? 'Use at least 8 characters.' : 'Enter your password.';
    setErrors(next);
    if (next.email || next.password) return;
    setBusy(which);
    const r =
      kind === 'signup'
        ? await api('/api/auth/sign-up/email', { method: 'POST', body: JSON.stringify({ email: creds.email.trim(), password: creds.password, name: creds.email.trim().split('@')[0] }) })
        : await api('/api/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email: creds.email.trim(), password: creds.password, rememberMe: remember }) });
    if (!r.ok) {
      setBusy(null);
      setErrors({ form: r.code === 'RATE_LIMITED' || r.status === 429 ? `Too many attempts. Try again in ${r.retryAfter ?? 60} seconds.` : (ERRORS[r.code] ?? r.message ?? 'Something went wrong. Try again.') });
      return;
    }
    await finish();
  };

  const switcher = signup
    ? { text: 'Already have an account?', action: 'Sign in', mode: 'login' as Mode, href: `/login?returnTo=${encodeURIComponent(returnTo)}` }
    : { text: 'Don’t have an account?', action: 'Sign up', mode: 'signup' as Mode, href: `/signup?returnTo=${encodeURIComponent(returnTo)}` };

  return (
    <div className="auth">
      {!inModal && (
        <header className="auth__head">
          <h1 className="auth__title">{signup ? 'Create your account' : 'Welcome back!'}</h1>
          <p className="auth__sub">{signup ? 'Join Trippple and share your work with a community of independent designers.' : 'Sign in to continue your journey with Trippple.'}</p>
        </header>
      )}
      {intent === 'like-shot' && <p className="auth__note">Sign in and your like will be saved.</p>}

      <div className="auth__socials">
        <button type="button" className="auth__social" onClick={() => void submit({ email: DEMO_EMAIL, password: DEMO_PASSWORD }, 'login', 'demo')} aria-busy={busy === 'demo' || undefined} disabled={busy !== null}>
          <span className="auth__social-icon" aria-hidden="true">
            <TrippleMark />
          </span>
          <span className="auth__social-label">Continue with the demo account</span>
          <Icon name="arrow" className="auth__social-arrow" />
        </button>
        {googleEnabled && (
          <a className="auth__social" href={`/api/auth/sign-in/social?provider=google&callbackURL=${encodeURIComponent(returnTo)}`}>
            <span className="auth__social-icon" aria-hidden="true">
              <Icon name="globe" />
            </span>
            <span className="auth__social-label">Continue with Google</span>
            <Icon name="arrow" className="auth__social-arrow" />
          </a>
        )}
      </div>

      <div className="auth__or">
        <span>or</span>
      </div>

      <form
        className="auth__form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit({ email, password }, mode, 'form');
        }}
      >
        <div className="auth__group">
          <label className="auth__field" data-invalid={errors.email ? '' : undefined}>
            <Icon name="mail" className="auth__field-icon" />
            <span className="visually-hidden">Email address</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Email address"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'auth-email-err' : undefined}
            />
          </label>
          {errors.email && (
            <span id="auth-email-err" className="auth__error">
              {errors.email}
            </span>
          )}
        </div>
        <div className="auth__group">
          <label className="auth__field" data-invalid={errors.password ? '' : undefined}>
            <Icon name="lock" className="auth__field-icon" />
            <span className="visually-hidden">{signup ? 'Create a password' : 'Password'}</span>
            <input
              type={show ? 'text' : 'password'}
              name="password"
              autoComplete={signup ? 'new-password' : 'current-password'}
              placeholder={signup ? 'Create a password' : 'Password'}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? 'auth-pass-err' : signup ? 'auth-pass-hint' : undefined}
            />
            <button type="button" className="auth__eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
              <Icon name={show ? 'eyeOff' : 'eye'} />
            </button>
          </label>
          {errors.password ? (
            <span id="auth-pass-err" className="auth__error">
              {errors.password}
            </span>
          ) : (
            signup && (
              <span id="auth-pass-hint" className="auth__hint">
                At least 8 characters.
              </span>
            )
          )}
        </div>
        {!signup && (
          <label className="auth__check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className="auth__check-box" aria-hidden="true">
              <Icon name="check" strokeWidth={3} />
            </span>
            Remember me
          </label>
        )}
        {errors.form && (
          <div className="ui-alert ui-alert--error" role="alert">
            <Icon name="alert" strokeWidth={2} />
            {errors.form}
          </div>
        )}
        <button className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg auth__submit" type="submit" disabled={busy !== null} aria-busy={busy === 'form' || undefined}>
          {signup ? 'Sign up' : 'Sign in'}
          <Icon name="chev" className="auth__submit-chev" />
        </button>
      </form>

      <p className="auth__switch">
        {switcher.text}{' '}
        {inModal ? (
          <button type="button" className="link-button auth__switch-link" onClick={() => { setMode(switcher.mode); setErrors({}); }}>
            {switcher.action}
          </button>
        ) : (
          <Link className="auth__switch-link" href={switcher.href}>
            {switcher.action}
          </Link>
        )}
      </p>
    </div>
  );
}
