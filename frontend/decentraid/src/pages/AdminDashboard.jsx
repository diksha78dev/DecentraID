import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card, { CardHeader, StatCard } from '../components/common/Card';
import Button from '../components/common/Button';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import Badge from '../components/common/Badge';
import DataValue from '../components/common/DataValue';
import { useAsync } from '../hooks/useAsync';
import adminService from '../services/adminService';
import { ISSUER_STATUS } from '../utils/constants';
import { relativeTime } from '../utils/format';

const ACTION_LABEL = {
  ISSUER_AUTHORIZED: 'authorised issuer',
  ISSUER_SUSPENDED: 'suspended issuer',
  CREDENTIAL_ISSUED: 'issued credential',
  CREDENTIAL_REVOKED: 'revoked credential',
  VERIFICATION_REQUESTED: 'raised verification request',
  VERIFICATION_REJECTED: 'rejected verification request',
  CREDENTIAL_SHARED: 'shared credential',
};

export default function AdminDashboard() {
  const issuers = useAsync(() => adminService.listIssuers(), []);
  const audit = useAsync(() => adminService.audit({ limit: 6 }), []);

  const list = issuers.data || [];
  const counts = {
    total: list.length,
    active: list.filter((i) => i.status === ISSUER_STATUS.AUTHORIZED).length,
    suspended: list.filter((i) => i.status === ISSUER_STATUS.SUSPENDED).length,
    pending: list.filter((i) => i.status === ISSUER_STATUS.PENDING).length,
  };

  return (
    <>
      <PageHeader
        title="Registry overview"
        description="Which organisations may issue credentials, and what has happened recently."
        action={
          <Link to="/admin/issuers">
            <Button>Manage issuers</Button>
          </Link>
        }
      />

      {issuers.error ? (
        <ErrorState compact error={issuers.error} onRetry={issuers.reload} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total issuers" value={counts.total} loading={issuers.loading} />
          <StatCard label="Authorised" value={counts.active} tone="ok" loading={issuers.loading} />
          <StatCard label="Suspended" value={counts.suspended} tone="bad" loading={issuers.loading} />
          <StatCard
            label="Awaiting authorisation"
            value={counts.pending}
            tone="warn"
            loading={issuers.loading}
            hint={counts.pending ? 'Review in issuer management' : undefined}
          />
        </div>
      )}

      {counts.pending > 0 ? (
        <Card className="mt-4 flex flex-col gap-3 border-warn-500/30 bg-warn-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-warn-700">
            {counts.pending} organisation{counts.pending > 1 ? 's are' : ' is'} waiting for
            authorisation before they can issue credentials.
          </p>
          <Link to="/admin/issuers">
            <Button size="sm" variant="secondary">
              Review now
            </Button>
          </Link>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader
          title="Recent activity"
          description="Registry actions, newest first."
          action={
            <Link to="/admin/audit">
              <Button variant="secondary" size="sm">
                View all
              </Button>
            </Link>
          }
        />
        {audit.loading ? (
          <TableSkeleton rows={4} />
        ) : audit.error ? (
          <ErrorState error={audit.error} onRetry={audit.reload} />
        ) : !audit.data?.length ? (
          <EmptyState title="No activity yet" description="Registry actions will appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {audit.data.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3.5 text-sm">
                <span className="font-medium text-ink">{entry.actor}</span>
                <span className="text-ink-soft">{ACTION_LABEL[entry.action] || entry.action}</span>
                <span className="data text-ink">{entry.entity}</span>
                {entry.transactionRef ? (
                  <Badge tone="neutral" className="hidden sm:inline-flex">
                    <DataValue value={entry.transactionRef} truncate lead={6} tail={4} label="transaction reference" />
                  </Badge>
                ) : null}
                <span className="ml-auto whitespace-nowrap text-xs text-ink-soft">
                  {relativeTime(entry.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
