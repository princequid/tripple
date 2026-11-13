'use client';

import Link from 'next/link';
import { useState } from 'react';
import { decideReport, REPORT_DECISION_MIN, reportQueue } from '@/services/social';
import type { ReportDecision, ReportRow } from '@/services/contracts';
import { REPORT_REASONS, timeAgo } from '@/services/reference';
import { useResource } from '@/hooks/useResource';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/Field';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { Avatar } from '../Avatar';

const ACTIONS: { action: ReportDecision['action']; label: string; danger?: boolean }[] = [
  { action: 'dismiss', label: 'Dismiss' },
  { action: 'hide', label: 'Hide content', danger: true },
  { action: 'suspend', label: 'Suspend author', danger: true },
];

/** SCR-41 report queue (FR-90, BR-68/69): Open / Resolved; Hide, Dismiss or Suspend with a required reason. */
export function ReportQueue() {
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const res = useResource(() => reportQueue(tab), [tab]);
  const [decide, setDecide] = useState<{ r: ReportRow; action: ReportDecision['action'] } | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  return (
    <section className="stack">
      <div className="ui-segmented" role="radiogroup" aria-label="Queue">
        {(['open', 'closed'] as const).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={tab === t} className="ui-segmented__item" onClick={() => setTab(t)}>
            {t === 'open' ? 'Open' : 'Resolved'}
          </button>
        ))}
      </div>
      {res.status === 'error' ? (
        <ErrorState onRetry={res.reload} />
      ) : !res.data ? (
        <ListSkeleton rows={3} />
      ) : res.data.length === 0 ? (
        <EmptyState icon="flag" title={tab === 'open' ? 'Queue is clear' : 'No resolved reports yet'} body={tab === 'open' ? 'New reports from members will appear here.' : undefined} />
      ) : (
        <ul className="report-list">
          {res.data.map((r) => (
            <li key={r.id} className="ui-card report-row">
              <div className="row-between">
                <span className="cluster">
                  <span className="ui-badge ui-badge--neutral">{r.targetType}</span>
                  <span className="ui-badge ui-badge--accent">{REPORT_REASONS.find((x) => x.value === r.reason)?.label ?? r.reason}</span>
                  {r.reportsCount > 1 && <span className="ui-badge ui-badge--gold">{r.reportsCount} reports</span>}
                </span>
                <time className="t-caption text-secondary" dateTime={r.createdAt}>
                  {timeAgo(r.createdAt)}
                </time>
              </div>
              <Link className="text-link t-h4" href={r.targetHref}>
                {r.targetLabel}
              </Link>
              {r.note && <p className="t-body-sm report-row__note">“{r.note}”</p>}
              <p className="cluster t-caption text-secondary">
                <Avatar name={r.reporter.displayName} avatarKey={r.reporter.avatarKey} /> Reported by {r.reporter.displayName}
              </p>
              {tab === 'open' ? (
                <div className="cluster">
                  {ACTIONS.map((a) => (
                    <button key={a.action} type="button" className={`ui-btn ui-btn--sm ${a.danger ? 'ui-btn--danger-ghost' : 'ui-btn--secondary neu-control'}`} onClick={() => (setDecide({ r, action: a.action }), setReason(''), setError(null))}>
                      {a.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="ui-badge ui-badge--sage">{r.status}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <Modal open={decide !== null} onClose={() => setDecide(null)} title={decide ? `${ACTIONS.find((a) => a.action === decide.action)?.label}: ${decide.r.targetLabel}` : ''} size="sm">
        <form
          className="stack"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (reason.trim().length < REPORT_DECISION_MIN) return setError(`Give a reason of at least ${REPORT_DECISION_MIN} characters (it goes to the audit log).`);
            setBusy(true);
            const r = await decideReport(decide!.r.id, { action: decide!.action, reason: reason.trim() });
            setBusy(false);
            if (!r.ok) return setError(r.message);
            toast({ tone: 'success', text: 'Decision recorded.' });
            setDecide(null);
            await res.reload();
          }}
        >
          <TextArea label="Reason" value={reason} maxLength={500} rows={3} onChange={(e) => (setReason(e.target.value), setError(null))} error={error} data-autofocus />
          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="ui-btn ui-btn--on-glass" onClick={() => setDecide(null)}>
              Cancel
            </button>
            <button type="submit" className={`ui-btn ${decide?.action === 'dismiss' ? 'ui-btn--primary' : 'ui-btn--danger'}`} aria-busy={busy || undefined}>
              Confirm
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
