import type { Metadata } from 'next';
import { JobDetailView } from '@/components/jobs/JobDetailView';
import { idFromSegment } from '../../../_guard';

export const metadata: Metadata = { title: 'Job' };

/** /jobs/:id-:slug — SCR-38 (J-02, FR-68). */
export default async function JobPage({ params }: { params: Promise<{ job: string }> }) {
  return <JobDetailView id={idFromSegment((await params).job)} />;
}
