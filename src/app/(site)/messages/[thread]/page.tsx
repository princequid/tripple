import type { Metadata } from 'next';
import { Conversation, ThreadList } from '@/components/inbox/Messages';
import { idFromSegment, requireMemberPage } from '../../../_guard';

export const metadata: Metadata = { title: 'Conversation', robots: { index: false } };

/** /messages/:threadId — SCR-52 (participant only). Below 1024 px the thread list is hidden. */
export default async function ThreadPage({ params }: { params: Promise<{ thread: string }> }) {
  const seg = (await params).thread;
  await requireMemberPage(`/messages/${seg}`);
  const id = idFromSegment(seg);
  return (
    <div className="inbox-layout inbox-layout--thread">
      <h1 className="visually-hidden">Conversation</h1>
      <div className="inbox-layout__list">
        <ThreadList activeId={id} />
      </div>
      <div className="inbox-layout__pane">
        <Conversation id={id} />
      </div>
    </div>
  );
}
