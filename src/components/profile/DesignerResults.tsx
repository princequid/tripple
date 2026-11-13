'use client';

import { useState } from 'react';
import { searchDesigners } from '@/services/marketplace';
import type { PersonSummary } from '@/services/contracts';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { PersonRow } from './PeopleList';

/** SCR-42 designer search results (FR-35): name, username, skills; Load more. */
export function DesignerResults({ term }: { term: string }) {
  const res = useResource(() => searchDesigners(term), [term]);
  const [more, setMore] = useState<{ items: PersonSummary[]; cursor: string | null } | null>(null);
  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={5} />;
  const items = [...res.data.items, ...(more?.items ?? [])];
  const cursor = more ? more.cursor : res.data.nextCursor;
  if (items.length === 0) return <EmptyState icon="users" title={`No designers match “${term}”`} body="Try a name, a username or a skill such as “branding”." />;
  return (
    <>
      <ul className="person-list" aria-label={`Designers matching ${term}`}>
        {items.map((p) => (
          <PersonRow key={p.username} p={p} />
        ))}
      </ul>
      {cursor && (
        <div className="ui-feed-status">
          <button
            type="button"
            className="ui-btn ui-btn--secondary neu-control"
            onClick={async () => {
              const r = await searchDesigners(term, cursor);
              if (r.ok) setMore((m) => ({ items: [...(m?.items ?? []), ...r.data.items], cursor: r.data.nextCursor }));
            }}
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
