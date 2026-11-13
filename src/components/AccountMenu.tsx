'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { unreadCounts } from '@/services/inbox';
import { Avatar } from './Avatar';
import { Icon, type IconName } from './Icon';
import { Menu } from './ui/Menu';

/**
 * C07 AccountMenu (IA §3.4, R1–R3 entries): View profile · Share work · Liked shots · Notifications · Messages ·
 * Settings · Report queue (staff) · Sign out (POST /api/auth/sign-out). Menu-button pattern via C49 Menu.
 */
export function AccountMenu({ username, displayName, avatarKey, isStaff }: { username: string; displayName: string; avatarKey: string | null; isStaff: boolean }) {
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    void unreadCounts().then((r) => r.ok && setCounts(r.data));
  }, [path]);

  const signOut = async () => {
    setBusy(true);
    await api('/api/auth/sign-out', { method: 'POST', body: '{}' });
    router.push('/');
    router.refresh();
  };

  const items: { href: string; label: string; icon: IconName; count?: number }[] = [
    { href: `/${username}`, label: 'View profile', icon: 'user' },
    { href: '/uploads/new', label: 'Share work', icon: 'upload' },
    { href: `/${username}/likes`, label: 'Liked shots', icon: 'heart' },
    { href: '/notifications', label: 'Notifications', icon: 'bell', count: counts.notifications },
    { href: '/messages', label: 'Messages', icon: 'message', count: counts.messages },
    { href: '/settings/profile', label: 'Settings', icon: 'settings' },
  ];
  if (isStaff) items.push({ href: '/admin/reports', label: 'Report queue', icon: 'flag' });

  return (
    <Menu
      label="Account"
      trigger={(p) => (
        <button {...p} id="account-trigger" className="ui-account-trigger" type="button" aria-label={`Account menu for ${displayName}`}>
          <Avatar name={displayName} avatarKey={avatarKey} size="md" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="ui-menu__identity">
            <strong>{displayName}</strong>
            <small>@{username}</small>
          </div>
          <hr className="ui-menu__sep" />
          {items.map((i) => (
            <Link key={i.href} role="menuitem" className="ui-menu__item" href={i.href} onClick={close}>
              <Icon name={i.icon} />
              {i.label}
              {i.count ? (
                <span className="ui-badge ui-badge--accent menu-count" aria-label={`${i.count} unread`}>
                  {i.count}
                </span>
              ) : null}
            </Link>
          ))}
          <hr className="ui-menu__sep" />
          <button role="menuitem" className="ui-menu__item" type="button" onClick={signOut} aria-busy={busy || undefined}>
            <Icon name="logout" />
            Sign out
          </button>
        </>
      )}
    </Menu>
  );
}
