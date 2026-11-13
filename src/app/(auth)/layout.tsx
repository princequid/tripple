import Link from 'next/link';

/** `(auth)` layout: a centred card, brand link, legal links only (FRONTEND_ARCHITECTURE §4). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="auth-shell">
      <div className="auth-card">
        <Link className="ui-brand auth-brand" href="/" aria-label="Trippple home">
          Trippple
        </Link>
        {children}
        <p className="t-caption text-secondary" style={{ marginTop: 'var(--space-8)' }}>
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
