import Link from 'next/link';
import { CATEGORIES, TIMEFRAMES, type FeedSort, type Timeframe } from '@/lib/catalog';
import { Icon } from './Icon';

/**
 * C15 FilterBar v3 (D-03, FR-25, A-27). The URL is the state, so every choice is a link and works without JavaScript.
 * One soft track: Sort (Popular | Recent), a divider, then "All" + the 8 categories (BR-36, A-13); the active
 * category is the navy pill. Timeframe (BR-34, Popular only) lives in a "Filters" popover built on <details>, so
 * it also opens without JavaScript. Tag filtering is served by /tags/:tag; colour is R3 (X-4).
 */
export function FilterBar({ sort, category, timeframe }: { sort: FeedSort; category: string | null; timeframe: Timeframe }) {
  const base = (s: FeedSort, c: string | null) => `/shots/${s}${c ? `/${c}` : ''}`;
  const withTf = (s: FeedSort, c: string | null) => (s === 'popular' && timeframe !== 'now' ? `${base(s, c)}?timeframe=${timeframe}` : base(s, c));
  const tfLabel = TIMEFRAMES.find((t) => t.value === timeframe)?.label;
  return (
    <div className="feed-filters">
      <div className="feed-filters__track">
        <nav aria-label="Sort" className="feed-filters__group">
          <Link className="ui-pill feed-pill feed-pill--sort" href={withTf('popular', category)} aria-current={sort === 'popular' ? 'page' : undefined}>
            Popular
          </Link>
          <Link className="ui-pill feed-pill feed-pill--sort" href={base('recent', category)} aria-current={sort === 'recent' ? 'page' : undefined}>
            Recent
          </Link>
        </nav>
        <span className="feed-filters__sep" aria-hidden="true" />
        <nav aria-label="Categories" className="feed-filters__group">
          <Link className="ui-pill feed-pill" href={withTf(sort, null)} aria-current={category === null ? 'page' : undefined}>
            <Icon name="grid" />
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} className="ui-pill feed-pill" href={withTf(sort, c.slug)} aria-current={category === c.slug ? 'page' : undefined}>
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
      {sort === 'popular' && (
        <details className="feed-filters__more">
          <summary className="ui-btn neu-control feed-filters__toggle">
            <Icon name="filter" />
            Filters
            {timeframe !== 'now' && <span className="ui-badge ui-badge--accent">{tfLabel}</span>}
            <Icon name="chev" className="ui-chevron" />
          </summary>
          <div className="feed-filters__panel glass-panel">
            <p className="feed-filters__title">Timeframe</p>
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
          </div>
        </details>
      )}
    </div>
  );
}
