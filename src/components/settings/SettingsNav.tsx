'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '../Icon';

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: '/settings/profile', label: 'Profile', icon: 'user' },
  { href: '/settings/account', label: 'Account', icon: 'lock' },
  { href: '/settings/sessions', label: 'Sessions', icon: 'device' },
  { href: '/settings/teams', label: 'Teams', icon: 'users' },
  { href: '/settings/jobs', label: 'Jobs', icon: 'briefcase' },
  { href: '/settings/blocked', label: 'Blocked members', icon: 'block' },
];

/** SettingsNav: vertical list ≥ md, horizontal scroll row below (same links, `aria-current`). */
export function SettingsNav() {
  const path = usePathname();
  return (
    <nav className="settings-nav" aria-label="Settings">
      <ul>
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link className="settings-nav__link" href={i.href} aria-current={path === i.href || path.startsWith(`${i.href}/`) ? 'page' : undefined}>
              <Icon name={i.icon} />
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
