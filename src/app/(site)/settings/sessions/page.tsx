import type { Metadata } from 'next';
import { SessionsView } from '@/components/settings/AccountSettings';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Sessions settings', robots: { index: false } };

/** /settings/sessions — SCR-32 (FR-19). */
export default function SettingsSessions() {
  return (
    <section className="stack" aria-labelledby="s-title">
      <h2 id="s-title" className="t-h3">
        Sessions
      </h2>
      <PreviewNote feature="settings" />
      <SessionsView />
    </section>
  );
}
