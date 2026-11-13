import type { Metadata } from 'next';
import { Composer } from '@/components/composer/Composer';
import { requireMemberPage } from '../../../_guard';

export const metadata: Metadata = { title: 'Share your work', robots: { index: false } };

/** /uploads/new — SCR-20 composer (auth, A-05). */
export default async function NewShotPage() {
  await requireMemberPage('/uploads/new');
  return (
    <>
      <header className="page-head">
        <h1 className="t-h2">Share your work</h1>
      </header>
      <Composer draftId={null} />
    </>
  );
}
