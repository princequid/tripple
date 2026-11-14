import 'server-only';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignInFlow } from '@/components/SignInFlow';
import { parseIntent, safeReturnTo } from '@/lib/return-to';
import { currentViewer, first } from '../_viewer';

/**
 * Shared body of /login and /signup (FR-10…FR-13, FR-16). Signed-in visits redirect to `returnTo` (A-13 §7);
 * pending users go to onboarding. `returnTo` and `intent` are sanitised (BR-14, BR-15).
 */
export async function SignInPage({ mode, searchParams }: { mode: 'login' | 'signup'; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const returnTo = safeReturnTo(first(sp.returnTo));
  const viewer = await currentViewer();
  if (viewer.kind === 'member') redirect(returnTo);
  if (viewer.kind === 'pending') redirect(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`);
  const intent = parseIntent(first(sp.intent));
  const other = mode === 'login' ? { href: '/signup', text: 'New here? Create an account' } : { href: '/login', text: 'Already have an account? Sign in' };
  const qs = new URLSearchParams({ returnTo });
  const passwordAuth = process.env.PROTOTYPE_PASSWORD_AUTH === '1'; // A-28 (prototype only)
  return (
    <>
      <SignInFlow
        mode={mode}
        returnTo={returnTo}
        intent={intent}
        target={first(sp.target)}
        googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
        passwordAuth={passwordAuth}
      />
      {!passwordAuth && (
        <p style={{ marginTop: 'var(--space-6)' }}>
          <Link className="text-link" href={`${other.href}?${qs}`}>
            {other.text}
          </Link>
        </p>
      )}
    </>
  );
}
