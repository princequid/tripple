'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJob, getJob, jobPath, updateJob } from '@/services/jobs';
import type { JobInput } from '@/services/contracts';
import { EMPLOYMENT_LABEL, SPECIALTIES, WORKPLACE_LABEL, validateJob } from '@/services/reference';
import { sanitizeHtml } from '@/lib/sanitize';
import { useSession } from '../providers/AppProviders';
import { SelectField, TextField } from '../ui/Field';
import { Stepper } from '../ui/Tabs';
import { ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';
import { RichTextEditor } from './RichTextEditor';

const STEPS = ['Job details', 'Company', 'Preview and publish'];
const EMPTY: JobInput = { title: '', descriptionHtml: '', location: '', workplaceType: 'remote', specialtySlug: '', employmentType: 'full-time', applyUrl: '', companyName: '', companyWebsite: 'https://', companyLogoKey: null };
const DRAFT_KEY = 'trippple.jobdraft.v1';

/**
 * SCR-39 post / edit a job (J-03, FR-69/70, BR-71…73): 3 steps with per-step validation. The form is public;
 * visitors meet the auth gate on Continue from step 1 (`post-job`), and their draft is kept in sessionStorage
 * so it survives the sign-in round trip. Free jobs publish immediately and run for 30 days.
 */
export function JobWizard({ id }: { id: number | null }) {
  const { requireMember } = useSession();
  const [step, setStep] = useState(0);
  const [v, setV] = useState<JobInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'denied'>(id ? 'loading' : 'ready');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (id) {
      void getJob(id).then((r) => {
        if (!r.ok || !r.data.isOwn) return setState('denied');
        const j = r.data;
        setV({ title: j.title, descriptionHtml: j.descriptionHtml, location: j.location ?? '', workplaceType: j.workplaceType, specialtySlug: j.specialty.slug, employmentType: j.employmentType, applyUrl: j.applyUrl ?? '', companyName: j.company.name, companyWebsite: j.company.websiteUrl, companyLogoKey: j.company.logoKey });
        setState('ready');
      });
      return;
    }
    try {
      const d = sessionStorage.getItem(DRAFT_KEY);
      if (d) setV(JSON.parse(d) as JobInput);
    } catch {
      /* ignore */
    }
  }, [id]);
  useEffect(() => {
    if (id || state !== 'ready') return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [v, id, state]);

  if (state === 'denied') return <ErrorState title="You can’t edit this job" body="It may have been removed, or it was posted from another account." />;
  if (state === 'loading') return <ListSkeleton rows={5} />;

  const focusFirstError = () => setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
  const next = () => {
    const err = validateJob(v, step === 0 ? 'details' : 'company');
    setErrors(err);
    if (Object.keys(err).length) return focusFirstError();
    if (step === 0 && !requireMember('post-job', 'post a job')) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const publish = async () => {
    const err = validateJob(v);
    if (Object.keys(err).length) {
      setErrors(err);
      setStep(err.title || err.descriptionHtml || err.applyUrl || err.specialtySlug ? 0 : 1);
      return focusFirstError();
    }
    setBusy(true);
    const r = id ? await updateJob(id, v) : await createJob(v);
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fields ?? { form: r.message });
      if (r.fields) setStep(0);
      return;
    }
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    toast({ tone: 'success', text: id ? 'Job updated.' : 'Your job is live for 30 days.' });
    router.push(jobPath(r.data));
  };
  const set = <K extends keyof JobInput>(k: K, val: JobInput[K]) => {
    setV((x) => ({ ...x, [k]: val }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  return (
    <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-6)' }}>
      <Stepper steps={STEPS} current={step} />
      {errors.form && (
        <div className="ui-alert ui-alert--error" role="alert">
          <Icon name="alert" />
          {errors.form}
        </div>
      )}
      <form
        className="ui-card form-card stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 2) next();
          else void publish();
        }}
      >
        {step === 0 && (
          <>
            <h2 className="t-h4">Job details</h2>
            <TextField label="Job title" value={v.title} maxLength={100} onChange={(e) => set('title', e.target.value)} error={errors.title} placeholder="e.g. Senior Product Designer" />
            <RichTextEditor label="Description" value={v.descriptionHtml} onChange={(h) => set('descriptionHtml', h)} error={errors.descriptionHtml} hint="At least 50 characters. Describe the role, the team and what you look for." />
            <div className="form-grid form-grid--2">
              <TextField label="Location" optional value={v.location} maxLength={120} onChange={(e) => set('location', e.target.value)} error={errors.location} hint="Leave blank for fully remote roles." />
              <SelectField label="Workplace type" value={v.workplaceType} onChange={(e) => set('workplaceType', e.target.value as JobInput['workplaceType'])} error={errors.workplaceType}>
                {Object.entries(WORKPLACE_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Specialty" value={v.specialtySlug} onChange={(e) => set('specialtySlug', e.target.value)} error={errors.specialtySlug}>
                <option value="">Choose a specialty</option>
                {SPECIALTIES.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Employment type" value={v.employmentType} onChange={(e) => set('employmentType', e.target.value as JobInput['employmentType'])} error={errors.employmentType}>
                {Object.entries(EMPLOYMENT_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField label="How to apply" value={v.applyUrl} maxLength={512} onChange={(e) => set('applyUrl', e.target.value)} error={errors.applyUrl} hint="An https:// link to your application page, or a mailto: address." placeholder="https://yourcompany.com/careers" />
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="t-h4">About the company</h2>
            <TextField label="Company name" value={v.companyName} maxLength={80} onChange={(e) => set('companyName', e.target.value)} error={errors.companyName} />
            <TextField label="Company website" type="url" value={v.companyWebsite} onChange={(e) => set('companyWebsite', e.target.value)} error={errors.companyWebsite} />
            <p className="muted-note">A company logo can be added once uploads are available. Until then we show the company initial.</p>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="t-h4">Preview</h2>
            <div className="job-preview">
              <p className="job-row__meta">
                <span>{v.companyName}</span>
                <span>
                  <Icon name="pin" size={14} /> {v.location || 'Remote'}
                </span>
                <span className="ui-badge ui-badge--sage">{WORKPLACE_LABEL[v.workplaceType]}</span>
                <span className="ui-badge ui-badge--neutral">{EMPLOYMENT_LABEL[v.employmentType]}</span>
              </p>
              <h3 className="t-h3">{v.title}</h3>
              <div className="job-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.descriptionHtml) }} />
            </div>
            <div className="ui-card ui-card--muted">
              <p className="t-body-sm">
                <strong>Free listing.</strong> {id ? 'Edits keep the original posted date.' : 'Your job goes live immediately and stays on the board for 30 days. You can have up to 3 active jobs.'}
              </p>
            </div>
          </>
        )}
        <div className="form-actions wizard-actions">
          {step > 0 ? (
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setStep((s) => s - 1)}>
              <Icon name="arrowLeft" /> Back
            </button>
          ) : (
            <Link className="ui-btn ui-btn--ghost" href={id ? `/jobs/${id}` : '/jobs'}>
              Cancel
            </Link>
          )}
          <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
            {step < 2 ? 'Continue' : id ? 'Save changes' : 'Publish job'}
          </button>
        </div>
      </form>
    </div>
  );
}
