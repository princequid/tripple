import type { Metadata } from 'next';
import { JobWizard } from '@/components/jobs/JobWizard';
import { idFromSegment, requireMemberPage } from '../../../../_guard';

export const metadata: Metadata = { title: 'Edit job', robots: { index: false } };

/** /jobs/:id/edit — SCR-39 (owner). */
export default async function EditJobPage({ params }: { params: Promise<{ job: string }> }) {
  const seg = (await params).job;
  await requireMemberPage(`/jobs/${seg}/edit`);
  return (
    <div className="page-narrow form-page">
      <h1 className="t-h2 page-head">Edit job</h1>
      <JobWizard id={idFromSegment(seg)} />
    </div>
  );
}
