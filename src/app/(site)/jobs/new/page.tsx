import type { Metadata } from 'next';
import { JobWizard } from '@/components/jobs/JobWizard';

export const metadata: Metadata = { title: 'Post a job', robots: { index: false } };

/** /jobs/new — SCR-39 (J-03): public form; sign-in is required to continue past step 1 (BR-73). */
export default function NewJobPage() {
  return (
    <div className="page-narrow form-page">
      <header className="page-head stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
        <h1 className="t-h2">Post a job</h1>
        <p className="text-secondary">Reach designers who care about craft. Free listings run for 30 days.</p>
      </header>
      <JobWizard id={null} />
    </div>
  );
}
