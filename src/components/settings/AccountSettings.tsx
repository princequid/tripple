'use client';

import { useState } from 'react';
import { changeUsername, confirmCode, getAccount, listSessions, requestDeletionCode, requestEmailChange, revokeSessions } from '@/services/account';
import { formatDate } from '@/lib/format';
import { isMock } from '@/services/config';
import { timeAgo } from '@/services/reference';
import { useResource } from '@/hooks/useResource';
import { TextField } from '../ui/Field';
import { ConfirmDialog, Modal } from '../ui/Modal';
import { ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';

/** 6-digit code step (email change and deletion are confirmed by a fresh email code, BR-24). */
function CodeModal({ open, onClose, title, description, purpose, email, confirmLabel, danger, onDone }: { open: boolean; onClose: () => void; title: string; description: string; purpose: 'email' | 'delete'; email?: string; confirmLabel: string; danger?: boolean; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <form
        className="stack"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from the email.');
          setBusy(true);
          const r = await confirmCode(purpose, code, email);
          setBusy(false);
          if (!r.ok) return setError(r.message);
          setCode('');
          onDone();
        }}
      >
        <TextField label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => (setCode(e.target.value.replace(/\D/g, '')), setError(null))} error={error} data-autofocus />
        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="ui-btn ui-btn--on-glass" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={`ui-btn ${danger ? 'ui-btn--danger' : 'ui-btn--primary'}`} aria-busy={busy || undefined}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** SCR-31 Settings → Account (A-07, FR-19, BR-23, BR-24): username, email (code), delete account (code). */
export function AccountSettingsView() {
  const res = useResource(() => getAccount(), []);
  const [username, setUsername] = useState('');
  const [uErr, setUErr] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [eErr, setEErr] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'username' | 'email' | 'delete-confirm' | 'delete-code' | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={3} />;
  const a = res.data;
  const locked = a.canChangeUsernameAt && new Date(a.canChangeUsernameAt) > new Date();

  return (
    <div className="stack settings-sections">
      <section className="ui-card stack" aria-labelledby="u-title">
        <h2 id="u-title" className="ui-card__title">
          Username
        </h2>
        <p className="t-body-sm text-secondary">
          Your profile lives at <strong>/{a.username}</strong>. You can change your username once every 30 days. Old links stop working (no redirects).
        </p>
        <form
          className="settings-inline"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const n = username.trim().toLowerCase();
            if (!/^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/.test(n)) return setUErr('Use 3–30 lower-case letters, numbers, "_" or "-".');
            if (n === a.username) return setUErr('That’s already your username.');
            setDialog('username');
          }}
        >
          <TextField label="New username" value={username} maxLength={30} onChange={(e) => (setUsername(e.target.value), setUErr(null))} error={uErr} disabled={Boolean(locked)} hint={locked ? `You can change it again on ${formatDate(a.canChangeUsernameAt!)}.` : undefined} />
          <button type="submit" className="ui-btn ui-btn--secondary neu-control" disabled={Boolean(locked)}>
            Change username
          </button>
        </form>
      </section>

      <section className="ui-card stack" aria-labelledby="e-title">
        <h2 id="e-title" className="ui-card__title">
          Sign-in email
        </h2>
        <p className="t-body-sm text-secondary">{a.email ? `Currently ${a.email}.` : 'We send sign-in codes to this address. It is never shown publicly.'} We’ll send a code to the new address to confirm it.</p>
        <form
          className="settings-inline"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setEErr('Enter a valid email address.');
            setBusy(true);
            const r = await requestEmailChange(email.trim());
            setBusy(false);
            if (!r.ok) return setEErr(r.message);
            setDialog('email');
          }}
        >
          <TextField label="New email" type="email" autoComplete="email" value={email} onChange={(e) => (setEmail(e.target.value), setEErr(null))} error={eErr} />
          <button type="submit" className="ui-btn ui-btn--secondary neu-control" aria-busy={busy || undefined}>
            Send code
          </button>
        </form>
      </section>

      <section className="ui-card stack danger-zone" aria-labelledby="d-title">
        <h2 id="d-title" className="ui-card__title">
          Delete account
        </h2>
        <p className="t-body-sm">Your profile, shots, likes, follows, collections and comments are removed at once and permanently erased after 30 days. If you own a team, transfer it or delete it first.</p>
        <div>
          <button type="button" className="ui-btn ui-btn--danger-ghost" onClick={() => setDialog('delete-confirm')}>
            <Icon name="trash" /> Delete my account
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={dialog === 'username'}
        onClose={() => setDialog(null)}
        title={`Change username to @${username.trim().toLowerCase()}?`}
        body="Links to your old profile URL will stop working. You can’t change it again for 30 days."
        confirmLabel="Change username"
        busy={busy}
        onConfirm={async () => {
          setBusy(true);
          const r = await changeUsername(username);
          setBusy(false);
          setDialog(null);
          if (!r.ok) return setUErr(r.fields?.username === 'taken' ? 'That username is taken.' : r.message);
          toast({ tone: 'success', text: `Username change to @${r.data.username} requested.` });
          setUsername('');
          await res.reload();
        }}
      />
      <CodeModal open={dialog === 'email'} onClose={() => setDialog(null)} title="Confirm your new email" description={`We sent a 6-digit code to ${email}.`} purpose="email" email={email.trim()} confirmLabel="Confirm email" onDone={() => (setDialog(null), setEmail(''), toast({ tone: 'success', text: 'Email updated.' }))} />
      <ConfirmDialog
        open={dialog === 'delete-confirm'}
        onClose={() => setDialog(null)}
        title="Delete your account?"
        body="We’ll email you a code to confirm. This cannot be undone after 30 days."
        confirmLabel="Email me a code"
        danger
        onConfirm={async () => {
          const r = await requestDeletionCode();
          if (!r.ok) return toast({ tone: 'error', text: r.message });
          setDialog('delete-code');
        }}
      />
      <CodeModal
        open={dialog === 'delete-code'}
        onClose={() => setDialog(null)}
        title="Enter the code to delete your account"
        description="Check your sign-in email for the code."
        purpose="delete"
        confirmLabel="Delete account"
        danger
        onDone={() => {
          setDialog(null);
          if (isMock('settings')) return toast({ tone: 'success', text: 'Deletion confirmed (preview data: nothing was deleted).' });
          window.location.assign('/');
        }}
      />
    </div>
  );
}

