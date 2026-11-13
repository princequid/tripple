'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResult } from '@/lib/api-client';

export type Resource<T> =
  | { status: 'loading'; data: T | null }
  | { status: 'ready'; data: T }
  | { status: 'error'; data: T | null; code: string; message: string };

/**
 * Loads one service call and exposes a small state machine (loading → ready | error) with `reload` and a local
 * `mutate` for optimistic updates. `deps` re-run the loader (e.g. filters). Stale responses are discarded.
 */
export function useResource<T>(loader: () => Promise<ApiResult<T>>, deps: unknown[]) {
  const [state, setState] = useState<Resource<T>>({ status: 'loading', data: null });
  const seq = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller controls re-runs through deps
  const load = useCallback(loader, deps);

  const run = useCallback(async () => {
    const id = ++seq.current;
    setState((s) => ({ status: 'loading', data: s.data }));
    const r = await load();
    if (id !== seq.current) return;
    setState(r.ok ? { status: 'ready', data: r.data } : { status: 'error', data: null, code: r.code, message: r.message });
  }, [load]);

  useEffect(() => {
    void run();
  }, [run]);

  const mutate = useCallback((fn: (d: T) => T) => setState((s) => (s.data === null ? s : { ...s, data: fn(s.data) } as Resource<T>)), []);
  return { ...state, reload: run, mutate };
}
