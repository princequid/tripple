'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from './providers/AppProviders';
import { AccountMenu } from './AccountMenu';
import { Icon } from './Icon';
import { Menu } from './ui/Menu';
import { HeaderSearch } from './shell/HeaderSearch';
import { MobileDrawer } from './shell/MobileDrawer';
import { NotificationsBell } from './shell/NotificationsBell';
import { CookieSettingsButton } from './shell/CookieConsent';
import { CATEGORY_LINKS, EXPLORE, HIRE, JOBS } from './shell/nav';

/**
 * C03 SiteHeader (SH-01, IA §3.2 R1–R3): brand, search (not on home), Explore ▾, Tags, Jobs ▾, Hire ▾,
 * Share work + bell + account (member) or Log in + Sign up (visitor). Below 1024 px: burger + search icon → drawer.
 */
function NavMenu({ label, links, current }: { label: string; links: readonly { href: string; label: string }[]; current: boolean }) {
  return (
    <Menu
      label={label}
      align="start"
      trigger={(p) => (
        <button {...p} type="button" className="ui-btn ui-btn--ghost ui-nav-link" aria-current={current ? 'true' : undefined}>
          {label}
          <Icon name="chev" className="ui-chevron" />
        </button>
      )}
    >
      {(close) =>
        links.map((l, i) =>
          l.href === '---' ? (
            <hr key={i} className="ui-menu__sep" />
          ) : (
            <Link key={l.href + l.label} role="menuitem" className="ui-menu__item" href={l.href} onClick={close}>
              {l.label}
            </Link>
          ),
        )
      }
    </Menu>
  );
}

export function SiteHeader() {
  const { viewer, isStaff } = useSession();
  const path = usePathname();
  const [drawer, setDrawer] = useState<{ open: boolean; search: boolean }>({ open: false, search: false });
  const burger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setDrawer({ open: false, search: false });
    burger.current?.focus();
  }, []);
  const home = path === '/';

  return (
    <header className="ui-header glass-subtle glass-subtle--md">
      <button
        ref={burger}
        type="button"
        className="ui-icon-btn ui-btn--ghost ui-header__burger"
        aria-label="Open menu"
        aria-expanded={drawer.open}
        aria-controls="mobile-drawer"
        onClick={() => setDrawer({ open: true, search: false })}
      >
        <Icon name="menu" />
      </button>
      <Link className="ui-brand" href="/" aria-label="Trippple home">
        Trippple
      </Link>
      {!home && <HeaderSearch id="header-q" />}
      <nav className="ui-header__nav" aria-label="Primary">
        <NavMenu label="Explore" links={[...EXPLORE, { href: '---', label: '' }, ...CATEGORY_LINKS, { href: '---', label: '' }, { href: '/tags', label: 'All tags' }]} current={path.startsWith('/shots/')} />
        <Link className="ui-btn ui-btn--ghost ui-nav-link" href="/tags" aria-current={path.startsWith('/tags') ? 'page' : undefined}>
          Tags
        </Link>
        <NavMenu label="Jobs" links={JOBS} current={path.startsWith('/jobs')} />
        <NavMenu label="Hire" links={HIRE} current={path.startsWith('/hire') || path.startsWith('/services')} />
      </nav>
      <span className="ui-header__spacer" />
      {!home && (
        <button type="button" className="ui-icon-btn ui-btn--ghost header-search-btn" aria-label="Search" onClick={() => setDrawer({ open: true, search: true })}>
          <Icon name="search" />
        </button>
      )}
      {viewer.kind === 'member' ? (
        <>
          <Link className="ui-btn ui-btn--primary header-share" href="/uploads/new">
            <Icon name="upload" />
            <span>Share work</span>
          </Link>
          <NotificationsBell />
          <AccountMenu username={viewer.username} displayName={viewer.displayName} avatarKey={viewer.avatarKey} isStaff={isStaff} />
        </>
      ) : (
        <>
          <Link className="ui-btn ui-btn--on-glass ui-header__secondary" href={`/login?returnTo=${encodeURIComponent(path)}`}>
            Log in
          </Link>
          <Link className="ui-btn ui-btn--primary" href={`/signup?returnTo=${encodeURIComponent(path)}`}>
            Sign up
          </Link>
        </>
      )}
      <MobileDrawer open={drawer.open} onClose={close} focusSearch={drawer.search} />
    </header>
  );
}

const FOOT = {
  Explore: [
    ['/shots/popular', 'Popular'],
    ['/shots/recent', 'Recent'],
    ['/tags', 'Tags'],
    ['/jobs', 'Jobs'],
  ],
  Hire: [
    ['/hire', 'Find designers'],
    ['/services', 'Services'],
    ['/jobs/new', 'Post a job'],
  ],
  Company: [
    ['/about', 'About'],
    ['/contact', 'Contact'],
    ['/terms', 'Terms'],
    ['/privacy', 'Privacy'],
    ['/cookies', 'Cookies'],
  ],
} as const;

/** C08 SiteFooter (IA §3.5): Explore, Hire, Company/Legal + Cookie settings (R3). */
export function SiteFooter() {
  return (
    <footer className="ui-footer neu-context-bg2">
      <div className="ui-footer__inner">
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-3)' }}>
          <Link className="ui-brand" href="/" aria-label="Trippple home">
            Trippple
          </Link>
          <p className="t-body-sm text-secondary">A home for independent design work.</p>
        </div>
        {Object.entries(FOOT).map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <p className="ui-footer__title">{title}</p>
            <ul>
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link className="ui-footer__link" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
              {title === 'Company' && (
                <li>
                  <CookieSettingsButton />
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>
      <p className="ui-footer__legal">© 2026 Trippple</p>
    </footer>
  );
}
