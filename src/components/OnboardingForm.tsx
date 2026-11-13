'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { USERNAME_HINT } from '@/lib/username';
import { Icon } from './Icon';

/**
 * C36 OnboardingForm (A-06 minimal, FR-17, BR-18…BR-22). Debounced availability check (300 ms, A-13) against
 * GET /api/onboarding/username; submit is POST /api/onboarding. The server result is authoritative.
 */
type Check = { available: boolean; problem: 'invalid' | 'reserved' | 'taken' | null } | null;

const PROBLEM: Record<string, string> = {
  invalid: USERNAME_HINT,
  reserved: 'This username is not available.',
  taken: 'This username is taken.',
};

export function OnboardingForm({ suggested, defaultName, returnTo }: { suggested: string; defaultName: string; returnTo: string }) {
  const [username, setUsername] = useState(suggested);
  const [displayName, setDisplayName] = useState(defaultName);
  const [check, setCheck] = useState<Check>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (u.length < 3) {
      setCheck(null);
      return;
    }
    const t = setTimeout(async () => {
      const r = await api<NonNullable<Check>>(`/api/onboarding/username?u=${encodeURIComponent(u)}`);
      if (r.ok) setCheck(r.data);
    }, 300);
    return () => clearTimeout(t);
  }, [username]);

  const submit = async () => {
    setBusy(true);
    setError('');
    setFields({});
    const r = await api<{ username: string }>('/api/onboarding', { method: 'POST', body: JSON.stringify({ username, displayName }) });
    if (r.ok) {
      // A fresh sign-up with no destination continues to the optional profile steps (SCR-29); otherwise return (BR-14).
      router.replace(returnTo === '/' ? '/onboarding/details' : returnTo);
      router.refresh();
      return;
    }
    setBusy(false);
    if (r.fields) setFields(r.fields);
    else setError(r.code === 'RATE_LIMITED' ? `Too many attempts. Try again in ${r.retryAfter ?? 60} seconds.` : r.message);
  };

  const userError = fields.username ?? (check && !check.available && check.problem ? PROBLEM[check.problem] : '');

  return (
    <form
      className="stack"
      style={{ ['--stack-gap' as string]: 'var(--space-5, 1.25rem)' }}
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h1 className="t-h2">Choose your username</h1>
      <p className="text-secondary">This is your profile address. You can change it later.</p>
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className="ui-input ui-input--lg neu-field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={30}
          required
          aria-invalid={userError ? true : undefined}
          aria-describedby="username-msg"
        />
        {userError ? (
          <span id="username-msg" className="ui-field__error">
            <Icon name="alert" size={16} strokeWidth={2} />
            {userError}
          </span>
        ) : (
          <span id="username-msg" className="ui-field__hint" aria-live="polite">
            {check?.available ? `trippple/${username.trim().toLowerCase()} is available.` : USERNAME_HINT}
          </span>
        )}
      </div>
      <div className="ui-field">
        <label className="ui-field__label" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          className="ui-input ui-input--lg neu-field"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          maxLength={50}
          required
          aria-invalid={fields.displayName ? true : undefined}
          aria-describedby={fields.displayName ? 'name-err' : undefined}
        />
        {fields.displayName && (
          <span id="name-err" className="ui-field__error">
            <Icon name="alert" size={16} strokeWidth={2} />
            {fields.displayName}
          </span>
        )}
      </div>
      {error && (
        <div className="ui-alert ui-alert--error" role="alert">
          <Icon name="alert" strokeWidth={2} />
          {error}
        </div>
      )}
      <button className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg" type="submit" disabled={busy} aria-busy={busy || undefined}>
        Continue
      </button>
    </form>
  );
}
