'use client';

import Link from 'next/link';
import { TrippleMark } from './brand/TrippleMark';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShotCard as ShotCardDto } from '@/modules/shots/types';
import { mediaUrl } from '@/lib/media';
import { shotPath } from '@/lib/slug';
import { usePathname } from 'next/navigation';
import { useSession } from './providers/AppProviders';
import { AccountMenu } from './AccountMenu';
import { Icon } from './Icon';
import { Menu } from './ui/Menu';
import { HeaderSearch } from './shell/HeaderSearch';
import { MobileDrawer } from './shell/MobileDrawer';
import { NotificationsBell } from './shell/NotificationsBell';
import { CookieSettingsButton } from './shell/CookieConsent';
import { CATEGORY_LINKS, COMMUNITY, EXPLORE, INSPIRATION, RESOURCES } from './shell/nav';

/**
 * C03 SiteHeader v3 (A-27): a floating glass pill (burger, wordmark, Explore ▾ Inspiration ▾ Resources ▾
 * Community ▾) and a separate tools cluster (search, Share work + bell + account, or Log in + Sign up).
 * The four menus map onto the reverse-engineered destinations (IA §3.2): feeds, tags, jobs/help, people.
 * Below 1024 px: burger + search icon → drawer.
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

  const explore = home || path.startsWith('/shots/');
  return (
    <header className="ui-header site-header">
      <div className="site-header__bar glass-subtle glass-subtle--md">
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
          <TrippleMark className="ui-brand__mark" />
          Trippple
        </Link>
        <nav className="ui-header__nav" aria-label="Primary">
          <NavMenu label="Explore" links={[...EXPLORE, { href: '---', label: '' }, ...CATEGORY_LINKS, { href: '---', label: '' }, { href: '/tags', label: 'All tags' }]} current={explore} />
          <NavMenu label="Inspiration" links={INSPIRATION} current={path.startsWith('/tags')} />
          <NavMenu label="Resources" links={RESOURCES} current={path.startsWith('/jobs') || path === '/about' || path === '/contact'} />
          <NavMenu label="Community" links={COMMUNITY} current={path.startsWith('/hire') || path.startsWith('/services') || path.startsWith('/teams')} />
        </nav>
      </div>
      <span className="ui-header__spacer" />
      <div className="site-header__tools">
        {!home && <HeaderSearch id="header-q" />}
        <button
          type="button"
          className={`ui-icon-btn neu-control site-header__round header-search-btn${home ? ' header-search-btn--always' : ''}`}
          aria-label="Search"
          onClick={() => setDrawer({ open: true, search: true })}
        >
          <Icon name="search" />
        </button>
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
            <Link className="ui-btn neu-control ui-header__secondary" href={`/login?returnTo=${encodeURIComponent(path)}`}>
              Log in
            </Link>
            <Link className="ui-btn ui-btn--primary" href={`/signup?returnTo=${encodeURIComponent(path)}`}>
              Sign up
            </Link>
          </>
        )}
      </div>
      <MobileDrawer open={drawer.open} onClose={close} focusSearch={drawer.search} />
    </header>
  );
}

/** Footer link groups mirror the header (A-27): same names, same existing destinations. */
const FOOT = {
  Explore: [
    ['/shots/popular', 'Popular shots'],
    ['/shots/recent', 'Recent shots'],
    ['/tags', 'All tags'],
  ],
  Community: [
    ['/hire', 'Find designers'],
    ['/services', 'Browse services'],
    ['/teams/new', 'Create a team'],
  ],
  Resources: [
    ['/jobs', 'Job board'],
    ['/jobs/new', 'Post a job (free)'],
  ],
  Company: [
    ['/about', 'About'],
    ['/contact', 'Contact'],
  ],
} as const;
const LEGAL_LINKS = [
  ['/terms', 'Terms'],
  ['/privacy', 'Privacy'],
  ['/cookies', 'Cookies'],
] as const;

/** Recently shared work for the footer reel (public feed endpoint; hidden if it fails). */
function useReel() {
  const [shots, setShots] = useState<ShotCardDto[]>([]);
  useEffect(() => {
    let live = true;
    fetch('/api/shots?sort=recent&limit=14', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { data?: ShotCardDto[] } | null) => live && setShots((b?.data ?? []).filter((x) => x.cover)))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return shots;
}

/**
 * C08 SiteFooter v3 (A-27). A deep-navy stage that closes every page:
 * 1. a call to action (Share your work / Find designers),
 * 2. a slow reel of recently shared shots (pauses on hover; static under reduced motion),
 * 3. link groups matching the header, the brand lockup and "Back to top",
 * 4. an oversized wordmark (decorative) and the legal row with Cookie settings (R3).
 */
export function SiteFooter() {
  const reel = useReel();
  const { viewer } = useSession();
  const shareHref = viewer.kind === 'member' ? '/uploads/new' : '/signup?returnTo=%2Fuploads%2Fnew';
  return (
    <footer className="ui-footer site-footer">
      <section className="site-footer__cta" aria-labelledby="footer-cta">
        <div>
          <h2 id="footer-cta" className="site-footer__headline">
            Share what you&apos;re <span>making next.</span>
          </h2>
        </div>
        <div className="site-footer__actions">
          <Link className="ui-btn ui-btn--primary ui-btn--lg" href={shareHref}>
            <Icon name="upload" />
            Share your work
          </Link>
          <Link className="ui-btn ui-btn--lg site-footer__ghost" href="/hire">
            Find designers
          </Link>
        </div>
      </section>

      {reel.length > 0 && (
        <div className="site-footer__reel">
          <ul className="site-footer__track" aria-label="Recently shared">
            {[...reel, ...reel].map((s, i) => (
              <li key={`${s.id}-${i}`} aria-hidden={i >= reel.length || undefined}>
                <Link href={shotPath(s.id, s.slug)} tabIndex={i >= reel.length ? -1 : undefined} data-tip={s.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- custom media host (ADR-010) */}
                  <img src={mediaUrl(s.cover!.key, 'cover-400')} width={400} height={300} alt={i >= reel.length ? '' : s.title} loading="lazy" decoding="async" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="site-footer__grid">
        <div className="site-footer__brand">
          <Link className="ui-brand" href="/" aria-label="Trippple home">
            <TrippleMark className="ui-brand__mark" />
            Trippple
          </Link>
          <p>A home for independent design work: interfaces, identities, illustration and motion.</p>
          <a className="site-footer__top" href="#main">
            <Icon name="chev" />
            Back to top
          </a>
        </div>
        {Object.entries(FOOT).map(([title, links]) => (
          <nav key={title} aria-label={title} className="site-footer__col">
            <p className="site-footer__title">{title}</p>
            <ul>
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link className="site-footer__link" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p className="site-footer__word" aria-hidden="true">
        Trippple
      </p>

      <div className="site-footer__bottom">
        <p>© 2026 Trippple. Every shot belongs to the designer who made it.</p>
        <ul aria-label="Legal">
          {LEGAL_LINKS.map(([href, label]) => (
            <li key={href}>
              <Link className="site-footer__link" href={href}>
                {label}
              </Link>
            </li>
          ))}
          <li>
            <CookieSettingsButton />
          </li>
        </ul>
      </div>
    </footer>
  );
}
