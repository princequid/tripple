'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';

/**
 * C38 Toast region (SH-06): non-blocking confirmations and errors. Polite live region; each toast lives 5 s
 * (errors 8 s) and can be dismissed. An optional action (e.g. "Undo", "View") is a real button.
 */
type Toast = { id: number; tone: 'success' | 'error' | 'info'; text: string; action?: { label: string; run: () => void } };
type Ctx = { show: (t: Omit<Toast, 'id'>) => void };

const ToastCtx = createContext<Ctx>({ show: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current;
      setItems((xs) => [...xs.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), t.tone === 'error' ? 8000 : 5000);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="ui-toast-region" role="status" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`ui-toast ui-toast--${t.tone} glass-panel glass-enter`} data-testid="toast">
            <Icon name={t.tone === 'error' ? 'alert' : t.tone === 'success' ? 'check' : 'info'} className="ui-toast__icon" strokeWidth={2} />
            <span style={{ flex: 1 }}>{t.text}</span>
            {t.action && (
              <button
                type="button"
                className="ui-btn ui-btn--ghost toast-action"
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="ui-icon-btn ui-icon-btn--sm ui-btn--ghost" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
              <Icon name="x" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx).show;
