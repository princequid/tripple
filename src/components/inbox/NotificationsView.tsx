'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { listNotifications, markNotificationsRead } from '@/services/inbox';
import type { NotificationDto } from '@/services/contracts';
import { mediaUrl } from '@/lib/media';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { useToast } from '../ui/Toast';
import { NotificationText } from './NotificationText';

/** SCR-50 notifications (S-05, FR-51, BR-83): All / Unread, mark one (on open) or all read, Load more. */
export function NotificationsView() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const res = useResource(() => listNotifications(filter), [filter]);
  const [extra, setExtra] = useState<{ items: NotificationDto[]; cursor: string | null } | null>(null);
  const router = useRouter();
  const toast = useToast();
  const items = [...(res.data?.items ?? []), ...(extra?.items ?? [])];
  const cursor = extra ? extra.cursor : (res.data?.nextCursor ?? null);
  const unread = items.filter((n) => !n.readAt).length;

  const open = async (n: NotificationDto) => {
    if (!n.readAt) {
      res.mutate((d) => ({ ...d, items: d.items.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) }));
      void markNotificationsRead([n.id]);
    }
    router.push(n.target?.href ?? `/${n.actors[0]?.username ?? ''}`);
  };

  return (
    <section className="stack" aria-labelledby="notif-title">
      <div className="row-between">
        <div className="ui-segmented" role="radiogroup" aria-label="Show">
          {(['all', 'unread'] as const).map((f) => (
            <button key={f} type="button" role="radio" aria-checked={filter === f} className="ui-segmented__item" onClick={() => (setFilter(f), setExtra(null))}>
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ui-btn ui-btn--secondary neu-control"
          disabled={unread === 0}
          onClick={async () => {
            const r = await markNotificationsRead('all');
            if (!r.ok) return toast({ tone: 'error', text: r.message });
            toast({ tone: 'success', text: 'All notifications marked as read.' });
            await res.reload();
            router.refresh();
          }}
        >
          Mark all as read
        </button>
      </div>
      <h2 id="notif-title" className="visually-hidden">
        {filter === 'all' ? 'All notifications' : 'Unread notifications'}
      </h2>
      {res.status === 'error' ? (
        <ErrorState onRetry={res.reload} />
      ) : !res.data ? (
        <ListSkeleton rows={6} />
      ) : items.length === 0 ? (
        <EmptyState icon="bell" title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'} body="Likes, comments, follows and saves on your work will appear here." />
      ) : (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id} className={`notif-row${n.readAt ? '' : ' is-unread'}`}>
              <button type="button" className="notif-row__btn" onClick={() => open(n)}>
                <NotificationText n={n} />
                {n.target?.cover && (
                  // eslint-disable-next-line @next/next/no-img-element -- custom media host
                  <img className="notif-row__thumb" src={mediaUrl(n.target.cover.key, 'cover-400')} alt="" style={{ background: n.target.cover.dominantColor ?? undefined }} />
                )}
              </button>
              {n.type === 'team-invite' && (
                <Link className="ui-btn ui-btn--secondary neu-control ui-btn--sm" href="/settings/teams">
                  Review
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <div className="ui-feed-status">
          <button
            type="button"
            className="ui-btn ui-btn--secondary neu-control"
            onClick={async () => {
              const r = await listNotifications(filter, cursor);
              if (r.ok) setExtra((x) => ({ items: [...(x?.items ?? []), ...r.data.items], cursor: r.data.nextCursor }));
            }}
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}
