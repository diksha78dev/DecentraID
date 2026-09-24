import { Link } from 'react-router-dom';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import { formatDate, effectiveStatus, daysUntil } from '../../utils/format';

/**
 * Holder-facing credential summary. The type is the headline because that is
 * what a holder looks for; the identifier sits beneath it as reference data.
 */
export default function CredentialCard({ credential, selectable = false, selected = false, onSelect }) {
  const status = effectiveStatus(credential);
  const days = daysUntil(credential.expiresAt);
  const expiringSoon = status === 'ACTIVE' && days !== null && days <= 60;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink">{credential.type}</h3>
          {credential.title && credential.title !== credential.type ? (
            <p className="mt-0.5 truncate text-sm text-ink-soft">{credential.title}</p>
          ) : null}
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Credential ID</dt>
          <dd className="data text-ink">{credential.credentialId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Issuer</dt>
          <dd className="truncate text-right text-ink">{credential.issuerName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Issued</dt>
          <dd className="text-ink">{formatDate(credential.issuedAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Expires</dt>
          <dd className="text-ink">
            {credential.expiresAt ? formatDate(credential.expiresAt) : 'No expiry'}
          </dd>
        </div>
      </dl>

      {expiringSoon ? (
        <p className="mt-3 text-xs text-warn-700">
          Expires in {days} {days === 1 ? 'day' : 'days'}.
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2.5 3.5 5.5v4c0 3.5 2.6 6.8 6.5 8 3.9-1.2 6.5-4.5 6.5-8v-4L10 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
          Integrity record anchored
        </span>
        {!selectable ? (
          <span className="text-sm font-medium text-seal-600 underline underline-offset-4">
            View details
          </span>
        ) : null}
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onSelect?.(credential)}
        aria-pressed={selected}
        className={
          'w-full rounded-xl border bg-white p-5 text-left shadow-card transition-colors ' +
          (selected ? 'border-seal-600 ring-1 ring-seal-600' : 'border-line hover:border-seal-200')
        }
      >
        {inner}
      </button>
    );
  }

  return (
    <Card className="p-5 transition-colors hover:border-seal-200">
      <Link to={'/credentials/' + encodeURIComponent(credential.credentialId)} className="block">
        {inner}
      </Link>
    </Card>
  );
}
