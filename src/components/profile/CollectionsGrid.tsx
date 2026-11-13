'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCollection, listCollections } from '@/services/social';
import type { CollectionSummary } from '@/services/contracts';
import { mediaUrl } from '@/lib/media';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, GridSkeleton } from '../ui/States';
import { Icon } from '../Icon';
import { CollectionFormModal } from './CollectionFormModal';
import { useToast } from '../ui/Toast';

export const collectionPath = (username: string, c: { id: number; slug: string }) => `/${username}/collections/${c.id}-${c.slug}`;

/** CollectionCard (mosaic of up to 4 covers; frameless media per showcase rule). */
export function CollectionCard({ c, username }: { c: CollectionSummary; username: string }) {
  return (
    <li className="collection-card">
      <Link href={collectionPath(username, c)} className="collection-card__link">
        <span className={`collection-card__mosaic collection-card__mosaic--${Math.min(c.covers.length, 4)}`} aria-hidden="true">
          {c.covers.slice(0, 4).map((m, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- custom media host
            <img key={i} src={mediaUrl(m.key, 'cover-400')} alt="" loading="lazy" style={{ background: m.dominantColor ?? undefined }} />
          ))}
          {c.covers.length === 0 && <Icon name="grid" />}
        </span>
        <span className="collection-card__name">
          {c.name}
          {c.isPrivate && <Icon name="lock" size={14} label="Private" />}
        </span>
      </Link>
      <p className="t-caption text-secondary">
        {c.shotsCount} shot{c.shotsCount === 1 ? '' : 's'} · {c.designersCount} designer{c.designersCount === 1 ? '' : 's'}
      </p>
    </li>
  );
}

/** SCR-24 Collections tab (FR-56): public collections; the owner also sees private ones and can create. */
export function CollectionsGrid({ username, displayName, isOwn }: { username: string; displayName: string; isOwn: boolean }) {
  const res = useResource(() => listCollections(username), [username]);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const toast = useToast();

  return (
    <section className="tab-section" aria-labelledby="collections-title">
      <div className="row-between">
        <h2 id="collections-title" className="t-h4">
          Collections
        </h2>
        {isOwn && (
          <button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={() => setCreating(true)}>
            <Icon name="plus" /> New collection
          </button>
        )}
      </div>
      {res.status === 'error' ? (
        <ErrorState onRetry={res.reload} />
      ) : res.status === 'loading' && !res.data ? (
        <GridSkeleton count={4} />
      ) : res.data && res.data.length > 0 ? (
        <ul className="collection-grid">
          {res.data.map((c) => (
            <CollectionCard key={c.id} c={c} username={username} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="bookmark"
          title={isOwn ? 'No collections yet' : `${displayName} has no public collections`}
          body={isOwn ? 'Save shots you love into collections. Use the bookmark on any shot, or create one here.' : undefined}
        />
      )}
      {isOwn && (
        <CollectionFormModal
          open={creating}
          onClose={() => setCreating(false)}
          title="New collection"
          submitLabel="Create"
          onSubmit={async (input) => {
            const r = await createCollection(input);
            if (!r.ok) return r;
            toast({ tone: 'success', text: `Created ${r.data.name}.` });
            router.push(collectionPath(username, r.data));
            return r;
          }}
        />
      )}
    </section>
  );
}
