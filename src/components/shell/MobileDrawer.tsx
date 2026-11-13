'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { api } from '@/lib/api-client';
import { useSession } from '../providers/AppProviders';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { HeaderSearch } from './HeaderSearch';
import { CATEGORY_LINKS, EXPLORE, HIRE, JOBS, LEGAL } from './nav';

/**
 * C06 MobileNavDrawer (SH-03, IA §3.3): panel glass over the scrim, below 1024 px. Search with type switch,
 * Explore (open by default), Tags, Jobs and Hire accordions, account block, compact legal links.
 * Closes on route change, Escape, the scrim and the close button; focus returns to the burger.
 */
export function MobileDrawer({ open, onClose, focusSearch }: { open: boolean; onClose: () => void; focusSearch: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const { viewer, isStaff } = useSession();
  const [sections, setSections] = useState({ explore: true, jobs: false, hire: false });
  useFocusTrap(open, ref);

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close on navigation only
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    if (focusSearch) setTimeout(() => ref.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, focusSearch]);

  if (!open) return null;
  const cur = (href: string) => (path === href ? 'page' : undefined);
  const Section = ({ id, title, links }: { id: keyof typeof sections; title: string; links: readonly { href: string; label: string }[] }) => (
    <li>
      <button type="button" className="ui-drawer__link" aria-expanded={sections[id]} aria-controls={`drawer-${id}`} onClick={() => setSections((s) => ({ ...s, [id]: !s[id] }))}>
        {title}
        <Icon name="chev" className="ui-chevron" />
      </button>
      {sections[id] && (
        <ul id={`drawer-${id}`} className="ui-drawer__list ui-drawer__sub">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <Link className="ui-drawer__link" href={l.href} aria-current={cur(l.href)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );

  return createPortal(
    <>
      <div className="glass-scrim" aria-hidden="true" onClick={onClose} />
      <div ref={ref} id="mobile-drawer" className="ui-drawer glass-panel glass-enter-drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="ui-drawer__head">
          <Link className="ui-brand" href="/" aria-label="Trippple home">
            Trippple
          </Link>
          <button type="button" className="ui-icon-btn ui-btn--ghost" aria-label="Close menu" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <HeaderSearch id="drawer-q" variant="drawer" onNavigate={onClose} />
        <nav aria-label="Mobile">
          <ul className="ui-drawer__list">
            <Section id="explore" title="Explore" links={[...EXPLORE, ...CATEGORY_LINKS]} />
            <li>
              <Link className="ui-drawer__link" href="/tags" aria-current={cur('/tags')}>
                Tags
              </Link>
            </li>
            <Section id="jobs" title="Jobs" links={JOBS} />
            <Section id="hire" title="Hire" links={HIRE} />
          </ul>
        </nav>
        <div className="ui-drawer__actions">
          {viewer.kind === 'member' ? (
            <>
              <div className="cluster" style={{ ['--cluster-gap' as string]: 'var(--space-3)' }}>
                <Avatar name={viewer.displayName} avatarKey={viewer.avatarKey} size="md" />
                <div>
                  <strong className="t-label">{viewer.displayName}</strong>
                  <p className="t-caption">@{viewer.username}</p>
                </div>
              </div>
              <Link className="ui-btn ui-btn--primary ui-btn--block" href="/uploads/new">
                <Icon name="upload" /> Share work
              </Link>
              <ul className="ui-drawer__list">
                {[
                  [`/${viewer.username}`, 'View profile'],
                  [`/${viewer.username}/likes`, 'Liked shots'],
                  ['/notifications', 'Notifications'],
                  ['/messages', 'Messages'],
                  ['/settings/profile', 'Settings'],
                  ...(isStaff ? [['/admin/reports', 'Report queue']] : []),
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link className="ui-drawer__link" href={href!} aria-current={cur(href!)}>
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="ui-drawer__link"
                    onClick={async () => {
                      await api('/api/auth/sign-out', { method: 'POST', body: '{}' });
                      window.location.assign('/');
                    }}
                  >
                    Sign out
                  </button>
                </li>
              </ul>
            </>
          ) : (
            <>
              <Link className="ui-btn ui-btn--primary ui-btn--block" href={`/signup?returnTo=${encodeURIComponent(path)}`}>
                Sign up
              </Link>
              <Link className="ui-btn ui-btn--secondary neu-control ui-btn--block" href={`/login?returnTo=${encodeURIComponent(path)}`}>
                Log in
              </Link>
            </>
          )}
        </div>
        <ul className="drawer-legal" aria-label="Legal">
          {LEGAL.map((l) => (
            <li key={l.href}>
              <Link className="ui-footer__link" href={l.href}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>,
    document.body,
  );
}
