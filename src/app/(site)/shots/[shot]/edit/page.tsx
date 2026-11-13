import type { Metadata } from 'next';
import { Composer } from '@/components/composer/Composer';
import { idFromSegment, requireMemberPage } from '../../../../_guard';

export const metadata: Metadata = { title: 'Edit shot', robots: { index: false } };

/** /shots/:id/edit — SCR-21 (owner; others see a not-available state). */
export default async function EditShotPage({ params }: { params: Promise<{ shot: string }> }) {
  const seg = (await params).shot;
  await requireMemberPage(`/shots/${seg}/edit`);
  return (
    <>
      <header className="page-head">
        <h1 className="t-h2">Edit shot</h1>
      </header>
      <Composer draftId={idFromSegment(seg)} />
    </>
  );
}
