'use client';

import { useEffect, useState } from 'react';
import { setFollow } from '@/services/social';
import { useSession } from '../providers/AppProviders';
import { useToast } from '../ui/Toast';
import { Icon } from '../Icon';

/**
 * FollowButton (S-03, BR-56). Optimistic with rollback; visitors get the auth gate (`follow-user`); hidden for the
 * viewer's own profile. `onChange(following)` fires optimistically; `onChange(following, count)` after the server
 * confirms (only then should a caller refresh server-rendered counts, or it races the pending request).
 */
export function FollowButton({
  username,
  displayName,
  initial,
  size = 'md',
  onChange,
}: {
  username: string;
  displayName: string;
  initial: boolean | null;
  size?: 'sm' | 'md';
  onChange?: (following: boolean, followersCount?: number) => void;
}) {
  const { viewer, requireMember } = useSession();
  const [following, setFollowing] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    setFollowing(Boolean(initial));
  }, [initial]);

  if (viewer.kind === 'member' && viewer.username === username) return null;

  const toggle = async () => {
    if (!requireMember('follow-user', `follow ${displayName}`, username)) return;
    const next = !following;
    setFollowing(next);
    onChange?.(next);
    setBusy(true);
    const r = await setFollow(username, next);
    setBusy(false);
    if (r.ok) {
      onChange?.(r.data.following, r.data.followersCount);
      return;
    }
    setFollowing(!next);
    onChange?.(!next);
    toast({ tone: 'error', text: r.code === 'RATE_LIMITED' ? 'Too many follows. Try again in a minute.' : r.message || 'Couldn’t update follow. Try again.' });
  };

  return (
    <button
      type="button"
      className={`ui-btn ${following ? 'ui-btn--secondary neu-control' : 'ui-btn--primary'} ${size === 'sm' ? 'ui-btn--sm' : ''}`}
      aria-pressed={following}
      aria-busy={busy || undefined}
      aria-label={`${following ? 'Following' : 'Follow'} ${displayName}`}
      onClick={toggle}
      data-testid="follow-button"
    >
      {following ? <Icon name="check" /> : <Icon name="plus" />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
