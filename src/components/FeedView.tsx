import type { Viewer } from '@/modules/auth/types';
import * as feed from '@/modules/feed/service';
import { categoryBySlug, TIMEFRAMES, type FeedSort, type Timeframe } from '@/lib/catalog';
import { FilterBar } from './FilterBar';
import { ShotGrid } from './ShotGrid';
import { Icon } from './Icon';

/**
 * Explore feed body shared by `/`, `/shots/popular[/:category]` and `/shots/recent[/:category]` (FR-22).
 * Calls the feed service directly (Server Component); later pages come from GET /api/shots with the same params.
 * Unknown category / bad cursor → AppError, mapped to 404 by the page (orNotFound).
 */
export async function FeedView(props: { viewer: Viewer; sort: FeedSort; category: string | null; timeframe: string | null; cursor: string | null }) {
  const page = await feed.list({ sort: props.sort, category: props.category, timeframe: props.timeframe, cursor: props.cursor }, props.viewer);
  const { timeframe } = feed.normaliseQuery({ sort: props.sort, category: props.category, timeframe: props.timeframe });
  const params = new URLSearchParams({ sort: props.sort });
  if (props.category) params.set('category', props.category);
  if (props.sort === 'popular' && timeframe !== 'now') params.set('timeframe', timeframe);
  const catName = props.category ? categoryBySlug(props.category)?.name : null;
  const label = `${props.sort === 'recent' ? 'Recent' : (TIMEFRAMES.find((t) => t.value === timeframe)?.label ?? 'Popular')} shots${catName ? ` in ${catName}` : ''}`;
  return (
    <>
      <FilterBar sort={props.sort} category={props.category} timeframe={timeframe as Timeframe} />
      {page.items.length === 0 ? (
        <div className="ui-state section">
          <Icon name="search" className="ui-state__icon" strokeWidth={1.5} />
          <p className="ui-state__title">No shots here yet</p>
          <p className="ui-state__body">Try another category or timeframe.</p>
        </div>
      ) : (
        <ShotGrid key={params.toString() + (props.cursor ?? '')} initial={page.items} nextCursor={page.nextCursor} apiPath={`/api/shots?${params}`} label={label} />
      )}
    </>
  );
}
