import type { Metadata } from 'next';
import Link from 'next/link';
import * as feed from '@/modules/feed/service';
import { ProfileHeader } from '@/components/ProfileHeader';
import { ShotGrid } from '@/components/ShotGrid';
import { Icon } from '@/components/Icon';
import { DraftsStrip } from '@/components/composer/DraftsStrip';
import { first, orNotFound } from '../../_viewer';
import { loadProfile } from './_profile';

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { profile } = await loadProfile((await params).username);
  return { title: `${profile.displayName} (@${profile.username})`, description: profile.headline ?? undefined, robots: profile.suspended ? { index: false } : undefined };
}

/** /:username — Work tab (P-01, FR-54, BR-59). Recent | Popular. */
export default async function ProfileWork({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { profile, viewer } = await loadProfile((await params).username);
  const sp = await searchParams;
  const sort = first(sp.sort) === 'popular' ? 'popular' : 'recent';
  const page = await orNotFound(feed.byProfile(profile.id, { sort, cursor: first(sp.cursor) }, viewer));
  return (
    <>
      <ProfileHeader
        profile={profile}
        tab="work"
        toolbar={
          <nav aria-label="Sort" className="profile-sort">
            <Link className="profile-sort__item" href={`/${profile.username}`} aria-current={sort === 'recent' ? 'page' : undefined}>
              Recent
            </Link>
            <Link className="profile-sort__item" href={`/${profile.username}?sort=popular`} aria-current={sort === 'popular' ? 'page' : undefined}>
              Popular
            </Link>
          </nav>
        }
      />
      {profile.isOwn && <DraftsStrip />}
      {page.items.length === 0 ? (
        <div className="profile-empty">
          <span className="profile-empty__icon" aria-hidden="true">
            <Icon name="image" strokeWidth={1.5} />
          </span>
          <p className="profile-empty__title">{profile.isOwn ? 'Your portfolio is waiting' : 'No shots yet'}</p>
          <p className="profile-empty__body">
            {profile.isOwn ? 'Share your first shot: an interface, an identity, an illustration. It appears here and in the feeds.' : `${profile.displayName} has not published any shots yet.`}
          </p>
          {profile.isOwn && (
            <Link className="ui-btn ui-btn--primary" href="/uploads/new">
              <Icon name="upload" />
              Share your first shot
            </Link>
          )}
        </div>
      ) : (
        <ShotGrid
          key={profile.username + sort + (first(sp.cursor) ?? '')}
          initial={page.items}
          nextCursor={page.nextCursor}
          apiPath={`/api/users/${profile.username}/shots?sort=${sort}`}
          label={`Shots by ${profile.displayName}`}
        />
      )}
    </>
  );
}
