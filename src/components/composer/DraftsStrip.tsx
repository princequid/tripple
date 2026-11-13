'use client';

import Link from 'next/link';
import { myDrafts } from '@/services/composer';
import { isMock } from '@/services/config';
import { timeAgo } from '@/services/reference';
import { useResource } from '@/hooks/useResource';
import { Icon } from '../Icon';

/** SCR-23 owner drafts area on the Work tab: drafts (and, in preview mode, composer-published shots) with Edit. */
export function DraftsStrip() {
  const res = useResource(() => myDrafts(), []);
  if (res.status !== 'ready' || res.data.length === 0) return null;
  return (
    <section className="drafts-strip ui-card ui-card--muted" aria-labelledby="drafts-title">
      <div className="row-between">
        <h2 id="drafts-title" className="t-label">
          Your drafts{isMock('composer') ? ' (saved in this browser)' : ''}
        </h2>
        <Link className="text-link t-body-sm" href="/uploads/new">
          New shot
        </Link>
      </div>
      <ul className="drafts-strip__list">
        {res.data.map((d) => (
          <li key={d.id}>
            <Link className="drafts-strip__item" href={`/shots/${d.id}/edit`}>
              <Icon name={d.status === 'draft' ? 'edit' : 'check'} />
              <span className="drafts-strip__title">{d.title || 'Untitled'}</span>
              <span className="t-caption text-secondary">
                {d.status === 'draft' ? 'Draft' : 'Published'} · {timeAgo(d.updatedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
