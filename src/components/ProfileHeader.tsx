import Link from 'next/link';
import type { PublicProfile } from '@/modules/users/types';
import { formatCount, formatCountLong } from '@/lib/format';
import { Avatar } from './Avatar';
import { ProfileActions, ProfileTabs } from './profile/ProfileActions';

export type ProfileTab = 'work' | 'collections' | 'likes' | 'members' | 'services' | 'about' | 'followers' | 'following';

/**
 * C25 ProfileHeader v2 (P-01, SCR-23): identity, stats (shots, likes, followers, following → lists), Follow,
 * Message and the More menu (report, block) for others; Edit profile and Share work for the owner. Tabs: Work,
 * Collections, Liked (owner), Members (teams), Services (when listed), About.
 */
export function ProfileHeader({ profile, tab }: { profile: PublicProfile; tab: ProfileTab }) {
  const u = profile.username;
  return (
    <>
      {profile.suspended && (
        <div className="ui-alert ui-alert--error" role="status" style={{ marginTop: 'var(--space-6)' }}>
          This account is suspended (moderation view).
        </div>
      )}
      <div className="ui-profile">
        <Avatar name={profile.displayName} avatarKey={profile.avatarKey} size="xl" />
        <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-2)' }}>
          <h1 className="ui-profile__name">
            {profile.displayName}{' '}
            {profile.isTeam && <span className="ui-badge ui-badge--support">Team</span>}{' '}
            {profile.isFeaturedStudio && <span className="ui-badge ui-badge--gold">Featured Studio</span>}
          </h1>
          {profile.headline && <p className="ui-profile__headline">{profile.headline}</p>}
          <p className="ui-profile__stats profile-stats">
            <span>
              <strong>{formatCount(profile.stats.shots)}</strong> shots<span className="visually-hidden"> ({formatCountLong(profile.stats.shots)})</span>
            </span>
            <span>
              <strong>{formatCount(profile.stats.likesReceived)}</strong> likes
              <span className="visually-hidden"> received ({formatCountLong(profile.stats.likesReceived)})</span>
            </span>
            <Link href={`/${u}/followers`} aria-current={tab === 'followers' ? 'page' : undefined}>
              <strong data-testid="followers-count">{formatCount(profile.stats.followers ?? 0)}</strong> followers
            </Link>
            {!profile.isTeam && (
              <Link href={`/${u}/following`} aria-current={tab === 'following' ? 'page' : undefined}>
                <strong>{formatCount(profile.stats.following ?? 0)}</strong> following
              </Link>
            )}
          </p>
        </div>
        <ProfileActions username={u} displayName={profile.displayName} isOwn={profile.isOwn} isTeam={profile.isTeam} isFollowing={profile.isFollowing ?? null} profileId={profile.id} />
      </div>
      <ProfileTabs username={u} isOwn={profile.isOwn} isTeam={profile.isTeam} />
    </>
  );
}
