'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteService, getService, servicePath } from '@/services/marketplace';
import { formatPrice } from '@/services/reference';
import { mediaUrl } from '@/lib/media';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { ConfirmDialog } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { MessageButton } from '../social/MessageButton';
import { ShareModal } from '../shot/ShareModal';

/** SCR-55 service detail (M-01, BR-84): description, includes, price box; "Request service" opens a message. */
export function ServiceDetailView({ id }: { id: number }) {
  const res = useResource(() => getService(id), [id]);
  const [dialog, setDialog] = useState<'share' | 'delete' | null>(null);
  const router = useRouter();
  const toast = useToast();
  if (res.status === 'error')
    return res.code === 'NOT_FOUND' ? <EmptyState icon="briefcase" title="This service is no longer listed" action={<Link className="ui-btn ui-btn--primary" href="/services">Browse services</Link>} /> : <ErrorState onRetry={res.reload} />;
  if (!res.data) return <ListSkeleton rows={4} />;
  const s = res.data;
  const path = servicePath(s);
  return (
    <article className="service-detail">
      <div className="service-detail__main stack">
        <p className="t-label">
          <Link className="text-link" href={`/services?category=${s.category.slug}`}>
            {s.category.name}
          </Link>
        </p>
        <h1 className="t-h2">{s.title}</h1>
        <Link href={`/${s.seller.username}`} className="cluster comment__author">
          <Avatar name={s.seller.displayName} avatarKey={s.seller.avatarKey} size="md" />
          <span>
            <strong>{s.seller.displayName}</strong>
            {s.sellerLocation && <span className="t-caption text-secondary"> · {s.sellerLocation}</span>}
          </span>
        </Link>
        {s.cover && (
          <figure className="ui-content-block" style={{ ['--shot-placeholder' as string]: s.cover.dominantColor ?? undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- custom media host */}
            <img src={mediaUrl(s.cover.key, 'w1200')} alt={s.cover.alt} width={s.cover.width} height={s.cover.height} />
          </figure>
        )}
        <section className="stack" aria-labelledby="about-svc">
          <h2 id="about-svc" className="t-h4">
            About this service
          </h2>
          <p className="t-body-lg measure">{s.description}</p>
        </section>
        <section className="stack" aria-labelledby="incl">
          <h2 id="incl" className="t-h4">
            What’s included
          </h2>
          <ul className="check-list">
            {s.includes.map((i) => (
              <li key={i}>
                <Icon name="check" strokeWidth={2.25} />
                {i}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <aside className="service-detail__aside">
        <div className="ui-card price-box">
          <p className="t-caption text-secondary">Starting at</p>
          <p className="t-h2">{formatPrice(s.priceCents)}</p>
          <dl className="price-box__facts">
            <div>
              <dt>
                <Icon name="clock" size={16} /> Delivery
              </dt>
              <dd>
                {s.deliveryDays} day{s.deliveryDays === 1 ? '' : 's'}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="edit" size={16} /> Revisions
              </dt>
              <dd>{s.revisions}</dd>
            </div>
          </dl>
          {s.isOwn ? (
            <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
              <Link className="ui-btn ui-btn--primary ui-btn--block" href={`/services/${s.id}/edit`}>
                <Icon name="edit" /> Edit service
              </Link>
              <button type="button" className="ui-btn ui-btn--danger-ghost ui-btn--block" onClick={() => setDialog('delete')}>
                <Icon name="trash" /> Remove listing
              </button>
            </div>
          ) : (
            <MessageButton
              username={s.seller.username}
              displayName={s.seller.displayName}
              label="Request service"
              variant="primary"
              block
              context={{ type: 'service', id: s.id, label: s.title, href: path }}
              prefill={`Hi ${s.seller.displayName.split(' ')[0]}, I’m interested in “${s.title}”. Here’s a little about my project: `}
            />
          )}
          <p className="t-caption text-secondary">Payments aren’t handled on Trippple yet. Agree on the details directly in messages.</p>
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--block" onClick={() => setDialog('share')}>
            <Icon name="share" /> Share
          </button>
        </div>
      </aside>
      <ShareModal open={dialog === 'share'} onClose={() => setDialog(null)} path={path} title={s.title} kind="service" />
      <ConfirmDialog
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        title="Remove this listing?"
        body="Clients will no longer find it. Existing conversations stay in Messages."
        confirmLabel="Remove"
        danger
        onConfirm={async () => {
          const r = await deleteService(s.id);
          setDialog(null);
          if (!r.ok) return toast({ tone: 'error', text: r.message });
          toast({ tone: 'success', text: 'Listing removed.' });
          router.push(`/${s.seller.username}/services`);
        }}
      />
    </article>
  );
}
