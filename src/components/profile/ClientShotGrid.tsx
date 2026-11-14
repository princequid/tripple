'use client';

import { useState } from 'react';
import type { ApiResult } from '@/lib/api-client';
import type { Paged, ShotCard as ShotCardDto } from '@/services/contracts';
import { ShotMasonry } from '../ShotMasonry';

/** Shot grid for client-loaded lists (liked shots, collection pages) with a "Load more" control (BR-35). */
export function ClientShotGrid({ initial, nextCursor, load, label }: { initial: ShotCardDto[]; nextCursor: string | null; load?: (cursor: string) => Promise<ApiResult<Paged<ShotCardDto>>>; label: string }) {
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const more = async () => {
    if (!cursor || !load) return;
    setState('loading');
    const r = await load(cursor);
    if (!r.ok) return setState('error');
    setItems((xs) => [...xs, ...r.data.items.filter((d) => !xs.some((x) => x.id === d.id))]);
    setCursor(r.data.nextCursor);
    setState('idle');
  };
  return (
    <div className="shot-feed-wrap">
      <ShotMasonry shots={items} label={label} />
      {cursor && load && (
        <div className="ui-feed-status">
          {state === 'error' && <p className="t-body-sm">Couldn’t load more.</p>}
          <button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={more} aria-busy={state === 'loading' || undefined}>
            {state === 'error' ? 'Try again' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
