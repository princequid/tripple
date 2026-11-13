'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfileSettings, saveProfileSettings, validateProfile } from '@/services/account';
import type { ProfileSettings } from '@/services/contracts';
import { ChipInput, TextArea, TextField } from '../ui/Field';
import { ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Avatar } from '../Avatar';
import { useSession } from '../providers/AppProviders';

/** SCR-30 Settings → Profile (P-06, FR-59). Unsaved-changes guard on navigation away (beforeunload). */
export function ProfileSettingsForm() {
  const { viewer } = useSession();
  const [v, setV] = useState<ProfileSettings | null>(null);
  const [initial, setInitial] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const load = async () => {
    setFailed(false);
    const r = await getProfileSettings();
    if (!r.ok) return setFailed(true);
    setV(r.data);
    setInitial(JSON.stringify(r.data));
  };
  useEffect(() => {
    void load();
  }, []);
  const dirty = v !== null && JSON.stringify(v) !== initial;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (failed) return <ErrorState onRetry={load} />;
  if (!v) return <ListSkeleton rows={5} />;
  const set = <K extends keyof ProfileSettings>(k: K, val: ProfileSettings[K]) => {
    setV({ ...v, [k]: val });
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  return (
    <form
      className="stack settings-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const err = validateProfile(v);
        setErrors(err);
        if (Object.keys(err).length) return setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
        setBusy(true);
        const r = await saveProfileSettings(v);
        setBusy(false);
        if (!r.ok) return setErrors(r.fields ?? { form: r.message });
        setInitial(JSON.stringify(v));
        toast({ tone: 'success', text: 'Profile saved.' });
        router.refresh();
      }}
    >
      {errors.form && (
        <div className="ui-alert ui-alert--error" role="alert">
          {errors.form}
        </div>
      )}
      <div className="cluster" style={{ ['--cluster-gap' as string]: 'var(--space-4)' }}>
        <Avatar name={v.displayName || '?'} avatarKey={v.avatarKey} size="lg" />
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-1)' }}>
          <strong className="t-label">Profile photo</strong>
          <p className="muted-note">Photo uploads arrive with the media service. Your initials are shown until then.</p>
        </div>
      </div>
      <div className="form-grid form-grid--2">
        <TextField label="Display name" value={v.displayName} maxLength={50} onChange={(e) => set('displayName', e.target.value)} error={errors.displayName} />
        <TextField label="Location" optional value={v.location} maxLength={80} onChange={(e) => set('location', e.target.value)} error={errors.location} />
        <TextField className="span-2" label="Headline" optional value={v.headline} maxLength={120} onChange={(e) => set('headline', e.target.value)} error={errors.headline} hint="One line shown under your name." />
        <TextArea className="span-2" label="Bio" optional value={v.bio} maxLength={1000} rows={5} onChange={(e) => set('bio', e.target.value)} error={errors.bio} />
        <TextField label="Website" optional type="url" value={v.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} error={errors.websiteUrl} placeholder="https://" />
        <TextField label="Public contact email" optional type="email" value={v.publicEmail} onChange={(e) => set('publicEmail', e.target.value)} error={errors.publicEmail} hint="Shown on your About tab. Your sign-in email is never shown." />
      </div>
      <ChipInput label="Skills" values={v.skills} onChange={(s) => set('skills', s)} max={15} hint="Press Enter after each skill." placeholder="e.g. Branding" />
      <ChipInput label="Languages" values={v.languages} onChange={(s) => set('languages', s)} max={10} placeholder="e.g. English" />
      <div className="form-actions settings-actions">
        <button type="submit" className="ui-btn ui-btn--primary" disabled={!dirty} aria-busy={busy || undefined}>
          Save profile
        </button>
        {dirty && (
          <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setV(JSON.parse(initial) as ProfileSettings)}>
            Discard changes
          </button>
        )}
        {viewer.kind === 'member' && (
          <a className="text-link t-body-sm" href={`/${viewer.username}`}>
            View public profile
          </a>
        )}
      </div>
    </form>
  );
}
