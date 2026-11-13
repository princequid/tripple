import type { Metadata } from 'next';
import { ProfileHeader } from '@/components/ProfileHeader';
import { CollectionsGrid } from '@/components/profile/CollectionsGrid';
import { loadProfile } from '../_profile';

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { profile } = await loadProfile((await params).username);
  return { title: `Collections by ${profile.displayName}` };
}

/** /:username/collections — SCR-24 (FR-56). */
export default async function ProfileCollections({ params }: { params: Promise<Params> }) {
  const { profile } = await loadProfile((await params).username);
  return (
    <>
      <ProfileHeader profile={profile} tab="collections" />
      <CollectionsGrid username={profile.username} displayName={profile.displayName} isOwn={profile.isOwn} />
    </>
  );
}
