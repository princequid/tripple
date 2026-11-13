import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProfileHeader } from '@/components/ProfileHeader';
import { Avatar } from '@/components/Avatar';
import { loadProfile } from '../_profile';

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { profile } = await loadProfile((await params).username);
  return { title: `Members of ${profile.displayName}` };
}

const ROLE: Record<string, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

/** /:username/members — SCR-27 (FR-58): team accounts only; individuals 404. Data from the R1 profile API. */
export default async function TeamMembers({ params }: { params: Promise<Params> }) {
  const { profile } = await loadProfile((await params).username);
  if (!profile.isTeam) notFound();
  return (
    <>
      <ProfileHeader profile={profile} tab="members" />
      <section className="tab-section" aria-labelledby="members-title">
        <h2 id="members-title" className="t-h4">
          {profile.members.length} member{profile.members.length === 1 ? '' : 's'}
        </h2>
        <ul className="member-grid">
          {profile.members.map((m) => (
            <li key={m.username} className="ui-card member-card">
              <Avatar name={m.displayName} avatarKey={m.avatarKey} size="lg" />
              <Link className="member-card__name" href={`/${m.username}`}>
                {m.displayName}
              </Link>
              <span className="t-caption text-secondary">@{m.username}</span>
              {m.role && <span className={`ui-badge ${m.role === 'owner' ? 'ui-badge--accent' : 'ui-badge--neutral'}`}>{ROLE[m.role] ?? m.role}</span>}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
