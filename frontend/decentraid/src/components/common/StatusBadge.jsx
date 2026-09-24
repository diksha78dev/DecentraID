import Badge from './Badge';

/**
 * One vocabulary, one colour, everywhere. Credential statuses and verification
 * results share this component so a VALID check and an ACTIVE credential read
 * consistently across dashboards.
 */
const MAP = {
  ACTIVE: { tone: 'ok', label: 'Active' },
  VALID: { tone: 'ok', label: 'Valid' },
  AUTHORIZED: { tone: 'ok', label: 'Authorised' },
  APPROVED: { tone: 'ok', label: 'Approved' },
  REVOKED: { tone: 'bad', label: 'Revoked' },
  INVALID: { tone: 'bad', label: 'Invalid' },
  REJECTED: { tone: 'bad', label: 'Rejected' },
  SUSPENDED: { tone: 'bad', label: 'Suspended' },
  EXPIRED: { tone: 'warn', label: 'Expired' },
  PENDING: { tone: 'warn', label: 'Pending' },
};

export default function StatusBadge({ status, className }) {
  const entry = MAP[status] || { tone: 'neutral', label: status || 'Unknown' };
  return (
    <Badge tone={entry.tone} dot className={className}>
      {entry.label}
    </Badge>
  );
}
