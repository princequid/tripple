import type { Metadata } from 'next';
import Link from 'next/link';
import { ProfileHeader } from '@/components/ProfileHeader';
import { Avatar } from '@/components/Avatar';
import { formatMonthYear } from '@/lib/format';
import { loadProfile } from '../_profile';

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { profile } = await loadProfile((await params).username);
  return { title: `About ${profile.displayName}` };
}

const safeHref = (url: string) => (/^https?:\/\//i.test(url) ? url : null);

/** /:username/about (P-02, FR-55). Public email only if the user set one (BR-78); external links are rel=noopener. */
export default async function ProfileAbout({ params }: { params: Promise<Params> }) {
  const { profile } = await loadProfile((await params).username);
  const people = profile.isTeam ? profile.members : profile.teams;
  return (
    <>
      <ProfileHeader profile={profile} tab="about" />
      <div className="section stack prose">
        {profile.bio && <p className="t-body-lg">{profile.bio}</p>}
        <dl className="ui-stat-grid">
          {profile.location && (
            <div>
              <dt>Location</dt>
              <dd>{profile.location}</dd>
            </div>
          )}
          <div>
            <dt>Member since</dt>
            <dd>{formatMonthYear(profile.memberSince)}</dd>
          </div>
        </dl>
        {profile.skills.length > 0 && (
          <section className="stack" aria-labelledby="skills">
            <h2 id="skills" className="t-label">
              Skills
            </h2>
            <ul className="ui-chip-row">
              {profile.skills.map((s) => (
                <li key={s}>
                  <span className="ui-chip">{s}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {(profile.websiteUrl || profile.publicEmail || profile.socialLinks.length > 0) && (
          <section className="stack" aria-labelledby="links">
            <h2 id="links" className="t-label">
              Links
            </h2>
            <ul className="stack" style={{ listStyle: 'none', padding: 0, ['--stack-gap' as string]: 'var(--space-2)' }}>
              {profile.websiteUrl && safeHref(profile.websiteUrl) && (
                <li>
                  <a className="text-link" href={safeHref(profile.websiteUrl)!} rel="noopener noreferrer nofollow" target="_blank">
                    {profile.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
              {profile.socialLinks.map((l) =>
                safeHref(l.url) ? (
                  <li key={l.platform}>
                    <a className="text-link" href={l.url} rel="noopener noreferrer nofollow" target="_blank">
                      {l.platform === 'website' ? l.url.replace(/^https?:\/\//, '') : l.platform}
                    </a>
                  </li>
                ) : null,
              )}
              {profile.publicEmail && (
                <li>
                  <a className="text-link" href={`mailto:${profile.publicEmail}`}>
                    {profile.publicEmail}
                  </a>
                </li>
              )}
            </ul>
          </section>
        )}
        {people.length > 0 && (
          <section className="stack" aria-labelledby="people">
            <h2 id="people" className="t-label">
              {profile.isTeam ? 'Members' : 'Teams'}
            </h2>
            <ul className="cluster" style={{ listStyle: 'none', padding: 0, ['--cluster-gap' as string]: 'var(--space-4)' }}>
              {people.map((p) => (
                <li key={p.id}>
                  <Link className="ui-shot-card__author" href={`/${p.username}`}>
                    <Avatar name={p.displayName} avatarKey={p.avatarKey} />
                    <span>{p.displayName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
