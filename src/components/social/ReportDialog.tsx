'use client';

import { useState } from 'react';
import { createReport } from '@/services/social';
import { REPORT_REASONS } from '@/services/reference';
import type { ReportReason, ReportTargetType } from '@/services/contracts';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/Field';
import { useToast } from '../ui/Toast';

/** OV-06 report dialog (BR-69): reason (radio) + optional note (≤ 500). One report per target per reporter. */
export function ReportDialog({ open, onClose, target }: { open: boolean; onClose: () => void; target: { type: ReportTargetType; id: number; label: string; href: string } }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return setError('Choose a reason.');
    if (reason === 'other' && !note.trim()) return setError('Tell us a little about the problem.');
    setBusy(true);
    const r = await createReport({ targetType: target.type, targetId: target.id, reason, note: note.trim() || undefined }, target.label, target.href);
    setBusy(false);
    if (!r.ok) return setError(r.message);
    toast({ tone: 'success', text: r.data.status === 'already-reported' ? 'You already reported this. Our moderators will review it.' : 'Thanks. Our moderators will review this report.' });
    setReason(null);
    setNote('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Report this ${target.type}`} description="Reports are private. The member is not told who reported them.">
      <form className="stack" onSubmit={submit} noValidate>
        <fieldset className="ui-fieldset">
          <legend>What’s wrong?</legend>
          <div className="ui-radio-group" role="radiogroup" aria-label="Reason">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={reason === r.value}
                className="ui-radio link-button"
                onClick={() => (setReason(r.value), setError(null))}
              >
                <span className="ui-radio__dot" />
                {r.label}
              </button>
            ))}
          </div>
        </fieldset>
        <TextArea label="Add a note" optional value={note} maxLength={500} rows={3} onChange={(e) => setNote(e.target.value)} />
        {error && (
          <p className="ui-field__error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="ui-btn ui-btn--on-glass" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ui-btn ui-btn--primary" aria-busy={busy || undefined}>
            Send report
          </button>
        </div>
      </form>
    </Modal>
  );
}
