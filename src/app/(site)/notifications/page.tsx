import type { Metadata } from 'next';
import { NotificationsView } from '@/components/inbox/NotificationsView';
import { PreviewNote } from '@/components/ui/PreviewNote';
import { requireMemberPage } from '../../_guard';

export const metadata: Metadata = { title: 'Notifications', robots: { index: false } };

/** /notifications — SCR-50 (auth). */
export default async function NotificationsPage() {
  await requireMemberPage('/notifications');
  return (
    <div className="page-mid">
      <header className="page-head stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
        <h1 className="t-h2">Notifications</h1>
        <PreviewNote feature="notifications" />
      </header>
      <NotificationsView />
    </div>
  );
}
