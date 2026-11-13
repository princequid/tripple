import type { Metadata } from 'next';
import { TeamAdminView } from '@/components/settings/TeamsSettings';

export const metadata: Metadata = { title: 'Manage team', robots: { index: false } };

/** /settings/teams/:team — SCR-34 (owner/admin; members see their own role and Leave). */
export default async function TeamAdminPage({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  return (
    <section className="stack" aria-labelledby="s-title">
      <h2 id="s-title" className="t-h3">
        Manage team
      </h2>
      <TeamAdminView team={decodeURIComponent(team)} />
    </section>
  );
}
