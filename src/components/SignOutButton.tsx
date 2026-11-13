'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

/** Signs out (M-06, POST /api/auth/sign-out) and goes to `to`. Used for "Not you? Sign out" on onboarding (A-13). */
export function SignOutButton({ to = '/login', children }: { to?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="ui-btn ui-btn--ghost"
      onClick={async () => {
        await api('/api/auth/sign-out', { method: 'POST', body: '{}' });
        router.replace(to);
        router.refresh();
      }}
    >
      {children}
    </button>
  );
}
