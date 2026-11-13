import type { Metadata } from 'next';
import { MyJobsView } from '@/components/settings/TeamsSettings';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Jobs settings', robots: { index: false } };

/** /settings/jobs — SCR-36 (FR-70). */
export default function SettingsJobs() {
  return (
    <section className="stack" aria-labelledby="s-title">
      <h2 id="s-title" className="t-h3">
        Jobs
      </h2>
      <PreviewNote feature="jobs" />
      <MyJobsView />
    </section>
  );
}
