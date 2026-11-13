import Link from 'next/link';
import { FeedView } from '@/components/FeedView';
import { SearchForm } from '@/components/SearchForm';
import { currentViewer, first, orNotFound } from '../_viewer';

const POPULAR_SEARCHES = ['dashboard', 'landing page', 'mobile', 'illustration'];

/** Homepage (D-09, FR-21): original hero copy, hero search, then the popular feed. No promo toast (BR-89). */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const viewer = await currentViewer();
  return (
    <>
      <section className="section stack" style={{ ['--stack-gap' as string]: 'var(--space-6)' }} aria-labelledby="hero-title">
        <h1 id="hero-title" className="t-display measure">
          Discover work from <span className="text-accent-display">independent designers</span>
        </h1>
        <p className="t-body-lg text-secondary measure">
          Interfaces, identities, illustration and motion, shared by the people who made them.
        </p>
        <div style={{ maxWidth: 640 }}>
          <SearchForm variant="hero" id="hero-q" />
        </div>
        <div className="cluster" style={{ ['--cluster-gap' as string]: 'var(--space-3)' }}>
          <span className="t-label">Popular:</span>
          <ul className="ui-chip-row" aria-label="Popular searches">
            {POPULAR_SEARCHES.map((t) => (
              <li key={t}>
                <Link className="ui-chip" href={`/search/${t.replace(/ /g, '-')}`}>
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <h2 className="visually-hidden">Popular shots</h2>
      {await orNotFound(FeedView({ viewer, sort: 'popular', category: null, timeframe: null, cursor: first(sp.cursor) }))}
    </>
  );
}
