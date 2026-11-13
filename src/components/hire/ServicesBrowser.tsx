'use client';

import { useEffect, useState } from 'react';
import { listServices } from '@/services/marketplace';
import type { ServiceQuery, ServiceSummary } from '@/services/contracts';
import { SERVICE_CATEGORIES } from '@/services/reference';
import { useUrlState } from '@/hooks/useUrlState';
import { useResource } from '@/hooks/useResource';
import { EmptyState, ErrorState, GridSkeleton } from '../ui/States';
import { Icon } from '../Icon';
import { ServiceCard } from './ServiceCard';

const PRICES = [
  { v: '', l: 'Any budget' },
  { v: '50000', l: 'Up to $500' },
  { v: '100000', l: 'Up to $1,000' },
  { v: '200000', l: 'Up to $2,000' },
];
const DAYS = [
  { v: '', l: 'Any delivery time' },
  { v: '7', l: 'Within 7 days' },
  { v: '14', l: 'Within 14 days' },
  { v: '30', l: 'Within 30 days' },
];
const SORTS = [
  { v: 'recommended', l: 'Recommended' },
  { v: 'newest', l: 'Newest' },
  { v: 'price-asc', l: 'Price: low to high' },
  { v: 'price-desc', l: 'Price: high to low' },
];

/** SCR-54 services listing (M-01, FR-75): keyword, category pills, budget, delivery, sort. */
export function ServicesBrowser() {
  const { sp, set } = useUrlState();
  const q = sp.get('q') ?? '';
  const category = sp.get('category') ?? '';
  const maxPrice = sp.get('max') ?? '';
  const maxDays = sp.get('days') ?? '';
  const sort = (sp.get('sort') as ServiceQuery['sort']) ?? 'recommended';
  const [draft, setDraft] = useState(q);
  useEffect(() => {
    setDraft(q);
  }, [q]);
  const query: ServiceQuery = { q, category: category || undefined, maxPriceCents: maxPrice ? Number(maxPrice) : undefined, maxDays: maxDays ? Number(maxDays) : undefined, sort };
  const res = useResource(() => listServices(query), [q, category, maxPrice, maxDays, sort]);
  const [more, setMore] = useState<{ items: ServiceSummary[]; cursor: string | null } | null>(null);
  useEffect(() => {
    setMore(null);
  }, [q, category, maxPrice, maxDays, sort]);
  const items = [...(res.data?.items ?? []), ...(more?.items ?? [])];
  const cursor = more ? more.cursor : (res.data?.nextCursor ?? null);

  return (
    <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-6)' }}>
      <form
        className="services-search"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: draft.trim() });
        }}
      >
        <div className="ui-search ui-search--hero">
          <Icon name="search" className="ui-search__icon" />
          <label className="visually-hidden" htmlFor="svc-q">
            Search services
          </label>
          <input id="svc-q" className="ui-input ui-input--lg neu-field" type="search" placeholder="Logo, website, illustration…" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button className="ui-btn ui-btn--primary ui-search__submit" type="submit">
            Search
          </button>
        </div>
      </form>
      <nav aria-label="Service categories">
        <div className="ui-pill-row">
          <button type="button" className="ui-pill neu-control" aria-pressed={!category} onClick={() => set({ category: null })}>
            All
          </button>
          {SERVICE_CATEGORIES.map((c) => (
            <button key={c.slug} type="button" className="ui-pill neu-control" aria-pressed={category === c.slug} onClick={() => set({ category: c.slug })}>
              {c.name}
            </button>
          ))}
        </div>
      </nav>
      <div className="filter-row">
        {[
          { id: 'svc-max', label: 'Budget', value: maxPrice, opts: PRICES, key: 'max' },
          { id: 'svc-days', label: 'Delivery', value: maxDays, opts: DAYS, key: 'days' },
          { id: 'svc-sort', label: 'Sort by', value: sort, opts: SORTS, key: 'sort' },
        ].map((f) => (
          <div key={f.id} className="filter-row__item">
            <label className="t-label" htmlFor={f.id}>
              {f.label}
            </label>
            <div className="ui-select">
              <select id={f.id} className="ui-input neu-field" value={f.value} onChange={(e) => set({ [f.key]: e.target.value === 'recommended' ? null : e.target.value })}>
                {f.opts.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.l}
                  </option>
                ))}
              </select>
              <Icon name="chev" className="ui-select__chev" />
            </div>
          </div>
        ))}
      </div>
      <p className="t-body-sm text-secondary" role="status">
        {res.status === 'ready' ? (q ? `Results for “${q}”: ${items.length}${cursor ? '+' : ''}` : `${items.length}${cursor ? '+' : ''} services`) : ''}
      </p>
      {res.status === 'error' ? (
        <ErrorState onRetry={res.reload} />
      ) : !res.data ? (
        <GridSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState icon="briefcase" title="No services match" body="Try another category or a wider budget." />
      ) : (
        <ul className="service-grid">
          {items.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </ul>
      )}
      {cursor && (
        <div className="ui-feed-status">
          <button
            type="button"
            className="ui-btn ui-btn--secondary neu-control"
            onClick={async () => {
              const r = await listServices({ ...query, cursor });
              if (r.ok) setMore((m) => ({ items: [...(m?.items ?? []), ...r.data.items], cursor: r.data.nextCursor }));
            }}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
