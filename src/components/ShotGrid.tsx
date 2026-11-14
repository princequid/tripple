'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShotCard as ShotCardDto } from '@/modules/shots/types';
import { api } from '@/lib/api-client';
import { ShotMasonry } from './ShotMasonry';
import { Icon } from './Icon';

/**
 * C18 ShotGrid + InfiniteFeed (D-01, FR-23, BR-35). The first page is server-rendered. Later pages come from the
 * list endpoint (`apiPath` + `cursor`). Loads automatically near the end (IntersectionObserver) and always shows
 * a "Load more" control. Without JavaScript, that control is a plain link to `?cursor=…` (progressive enhancement).
 * IDs are de-duplicated across pages.
 */
type Props = {
  initial: ShotCardDto[];
  nextCursor: string | null;
  apiPath: string; // e.g. "/api/shots?sort=popular" (no cursor)
  label: string; // accessible name of the list
};

export function ShotGrid({ initial, nextCursor, apiPath, label }: Props) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [announce, setAnnounce] = useState('');
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || status === 'loading') return;
    setStatus('loading');
    const sep = apiPath.includes('?') ? '&' : '?';
    const r = await api<ShotCardDto[]>(`${apiPath}${sep}cursor=${encodeURIComponent(cursor)}`);
    if (!r.ok) {
      setStatus('error');
      return;
    }
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...r.data.filter((d) => !seen.has(d.id))];
    });
    setCursor(r.page?.nextCursor ?? null);
    setAnnounce(`${r.data.length} more shots loaded.`);
    setStatus('idle');
  }, [apiPath, cursor, status]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || status !== 'idle') return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && void loadMore(), { rootMargin: '800px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, status, loadMore]);

  return (
    <div className="shot-feed-wrap">
      <ShotMasonry shots={items} label={label} />
      <div ref={sentinel} />
      <div className="ui-feed-status">
        {status === 'error' ? (
          <div className="ui-feed-status ui-feed-status--error" style={{ padding: 0 }}>
            <Icon name="alert" size={20} strokeWidth={2} />
            <span>Couldn&apos;t load more shots.</span>
            <button className="ui-btn ui-btn--ghost" type="button" onClick={() => setStatus('idle')}>
              Try again
            </button>
          </div>
        ) : cursor ? (
          <a
            className="ui-btn ui-btn--secondary neu-control"
            href={`?cursor=${encodeURIComponent(cursor)}`}
            aria-busy={status === 'loading' || undefined}
            onClick={(e) => {
              e.preventDefault();
              void loadMore();
            }}
          >
            {status === 'loading' ? 'Loading…' : 'Load more'}
          </a>
        ) : (
          items.length > 0 && <p className="ui-feed-status__caption">You&apos;ve reached the end</p>
        )}
        <span className="visually-hidden" role="status">
          {announce}
        </span>
      </div>
    </div>
  );
}
