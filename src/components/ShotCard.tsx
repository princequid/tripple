import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { ShotCard as ShotCardDto } from '@/modules/shots/types';
import { coverSrcSet, mediaUrl } from '@/lib/media';
import { formatCount, formatCountLong } from '@/lib/format';
import { shotPath } from '@/lib/slug';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { LikeButton } from './LikeButton';
import { SaveButton } from './shot/SavePicker';

/** Shape families derived from the artwork's intrinsic aspect ratio (width / height). */
export type CardShape = 'tall' | 'portrait' | 'square' | 'landscape' | 'wide';
export const shapeOf = (ratio: number): CardShape =>
  ratio >= 1.9 ? 'wide' : ratio >= 1.15 ? 'landscape' : ratio > 0.87 ? 'square' : ratio > 0.7 ? 'portrait' : 'tall';
/** Extreme ratios are clamped so a 1:4 scroll shot cannot fill a column; only clamped art is cropped (from the top). */
export const RATIO_MIN = 0.56;
export const RATIO_MAX = 2.4;
export const cardRatio = (shot: ShotCardDto) => {
  const w = shot.cover?.width || 4;
  const h = shot.cover?.height || 3;
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, w / h));
};
/** Below this intrinsic width the artwork is shown at its natural size on a soft well instead of being stretched. */
const SMALL_PX = 480;

/**
 * C19 ShotCard v3 (A-27): a tactile neumorphic card whose media box takes the artwork's own aspect ratio.
 * - `standard` (masonry): full image, never cropped unless its ratio is clamped; Save always visible, Like on hover.
 * - `compact` (related rows): uniform 4:3 cover crop and a single meta line.
 * "{Author} for {Team}" attribution shows the team (BR-59). One badge at most on a card.
 * No hooks, so it renders on the server (first page) and inside client grids (later pages).
 */
export function ShotCard({
  shot,
  priority = false,
  variant = 'standard',
  as: Tag = 'li',
}: {
  shot: ShotCardDto;
  priority?: boolean;
  variant?: 'standard' | 'compact';
  as?: 'li' | 'div';
}) {
  const href = shotPath(shot.id, shot.slug);
  const owner = shot.team ?? shot.author;
  const compact = variant === 'compact';
  const cover = shot.cover;
  const ratio = cardRatio(shot);
  const natural = cover ? cover.width / cover.height : ratio;
  const clamped = Math.abs(natural - ratio) > 0.01;
  const small = !compact && !!cover && cover.width < SMALL_PX;
  const mediaStyle = {
    ['--shot-placeholder' as string]: cover?.dominantColor ?? undefined,
    ...(compact ? {} : { aspectRatio: small ? undefined : `${ratio}` }),
  } as CSSProperties;

  return (
    <Tag
      className="ui-shot-card"
      role={Tag === 'div' ? 'listitem' : undefined}
      data-variant={variant}
      data-shape={compact ? 'landscape' : shapeOf(natural)}
    >
      <div className={`ui-shot-card__media${small ? ' ui-shot-card__media--small' : ''}${clamped ? ' ui-shot-card__media--clamped' : ''}`} style={mediaStyle}>
        {cover &&
          (compact ? (
            // eslint-disable-next-line @next/next/no-img-element -- custom media host + srcset (ADR-010, D-15)
            <img
              src={mediaUrl(cover.key, 'cover-400')}
              srcSet={coverSrcSet(cover.key)}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
              width={400}
              height={300}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- custom media host + srcset (ADR-010, D-15)
            <img
              src={mediaUrl(cover.key, 'w800')}
              srcSet={`${mediaUrl(cover.key, 'w800')} 800w, ${mediaUrl(cover.key, 'w1200')} 1200w`}
              sizes="(min-width: 1100px) 25vw, (min-width: 760px) 33vw, (min-width: 480px) 50vw, 100vw"
              width={cover.width}
              height={cover.height}
              style={small ? { maxWidth: cover.width } : undefined}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              decoding="async"
            />
          ))}
        <Link className="ui-shot-card__link" href={href} tabIndex={-1} aria-hidden="true" />
        <div className="ui-shot-card__actions">
          <SaveButton shotId={shot.id} title={shot.title} variant="card" />
          <LikeButton shotId={shot.id} title={shot.title} liked={shot.isLiked} count={shot.likesCount} isOwn={shot.isOwn} variant="card" />
        </div>
      </div>
      <div className="ui-shot-card__meta">
        <Link className="ui-shot-card__avatar" href={`/${owner.username}`} tabIndex={-1} aria-hidden="true">
          <Avatar name={owner.displayName} avatarKey={owner.avatarKey} size={compact ? 'xs' : 'md'} />
        </Link>
        <div className="ui-shot-card__who">
          <span className="ui-shot-card__byline">
            <Link className="ui-shot-card__author" href={`/${owner.username}`}>
              {owner.displayName}
            </Link>
            {owner.isFeaturedStudio ? (
              <span className="ui-badge ui-badge--gold">Featured</span>
            ) : (
              owner.isTeam && <span className="ui-badge ui-badge--support">Team</span>
            )}
          </span>
          <Link className="ui-shot-card__bar-title" href={href}>
            {shot.title}
          </Link>
        </div>
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
    </Tag>
  );
}
