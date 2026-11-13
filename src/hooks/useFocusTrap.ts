'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside `root` while active, focuses the first focusable element (or `[data-autofocus]`) on open and
 * restores focus to the element that was focused before opening (modal dialog pattern, WAI-ARIA APG).
 */
export function useFocusTrap(active: boolean, root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const el = root.current;
    if (!el) return;
    const before = document.activeElement as HTMLElement | null;
    const items = () => Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
    const first = el.querySelector<HTMLElement>('[data-autofocus]') ?? items()[0] ?? el;
    first.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) return e.preventDefault();
      const a = list[0]!;
      const z = list[list.length - 1]!;
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      if (before && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, [active, root]);
}
