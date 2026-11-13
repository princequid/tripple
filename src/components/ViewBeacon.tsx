'use client';

import { useEffect } from 'react';

/**
 * C40 ViewBeacon (D-10, BR-29): one POST /api/views after hydration, i.e. only when the page really rendered in a
 * browser. `keepalive` lets it finish if the user navigates away. No-JS visits are not counted (by design).
 */
export function ViewBeacon({ shotId }: { shotId: number }) {
  useEffect(() => {
    const body = JSON.stringify({ shotId });
    void fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }, [shotId]);
  return null;
}
