import type { Metadata } from 'next';
import Link from 'next/link';
import * as search from '@/modules/search/service';
import { formatCountLong } from '@/lib/format';
import { ShotGrid } from '@/components/ShotGrid';
import { currentViewer, first, orNotFound } from '../../../_viewer';

type Params = { tag: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `#${decodeURIComponent((await params).tag)}` };
}

/** /tags/:tag (D-07, FR-34): 404 unless the tag has an eligible shot (BR-41). Popular | Recent. */
export default async function TagPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { tag: slug } = await params;
  const sp = await searchParams;
  const sort = first(sp.sort) === 'recent' ? 'recent' : 'popular';
  const viewer = await currentViewer();
  const page = await orNotFound(search.tagPage(slug, { sort, cursor: first(sp.cursor) }, viewer));
  return (
    <>
      <div className="page-head">
        <h1 className="t-h2">#{page.tag.name}</h1>
        <p className="text-secondary page-head__sub">{formatCountLong(page.count)} shots</p>
      </div>
      <nav aria-label="Sort">
        <div className="ui-pill-row">
          <Link className="ui-pill neu-control" href={`/tags/${page.tag.slug}`} aria-current={sort === 'popular' ? 'page' : undefined}>
            Popular
          </Link>
          <Link className="ui-pill neu-control" href={`/tags/${page.tag.slug}?sort=recent`} aria-current={sort === 'recent' ? 'page' : undefined}>
            Recent
          </Link>
        </div>
      </nav>
      <ShotGrid
        key={slug + sort + (first(sp.cursor) ?? '')}
        initial={page.items}
        nextCursor={page.nextCursor}
        apiPath={`/api/tags/${encodeURIComponent(page.tag.slug)}/shots?sort=${sort}`}
        label={`Shots tagged ${page.tag.name}`}
      />
    </>
  );
}
