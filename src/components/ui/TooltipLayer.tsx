'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * C47 Tooltip layer (one per app). Shows a small navy tooltip for:
 * - any element with `data-tip="…"` (explicit text), and
 * - icon-only controls: a button/link with an `aria-label` and no visible text (save, like, share, eye toggle, …).
 * Hover shows it after 400 ms (mouse/pen only; touch never); keyboard focus shows it at once. Escape, scroll,
 * pointer-down and blur hide it. The tooltip is aria-hidden: the control already carries the same accessible name.
 * Opt out with `data-no-tip` on the element or an ancestor.
 */
type Tip = { text: string; x: number; y: number; place: 'top' | 'bottom' };
const SELECTOR = '[data-tip], button[aria-label], a[aria-label], [role="button"][aria-label]';

function tipText(el: HTMLElement): string | null {
  const explicit = el.getAttribute('data-tip');
  if (explicit) return explicit;
  const label = el.getAttribute('aria-label');
  if (!label) return null;
  return el.innerText.trim() === '' ? label : null; // icon-only controls only
}

export function TooltipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const current = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const find = (t: EventTarget | null): HTMLElement | null => {
      const el = t instanceof Element ? (t.closest(SELECTOR) as HTMLElement | null) : null;
      if (!el || el.closest('[data-no-tip]') || el.hasAttribute('disabled')) return null;
      return tipText(el) ? el : null;
    };
    const hide = () => {
      clearTimeout(timer.current);
      current.current = null;
      setTip(null);
    };
    const show = (el: HTMLElement, delay: number) => {
      clearTimeout(timer.current);
      current.current = el;
      timer.current = setTimeout(() => {
        if (current.current !== el || !el.isConnected) return;
        const text = tipText(el);
        if (!text) return;
        const r = el.getBoundingClientRect();
        const place = r.top < 64 ? 'bottom' : 'top';
        const x = Math.min(window.innerWidth - 16, Math.max(16, r.left + r.width / 2));
        setTip({ text, x, y: place === 'top' ? r.top : r.bottom, place });
      }, delay);
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const el = find(e.target);
      if (el) {
        if (el !== current.current) show(el, 400);
      } else if (current.current) hide();
    };
    const focusIn = (e: FocusEvent) => {
      const el = find(e.target);
      if (el && (e.target as HTMLElement).matches(':focus-visible')) show(el, 0);
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    document.addEventListener('pointerover', over);
    document.addEventListener('focusin', focusIn);
    document.addEventListener('focusout', hide);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', hide, true);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('pointerover', over);
      document.removeEventListener('focusin', focusIn);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('pointerdown', hide);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);

  if (!tip) return null;
  return (
    <div className="app-tooltip" data-place={tip.place} style={{ left: tip.x, top: tip.y }} aria-hidden="true">
      {tip.text}
    </div>
  );
}
