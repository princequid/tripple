'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listComments, neighbours, setCommentsDisabled } from '@/services/social';
import type { ShotNeighbours } from '@/services/contracts';
import { formatCountLong, formatDate } from '@/lib/format';
import { useSession } from '../providers/AppProviders';
import { Menu } from '../ui/Menu';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';
import { CommentsPanel } from './CommentsPanel';
import { SaveButton } from './SavePicker';
import { ShareModal } from './ShareModal';
import { ReportDialog } from '../social/ReportDialog';

/**
 * C21 ShotActionRail v2 (SD-02, SCR-22): Save · Comments (count) · Share (OV-01) · Details (OV-02) · More
 * (Report; owner: Edit shot, turn comments on/off). Like stays the server-rendered LikeButton next to it.
 */
type Props = {
  shotId: number;
  title: string;
  ownerUsername: string;
  canonicalPath: string;
  coverUrl: string | null;
  details: { publishedAt: string; views: number; likes: number; category: { slug: string; name: string }; tags: { name: string; slug: string }[] };
  isOwn: boolean;
};

export function ShotActions({ shotId, title, ownerUsername, canonicalPath, coverUrl, details, isOwn }: Props) {
  const { requireMember } = useSession();
  const [panel, setPanel] = useState<'comments' | 'share' | 'details' | 'report' | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [disabled, setDisabled] = useState(false);
  const toast = useToast();

  useEffect(() => {
    void listComments(shotId, ownerUsername).then((r) => {
      if (r.ok) {
        setCount(r.data.total);
        setDisabled(r.data.disabled);
      }
    });
  }, [shotId, ownerUsername]);

  useEffect(() => {
    const open = () => setPanel('comments');
    window.addEventListener('trippple:open-comments', open);
    return () => window.removeEventListener('trippple:open-comments', open);
  }, []);

  const close = () => setPanel(null);
  return (
    <>
      <SaveButton shotId={shotId} title={title} />
      <button type="button" className="ui-icon-btn neu-control rail-count" aria-label={`Comments${count !== null ? ` (${count})` : ''}`} aria-expanded={panel === 'comments'} onClick={() => setPanel('comments')}>
        <Icon name="message" />
        {count ? <span className="rail-count__n">{count}</span> : null}
      </button>
      <button type="button" className="ui-icon-btn neu-control" aria-label="Share" aria-haspopup="dialog" onClick={() => setPanel('share')}>
        <Icon name="share" />
      </button>
      <button type="button" className="ui-icon-btn neu-control" aria-label="Shot details" aria-haspopup="dialog" onClick={() => setPanel('details')}>
        <Icon name="info" />
      </button>
      <Menu
        label="More actions"
        trigger={(p) => (
          <button {...p} type="button" className="ui-icon-btn neu-control" aria-label="More actions">
            <Icon name="more" />
          </button>
        )}
      >
        {(closeMenu) => (
          <>
            {isOwn && (
              <>
                <Link role="menuitem" className="ui-menu__item" href={`/shots/${shotId}/edit`} onClick={closeMenu}>
                  <Icon name="edit" /> Edit shot
                </Link>
                <button
                  role="menuitem"
                  type="button"
                  className="ui-menu__item"
                  onClick={async () => {
                    closeMenu();
                    const r = await setCommentsDisabled(shotId, !disabled);
                    if (r.ok) {
                      setDisabled(r.data.disabled);
                      toast({ tone: 'success', text: r.data.disabled ? 'Comments turned off.' : 'Comments turned on.' });
                    } else toast({ tone: 'error', text: r.message });
                  }}
                >
                  <Icon name="message" /> {disabled ? 'Turn comments on' : 'Turn comments off'}
                </button>
              </>
            )}
            {!isOwn && (
              <button role="menuitem" type="button" className="ui-menu__item" onClick={() => (closeMenu(), requireMember(null, 'report shots') && setPanel('report'))}>
                <Icon name="flag" /> Report shot
              </button>
            )}
            <button
              role="menuitem"
              type="button"
              className="ui-menu__item"
              onClick={async () => {
                closeMenu();
                try {
                  await navigator.clipboard.writeText(new URL(canonicalPath, location.origin).toString());
                  toast({ tone: 'success', text: 'Link copied.' });
                } catch {
                  setPanel('share');
                }
              }}
            >
              <Icon name="link" /> Copy link
            </button>
          </>
        )}
      </Menu>

      <CommentsPanel open={panel === 'comments'} onClose={close} shotId={shotId} owner={ownerUsername} title={title} onCount={setCount} />
      <ShareModal open={panel === 'share'} onClose={close} path={canonicalPath} title={title} image={coverUrl} />
      <ReportDialog open={panel === 'report'} onClose={close} target={{ type: 'shot', id: shotId, label: title, href: canonicalPath }} />
      <Modal open={panel === 'details'} onClose={close} title="Shot details" description={title} size="sm">
        <dl className="ui-stat-grid">
          <div>
            <dt>Posted</dt>
            <dd>{formatDate(details.publishedAt)}</dd>
          </div>
          <div>
            <dt>Views</dt>
            <dd>{formatCountLong(details.views)}</dd>
          </div>
          <div>
            <dt>Likes</dt>
            <dd>{formatCountLong(details.likes)}</dd>
          </div>
          <div>
            <dt>Comments</dt>
            <dd>{count ?? '—'}</dd>
          </div>
        </dl>
        <p className="t-body-sm">
          Category:{' '}
          <Link className="text-link" href={`/shots/popular/${details.category.slug}`} onClick={close}>
            {details.category.name}
          </Link>
        </p>
        {details.tags.length > 0 && (
          <ul className="ui-chip-row" aria-label="Tags">
            {details.tags.map((t) => (
              <li key={t.slug}>
                <Link className="ui-chip" href={`/tags/${t.slug}`} onClick={close}>
                  #{t.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}

/** SD-05 previous/next shot by the same owner (keyboard: ← / → when focus is not in a field). */
export function PrevNext({ shotId, ownerUsername }: { shotId: number; ownerUsername: string }) {
  const [n, setN] = useState<ShotNeighbours | null>(null);
  useEffect(() => {
    void neighbours(shotId, ownerUsername).then((r) => r.ok && setN(r.data));
  }, [shotId, ownerUsername]);
  useEffect(() => {
    if (!n) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable], [role="dialog"]') || e.altKey || e.metaKey || e.ctrlKey) return;
      const to = e.key === 'ArrowLeft' ? n.prev : e.key === 'ArrowRight' ? n.next : null;
      if (to) window.location.assign(`/shots/${to.id}-${to.slug}`);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [n]);
  if (!n || (!n.prev && !n.next)) return null;
  return (
    <nav className="prevnext" aria-label="More shots by this designer">
      {n.prev ? (
        <Link className="ui-btn ui-btn--secondary neu-control prevnext__link" href={`/shots/${n.prev.id}-${n.prev.slug}`} rel="prev">
          <Icon name="chevLeft" />
          <span className="prevnext__label">
            <span className="t-caption text-secondary">Previous</span>
            <span className="prevnext__title">{n.prev.title}</span>
          </span>
        </Link>
      ) : (
        <span />
      )}
      {n.next && (
        <Link className="ui-btn ui-btn--secondary neu-control prevnext__link prevnext__link--next" href={`/shots/${n.next.id}-${n.next.slug}`} rel="next">
          <span className="prevnext__label">
            <span className="t-caption text-secondary">Next</span>
            <span className="prevnext__title">{n.next.title}</span>
          </span>
          <Icon name="chevRight" />
        </Link>
      )}
    </nav>
  );
}
