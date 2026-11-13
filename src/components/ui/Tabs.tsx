'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../Icon';

/** C27 link tabs (segmented well): the URL is the state, `aria-current="page"` marks the active tab. */
/** A tab is current on its exact path, or on a sub-path unless it is the root tab (index 0). */
export function LinkTabs({ items, label }: { items: { href: string; label: string; count?: number }[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="link-tabs">
      <div className="ui-segmented">
        {items.map((t, i) => {
          const active = path === t.href || (i > 0 && path.startsWith(`${t.href}/`));
          return (
            <Link key={t.href} className="ui-segmented__item segmented-link" href={t.href} aria-current={active ? 'page' : undefined}>
              {t.label}
              {typeof t.count === 'number' && <span className="segmented-count">{t.count}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Stepper for multi-step flows (job wizard, onboarding). */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="stepper" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className={`stepper__item${i < current ? ' is-done' : ''}`} aria-current={i === current ? 'step' : undefined}>
          <span className="stepper__dot" aria-hidden="true">
            {i < current ? <Icon name="check" strokeWidth={2.5} /> : i + 1}
          </span>
          <span className="stepper__label">
            <span className="visually-hidden">{`Step ${i + 1} of ${steps.length}: `}</span>
            {s}
            {i < current && <span className="visually-hidden"> (completed)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
