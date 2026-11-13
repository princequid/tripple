import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileHeader } from '@/components/ProfileHeader';
import { LikedShots } from '@/components/profile/PeopleList';
import { loadProfile } from '../_profile';

export const metadata: Metadata = { title: 'Liked shots', robots: { index: false } };

/** /:username/likes — SCR-26 (FR-57): owner only; everyone else gets 404 (P-04). */
export default async function ProfileLikes({ params }: { params: Promise<{ username: string }> }) {
  const { profile } = await loadProfile((await params).username);
  if (!profile.isOwn) notFound();
  return (
    <>
      <ProfileHeader profile={profile} tab="likes" />
      <section className="tab-section" aria-labelledby="liked-title">
        <h2 id="liked-title" className="t-h4">
          Liked shots <span className="t-caption text-secondary">· only you can see this</span>
        </h2>
        <LikedShots username={profile.username} />
      </section>
    </>
  );
}
