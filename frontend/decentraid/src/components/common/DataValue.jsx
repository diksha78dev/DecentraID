import { useState } from 'react';
import { cn } from '../../utils/cn';
import { shortenHex } from '../../utils/format';

/**
 * Machine-readable value (hash, wallet address, transaction reference) with a
 * copy action. Monospace here is functional: these strings get compared
 * character by character.
 */
export default function DataValue({ value, truncate = false, className, label, lead = 10, tail = 8 }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-ink-soft">—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the full value is still selectable */
    }
  };

  return (
    <span className={cn('inline-flex max-w-full items-center gap-2', className)}>
      <span className="data truncate text-ink-muted" title={value}>
        {truncate ? shortenHex(value, lead, tail) : value}
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-1 text-ink-soft hover:bg-canvas hover:text-ink"
        aria-label={'Copy ' + (label || 'value')}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 3.5h-7a1 1 0 0 0-1 1v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied' : ''}
      </span>
    </span>
  );
}
