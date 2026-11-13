'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Closes a floating layer on Escape and on a pointer-down outside `root` (COMPONENT_GUIDELINES §1.4).
 * `returnFocus` receives focus after an Escape close so keyboard users land where they started.
 */
export function useDismiss(open: boolean, close: () => void, root: RefObject<HTMLElement | null>, returnFocus?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
      returnFocus?.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (root.current?.contains(t) || returnFocus?.current?.contains(t)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, close, root, returnFocus]);
}
