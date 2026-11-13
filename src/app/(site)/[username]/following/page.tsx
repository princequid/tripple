import type { Metadata } from 'next';
import { ProfileHeader } from '@/components/ProfileHeader';
import { PeopleList } from '@/components/profile/PeopleList';
import { loadProfile } from '../_profile';

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { profile } = await loadProfile((await params).username);
  return { title: `Following · ${profile.displayName}`, robots: { index: false } };
}

/** /:username/following — SCR-28 (FR-48). */
export default async function ProfileFollowing({ params }: { params: Promise<Params> }) {
  const { profile } = await loadProfile((await params).username);
  return (
    <>
      <ProfileHeader profile={profile} tab="following" />
      <section className="tab-section" aria-labelledby="people-title">
        <h2 id="people-title" className="t-h4">
          Following
        </h2>
        <PeopleList username={profile.username} displayName={profile.displayName} which="following" />
      </section>
    </>
  );
}
