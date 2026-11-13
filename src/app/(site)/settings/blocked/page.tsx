import type { Metadata } from 'next';
import { BlockedView } from '@/components/settings/TeamsSettings';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Blocked members settings', robots: { index: false } };

/** /settings/blocked — SCR-58 (S-06). */
export default function SettingsBlocked() {
  return (
    <section className="stack" aria-labelledby="s-title">
      <h2 id="s-title" className="t-h3">
        Blocked members
      </h2>
      <PreviewNote feature="blocks" />
      <BlockedView />
    </section>
  );
}
