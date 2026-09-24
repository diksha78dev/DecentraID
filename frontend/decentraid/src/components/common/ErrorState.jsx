import Button from './Button';

/**
 * Says what failed and offers the way out. Raw server errors are never shown —
 * the transport has already converted them to a readable sentence.
 */
export default function ErrorState({ title = 'Something did not load', error, onRetry, compact = false }) {
  const message =
    typeof error === 'string' ? error : error?.message || 'The request could not be completed.';

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-bad-500/25 bg-bad-50 px-4 py-3 text-sm text-bad-700">
        <span className="flex-1">{message}</span>
        {onRetry ? (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bad-50 text-bad-500">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 7v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
