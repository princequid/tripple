'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, loginHref } from '@/lib/api-client';
import { formatCount, formatCountLong } from '@/lib/format';
import { Icon } from './Icon';

/**
 * C20 LikeButton (S-01, BR-45…BR-47). Optimistic: the state flips immediately and rolls back on failure with an
 * announced message. Visitors get a link to sign in that completes the like afterwards (intent, BR-15).
 * Authors get no control (BR-46). Variants: `card` (icon on the hover bar) and `detail` (labelled with count).
 */
type Props = {
  shotId: number;
  title: string;
  liked: boolean | null; // null = visitor
  count: number;
  isOwn: boolean;
  variant: 'card' | 'detail';
};

export function LikeButton({ shotId, title, liked, count, isOwn, variant }: Props) {
  const [state, setState] = useState({ liked: Boolean(liked), count });
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  if (isOwn) return null;

  const returnTo = `${pathname}${search.size ? `?${search.toString()}` : ''}`;
  const cls =
    variant === 'card'
      ? 'ui-icon-btn ui-icon-btn--sm ui-like'
      : 'ui-icon-btn ui-like ui-like--labelled neu-control';
  const label = `Like ${title}`;

  if (liked === null) {
    return (
      <a className={cls} href={loginHref(returnTo, { name: 'like-shot', target: shotId })} aria-label={variant === 'card' ? label : undefined}>
        <Icon name="heart" strokeWidth={2} />
        {variant === 'detail' && (
          <>
            Like <span className="ui-like__count">{formatCount(count)}</span>
          </>
        )}
      </a>
    );
  }

  const toggle = () => {
    const prev = state;
    const next = { liked: !prev.liked, count: Math.max(0, prev.count + (prev.liked ? -1 : 1)) };
    setState(next);
    setMessage('');
    startTransition(async () => {
      const r = await api<{ liked: boolean; likesCount: number }>(`/api/shots/${shotId}/like`, { method: next.liked ? 'PUT' : 'DELETE' });
      if (r.ok) {
        setState({ liked: r.data.liked, count: r.data.likesCount });
        return;
      }
      setState(prev);
      if (r.code === 'UNAUTHENTICATED') return router.push(loginHref(returnTo, { name: 'like-shot', target: shotId }));
      if (r.code === 'ONBOARDING_REQUIRED') return router.push(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`);
      setMessage(r.code === 'RATE_LIMITED' ? `Too many likes. Try again in ${r.retryAfter ?? 60} seconds.` : "Couldn't save your like. Try again.");
    });
  };

  return (
    <>
      <button
        type="button"
        className={cls}
        aria-pressed={state.liked}
        aria-label={variant === 'card' ? label : undefined}
        aria-busy={pending || undefined}
        onClick={toggle}
      >
        <Icon name="heart" strokeWidth={2} />
        {variant === 'detail' && (
          <>
            Like{' '}
            <span className="ui-like__count">
              {formatCount(state.count)}
              <span className="visually-hidden"> ({formatCountLong(state.count)} likes)</span>
            </span>
          </>
        )}
      </button>
      <span role="status" className={message ? 't-caption' : 'visually-hidden'}>
        {message}
      </span>
    </>
  );
}
