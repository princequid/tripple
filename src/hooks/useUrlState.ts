'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Filter state kept in the URL (shareable, back-button friendly). `set` replaces history; empty values are removed. */
export function useUrlState() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const set = useCallback(
    (patch: Record<string, string | string[] | null | undefined | boolean>) => {
      const next = new URLSearchParams(sp.toString());
      Object.entries(patch).forEach(([k, v]) => {
        next.delete(k);
        if (Array.isArray(v)) v.forEach((x) => next.append(k, x));
        else if (v === true) next.set(k, '1');
        else if (v) next.set(k, v);
      });
      next.delete('cursor');
      const qs = next.toString();
      router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    },
    [sp, router, path],
  );
  return { sp, set };
}
