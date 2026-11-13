'use client';

import { useCallback, useId, useRef, useState, type ReactNode } from 'react';
import { useDismiss } from '@/hooks/useDismiss';

/**
 * C49 Menu (menu-button pattern). Panel-glass dropdown anchored to its trigger; Escape and outside click close it
 * and return focus; Arrow keys move between items; selecting an item closes the menu.
 * `trigger` renders the button and receives the ARIA props to spread.
 */
type TriggerProps = {
  ref: React.RefObject<HTMLButtonElement | null>;
  'aria-expanded': boolean;
  'aria-haspopup': 'menu' | 'dialog';
  'aria-controls': string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

export function Menu({
  trigger,
  children,
  align = 'end',
  label,
  kind = 'menu',
  className = '',
  panelClassName = '',
}: {
  trigger: (p: TriggerProps, open: boolean) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
  label: string;
  kind?: 'menu' | 'dialog';
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root, btn);

  const focusItem = (dir: 1 | -1 | 'first' | 'last') => {
    const items = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]') ?? []);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = dir === 'first' ? 0 : dir === 'last' ? items.length - 1 : (i + dir + items.length) % items.length;
    items[next]?.focus();
  };

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (kind !== 'menu') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(e.key === 'ArrowDown' ? 'first' : 'last'));
    }
  };

  const onPanelKey = (e: React.KeyboardEvent) => {
    if (kind !== 'menu') return;
    if (e.key === 'ArrowDown') (e.preventDefault(), focusItem(1));
    else if (e.key === 'ArrowUp') (e.preventDefault(), focusItem(-1));
    else if (e.key === 'Home') (e.preventDefault(), focusItem('first'));
    else if (e.key === 'End') (e.preventDefault(), focusItem('last'));
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className={`menu-anchor ${className}`} ref={root}>
      {trigger({ ref: btn, 'aria-expanded': open, 'aria-haspopup': kind, 'aria-controls': id, onClick: () => setOpen((o) => !o), onKeyDown: onTriggerKey }, open)}
      {open && (
        <div
          id={id}
          className={`ui-menu glass-panel glass-enter menu-panel menu-panel--${align} ${panelClassName}`}
          role={kind}
          aria-label={label}
          onKeyDown={onPanelKey}
        >
          {children(() => {
            setOpen(false);
            btn.current?.focus();
          })}
        </div>
      )}
    </div>
  );
}
