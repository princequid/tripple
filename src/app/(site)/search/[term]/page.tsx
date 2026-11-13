import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import * as search from '@/modules/search/service';
import { searchPath, termFromSegment } from '@/lib/search-term';
import { ShotGrid } from '@/components/ShotGrid';
import { Icon } from '@/components/Icon';
import { DesignerResults } from '@/components/profile/DesignerResults';
import { currentViewer, first, orNotFound } from '../../../_viewer';

type Params = { term: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const term = termFromSegment((await params).term);
  return { title: `${term} designs`, robots: { index: false } };
}

/** /search/:term (D-06, FR-31, FR-32; BR-38 canonical 308, BR-39 ranking). */
export default async function SearchPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { term: segment } = await params;
  const term = termFromSegment(segment);
  if (term && searchPath(term) !== `/search/${segment}`) permanentRedirect(searchPath(term));
  const sp = await searchParams;
  const type = first(sp.type) === 'designers' ? 'designers' : 'shots';
  const tabs = (
    <nav aria-label="Result type" className="search-tabs">
      <div className="ui-segmented">
        <Link className="ui-segmented__item segmented-link" href={searchPath(term)} aria-current={type === 'shots' ? 'page' : undefined}>
          Shots
        </Link>
        <Link className="ui-segmented__item segmented-link" href={`${searchPath(term)}?type=designers`} aria-current={type === 'designers' ? 'page' : undefined}>
          Designers
        </Link>
      </div>
    </nav>
  );
  if (type === 'designers') {
    return (
      <>
        <div className="page-head">
          <h1 className="t-h2">{term || 'Search'}</h1>
          <p className="text-secondary page-head__sub">Designers matching “{term}”</p>
        </div>
        {tabs}
        <DesignerResults term={term} />
      </>
    );
  }
  const viewer = await currentViewer();
  const page = await orNotFound(search.searchShots(term, first(sp.cursor), viewer));
  const related = page.items.length === 0 ? await search.relatedTags(term) : [];

  return (
    <>
      <div className="page-head">
        <h1 className="t-h2">{term || 'Search'}</h1>
        <p className="text-secondary page-head__sub">Shots matching “{term}”</p>
      </div>
      {tabs}
      {page.items.length === 0 ? (
        <div className="ui-state section">
          <Icon name="search" className="ui-state__icon" strokeWidth={1.5} />
          <p className="ui-state__title">No shots match “{term}”</p>
          <p className="ui-state__body">Try a broader term, or browse by tag.</p>
          {related.length > 0 ? (
            <ul className="ui-chip-row" aria-label="Related tags">
              {related.map((t) => (
                <li key={t.slug}>
                  <Link className="ui-chip" href={`/tags/${t.slug}`}>
                    #{t.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Link className="ui-btn ui-btn--secondary neu-control" href="/tags">
              Browse tags
            </Link>
          )}
        </div>
      ) : (
        <ShotGrid
          key={term + (first(sp.cursor) ?? '')}
          initial={page.items}
          nextCursor={page.nextCursor}
          apiPath={`/api/search/shots?q=${encodeURIComponent(term)}`}
          label={`Search results for ${term}`}
        />
      )}
    </>
  );
}
