'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { jobPath, listJobs } from '@/services/jobs';
import type { EmploymentType, JobSummary } from '@/services/contracts';
import { EMPLOYMENT_LABEL, SPECIALTIES, WORKPLACE_LABEL, timeAgo } from '@/services/reference';
import { useUrlState } from '@/hooks/useUrlState';
import { useResource } from '@/hooks/useResource';
import { Checkbox } from '../ui/Field';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { Icon } from '../Icon';

/** JobRow (SCR-37): company initial tile, title, company, location/remote, type, posted time. */
export function JobRow({ j, actions }: { j: JobSummary; actions?: React.ReactNode }) {
  return (
    <li className="job-row">
      <span className="job-row__logo" aria-hidden="true">
        {j.company.name.slice(0, 1)}
      </span>
      <div className="job-row__main">
        <Link href={jobPath(j)} className="job-row__title">
          {j.title}
        </Link>
        <p className="job-row__meta">
          <span>{j.company.name}</span>
          <span>
            <Icon name="pin" size={14} /> {j.location || 'Remote'}
          </span>
          {j.workplaceType !== 'on-site' && <span className="ui-badge ui-badge--sage">{WORKPLACE_LABEL[j.workplaceType]}</span>}
          <span className="ui-badge ui-badge--neutral">{EMPLOYMENT_LABEL[j.employmentType]}</span>
          {j.status !== 'active' && <span className="ui-badge ui-badge--neutral">{j.status === 'closed' ? 'Closed' : 'Expired'}</span>}
        </p>
      </div>
      <div className="job-row__side">
        <time className="t-caption text-secondary" dateTime={j.postedAt}>
          {timeAgo(j.postedAt)}
        </time>
        {actions ?? (
          <Link href={jobPath(j)} className="ui-btn ui-btn--secondary neu-control ui-btn--sm" aria-label={`View job: ${j.title}`}>
            View job
          </Link>
        )}
      </div>
    </li>
  );
}

/** SCR-37 job board (J-01, FR-67, BR-75): keyword + sidebar filters; active jobs newest first, 20 per page. */
export function JobBoard() {
  const { sp, set } = useUrlState();
  const q = sp.get('q') ?? '';
  const specialties = sp.getAll('specialty');
  const location = sp.get('location') ?? '';
  const remote = sp.get('remote') === '1';
  const employment = sp.getAll('employment') as EmploymentType[];
  const [draft, setDraft] = useState({ q, location });
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    setDraft({ q, location });
  }, [q, location]);
  const key = sp.toString();
  const res = useResource(() => listJobs({ q, specialties, location, remote, employment }), [key]);
  const [more, setMore] = useState<{ items: JobSummary[]; cursor: string | null } | null>(null);
  useEffect(() => {
    setMore(null);
  }, [key]);
  const items = [...(res.data?.items ?? []), ...(more?.items ?? [])];
  const cursor = more ? more.cursor : (res.data?.nextCursor ?? null);
  const nActive = specialties.length + employment.length + (location ? 1 : 0) + (remote ? 1 : 0);
  const toggle = (k: 'specialty' | 'employment', list: string[], v: string) => set({ [k]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] });

  return (
    <div className="jobs-layout">
      <form
        className="jobs-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: draft.q.trim() });
        }}
      >
        <div className="ui-search">
          <Icon name="search" className="ui-search__icon" />
          <label className="visually-hidden" htmlFor="jobs-q">
            Search jobs
          </label>
          <input id="jobs-q" className="ui-input ui-input--lg neu-field" type="search" placeholder="Title, company or keyword" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
          <button type="submit" className="ui-btn ui-btn--primary ui-search__submit">
            Search
          </button>
        </div>
        <button type="button" className="ui-btn ui-btn--secondary neu-control jobs-filter-toggle" aria-expanded={filtersOpen} aria-controls="job-filters" onClick={() => setFiltersOpen((o) => !o)}>
          <Icon name="filter" /> Filters{nActive ? ` (${nActive})` : ''}
        </button>
      </form>

      <aside id="job-filters" className={`jobs-filters ui-filter-panel neu-context-bg2${filtersOpen ? ' is-open' : ''}`} aria-label="Job filters">
        <fieldset className="ui-fieldset">
          <legend className="ui-filter-panel__title">Specialty</legend>
          {SPECIALTIES.map((s) => (
            <Checkbox key={s.slug} label={s.name} checked={specialties.includes(s.slug)} onChange={() => toggle('specialty', specialties, s.slug)} />
          ))}
        </fieldset>
        <fieldset className="ui-fieldset">
          <legend className="ui-filter-panel__title">Location</legend>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              set({ location: draft.location.trim() });
            }}
            className="cluster"
          >
            <label className="visually-hidden" htmlFor="jobs-loc">
              City or country
            </label>
            <input id="jobs-loc" className="ui-input neu-field" style={{ flex: 1, minWidth: 0 }} placeholder="City or country" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} onBlur={() => draft.location !== location && set({ location: draft.location.trim() })} />
          </form>
          <Checkbox label="Open to remote" checked={remote} onChange={(v) => set({ remote: v })} />
        </fieldset>
        <fieldset className="ui-fieldset">
          <legend className="ui-filter-panel__title">Employment type</legend>
          {(Object.keys(EMPLOYMENT_LABEL) as EmploymentType[]).map((e) => (
            <Checkbox key={e} label={EMPLOYMENT_LABEL[e]} checked={employment.includes(e)} onChange={() => toggle('employment', employment, e)} />
          ))}
        </fieldset>
        {nActive > 0 && (
          <button type="button" className="ui-btn ui-btn--ghost" onClick={() => set({ specialty: null, employment: null, location: null, remote: null })}>
            Clear filters
          </button>
        )}
      </aside>

      <section className="jobs-results" aria-labelledby="jobs-results-title">
        <div className="row-between">
          <h2 id="jobs-results-title" className="t-h4">
            {q ? `Jobs matching “${q}”` : 'Latest jobs'}
          </h2>
          <span className="t-body-sm text-secondary" role="status">
            {res.status === 'ready' ? `${items.length}${cursor ? '+' : ''} open role${items.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>
        {res.status === 'error' ? (
          <ErrorState onRetry={res.reload} />
        ) : !res.data ? (
          <ListSkeleton rows={5} />
        ) : items.length === 0 ? (
          <EmptyState icon="briefcase" title="No jobs match your search" body="Try removing a filter, or check back soon." action={<Link className="ui-btn ui-btn--primary" href="/jobs/new">Post a job</Link>} />
        ) : (
          <ul className="job-list">
            {items.map((j) => (
              <JobRow key={j.id} j={j} />
            ))}
          </ul>
        )}
        {cursor && (
          <div className="ui-feed-status">
            <button
              type="button"
              className="ui-btn ui-btn--secondary neu-control"
              onClick={async () => {
                const r = await listJobs({ q, specialties, location, remote, employment, cursor });
                if (r.ok) setMore((m) => ({ items: [...(m?.items ?? []), ...r.data.items], cursor: r.data.nextCursor }));
              }}
            >
              Load more jobs
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
