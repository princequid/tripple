'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setBlocked } from '@/services/social';
import { servicesBy } from '@/services/marketplace';
import { useSession } from '../providers/AppProviders';
import { FollowButton } from '../social/FollowButton';
import { MessageButton } from '../social/MessageButton';
import { ReportDialog } from '../social/ReportDialog';
import { ShareModal } from '../shot/ShareModal';
import { Menu } from '../ui/Menu';
import { ConfirmDialog } from '../ui/Modal';
import { LinkTabs } from '../ui/Tabs';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';

/** Profile action cluster (SCR-23): owner → Edit profile + Share work; others → Follow, Message, More. */
export function ProfileActions({ username, displayName, isOwn, isTeam, isFollowing, profileId }: { username: string; displayName: string; isOwn: boolean; isTeam: boolean; isFollowing: boolean | null; profileId: number }) {
  const { requireMember } = useSession();
  const [dialog, setDialog] = useState<'report' | 'block' | 'share' | null>(null);
  const [blocked, setBlockedState] = useState(false);
  const toast = useToast();
  const router = useRouter();

  if (isOwn) {
    return (
      <div className="cluster profile-actions">
        <Link className="ui-btn ui-btn--secondary neu-control" href={isTeam ? `/settings/teams/${username}` : '/settings/profile'}>
          <Icon name="edit" /> Edit profile
        </Link>
        <Link className="ui-btn ui-btn--primary" href="/uploads/new">
          <Icon name="upload" /> Share work
        </Link>
      </div>
    );
  }

  return (
    <div className="cluster profile-actions">
      <FollowButton username={username} displayName={displayName} initial={isFollowing} onChange={(_f, confirmedCount) => confirmedCount !== undefined && router.refresh()} />
      {!isTeam && <MessageButton username={username} displayName={displayName} context={{ type: 'profile', id: profileId, label: displayName, href: `/${username}` }} />}
      <Menu
        label="More profile actions"
        trigger={(p) => (
          <button {...p} type="button" className="ui-icon-btn neu-control" aria-label="More profile actions">
            <Icon name="more" />
          </button>
        )}
      >
        {(close) => (
          <>
            <button role="menuitem" type="button" className="ui-menu__item" onClick={() => (close(), setDialog('share'))}>
              <Icon name="share" /> Share profile
            </button>
            <button role="menuitem" type="button" className="ui-menu__item" onClick={() => (close(), requireMember(null, 'report members') && setDialog('report'))}>
              <Icon name="flag" /> Report
            </button>
            {!isTeam && (
              <button
                role="menuitem"
                type="button"
                className="ui-menu__item is-danger"
                onClick={async () => {
                  close();
                  if (!requireMember(null, `block ${displayName}`)) return;
                  if (blocked) {
                    const r = await setBlocked(username, false);
                    if (r.ok) (setBlockedState(false), toast({ tone: 'success', text: `${displayName} is unblocked.` }));
                    return;
                  }
                  setDialog('block');
                }}
              >
                <Icon name="block" /> {blocked ? 'Unblock' : 'Block'}
              </button>
            )}
          </>
        )}
      </Menu>
      <ShareModal open={dialog === 'share'} onClose={() => setDialog(null)} path={`/${username}`} title={displayName} kind="profile" />
      <ReportDialog open={dialog === 'report'} onClose={() => setDialog(null)} target={{ type: 'profile', id: profileId, label: displayName, href: `/${username}` }} />
      <ConfirmDialog
        open={dialog === 'block'}
        onClose={() => setDialog(null)}
        title={`Block ${displayName}?`}
        body={
          <p>
            They won’t be able to follow you, comment on your shots or message you, and any follows between you are removed. They are not told. You can unblock them in{' '}
            <Link className="text-link" href="/settings/blocked">
              Settings
            </Link>
            .
          </p>
        }
        confirmLabel="Block"
        danger
        onConfirm={async () => {
          setDialog(null);
          const r = await setBlocked(username, true);
          if (r.ok) {
            setBlockedState(true);
            toast({ tone: 'success', text: `${displayName} is blocked.`, action: { label: 'Undo', run: () => void setBlocked(username, false).then(() => setBlockedState(false)) } });
          } else toast({ tone: 'error', text: r.message });
        }}
      />
    </div>
  );
}

/** Profile tab row. Services appears only when the member lists services (FR-60). */
export function ProfileTabs({ username, isOwn, isTeam }: { username: string; isOwn: boolean; isTeam: boolean }) {
  const [services, setServices] = useState(0);
  useEffect(() => {
    void servicesBy(username).then((r) => r.ok && setServices(r.data.length));
  }, [username]);
  const items = [
    { href: `/${username}`, label: 'Work' },
    { href: `/${username}/collections`, label: 'Collections' },
    ...(isOwn && !isTeam ? [{ href: `/${username}/likes`, label: 'Liked' }] : []),
    ...(isTeam ? [{ href: `/${username}/members`, label: 'Members' }] : []),
    ...(services > 0 ? [{ href: `/${username}/services`, label: 'Services', count: services }] : []),
    { href: `/${username}/about`, label: 'About' },
  ];
  return <LinkTabs label="Profile sections" items={items} />;
}
