import type { Metadata } from 'next';
import { TeamsView } from '@/components/settings/TeamsSettings';
import { PreviewNote } from '@/components/ui/PreviewNote';

export const metadata: Metadata = { title: 'Teams settings', robots: { index: false } };

/** /settings/teams — SCR-33 (FR-58). */
export default function SettingsTeams() {
  return (
    <section className="stack" aria-labelledby="s-title">
      <h2 id="s-title" className="t-h3">
        Teams
      </h2>
      <PreviewNote feature="teams" />
      <TeamsView />
    </section>
  );
}