/** SCR-32 Settings → Sessions (FR-19): list devices, sign out one or all others. */
export function SessionsView() {
  const res = useResource(() => listSessions(), []);
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();
  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={3} />;
  const others = res.data.filter((s) => !s.current);
  return (
    <div className="stack">
      <ul className="settings-list">
        {res.data.map((s) => (
          <li key={s.id} className="settings-row">
            <Icon name="device" />
            <div className="settings-row__main">
              <strong>{s.device}</strong>
              <span className="t-caption text-secondary">{[s.location, s.current ? 'Active now' : `Last active ${timeAgo(s.lastActiveAt)}`].filter(Boolean).join(' · ')}</span>
            </div>
            {s.current ? (
              <span className="ui-badge ui-badge--sage">This device</span>
            ) : (
              <button
                type="button"
                className="ui-btn ui-btn--ghost ui-btn--sm"
                onClick={async () => {
                  const r = await revokeSessions(s.id);
                  if (r.ok) {
                    toast({ tone: 'success', text: `Signed out of ${s.device}.` });
                    await res.reload();
                  }
                }}
              >
                Sign out
              </button>
            )}
          </li>
        ))}
      </ul>
      {others.length > 0 && (
        <div>
          <button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={() => setConfirm(true)}>
            Sign out of all other sessions
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Sign out everywhere else?"
        body={`${others.length} other session${others.length === 1 ? '' : 's'} will be signed out. This device stays signed in.`}
        confirmLabel="Sign out others"
        onConfirm={async () => {
          setConfirm(false);
          const r = await revokeSessions('others');
          if (r.ok) {
            toast({ tone: 'success', text: 'Other sessions signed out.' });
            await res.reload();
          }
        }}
      />
    </div>
  );
}
