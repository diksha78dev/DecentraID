import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

/** Brief confirmations for actions that succeed away from the main view. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = 'ok') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (m) => push(m, 'ok'),
      error: (m) => push(m, 'bad'),
      info: (m) => push(m, 'info'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-pop',
              t.tone === 'bad' && 'border-bad-500/30 bg-white text-bad-700',
              t.tone === 'ok' && 'border-ok-500/30 bg-white text-ok-700',
              t.tone === 'info' && 'border-line bg-white text-ink',
            )}
          >
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-ink-soft hover:text-ink"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider');
  return ctx;
}

export default ToastContext;
