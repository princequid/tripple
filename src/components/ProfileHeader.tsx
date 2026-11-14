import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PublicProfile } from '@/modules/users/types';
import { formatCount, formatCountLong } from '@/lib/format';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { ProfileActions, ProfileTabs } from './profile/ProfileActions';

export type ProfileTab = 'work' | 'collections' | 'likes' | 'members' | 'services' | 'about' | 'followers' | 'following';

const joined = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

/**
 * C25 ProfileHeader v3 (P-01, SCR-23, A-27). One panel:
 * 1. a navy cover band (flat red disc + slate orb, the home-hero motif),
 * 2. identity: avatar overlapping the band, name + badges, @username · location · joined, headline; actions on the right
 *    (Follow / Message / More for others; Edit profile / Share work for the owner),
 * 3. a stats strip (shots, likes, followers → list, following → list) and up to four skills.
 * Below the panel, one toolbar: section tabs (Work, Collections, Liked, Members, Services, About) and an optional
 * page tool on the right (e.g. Recent | Popular on the Work tab).
 */
export function ProfileHeader({ profile, tab, toolbar }: { profile: PublicProfile; tab: ProfileTab; toolbar?: ReactNode }) {
  const u = profile.username;
  const stats: { key: string; value: number; label: string; long: string; href?: string; current?: boolean; testId?: string }[] = [
    { key: 'shots', value: profile.stats.shots, label: 'Shots', long: 'shots' },
    { key: 'likes', value: profile.stats.likesReceived, label: 'Likes', long: 'likes received' },
    { key: 'followers', value: profile.stats.followers ?? 0, label: 'Followers', long: 'followers', href: `/${u}/followers`, current: tab === 'followers', testId: 'followers-count' },
    ...(profile.isTeam ? [] : [{ key: 'following', value: profile.stats.following ?? 0, label: 'Following', long: 'following', href: `/${u}/following`, current: tab === 'following' }]),
  ];
  return (
    <>
      {profile.suspended && (
        <div className="ui-alert ui-alert--error" role="status" style={{ marginTop: 'var(--space-6)' }}>
          This account is suspended (moderation view).
        </div>
      )}
      <section className="ui-profile profile-hero" aria-labelledby="profile-name">
        <div className="profile-hero__cover" aria-hidden="true">
          <span className="profile-hero__disc" />
          <span className="profile-hero__orb" />
        </div>
        <div className="profile-hero__body">
          <div className="profile-hero__avatar">
            <Avatar name={profile.displayName} avatarKey={profile.avatarKey} size="xl" />
          </div>
          <div className="profile-hero__identity">
            <h1 id="profile-name" className="profile-hero__name">
              {profile.displayName}
              {profile.isTeam && <span className="ui-badge ui-badge--support">Team</span>}
              {profile.isFeaturedStudio && <span className="ui-badge ui-badge--gold">Featured Studio</span>}
            </h1>
            <p className="profile-hero__facts">
              <span>@{u}</span>
              {profile.location && (
                <span>
                  <Icon name="pin" />
                  {profile.location}
                </span>
              )}
              <span>
                <Icon name="clock" />
                Joined {joined(profile.memberSince)}
              </span>
            </p>
            {profile.headline && <p className="profile-hero__headline">{profile.headline}</p>}
          </div>
          <div className="profile-hero__actions">
            <ProfileActions username={u} displayName={profile.displayName} isOwn={profile.isOwn} isTeam={profile.isTeam} isFollowing={profile.isFollowing ?? null} profileId={profile.id} />
          </div>
        </div>
        <div className="profile-hero__meta">
          <ul className="profile-hero__stats" aria-label="Profile stats">
            {stats.map((s) => {
              const body = (
                <>
                  <strong data-testid={s.testId}>{formatCount(s.value)}</strong>
                  <span>{s.label}</span>
                  <span className="visually-hidden"> ({formatCountLong(s.value)} {s.long})</span>
                </>
              );
              return (
                <li key={s.key}>
                  {s.href ? (
                    <Link className="profile-hero__stat" href={s.href} aria-current={s.current ? 'page' : undefined} data-tip={`See ${s.label.toLowerCase()}`}>
                      {body}
                    </Link>
                  ) : (
                    <span className="profile-hero__stat">{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {profile.skills.length > 0 && (
            <ul className="profile-hero__skills" aria-label="Skills">
              {profile.skills.slice(0, 4).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <div className="profile-toolbar">
        <ProfileTabs username={u} isOwn={profile.isOwn} isTeam={profile.isTeam} />
        {toolbar && <div className="profile-toolbar__tool">{toolbar}</div>}
      </div>
    </>
  );
}
