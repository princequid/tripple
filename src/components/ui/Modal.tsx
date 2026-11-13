'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Icon } from '../Icon';

/**
 * C48 Modal: modal-glass dialog over an unblurred scrim (one glass layer, constitution §3.2). Bottom sheet below
 * md, centred dialog from md. `variant="side"` is the comments panel (right side ≥ md, sheet below).
 * Focus is trapped and returned; Escape, the close button and a scrim click close it; page scroll is locked.
 */
type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dialog' | 'side';
  children: ReactNode;
  footer?: ReactNode;
  /** Set false for flows that must not be dismissed by a stray click (e.g. unsaved form). */
  dismissOnScrim?: boolean;
};

export function Modal({ open, onClose, title, description, size = 'md', variant = 'dialog', children, footer, dismissOnScrim = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useFocusTrap(open && mounted, ref);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;
  const cls = variant === 'side' ? 'ui-modal ui-modal--side glass-modal glass-enter-drawer' : `ui-modal ui-modal--${size} glass-modal glass-enter-modal`;
  return createPortal(
    <>
      <div className="glass-scrim" aria-hidden="true" onClick={dismissOnScrim ? onClose : undefined} />
      <div ref={ref} className={cls} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} tabIndex={-1}>
        <div className="ui-modal__header">
          <div className="stack" style={{ ['--stack-gap' as string]: 'var(--space-1)' }}>
            <h2 id={titleId} className="t-h4">
              {title}
            </h2>
            {description && (
              <p id={descId} className="t-body-sm text-secondary">
                {description}
              </p>
            )}
          </div>
          <button type="button" className="ui-icon-btn ui-icon-btn--sm ui-btn--ghost ui-modal__close" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </>,
    document.body,
  );
}

/** Confirmation dialog for destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  danger = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="ui-btn ui-btn--on-glass" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`ui-btn ${danger ? 'ui-btn--danger' : 'ui-btn--primary'}`} onClick={onConfirm} aria-busy={busy || undefined} data-autofocus>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="t-body-sm">{body}</div>
    </Modal>
  );
}
