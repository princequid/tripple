import Link from 'next/link';
import { TrippleMark } from '@/components/brand/TrippleMark';

/** `(auth)` layout: a centred card, brand link, legal links only (FRONTEND_ARCHITECTURE §4). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="auth-shell">
      <span className="auth-orb auth-orb--a" aria-hidden="true" />
      <span className="auth-orb auth-orb--b" aria-hidden="true" />
      <div className="auth-card">
        <span className="auth-card__leaf auth-card__leaf--tl" aria-hidden="true" />
        <span className="auth-card__leaf auth-card__leaf--br" aria-hidden="true" />
        <span className="auth-card__bubble" aria-hidden="true" />
        <Link className="ui-brand auth-brand" href="/" aria-label="Trippple home">
          <TrippleMark className="ui-brand__mark" />
          Trippple
        </Link>
        {children}
        <p className="auth-legal">
          By continuing you agree to the{' '}
          <Link className="text-link" href="/terms">
            Terms
          </Link>{' '}
          and{' '}
          <Link className="text-link" href="/privacy">
            Privacy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
