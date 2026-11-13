import type { Metadata } from 'next';
import { CreateTeamForm } from '@/components/settings/TeamsSettings';
import { PreviewNote } from '@/components/ui/PreviewNote';
import { requireMemberPage } from '../../../_guard';

export const metadata: Metadata = { title: 'Create a team', robots: { index: false } };

/** /teams/new — SCR-35 (auth). */
export default async function NewTeamPage() {
  await requireMemberPage('/teams/new');
  return (
    <div className="page-narrow form-page">
      <header className="page-head stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
        <h1 className="t-h2">Create a team</h1>
        <p className="text-secondary">A team has its own profile. Members publish shots for it and they appear on both profiles.</p>
        <PreviewNote feature="teams" />
      </header>
      <CreateTeamForm />
    </div>
  );
}
