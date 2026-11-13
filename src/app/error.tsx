'use client';

/** Error boundary (FR-05). Shows a request reference only, never error details. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="container section">
      <div className="ui-state ui-state--error" role="alert">
        <p className="ui-state__title">Something went wrong</p>
        <p className="ui-state__body">We couldn&apos;t load this page. Check your connection and try again.</p>
        {error.digest && <p className="t-caption text-secondary">Reference: {error.digest}</p>}
        <button className="ui-btn ui-btn--primary" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
