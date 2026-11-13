import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';

/** C34 EmptyState. */
export function EmptyState({ icon = 'info', title, body, action }: { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="ui-state" data-testid="empty-state">
      <Icon name={icon} className="ui-state__icon" strokeWidth={1.5} />
      <p className="ui-state__title">{title}</p>
      {body && <p className="ui-state__body">{body}</p>}
      {action}
    </div>
  );
}

/** C35 ErrorState with a retry action. */
export function ErrorState({ title = "Couldn't load this", body, onRetry }: { title?: string; body?: ReactNode; onRetry?: () => void }) {
  return (
    <div className="ui-state ui-state--error" role="alert" data-testid="error-state">
      <Icon name="alert" className="ui-state__icon" strokeWidth={1.5} />
      <p className="ui-state__title">{title}</p>
      <p className="ui-state__body">{body ?? 'Check your connection and try again.'}</p>
      {onRetry && (
        <button type="button" className="ui-btn ui-btn--secondary neu-control" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** C36 skeletons: grid of shot cards, or list rows. */
export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="gallery-grid shot-feed-wrap" aria-busy="true" aria-label="Loading" data-testid="loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="stack" style={{ ['--stack-gap' as string]: 'var(--space-3)' }}>
          <div className="ui-skeleton ui-skeleton--media" />
          <div className="ui-skeleton ui-skeleton--line" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="list-skeleton" aria-busy="true" aria-label="Loading" data-testid="loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="list-skeleton__row">
          <div className="ui-skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div className="stack" style={{ flex: 1, ['--stack-gap' as string]: 'var(--space-2)' }}>
            <div className="ui-skeleton ui-skeleton--line" style={{ width: '45%' }} />
            <div className="ui-skeleton ui-skeleton--line" style={{ width: '75%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
