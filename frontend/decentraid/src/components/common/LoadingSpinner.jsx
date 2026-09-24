import { cn } from '../../utils/cn';

export default function LoadingSpinner({ size = 20, tone = 'ink', className, label }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          className={tone === 'light' ? 'text-white/30' : 'text-line'}
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={tone === 'light' ? 'text-white' : 'text-seal-600'}
        />
      </svg>
      {label ? <span className="text-sm text-ink-soft">{label}</span> : null}
      <span className="sr-only">Loading</span>
    </span>
  );
}
