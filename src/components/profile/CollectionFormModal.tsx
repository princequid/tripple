'use client';

import { useEffect, useState } from 'react';
import type { ApiResult } from '@/lib/api-client';
import type { CollectionInput } from '@/services/contracts';
import { Modal } from '../ui/Modal';
import { Checkbox, TextArea, TextField } from '../ui/Field';

/** Create / edit collection form (BR-53: name 1–60, unique per owner; description ≤ 300; BR-54 privacy). */
export function CollectionFormModal({
  open,
  onClose,
  title,
  submitLabel,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  initial?: CollectionInput;
  onSubmit: (input: CollectionInput) => Promise<ApiResult<unknown>>;
}) {
  const [v, setV] = useState<CollectionInput>({ name: '', description: '', isPrivate: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setV(initial ?? { name: '', description: '', isPrivate: false });
      setErrors({});
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!v.name.trim() || v.name.trim().length > 60) err.name = 'Use 1–60 characters.';
    if ((v.description ?? '').length > 300) err.description = 'Use at most 300 characters.';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    const r = await onSubmit({ name: v.name.trim(), description: v.description?.trim() || undefined, isPrivate: v.isPrivate });
    setBusy(false);
    if (!r.ok) return setErrors({ name: r.fields?.name ?? r.message });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form className="stack" onSubmit={submit} noValidate>
        <TextField label="Name" value={v.name} maxLength={60} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} data-autofocus />
        <TextArea label="Description" optional value={v.description ?? ''} maxLength={300} rows={3} onChange={(e) => setV({ ...v, description: e.target.value })} error={errors.description} />
        <Checkbox label="Private collection" hint="Only you can see private collections." checked={v.isPrivate} onChange={(isPrivate) => setV({ ...v, isPrivate })} />
        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="ui-btn ui-btn--on-glass" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
