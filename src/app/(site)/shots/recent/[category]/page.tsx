import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FeedView } from '@/components/FeedView';
import { categoryBySlug } from '@/lib/catalog';
import { currentViewer, first, orNotFound } from '../../../../_viewer';

type Params = { category: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const c = categoryBySlug((await params).category);
  return { title: c ? `${c.name}: recent shots` : 'Not found' };
}

/** /shots/recent/:category (FR-22). Unknown category → 404 (BR-36). */
export default async function Page({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category } = await params;
  const c = categoryBySlug(category);
  if (!c) notFound();
  const sp = await searchParams;
  const viewer = await currentViewer();
  return (
    <>
      <div className="page-head">
        <h1 className="t-h2">{c.name}</h1>
      </div>
      {await orNotFound(FeedView({ viewer, sort: 'recent', category: c.slug, timeframe: first(sp.timeframe), cursor: first(sp.cursor) }))}
    </>
  );
}
