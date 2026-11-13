'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getService, saveService, servicePath } from '@/services/marketplace';
import type { ServiceInput } from '@/services/contracts';
import { SERVICE_CATEGORIES, validateService } from '@/services/reference';
import { ChipInput, SelectField, TextArea, TextField } from '../ui/Field';
import { ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';

const EMPTY: ServiceInput = { title: '', description: '', categorySlug: '', priceCents: 0, deliveryDays: 7, revisions: 2, includes: [], coverKey: null };

/** SCR-56 create / edit service (BR-84): price in whole dollars (stored as cents), delivery 1–90 days. */
export function ServiceForm({ id }: { id: number | null }) {
  const [v, setV] = useState<ServiceInput>(EMPTY);
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(id ? 'loading' : 'ready');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    void getService(id).then((r) => {
      if (!r.ok || !r.data.isOwn) return setState('error');
      const d = r.data;
      setV({ title: d.title, description: d.description, categorySlug: d.category.slug, priceCents: d.priceCents, deliveryDays: d.deliveryDays, revisions: d.revisions, includes: d.includes, coverKey: null });
      setPrice(String(d.priceCents / 100));
      setState('ready');
    });
  }, [id]);

  if (state === 'error') return <ErrorState title="You can’t edit this service" body="It may have been removed, or it belongs to someone else." />;
  if (state === 'loading') return <ListSkeleton rows={4} />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = { ...v, priceCents: Math.round(Number(price || '0') * 100) };
    const err = validateService(input);
    setErrors(err);
    if (Object.keys(err).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setBusy(true);
    const r = await saveService(id, input);
    setBusy(false);
    if (!r.ok) return setErrors(r.fields ?? { form: r.message });
    toast({ tone: 'success', text: id ? 'Service updated.' : 'Service published.' });
    router.push(servicePath(r.data));
  };

  return (
    <form className="ui-card form-card stack" onSubmit={submit} noValidate>
      {errors.form && (
        <div className="ui-alert ui-alert--error" role="alert">
          {errors.form}
        </div>
      )}
      <TextField label="Title" value={v.title} maxLength={100} onChange={(e) => setV({ ...v, title: e.target.value })} error={errors.title} hint="What will the client get? e.g. “A logo and wordmark for your shop”." />
      <SelectField label="Category" value={v.categorySlug} onChange={(e) => setV({ ...v, categorySlug: e.target.value })} error={errors.categorySlug}>
        <option value="">Choose a category</option>
        {SERVICE_CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <TextArea label="Description" value={v.description} maxLength={5000} rows={6} onChange={(e) => setV({ ...v, description: e.target.value })} error={errors.description} hint="Describe your process, what you need from the client and how you work together." />
      <div className="form-grid form-grid--2">
        <TextField label="Starting price (USD)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} error={errors.priceCents} hint="From $5 to $100,000." />
        <TextField label="Delivery (days)" type="number" min={1} max={90} value={String(v.deliveryDays)} onChange={(e) => setV({ ...v, deliveryDays: Number(e.target.value) })} error={errors.deliveryDays} />
        <TextField label="Revisions included" type="number" min={0} max={10} value={String(v.revisions)} onChange={(e) => setV({ ...v, revisions: Number(e.target.value) })} error={errors.revisions} />
      </div>
      <ChipInput label="What’s included" values={v.includes} onChange={(includes) => setV({ ...v, includes })} max={8} hint="Press Enter after each item." placeholder="e.g. Source files" />
      <p className="muted-note">The cover image is your most recent shot. Custom covers arrive with uploads.</p>
      <div className="form-actions">
        <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
          {id ? 'Save changes' : 'Publish service'}
        </button>
        <Link className="ui-btn ui-btn--ghost" href={id ? `/services/${id}` : '/services'}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
