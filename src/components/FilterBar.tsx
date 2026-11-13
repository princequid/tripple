import Link from 'next/link';
import { CATEGORIES, TIMEFRAMES, type FeedSort, type Timeframe } from '@/lib/catalog';

/**
 * C15 FilterBar (D-03, FR-25). The URL is the state, so every choice is a link and works without JavaScript.
 * Sort: Popular | Recent. Category pills (8, BR-36) with "All" (A-13). Timeframe (BR-34) applies to Popular only.
 * Tag filter and colour are not in this slice (tag filtering is served by /tags/:tag; colour is R3, X-4).
 */
export function FilterBar({ sort, category, timeframe }: { sort: FeedSort; category: string | null; timeframe: Timeframe }) {
  const base = (s: FeedSort, c: string | null) => `/shots/${s}${c ? `/${c}` : ''}`;
  const withTf = (s: FeedSort, c: string | null) => (s === 'popular' && timeframe !== 'now' ? `${base(s, c)}?timeframe=${timeframe}` : base(s, c));
  return (
    <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-4)' }}>
      <div className="ui-filter-bar">
        <nav aria-label="Sort" className="ui-filter-bar__sort">
          <div className="ui-pill-row">
            <Link className="ui-pill neu-control" href={withTf('popular', category)} aria-current={sort === 'popular' ? 'page' : undefined}>
              Popular
            </Link>
            <Link className="ui-pill neu-control" href={base('recent', category)} aria-current={sort === 'recent' ? 'page' : undefined}>
              Recent
            </Link>
          </div>
        </nav>
        <nav aria-label="Categories">
          <div className="ui-pill-row">
            <Link className="ui-pill neu-control" href={withTf(sort, null)} aria-current={category === null ? 'page' : undefined}>
              All
            </Link>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} className="ui-pill neu-control" href={withTf(sort, c.slug)} aria-current={category === c.slug ? 'page' : undefined}>
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      {sort === 'popular' && (
        <div className="ui-radio-group feed-timeframes" role="radiogroup" aria-label="Timeframe">
          {TIMEFRAMES.map((t) => (
            <Link
              key={t.value}
              className="ui-radio"
              role="radio"
              aria-checked={timeframe === t.value}
              href={t.value === 'now' ? base('popular', category) : `${base('popular', category)}?timeframe=${t.value}`}
            >
              <span className="ui-radio__dot" />
              {t.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
