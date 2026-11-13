'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { listNotifications, markNotificationsRead, unreadCounts } from '@/services/inbox';
import type { NotificationDto } from '@/services/contracts';
import { Menu } from '../ui/Menu';
import { Icon } from '../Icon';
import { NotificationText } from '../inbox/NotificationText';

/** OV-08 bell popover (R3, FR-51): unread count badge, latest 5, "Mark all read", "See all". */
export function NotificationsBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationDto[] | null>(null);
  const [failed, setFailed] = useState(false);
  const path = usePathname();

  const refresh = useCallback(async () => {
    const r = await unreadCounts();
    if (r.ok) setCount(r.data.notifications);
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh, path]);

  const load = async () => {
    setFailed(false);
    const r = await listNotifications('all', null, 5);
    if (r.ok) setItems(r.data.items);
    else setFailed(true);
  };

  return (
    <Menu
      label="Notifications"
      kind="dialog"
      panelClassName="bell-panel"
      trigger={(p, open) => (
        <button
          {...p}
          type="button"
          className="ui-icon-btn ui-btn--ghost bell"
          aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
          onClick={() => {
            p.onClick();
            if (!open) void load();
          }}
        >
          <Icon name="bell" />
          {count > 0 && (
            <span className="ui-dot" aria-hidden="true">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
          <div className="cluster" style={{ justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3) 0' }}>
            <strong className="t-label">Notifications</strong>
            {count > 0 && (
              <button
                type="button"
                className="ui-btn ui-btn--ghost bell-markall"
                onClick={async () => {
                  const r = await markNotificationsRead('all');
                  if (r.ok) {
                    setCount(0);
                    setItems((xs) => xs?.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })) ?? null);
                  }
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          {failed ? (
            <p className="t-body-sm" style={{ padding: 'var(--space-3)' }}>
              Couldn’t load notifications.{' '}
              <button type="button" className="text-link link-button" onClick={load}>
                Try again
              </button>
            </p>
          ) : items === null ? (
            <div className="bell-loading" aria-busy="true">
              <span className="ui-spinner" />
            </div>
          ) : items.length === 0 ? (
            <p className="t-body-sm" style={{ padding: 'var(--space-3)' }}>
              You’re all caught up.
            </p>
          ) : (
            <ul className="bell-list">
              {items.map((n) => (
                <li key={n.id} className={n.readAt ? '' : 'is-unread'}>
                  <Link className="ui-menu__item bell-item" href={n.target?.href ?? `/${n.actors[0]?.username ?? ''}`} onClick={close}>
                    <NotificationText n={n} compact />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <hr className="ui-menu__sep" />
          <Link className="ui-menu__item" href="/notifications" onClick={close}>
            See all notifications
          </Link>
        </div>
      )}
    </Menu>
  );
}
