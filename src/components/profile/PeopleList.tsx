'use client';

import Link from 'next/link';
import { useState } from 'react';
import { listFollows, likedShots } from '@/services/social';
import type { PersonSummary } from '@/services/contracts';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, GridSkeleton, ListSkeleton } from '../ui/States';
import { Avatar } from '../Avatar';
import { FollowButton } from '../social/FollowButton';
import { ClientShotGrid } from './ClientShotGrid';

/** PersonRow (SCR-28, SCR-42): avatar, name, headline/location, follower count, Follow. */
export function PersonRow({ p }: { p: PersonSummary }) {
  return (
    <li className="person-row">
      <Link href={`/${p.username}`} className="person-row__id">
        <Avatar name={p.displayName} avatarKey={p.avatarKey} size="md" />
        <span className="person-row__text">
          <strong>
            {p.displayName} {p.isTeam && <span className="ui-badge ui-badge--support">Team</span>}
          </strong>
          <span className="t-caption text-secondary">{[p.headline, p.location].filter(Boolean).join(' · ') || `@${p.username}`}</span>
        </span>
      </Link>
      <span className="t-caption text-secondary person-row__count">
        {p.followersCount} follower{p.followersCount === 1 ? '' : 's'}
      </span>
      {p.isOwn ? <span className="t-caption text-secondary">You</span> : <FollowButton username={p.username} displayName={p.displayName} initial={p.isFollowing} size="sm" />}
    </li>
  );
}

/** SCR-28 Followers / Following (FR-48): 24 per page with Load more. */
export function PeopleList({ username, displayName, which }: { username: string; displayName: string; which: 'followers' | 'following' }) {
  const res = useResource(() => listFollows(username, which), [username, which]);
  const [extra, setExtra] = useState<PersonSummary[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={6} />;
  const next = cursor === undefined ? res.data.nextCursor : cursor;
  const rows = [...res.data.items, ...extra];
  if (rows.length === 0)
    return <EmptyState icon="users" title={which === 'followers' ? `No followers yet` : `${displayName} isn’t following anyone yet`} body={which === 'followers' ? `When people follow ${displayName}, they’ll show up here.` : undefined} />;
  return (
    <>
      <ul className="person-list" aria-label={which === 'followers' ? `People following ${displayName}` : `People ${displayName} follows`}>
        {rows.map((p) => (
          <PersonRow key={p.username} p={p} />
        ))}
      </ul>
      {next && (
        <div className="ui-feed-status">
          <button
            type="button"
            className="ui-btn ui-btn--secondary neu-control"
            aria-busy={busy || undefined}
            onClick={async () => {
              setBusy(true);
              const r = await listFollows(username, which, next);
              setBusy(false);
              if (r.ok) {
                setExtra((x) => [...x, ...r.data.items]);
                setCursor(r.data.nextCursor);
              }
            }}
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}

/** SCR-26 Liked shots (FR-57): owner only (the page 404s for others). */
export function LikedShots({ username }: { username: string }) {
  const res = useResource(() => likedShots(username), [username]);
  if (res.status === 'error') return <ErrorState onRetry={res.reload} />;
  if (!res.data) return <GridSkeleton />;
  if (res.data.items.length === 0) return <EmptyState icon="heart" title="No liked shots yet" body="Shots you like appear here, newest first. Only you can see this list." action={<Link className="ui-btn ui-btn--primary" href="/shots/popular">Explore shots</Link>} />;
  return <ClientShotGrid initial={res.data.items} nextCursor={res.data.nextCursor} load={(c) => likedShots(username, c)} label="Liked shots" />;
}
