'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ToastProvider } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { SignInFlow } from '../SignInFlow';
import { TooltipLayer } from '../ui/TooltipLayer';
import { setMockViewer } from '@/services/mock/runtime';
import type { Intent } from '@/lib/return-to';

/**
 * Client session context + auth-gate modal (OV-03, A-04, BR-14/15). The viewer comes from the server layout
 * (one lookup per request), so client components never fetch "who am I". `requireMember(intent, label)` returns
 * true for members; for visitors it opens the gate and returns false. The gate embeds the real email-code
 * sign-in flow and returns to the current URL (and completes `like-shot` intents) afterwards.
 */
export type ClientViewer = { kind: 'visitor' } | { kind: 'member'; username: string; displayName: string; avatarKey: string | null; role: 'member' | 'moderator' | 'admin' };

type Ctx = {
  viewer: ClientViewer;
  isStaff: boolean;
  requireMember: (intent: Intent | null, label: string, target?: string | number) => boolean;
};

const SessionCtx = createContext<Ctx>({ viewer: { kind: 'visitor' }, isStaff: false, requireMember: () => false });

export function AppProviders({ viewer, googleEnabled, passwordAuth = false, children }: { viewer: ClientViewer; googleEnabled: boolean; passwordAuth?: boolean; children: ReactNode }) {
  setMockViewer(viewer.kind === 'member' ? { username: viewer.username, displayName: viewer.displayName, avatarKey: viewer.avatarKey, role: viewer.role } : null);
  const [gate, setGate] = useState<{ intent: Intent | null; label: string; target?: string | number } | null>(null);
  const path = usePathname();
  const search = useSearchParams();

  const requireMember = useCallback(
    (intent: Intent | null, label: string, target?: string | number) => {
      if (viewer.kind === 'member') return true;
      setGate({ intent, label, target });
      return false;
    },
    [viewer.kind],
  );
  const value = useMemo(
    () => ({ viewer, isStaff: viewer.kind === 'member' && viewer.role !== 'member', requireMember }),
    [viewer, requireMember],
  );
  const returnTo = `${path}${search.size ? `?${search.toString()}` : ''}`;

  return (
    <SessionCtx.Provider value={value}>
      <ToastProvider>
        {children}
        <TooltipLayer />
        <Modal open={gate !== null} onClose={() => setGate(null)} title={gate ? `Sign in to ${gate.label}` : ''} description={passwordAuth ? 'Sign in with your email and password, or create an account in seconds.' : 'Use your email and we’ll send you a 6-digit code. New here? The same steps create your account.'} size="sm">
          {gate && <SignInFlow mode="login" returnTo={returnTo} intent={gate.intent} target={gate.target === undefined ? null : String(gate.target)} googleEnabled={googleEnabled} passwordAuth={passwordAuth} inModal />}
        </Modal>
      </ToastProvider>
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);
