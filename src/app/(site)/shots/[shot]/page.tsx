import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import * as shots from '@/modules/shots/service';
import * as feed from '@/modules/feed/service';
import * as likes from '@/modules/likes/service';
import { parseShotSegment } from '@/lib/slug';
import { detailSrcSet, mediaUrl } from '@/lib/media';
import { formatCountLong, formatDate } from '@/lib/format';
import { Avatar } from '@/components/Avatar';
import { LikeButton } from '@/components/LikeButton';
import { ShotActions, PrevNext } from '@/components/shot/ShotActions';
import { FollowButton } from '@/components/social/FollowButton';
import { MessageButton } from '@/components/social/MessageButton';
import { ShotCard } from '@/components/ShotCard';
import { ViewBeacon } from '@/components/ViewBeacon';
import { currentViewer, orNotFound } from '../../../_viewer';

type Params = { shot: string };

/** Detail read shared by metadata and page (one service call per request). */
const load = cache(async (segment: string) => {
  const parsed = parseShotSegment(segment);
  if (!parsed) notFound();
  const viewer = await currentViewer();
  const liked = viewer.kind === 'member' ? (await likes.likedAmong(viewer, [parsed.id])).has(parsed.id) : null;
  const shot = await orNotFound(shots.getDetail(parsed.id, viewer, liked));
  return { shot, viewer, segment: parsed };
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { shot } = await load((await params).shot);
  const owner = shot.team ?? shot.author;
  return {
    title: `${shot.title} by ${owner.displayName}`,
    description: shot.description?.slice(0, 160) ?? `${shot.title} by ${owner.displayName} on Trippple.`,
    alternates: { canonical: shot.canonicalPath },
    robots: shot.hidden ? { index: false } : undefined,
    openGraph: shot.cover ? { images: [{ url: mediaUrl(shot.cover.key, 'w1200'), width: 1200, height: 900 }] } : undefined,
  };
}

/** /shots/:id-:slug (SD-01, SD-02, SD-04, SD-06; BR-37, BR-42, BR-43). */
export default async function ShotPage({ params }: { params: Promise<Params> }) {
  const { shot: segment } = await params;
  const { shot, viewer } = await load(segment);
  if (`/shots/${decodeURIComponent(segment)}` !== shot.canonicalPath) permanentRedirect(shot.canonicalPath); // BR-42: 308
  const more = await feed.moreBy(shot, viewer);
  const related = await feed.related(shot, more.map((m) => m.id), viewer);
  const owner = shot.team ?? shot.author;

  return (
    <article className="detail">
      <ViewBeacon shotId={shot.id} />
      {shot.hidden && (
        <div className="ui-alert ui-alert--error" role="status" style={{ marginTop: 'var(--space-6)' }}>
          This shot is hidden from the public (moderation view).
        </div>
      )}
      <header className="ui-detail-header">
        <div>
          <h1 className="ui-detail-header__title">{shot.title}</h1>
          <div className="ui-detail-header__author">
            <Avatar name={shot.author.displayName} avatarKey={shot.author.avatarKey} size="md" />
            <Link href={`/${shot.author.username}`}>{shot.author.displayName}</Link>
            {shot.team && (
              <>
                <span className="text-secondary">for</span>
                <Link href={`/${shot.team.username}`}>{shot.team.displayName}</Link>
              </>
            )}
          </div>
        </div>
        <div className="cluster">
          {!shot.isOwn && <FollowButton username={owner.username} displayName={owner.displayName} initial={shot.isFollowingOwner} size="sm" />}
          {!shot.isOwn && !owner.isTeam && (
            <MessageButton username={owner.username} displayName={owner.displayName} label="Get in touch" context={{ type: 'shot', id: shot.id, label: shot.title, href: shot.canonicalPath }} />
          )}
          <LikeButton shotId={shot.id} title={shot.title} liked={shot.isLiked} count={shot.likesCount} isOwn={shot.isOwn} variant="detail" />
        </div>
      </header>

      <div className="detail__body">
        <div className="detail__media">
          {shot.blocks.map((b) =>
            b.type === 'image' ? (
              <figure key={b.id} className="ui-content-block" style={{ ['--shot-placeholder' as string]: b.media.dominantColor ?? undefined }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- custom media host (ADR-010) */}
                <img
                  src={mediaUrl(b.media.key, 'w1200')}
                  srcSet={detailSrcSet(b.media.key)}
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  width={b.media.width}
                  height={b.media.height}
                  alt={b.media.alt}
                  loading={b.position === 0 ? 'eager' : 'lazy'}
                />
              </figure>
            ) : (
              <p key={b.id} className="t-body-lg detail__text">
                {b.text}
              </p>
            ),
          )}
        </div>
        <div className="ui-action-rail ui-action-rail--floating detail__rail" role="group" aria-label="Shot actions">
          <ShotActions
            shotId={shot.id}
            title={shot.title}
            ownerUsername={shot.author.username}
            canonicalPath={shot.canonicalPath}
            coverUrl={shot.cover ? mediaUrl(shot.cover.key, 'w1200') : null}
            isOwn={shot.isOwn}
            details={{ publishedAt: shot.publishedAt, views: shot.viewsCount, likes: shot.likesCount, category: shot.category, tags: shot.tags }}
          />
        </div>
      </div>

      <section className="detail__facts stack" aria-labelledby="details-title">
        <h2 id="details-title" className="t-h4">
          Details
        </h2>
        {shot.description && <p className="detail__text">{shot.description}</p>}
        <dl className="ui-stat-grid">
          <div>
            <dt>Views</dt>
            <dd>{formatCountLong(shot.viewsCount)}</dd>
          </div>
          <div>
            <dt>Likes</dt>
            <dd>{formatCountLong(shot.likesCount)}</dd>
          </div>
          <div>
            <dt>Posted</dt>
            <dd>{formatDate(shot.publishedAt)}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>
              <Link className="text-link" href={`/shots/popular/${shot.category.slug}`}>
                {shot.category.name}
              </Link>
            </dd>
          </div>
        </dl>
        {shot.palette.length > 0 && (
          <ul className="palette" aria-label="Colour palette">
            {shot.palette.map((hex) => (
              <li key={hex}>
                <span className="palette__swatch" style={{ ['--swatch' as string]: hex }} title={hex} />
                <span className="palette__hex">{hex}</span>
              </li>
            ))}
          </ul>
        )}
        {shot.tags.length > 0 && (
          <ul className="ui-chip-row" aria-label="Shot tags">
            {shot.tags.map((t) => (
              <li key={t.slug}>
                <Link className="ui-chip" href={`/tags/${t.slug}`}>
                  #{t.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PrevNext shotId={shot.id} ownerUsername={shot.author.username} />

      {more.length > 0 && (
        <section className="detail__section stack" aria-labelledby="more-title">
          <div className="cluster" style={{ justifyContent: 'space-between' }}>
            <h2 id="more-title" className="t-h4">
              More by {owner.displayName}
            </h2>
            <Link className="text-link" href={`/${owner.username}`}>
              View profile
            </Link>
          </div>
          <ol className="gallery-grid shot-feed">
            {more.map((s) => (
              <ShotCard key={s.id} shot={s} />
            ))}
          </ol>
        </section>
      )}
      {related.length > 0 && (
        <section className="detail__section stack" aria-labelledby="related-title">
          <h2 id="related-title" className="t-h4">
            You might also like
          </h2>
          <ol className="gallery-grid shot-feed">
            {related.map((s) => (
              <ShotCard key={s.id} shot={s} />
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
