'use client';

import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query. Server render assumes `false` (mobile-first markup). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
