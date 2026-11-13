'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collectionShots, deleteCollection, getCollection, updateCollection } from '@/services/social';
import { isMock } from '@/services/config';
import { useResource } from '@/hooks/useResource';
import { timeAgo } from '@/services/reference';
import { EmptyState, ErrorState, GridSkeleton } from '../ui/States';
import { ConfirmDialog } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { ShareModal } from '../shot/ShareModal';
import { ReportDialog } from '../social/ReportDialog';
import { ClientShotGrid } from './ClientShotGrid';
import { CollectionFormModal } from './CollectionFormModal';
import { useSession } from '../providers/AppProviders';

/** SCR-25 collection detail (FR-56, BR-54): curator header, counts, Share; owner edit/delete; shot grid. */
export function CollectionView({ id, username }: { id: number; username: string }) {
  const res = useResource(() => getCollection(id), [id]);
  const [dialog, setDialog] = useState<'edit' | 'delete' | 'share' | 'report' | null>(null);
  const { requireMember } = useSession();
  const router = useRouter();
  const toast = useToast();

  if (res.status === 'error') {
    return res.code === 'NOT_FOUND' ? (
      <EmptyState icon="lock" title="Collection not found" body="It may be private, or it was deleted." action={<Link className="ui-btn ui-btn--primary" href={`/${username}/collections`}>Back to collections</Link>} />
    ) : (
      <ErrorState onRetry={res.reload} />
    );
  }
  if (!res.data) return <GridSkeleton />;
  const c = res.data;
  const path = `/${username}/collections/${c.id}-${c.slug}`;

  return (
    <article className="collection-view">
      <header className="collection-head">
        <p className="t-label text-secondary">
          <Link className="text-link" href={`/${username}/collections`}>
            Collections
          </Link>{' '}
          / {c.isPrivate ? 'Private' : 'Public'}
        </p>
        <h1 className="t-h2">
          {c.name} {c.isPrivate && <Icon name="lock" size={22} label="Private collection" />}
        </h1>
        {c.description && <p className="t-body-lg text-secondary measure">{c.description}</p>}
        <div className="cluster collection-head__meta">
          <Link className="cluster comment__author" href={`/${c.owner.username}`}>
            <Avatar name={c.owner.displayName} avatarKey={c.owner.avatarKey} />
            <span>Curated by {c.owner.displayName}</span>
          </Link>
          <span className="t-body-sm text-secondary">
            {c.shotsCount} shot{c.shotsCount === 1 ? '' : 's'} · {c.designersCount} designer{c.designersCount === 1 ? '' : 's'} · updated {timeAgo(c.updatedAt)}
          </span>
        </div>
        <div className="cluster">
          {!c.isPrivate && (
            <button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={() => setDialog('share')}>
              <Icon name="share" /> Share
            </button>
          )}
          {c.isOwn ? (
            <>
              <button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={() => setDialog('edit')}>
                <Icon name="edit" /> Edit
              </button>
              <button type="button" className="ui-btn ui-btn--danger-ghost" onClick={() => setDialog('delete')}>
                <Icon name="trash" /> Delete
              </button>
            </>
          ) : (
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => requireMember(null, 'report collections') && setDialog('report')}>
              <Icon name="flag" /> Report
            </button>
          )}
        </div>
      </header>
      {c.shots.length === 0 ? (
        <EmptyState icon="bookmark" title="This collection is empty" body={c.isOwn ? 'Use the bookmark on any shot to add it here.' : undefined} action={c.isOwn ? <Link className="ui-btn ui-btn--primary" href="/shots/popular">Explore shots</Link> : undefined} />
      ) : (
        <ClientShotGrid
          initial={c.shots}
          nextCursor={c.shotsNextCursor ?? null}
          load={isMock('collections') ? undefined : (cur) => collectionShots(c.id, cur)}
          label={`Shots in ${c.name}`}
        />
      )}
      <ShareModal open={dialog === 'share'} onClose={() => setDialog(null)} path={path} title={c.name} kind="collection" />
      <ReportDialog open={dialog === 'report'} onClose={() => setDialog(null)} target={{ type: 'collection', id: c.id, label: c.name, href: path }} />
      <CollectionFormModal
        open={dialog === 'edit'}
        onClose={() => setDialog(null)}
        title="Edit collection"
        submitLabel="Save changes"
        initial={{ name: c.name, description: c.description ?? '', isPrivate: c.isPrivate }}
        onSubmit={async (input) => {
          const r = await updateCollection(c.id, input);
          if (r.ok) {
            toast({ tone: 'success', text: 'Collection updated.' });
            await res.reload();
          }
          return r;
        }}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        title={`Delete “${c.name}”?`}
        body="The collection is removed. The shots themselves are not affected."
        confirmLabel="Delete collection"
        danger
        onConfirm={async () => {
          const r = await deleteCollection(c.id);
          setDialog(null);
          if (!r.ok) return toast({ tone: 'error', text: r.message });
          toast({ tone: 'success', text: 'Collection deleted.' });
          router.push(`/${username}/collections`);
        }}
      />
    </article>
  );
}
