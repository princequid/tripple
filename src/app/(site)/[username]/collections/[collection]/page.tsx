import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CollectionView } from '@/components/profile/CollectionView';
import { loadProfile } from '../../_profile';

type Params = { username: string; collection: string };

export const metadata: Metadata = { title: 'Collection' };

/** /:username/collections/:id-:slug — SCR-25 (FR-56). Private or unknown → the view shows a not-found state. */
export default async function CollectionPage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const { profile } = await loadProfile(p.username);
  const m = /^(\d{1,12})(?:-.*)?$/.exec(decodeURIComponent(p.collection));
  if (!m) notFound();
  return <CollectionView id={Number(m[1])} username={profile.username} />;
}
