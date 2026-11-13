'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveOnboardingDetails } from '@/services/account';
import type { OnboardingIntent } from '@/services/contracts';
import { Checkbox, ChipInput, TextField } from './ui/Field';
import { Stepper } from './ui/Tabs';

const INTENTS: { value: OnboardingIntent; label: string; hint: string }[] = [
  { value: 'share', label: 'Share my work', hint: 'Build a portfolio of shots.' },
  { value: 'discover', label: 'Find inspiration', hint: 'Follow designers and save shots.' },
  { value: 'hire', label: 'Hire a designer', hint: 'Find talent and post jobs.' },
  { value: 'find-work', label: 'Find work', hint: 'Get discovered and browse jobs.' },
];

/** SCR-29 full onboarding (A-06, FR-18): after the username, optional details in two short steps; Skip anytime. */
export function OnboardingDetails({ username, next }: { username: string; next: string }) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ headline: '', location: '', intents: [] as OnboardingIntent[], skills: [] as string[] });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const done = next === '/' ? `/${username}` : next;

  const finish = async () => {
    setBusy(true);
    const r = await saveOnboardingDetails(v);
    setBusy(false);
    if (!r.ok) return setError(r.fields?.headline ?? r.message);
    router.replace(done);
    router.refresh();
  };

  return (
    <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-6)' }}>
      <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
        <h1 className="t-h2">Welcome, @{username}</h1>
        <p className="text-secondary">A couple of optional details help people find you. You can change them later in Settings.</p>
      </div>
      <Stepper steps={['What brings you here', 'About you']} current={step} />
      <form
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 0) setStep(1);
          else void finish();
        }}
      >
        {step === 0 ? (
          <fieldset className="ui-fieldset">
            <legend>Choose any that apply</legend>
            {INTENTS.map((i) => (
              <Checkbox key={i.value} label={i.label} hint={i.hint} checked={v.intents.includes(i.value)} onChange={(on) => setV({ ...v, intents: on ? [...v.intents, i.value] : v.intents.filter((x) => x !== i.value) })} />
            ))}
          </fieldset>
        ) : (
          <>
            <TextField label="Headline" optional value={v.headline} maxLength={120} onChange={(e) => (setV({ ...v, headline: e.target.value }), setError(null))} error={error} placeholder="e.g. Brand designer for small food businesses" />
            <TextField label="Location" optional value={v.location} maxLength={80} onChange={(e) => setV({ ...v, location: e.target.value })} placeholder="City, country" />
            <ChipInput label="Skills" values={v.skills} onChange={(skills) => setV({ ...v, skills })} max={15} hint="Press Enter after each skill." placeholder="e.g. Illustration" />
          </>
        )}
        <div className="form-actions">
          {step === 1 && (
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setStep(0)}>
              Back
            </button>
          )}
          <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
            {step === 0 ? 'Next' : 'Finish'}
          </button>
          <Link className="ui-btn ui-btn--ghost" href={done}>
            Skip for now
          </Link>
        </div>
      </form>
    </div>
  );
}
