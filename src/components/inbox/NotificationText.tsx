import type { NotificationDto } from '@/services/contracts';
import { timeAgo } from '@/services/reference';
import { Avatar } from '../Avatar';

/** One notification sentence (BR-83 types; grouped likes show "A, B and 2 others"). */
const VERB: Record<NotificationDto['type'], string> = {
  like: 'liked',
  comment: 'commented on',
  reply: 'replied to your comment on',
  follow: 'started following you',
  save: 'saved',
  'team-invite': 'invited you to join',
};

export function actorsText(n: NotificationDto) {
  const names = n.actors.map((a) => a.displayName);
  if (names.length <= 2) return names.join(' and ');
  return `${names[0]}, ${names[1]} and ${names.length - 2} other${names.length - 2 === 1 ? '' : 's'}`;
}

export function NotificationText({ n, compact = false }: { n: NotificationDto; compact?: boolean }) {
  const first = n.actors[0];
  return (
    <span className="notif">
      {first && <Avatar name={first.displayName} avatarKey={first.avatarKey} size={compact ? 'xs' : 'md'} />}
      <span className="notif__text">
        <strong>{actorsText(n)}</strong> {VERB[n.type]}
        {n.target && n.type !== 'follow' && <> <strong>{n.target.label}</strong></>}
        <span className="notif__time">
          {' · '}
          <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
          {!n.readAt && <span className="visually-hidden"> (unread)</span>}
        </span>
      </span>
      {!n.readAt && <span className="notif__dot" aria-hidden="true" />}
    </span>
  );
}
