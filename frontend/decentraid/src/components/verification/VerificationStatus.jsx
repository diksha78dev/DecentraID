import { cn } from '../../utils/cn';

/**
 * The verdict panel. This is the single most important element in the
 * application, so it is where the visual weight is spent: full-width, a large
 * word, and an explanation of what the word means for the reader.
 */
const STATES = {
  VALID: {
    label: 'Valid',
    headline: 'This credential was verified successfully.',
    wrap: 'border-ok-500/30 bg-ok-50',
    text: 'text-ok-700',
    icon: (
      <path d="M8 16.5l5.5 5.5L24 11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  INVALID: {
    label: 'Invalid',
    headline: 'This credential could not be verified.',
    wrap: 'border-bad-500/30 bg-bad-50',
    text: 'text-bad-700',
    icon: (
      <path d="M11 11l10 10M21 11L11 21" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    ),
  },
  REVOKED: {
    label: 'Revoked',
    headline: 'The issuing organisation revoked this credential.',
    wrap: 'border-bad-500/30 bg-bad-50',
    text: 'text-bad-700',
    icon: (
      <>
        <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2.4" />
        <path d="M9.5 9.5l13 13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </>
    ),
  },
  EXPIRED: {
    label: 'Expired',
    headline: 'This credential is outside its validity period.',
    wrap: 'border-warn-500/30 bg-warn-50',
    text: 'text-warn-700',
    icon: (
      <>
        <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeWidth="2.2" />
        <path d="M16 11v5.5l3.5 2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
};

export default function VerificationStatus({ result, reason, compact = false }) {
  const state = STATES[result] || STATES.INVALID;

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-2 font-semibold', state.text)}>
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          {state.icon}
        </svg>
        {state.label}
      </span>
    );
  }

  return (
    <div className={cn('rounded-xl border p-6 sm:p-8', state.wrap)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white', state.text)}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            {state.icon}
          </svg>
        </div>
        <div className="min-w-0">
          <p className={cn('text-4xl font-semibold tracking-tight sm:text-5xl', state.text)}>
            {state.label}
          </p>
          <p className="mt-2 text-base text-ink">{state.headline}</p>
          {reason ? <p className="mt-1 max-w-prose text-sm text-ink-muted">{reason}</p> : null}
        </div>
      </div>
    </div>
  );
}
