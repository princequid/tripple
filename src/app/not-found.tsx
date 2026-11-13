import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';
import { NotFoundMosaic, NotFoundLinks } from '@/components/NotFoundMosaic';

/** 404 (X-02, FR-05, FR-08 / SCR-60): colour mosaic from our own shots, hue slider, search, no global nav. */
export default function NotFound() {
  return (
    <main id="main" className="container section notfound">
      <Link className="ui-brand" href="/" aria-label="Trippple home">
        Trippple
      </Link>
      <NotFoundMosaic />
      <div className="ui-state" style={{ paddingTop: 'var(--space-6)' }}>
        <h1 className="ui-state__title">Whoops, we couldn&apos;t find that page</h1>
        <p className="ui-state__body">It may have moved, or it was never here. Try a search instead.</p>
        <div style={{ width: 'min(480px, 100%)' }}>
          <SearchForm variant="hero" id="nf-q" />
        </div>
        <NotFoundLinks />
      </div>
    </main>
  );
}
