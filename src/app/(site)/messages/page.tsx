import type { Metadata } from 'next';
import { ThreadList } from '@/components/inbox/Messages';
import { EmptyState } from '@/components/ui/States';
import { PreviewNote } from '@/components/ui/PreviewNote';
import { requireMemberPage } from '../../_guard';

export const metadata: Metadata = { title: 'Messages', robots: { index: false } };

/** /messages — SCR-51 inbox (auth). Two panes from 1024 px. */
export default async function MessagesPage() {
  await requireMemberPage('/messages');
  return (
    <>
      <header className="page-head stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
        <h1 className="t-h2">Messages</h1>
        <PreviewNote feature="messages" />
      </header>
      <div className="inbox-layout">
        <ThreadList />
        <div className="inbox-layout__pane inbox-layout__placeholder">
          <EmptyState icon="message" title="Select a conversation" body="Choose a conversation on the left to read and reply." />
        </div>
      </div>
    </>
  );
}
