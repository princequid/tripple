import Link from 'next/link';
import type { ShotCard as ShotCardDto } from '@/modules/shots/types';
import { coverSrcSet, mediaUrl } from '@/lib/media';
import { formatCount, formatCountLong } from '@/lib/format';
import { shotPath } from '@/lib/slug';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { LikeButton } from './LikeButton';
import { SaveButton } from './shot/SavePicker';

/**
 * C19 ShotCard (D-02). Thumbnail carries no effects (A-12 showcase rule); the hover bar is subtle glass with the
 * title and Like (Save from R2, Like from R1; BR-45). "{Author} for {Team}" when team-attributed (BR-59).
 * Rendered on the server for the first page and inside ShotGrid for later pages, so it has no hooks of its own.
 */
export function ShotCard({ shot, priority = false }: { shot: ShotCardDto; priority?: boolean }) {
  const href = shotPath(shot.id, shot.slug);
  const owner = shot.team ?? shot.author;
  return (
    <li className="ui-shot-card">
      <div className="ui-shot-card__media" style={{ ['--shot-placeholder' as string]: shot.cover?.dominantColor ?? undefined }}>
        {shot.cover && (
          // eslint-disable-next-line @next/next/no-img-element -- custom media host + srcset (ADR-010, D-15)
          <img
            src={mediaUrl(shot.cover.key, 'cover-400')}
            srcSet={coverSrcSet(shot.cover.key)}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            width={400}
            height={300}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
        <Link className="ui-shot-card__link" href={href}>
          <span className="visually-hidden">{shot.title}</span>
        </Link>
        <div className="ui-shot-card__bar glass-subtle">
          <span className="ui-shot-card__bar-title">{shot.title}</span>
          <SaveButton shotId={shot.id} title={shot.title} variant="card" />
          <LikeButton shotId={shot.id} title={shot.title} liked={shot.isLiked} count={shot.likesCount} isOwn={shot.isOwn} variant="card" />
        </div>
      </div>
      <div className="ui-shot-card__meta">
        <Link className="ui-shot-card__author" href={`/${owner.username}`}>
          <Avatar name={owner.displayName} avatarKey={owner.avatarKey} />
          <span>{owner.displayName}</span>
        </Link>
        {/* One badge at most on a card (design-system preview C19); the profile shows both. */}
        {owner.isFeaturedStudio ? (
          <span className="ui-badge ui-badge--gold">Featured</span>
        ) : (
          owner.isTeam && <span className="ui-badge ui-badge--support">Team</span>
        )}
        <span className="ui-shot-card__stats">
          <span>
            <Icon name="heart" />
            {formatCount(shot.likesCount)}
            <span className="visually-hidden"> likes ({formatCountLong(shot.likesCount)})</span>
          </span>
          <span>
            <Icon name="eye" />
            {formatCount(shot.viewsCount)}
            <span className="visually-hidden"> views ({formatCountLong(shot.viewsCount)})</span>
          </span>
        </span>
      </div>
    </li>
  );
}
