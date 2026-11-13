import type { Metadata } from 'next';
import { ProfileHeader } from '@/components/ProfileHeader';
import { SellerServices } from '@/components/hire/ServiceCard';
import { loadProfile } from '../_profile';

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { profile } = await loadProfile((await params).username);
  return { title: `Services by ${profile.displayName}` };
}

/** /:username/services — SCR-57 (FR-60): the seller's active listings. */
export default async function ProfileServices({ params }: { params: Promise<Params> }) {
  const { profile } = await loadProfile((await params).username);
  return (
    <>
      <ProfileHeader profile={profile} tab="services" />
      <SellerServices username={profile.username} displayName={profile.displayName} isOwn={profile.isOwn} />
    </>
  );
}
