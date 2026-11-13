import type { Metadata } from 'next';
import { FeedView } from '@/components/FeedView';
import { currentViewer, first, orNotFound } from '../../../_viewer';

export const metadata: Metadata = { title: 'Popular shots' };

/** /shots/popular (FR-22). */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const viewer = await currentViewer();
  return (
    <>
      <div className="page-head">
        <h1 className="t-h2">Popular shots</h1>
      </div>
      {await orNotFound(FeedView({ viewer, sort: 'popular', category: null, timeframe: first(sp.timeframe), cursor: first(sp.cursor) }))}
    </>
  );
}
