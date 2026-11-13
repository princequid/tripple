'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { suggest } from '@/services/marketplace';
import type { SearchType, Suggestion } from '@/services/contracts';
import { normaliseSearchTerm, searchPath } from '@/lib/search-term';
import { Icon } from '../Icon';
import { Avatar } from '../Avatar';

/**
 * C09 SearchBar v2 (D-08, FR-35, OV-07): type switch Shots / Designers / Services and an ARIA 1.2 combobox with
 * up to 8 suggestions (debounced 200 ms). Arrow keys move, Enter opens the highlighted suggestion or submits,
 * Escape closes the list. Submitting routes per type: shots → /search/:term, designers → /search/:term?type=designers,
 * services → /services?q=. Works without JavaScript as a GET form to /search (shots).
 */
const TYPES: { value: SearchType; label: string }[] = [
  { value: 'shots', label: 'Shots' },
  { value: 'designers', label: 'Designers' },
  { value: 'services', label: 'Services' },
];

export function HeaderSearch({ id, variant = 'header', onNavigate, defaultType = 'shots' }: { id: string; variant?: 'header' | 'drawer'; onNavigate?: () => void; defaultType?: SearchType }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<SearchType>(defaultType);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const root = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      const r = await suggest(q, type);
      if (r.ok) {
        setItems(r.data);
        setActive(-1);
        setOpen(true);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, type]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    onNavigate?.();
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(items[active]!.href);
    const term = normaliseSearchTerm(q);
    if (!term) return;
    if (type === 'services') return go(`/services?q=${encodeURIComponent(q.trim())}`);
    go(`${searchPath(term)}${type === 'designers' ? '?type=designers' : ''}`);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  };

  const showList = open && items.length > 0;
  return (
    <form ref={root} className={`header-search ${variant === 'header' ? 'ui-header__search' : 'header-search--drawer'}`} role="search" action="/search" method="get" onSubmit={submit}>
      <div className="ui-search header-search__field">
        <Icon name="search" className="ui-search__icon" />
        <label className="visually-hidden" htmlFor={id}>
          Search {type}
        </label>
        <input
          id={id}
          name="q"
          className="ui-input neu-field"
          type="search"
          placeholder={`Search ${type}`}
          value={q}
          maxLength={100}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => items.length && setOpen(true)}
        />
        <label className="visually-hidden" htmlFor={`${id}-type`}>
          Search type
        </label>
        <select id={`${id}-type`} className="header-search__type" value={type} onChange={(e) => setType(e.target.value as SearchType)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <ul id={listId} role="listbox" aria-label="Suggestions" className="ui-menu glass-panel header-search__list" hidden={!showList}>
        {items.map((s, i) => (
          <li
            key={`${s.kind}-${s.href}`}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className="ui-menu__item"
            data-highlighted={i === active ? '' : undefined}
            onPointerDown={(e) => {
              e.preventDefault();
              go(s.href);
            }}
          >
            {s.avatar ? <Avatar name={s.avatar.displayName} avatarKey={s.avatar.avatarKey} /> : <Icon name={s.kind === 'tag' ? 'tag' : 'search'} />}
            <span>{s.label}</span>
            <span className="t-caption text-secondary" style={{ marginLeft: 'auto' }}>
              {s.kind === 'designer' ? 'Designer' : s.kind === 'tag' ? 'Tag' : ''}
            </span>
          </li>
        ))}
      </ul>
    </form>
  );
}
