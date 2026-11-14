import Link from 'next/link';
import * as feed from '@/modules/feed/service';
import { FeedView } from '@/components/FeedView';
import { SearchForm } from '@/components/SearchForm';
import { TrippleMark } from '@/components/brand/TrippleMark';
import { Icon } from '@/components/Icon';
import { mediaUrl } from '@/lib/media';
import { formatCount, formatCountLong } from '@/lib/format';
import { shotPath } from '@/lib/slug';
import { currentViewer, first, orNotFound } from '../_viewer';

const POPULAR_SEARCHES = ['dashboard', 'landing page', 'mobile app', 'illustration', 'web design', 'branding'];
const title = (t: string) => t.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Homepage v3 (D-09, FR-21, A-27): headline, hero search and popular searches on the left; on the right a
 * composition built from the current top shot (glass frame, flat red disc, floating stats). Then the popular feed.
 * No promo toast (BR-89).
 */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const viewer = await currentViewer();
  const top = (await feed.list({ sort: 'popular', category: null, timeframe: null, cursor: null }, viewer).catch(() => null))?.items.find((s) => s.cover);
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <h1 id="hero-title" className="hero__title">
            <span className="hero__line hero__line--lead">Discover work from</span>{' '}
            <span className="hero__line">
              <span className="hero__mark">independent</span> designers
            </span>
          </h1>
          <SearchForm variant="hero" id="hero-q" />
          <div className="hero__popular">
            <span className="hero__popular-label">
              <Icon name="sparkle" />
              <span>Trending</span>
            </span>
            <ul className="hero__chips" aria-label="Popular searches">
              {POPULAR_SEARCHES.map((t) => (
                <li key={t}>
                  <Link className="hero__chip" href={`/search/${t.replace(/ /g, '-')}`}>
                    <span aria-hidden="true">#</span>
                    {title(t)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {top?.cover && (
          <Link className="hero__visual" href={shotPath(top.id, top.slug)} aria-label={`Featured shot: ${top.title} by ${(top.team ?? top.author).displayName}`}>
            <span className="hero__disc" aria-hidden="true" />
            <span className="hero__orb hero__orb--a" aria-hidden="true" />
            <span className="hero__orb hero__orb--b" aria-hidden="true" />
            <span className="hero__frame glass-panel">
              {/* eslint-disable-next-line @next/next/no-img-element -- custom media host (ADR-010) */}
              <img src={mediaUrl(top.cover.key, 'w800')} width={top.cover.width} height={top.cover.height} alt="" fetchPriority="high" />
            </span>
            <span className="hero__tag glass-panel" aria-hidden="true">
              <TrippleMark />
              <span>
                <strong>Shot of the day</strong>
                <span>{(top.team ?? top.author).displayName}</span>
              </span>
            </span>
            <span className="hero__stats glass-panel" aria-hidden="true">
              <span>
                <Icon name="heart" />
                {formatCount(top.likesCount)}
              </span>
              <span>
                <Icon name="eye" />
                {formatCount(top.viewsCount)}
              </span>
            </span>
            <span className="visually-hidden">
              {formatCountLong(top.likesCount)} likes, {formatCountLong(top.viewsCount)} views
            </span>
          </Link>
        )}
      </section>
      <h2 className="visually-hidden">Popular shots</h2>
      {await orNotFound(FeedView({ viewer, sort: 'popular', category: null, timeframe: null, cursor: first(sp.cursor) }))}
    </>
  );
}
