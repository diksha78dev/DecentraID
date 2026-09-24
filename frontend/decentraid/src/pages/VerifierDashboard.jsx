import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card, { CardHeader, StatCard } from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import VerificationStatus from '../components/verification/VerificationStatus';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAsync } from '../hooks/useAsync';
import verificationService from '../services/verificationService';
import { REQUEST_STATUS } from '../utils/constants';
import { formatDate } from '../utils/format';

export default function VerifierDashboard() {
  const { data, loading, error, reload } = useAsync(() => verificationService.listRequests(), []);
  const list = data || [];

  const counts = {
    total: list.length,
    pending: list.filter((r) => r.status === REQUEST_STATUS.PENDING).length,
    approved: list.filter((r) => r.status === REQUEST_STATUS.APPROVED).length,
    rejected: list.filter((r) => r.status === REQUEST_STATUS.REJECTED).length,
  };

  const columns = [
    {
      key: 'id',
      header: 'Request',
      primary: true,
      cell: (row) => <span className="data text-ink">{row.id}</span>,
    },
    {
      key: 'credential',
      header: 'Credential',
      cell: (row) => row.sharedCredentialId || row.credentialId || row.credentialType || '—',
    },
    { key: 'holder', header: 'Holder', cell: (row) => row.holderName },
    { key: 'created', header: 'Created', cell: (row) => formatDate(row.createdAt) },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'result',
      header: 'Result',
      className: 'text-right',
      cell: (row) =>
        row.sharedCredentialId ? (
          <Link
            to={'/verification/' + encodeURIComponent(row.sharedCredentialId)}
            className="inline-flex items-center gap-2"
          >
            {row.result ? <VerificationStatus result={row.result} compact /> : null}
            <span className="text-sm text-seal-600 underline underline-offset-4">Open</span>
          </Link>
        ) : (
          <span className="text-sm text-ink-soft">Awaiting response</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Verification overview"
        description="Requests you have raised and the results holders have returned."
        action={
          <Link to="/verifier/request">
            <Button>New request</Button>
          </Link>
        }
      />

      {error ? (
        <ErrorState compact error={error} onRetry={reload} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Requests raised" value={counts.total} loading={loading} />
          <StatCard label="Awaiting holder" value={counts.pending} tone="warn" loading={loading} />
          <StatCard label="Shared with you" value={counts.approved} tone="ok" loading={loading} />
          <StatCard label="Declined" value={counts.rejected} tone="bad" loading={loading} />
        </div>
      )}

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Recent requests"
          action={
            <Link to="/verifier/requests">
              <Button variant="secondary" size="sm">
                View all
              </Button>
            </Link>
          }
        />
        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <Table
            columns={columns}
            rows={list.slice(0, 5)}
            caption="Recent verification requests"
            empty={
              <EmptyState
                icon="inbox"
                title="No verification requests yet"
                description="Ask a holder to share a credential and the result will appear here."
                action={
                  <Link to="/verifier/request">
                    <Button>New request</Button>
                  </Link>
                }
              />
            }
          />
        )}
      </Card>
    </>
  );
}
