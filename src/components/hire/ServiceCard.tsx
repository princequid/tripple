'use client';

import Link from 'next/link';
import { servicesBy, servicePath } from '@/services/marketplace';
import type { DesignerCard as DesignerCardDto, ServiceSummary } from '@/services/contracts';
import { formatPrice } from '@/services/reference';
import { mediaUrl } from '@/lib/media';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, GridSkeleton } from '../ui/States';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { FollowButton } from '../social/FollowButton';
import { MessageButton } from '../social/MessageButton';

/** ServiceCard (SCR-54): frameless cover, title, seller, "From $X", delivery. */
export function ServiceCard({ s, showSeller = true }: { s: ServiceSummary; showSeller?: boolean }) {
  return (
    <li className="service-card">
      <Link href={servicePath(s)} className="service-card__media" style={{ ['--shot-placeholder' as string]: s.cover?.dominantColor ?? undefined }}>
        {s.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- custom media host
          <img src={mediaUrl(s.cover.key, 'cover-400')} alt="" loading="lazy" />
        ) : (
          <Icon name="briefcase" />
        )}
        <span className="visually-hidden">{s.title}</span>
      </Link>
      <div className="service-card__body">
        {showSeller && (
          <Link href={`/${s.seller.username}`} className="ui-shot-card__author">
            <Avatar name={s.seller.displayName} avatarKey={s.seller.avatarKey} />
            <span>{s.seller.displayName}</span>
          </Link>
        )}
        <Link href={servicePath(s)} className="service-card__title">
          {s.title}
        </Link>
        <p className="service-card__meta">
          <strong>From {formatPrice(s.priceCents)}</strong>
          <span className="text-secondary">
            <Icon name="clock" size={14} /> {s.deliveryDays} day{s.deliveryDays === 1 ? '' : 's'}
          </span>
        </p>
      </div>
    </li>
  );
}

/** DesignerCard (SCR-53): identity, skills, 3 recent shots, Follow + Message (no availability label, D-25d). */
export function DesignerCard({ d }: { d: DesignerCardDto }) {
  return (
    <li className="ui-card designer-card">
      <div className="designer-card__head">
        <Link href={`/${d.username}`} className="person-row__id">
          <Avatar name={d.displayName} avatarKey={d.avatarKey} size="md" />
          <span className="person-row__text">
            <strong>
              {d.displayName} {d.isTeam && <span className="ui-badge ui-badge--support">Team</span>}
            </strong>
            <span className="t-caption text-secondary">{[d.headline, d.location].filter(Boolean).join(' · ')}</span>
          </span>
        </Link>
      </div>
      {d.recentShots.length > 0 && (
        <ul className="designer-card__shots" aria-label={`Recent work by ${d.displayName}`}>
          {d.recentShots.map((s) => (
            <li key={s.id}>
              <Link href={`/shots/${s.id}-${s.slug}`} className="designer-card__shot" style={{ ['--shot-placeholder' as string]: s.cover?.dominantColor ?? undefined }}>
                {s.cover && (
                  // eslint-disable-next-line @next/next/no-img-element -- custom media host
                  <img src={mediaUrl(s.cover.key, 'cover-400')} alt="" loading="lazy" />
                )}
                <span className="visually-hidden">{s.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {d.skills.length > 0 && (
        <ul className="ui-chip-row" aria-label="Skills">
          {d.skills.slice(0, 4).map((k) => (
            <li key={k}>
              <Link className="ui-chip" href={`/hire?skill=${encodeURIComponent(k)}`}>
                {k}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="designer-card__foot">
        <span className="t-body-sm">{d.startingPriceCents !== null ? <>Services from <strong>{formatPrice(d.startingPriceCents)}</strong></> : <span className="text-secondary">{d.followersCount} followers</span>}</span>
        <div className="cluster">
          <FollowButton username={d.username} displayName={d.displayName} initial={d.isFollowing} size="sm" />
          {!d.isTeam && <MessageButton username={d.username} displayName={d.displayName} label="Message" />}
        </div>
      </div>
    </li>
  );
}

/** SCR-57 profile Services tab. */
export function SellerServices({ username, displayName, isOwn }: { username: string; displayName: string; isOwn: boolean }) {
  const res = useResource(() => servicesBy(username), [username]);
  return (
    <section className="tab-section" aria-labelledby="services-title">
      <div className="row-between">
        <h2 id="services-title" className="t-h4">
          Services
        </h2>
        {isOwn && (
          <Link className="ui-btn ui-btn--secondary neu-control" href="/services/new">
            <Icon name="plus" /> New service
          </Link>
        )}
      </div>
      {res.status === 'error' ? (
        <ErrorState onRetry={res.reload} />
      ) : !res.data ? (
        <GridSkeleton count={3} />
      ) : res.data.length === 0 ? (
        <EmptyState icon="briefcase" title={isOwn ? 'You don’t offer any services yet' : `${displayName} doesn’t offer services yet`} action={isOwn ? <Link className="ui-btn ui-btn--primary" href="/services/new">List a service</Link> : undefined} />
      ) : (
        <ul className="service-grid">
          {res.data.map((s) => (
            <ServiceCard key={s.id} s={s} showSeller={false} />
          ))}
        </ul>
      )}
    </section>
  );
}
