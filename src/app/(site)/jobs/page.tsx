import type { Metadata } from 'next';
import Link from 'next/link';
import { JobBoard } from '@/components/jobs/JobBoard';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Design jobs', description: 'Design jobs from studios and product teams. Posting is free.' };

/** /jobs — SCR-37 job board (J-01, FR-67). */
export default function JobsPage() {
  return (
    <>
      <header className="page-head row-between">
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-3)' }}>
          <h1 className="t-h1">
            Find your next <span className="text-accent-display">design role</span>
          </h1>
          <p className="t-body-lg text-secondary measure">Product, brand, motion and more. New roles every week, free to post.</p>
          <PreviewNote feature="jobs" />
        </div>
        <Link className="ui-btn ui-btn--primary" href="/jobs/new">
          Post a job
        </Link>
      </header>
      <JobBoard />
    </>
  );
}
