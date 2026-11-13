'use client';

import { useEffect, useState } from 'react';
import { listDesigners } from '@/services/marketplace';
import type { DesignerCard as Dto } from '@/services/contracts';
import { useUrlState } from '@/hooks/useUrlState';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/States';
import { Icon } from '../Icon';
import { DesignerCard } from './ServiceCard';

const SKILLS = ['Product design', 'Web design', 'Mobile', 'Branding', 'Illustration', 'Typography', 'Animation', 'Packaging', 'Design systems', 'UX research'];

/** SCR-53 designer directory (H-01, FR-73): keyword, skill, location, individuals/teams (no availability label, D-25d). */
export function HireDirectory() {
  const { sp, set } = useUrlState();
  const q = sp.get('q') ?? sp.get('search') ?? '';
  const skill = sp.get('skill') ?? '';
  const location = sp.get('location') ?? '';
  const kind = (sp.get('kind') as 'all' | 'individual' | 'team' | null) ?? 'all';
  const [draft, setDraft] = useState({ q, location });
  useEffect(() => {
    setDraft({ q, location });
  }, [q, location]);

  const res = useResource(() => listDesigners({ q, skill, location, kind }), [q, skill, location, kind]);
  const [more, setMore] = useState<{ items: Dto[]; cursor: string | null } | null>(null);
  useEffect(() => {
    setMore(null);
  }, [q, skill, location, kind]);
  const items = [...(res.data?.items ?? []), ...(more?.items ?? [])];
  const cursor = more ? more.cursor : (res.data?.nextCursor ?? null);
  const active = [q, skill, location].filter(Boolean).length + (kind !== 'all' ? 1 : 0);

  return (
    <div className="hire-layout">
      <form
        className="ui-filter-panel filters-panel neu-context-bg2"
        role="search"
        aria-label="Filter designers"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: draft.q.trim(), location: draft.location.trim(), search: null });
        }}
      >
        <div className="ui-filter-panel__group">
          <label className="ui-filter-panel__title" htmlFor="hire-q">
            Keyword
          </label>
          <div className="ui-search">
            <Icon name="search" className="ui-search__icon" />
            <input id="hire-q" className="ui-input neu-field" type="search" value={draft.q} placeholder="Name, skill or specialty" onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
          </div>
        </div>
        <div className="ui-filter-panel__group">
          <label className="ui-filter-panel__title" htmlFor="hire-loc">
            Location
          </label>
          <input id="hire-loc" className="ui-input neu-field" value={draft.location} placeholder="City or country" onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        </div>
        <div className="ui-filter-panel__group">
          <span className="ui-filter-panel__title" id="hire-kind">
            Show
          </span>
          <div className="ui-segmented" role="radiogroup" aria-labelledby="hire-kind">
            {(['all', 'individual', 'team'] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} className="ui-segmented__item" onClick={() => set({ kind: k === 'all' ? null : k })}>
                {k === 'all' ? 'All' : k === 'individual' ? 'Designers' : 'Teams'}
              </button>
            ))}
          </div>
        </div>
        <div className="ui-filter-panel__group span-2">
          <span className="ui-filter-panel__title">Skills</span>
          <div className="ui-chip-row" role="group" aria-label="Skill">
            {SKILLS.map((s) => (
              <button key={s} type="button" className="ui-pill ui-pill--sm neu-control" aria-pressed={skill === s} onClick={() => set({ skill: skill === s ? null : s })}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="form-actions span-2">
          <button type="submit" className="ui-btn ui-btn--primary">
            Apply
          </button>
          {active > 0 && (
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => set({ q: null, skill: null, location: null, kind: null, search: null })}>
              Clear all ({active})
            </button>
          )}
        </div>
      </form>

      <section aria-labelledby="hire-results" className="stack">
        <h2 id="hire-results" className="visually-hidden">
          Results
        </h2>
        <p className="t-body-sm text-secondary" role="status">
          {res.status === 'loading' ? 'Searching…' : res.status === 'ready' ? `${items.length}${cursor ? '+' : ''} designer${items.length === 1 ? '' : 's'}` : ''}
        </p>
        {res.status === 'error' ? (
          <ErrorState onRetry={res.reload} />
        ) : !res.data ? (
          <ListSkeleton rows={4} />
        ) : items.length === 0 ? (
          <EmptyState icon="users" title="No designers match" body="Try fewer filters or a different keyword." action={<button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={() => set({ q: null, skill: null, location: null, kind: null })}>Clear filters</button>} />
        ) : (
          <ul className="designer-grid">
            {items.map((d) => (
              <DesignerCard key={d.username} d={d} />
            ))}
          </ul>
        )}
        {cursor && (
          <div className="ui-feed-status">
            <button
              type="button"
              className="ui-btn ui-btn--secondary neu-control"
              onClick={async () => {
                const r = await listDesigners({ q, skill, location, kind, cursor });
                if (r.ok) setMore((m) => ({ items: [...(m?.items ?? []), ...r.data.items], cursor: r.data.nextCursor }));
              }}
            >
              Load more
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
