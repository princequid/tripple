'use client';

import Link from 'next/link';
import { useState } from 'react';
import { closeJob, getJob, jobPath } from '@/services/jobs';
import { EMPLOYMENT_LABEL, WORKPLACE_LABEL, timeAgo } from '@/services/reference';
import { formatDate } from '@/lib/format';
import { sanitizeHtml } from '@/lib/sanitize';
import { useResource } from '@/hooks/useResource';
import { useSession } from '../providers/AppProviders';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { ConfirmDialog } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';
import { ShareModal } from '../shot/ShareModal';
import { ReportDialog } from '../social/ReportDialog';

/** SCR-38 job detail (J-02, FR-68, BR-73/74): description, company card, Apply (new tab), share; expired notice. */
export function JobDetailView({ id }: { id: number }) {
  const res = useResource(() => getJob(id), [id]);
  const [dialog, setDialog] = useState<'share' | 'close' | 'report' | null>(null);
  const { requireMember } = useSession();
  const toast = useToast();
  if (res.status === 'error')
    return res.code === 'NOT_FOUND' ? <EmptyState icon="briefcase" title="Job not found" action={<Link className="ui-btn ui-btn--primary" href="/jobs">Browse jobs</Link>} /> : <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={5} />;
  const j = res.data;
  const active = j.status === 'active';
  const mailto = (j.applyUrl ?? '').startsWith('mailto:');

  return (
    <article className="job-detail">
      <div className="job-detail__main stack">
        <p className="t-label">
          <Link className="text-link" href="/jobs">
            <Icon name="arrowLeft" size={14} /> All jobs
          </Link>
        </p>
        {!active && (
          <div className="ui-alert ui-alert--error" role="status">
            <Icon name="info" />
            No longer accepting applications. This job {j.status === 'closed' ? 'was closed by the poster' : `expired on ${formatDate(j.expiresAt)}`}.
          </div>
        )}
        <h1 className="t-h2">{j.title}</h1>
        <p className="job-row__meta">
          <span>{j.company.name}</span>
          <span>
            <Icon name="pin" size={14} /> {j.location || 'Remote'}
          </span>
          <span className="ui-badge ui-badge--sage">{WORKPLACE_LABEL[j.workplaceType]}</span>
          <span className="ui-badge ui-badge--neutral">{EMPLOYMENT_LABEL[j.employmentType]}</span>
          <span className="ui-badge ui-badge--support">{j.specialty.name}</span>
        </p>
        <div className="job-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(j.descriptionHtml) }} />
      </div>
      <aside className="job-detail__aside">
        <div className="ui-card company-card">
          <span className="job-row__logo job-row__logo--lg" aria-hidden="true">
            {j.company.name.slice(0, 1)}
          </span>
          <h2 className="ui-card__title">{j.company.name}</h2>
          <a className="text-link" href={j.company.websiteUrl} target="_blank" rel="noopener noreferrer nofollow">
            {j.company.websiteUrl.replace(/^https:\/\//, '')} <Icon name="external" size={14} />
          </a>
          <p className="ui-card__meta">Posted {timeAgo(j.postedAt)}</p>
          {active &&
            j.applyUrl !== null &&
            (j.isOwn ? (
              <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
                <Link className="ui-btn ui-btn--primary ui-btn--block" href={`/jobs/${j.id}/edit`}>
                  <Icon name="edit" /> Edit job
                </Link>
                <button type="button" className="ui-btn ui-btn--danger-ghost ui-btn--block" onClick={() => setDialog('close')}>
                  Close job
                </button>
              </div>
            ) : (
              <a className="ui-btn ui-btn--primary ui-btn--block" href={j.applyUrl ?? undefined} target={mailto ? undefined : '_blank'} rel="noopener noreferrer">
                Apply for this position <Icon name="external" />
              </a>
            ))}
          <p className="t-caption text-secondary">Applications go directly to the employer. Trippple doesn’t collect application data.</p>
          <div className="cluster">
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => setDialog('share')}>
              <Icon name="share" /> Share
            </button>
            {!j.isOwn && (
              <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm" onClick={() => requireMember(null, 'report jobs') && setDialog('report')}>
                <Icon name="flag" /> Report
              </button>
            )}
          </div>
        </div>
      </aside>
      <ShareModal open={dialog === 'share'} onClose={() => setDialog(null)} path={jobPath(j)} title={`${j.title} at ${j.company.name}`} kind="job" />
      <ReportDialog open={dialog === 'report'} onClose={() => setDialog(null)} target={{ type: 'job', id: j.id, label: j.title, href: jobPath(j) }} />
      <ConfirmDialog
        open={dialog === 'close'}
        onClose={() => setDialog(null)}
        title="Close this job?"
        body="It leaves the board right away. The page stays up with a “no longer accepting applications” notice."
        confirmLabel="Close job"
        danger
        onConfirm={async () => {
          const r = await closeJob(j.id);
          setDialog(null);
          if (!r.ok) return toast({ tone: 'error', text: r.message });
          toast({ tone: 'success', text: 'Job closed.' });
          await res.reload();
        }}
      />
    </article>
  );
}
