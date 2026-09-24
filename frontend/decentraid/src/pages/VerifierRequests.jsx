import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import VerificationStatus from '../components/verification/VerificationStatus';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAsync } from '../hooks/useAsync';
import verificationService from '../services/verificationService';
import { formatDateTime } from '../utils/format';

export default function VerifierRequests() {
  const { data, loading, error, reload } = useAsync(() => verificationService.listRequests(), []);

  const columns = [
    {
      key: 'id',
      header: 'Request ID',
      primary: true,
      cell: (row) => <span className="data text-ink">{row.id}</span>,
    },
    {
      key: 'credential',
      header: 'Credential',
      cell: (row) => (
        <span className="text-ink">
          {row.sharedCredentialId || row.credentialId || row.credentialType || '—'}
        </span>
      ),
    },
    { key: 'holder', header: 'Holder', cell: (row) => row.holderName },
    {
      key: 'created',
      header: 'Created at',
      className: 'whitespace-nowrap',
      cell: (row) => formatDateTime(row.createdAt),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'result',
      header: 'Result',
      className: 'text-right',
      cell: (row) =>
        row.sharedCredentialId ? (
          <div className="flex items-center justify-end gap-3">
            {row.result ? <VerificationStatus result={row.result} compact /> : null}
            <Link to={'/verification/' + encodeURIComponent(row.sharedCredentialId)}>
              <Button size="sm" variant="secondary">
                Open
              </Button>
            </Link>
          </div>
        ) : (
          <span className="text-sm text-ink-soft">Awaiting holder</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Verification requests"
        description="Every request you have raised, with the outcome the holder returned."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={reload}>
              Refresh
            </Button>
            <Link to="/verifier/request">
              <Button>New request</Button>
            </Link>
          </div>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <ErrorState
            title="Unable to load verification requests"
            error={error}
            onRetry={reload}
          />
        ) : (
          <Table
            columns={columns}
            rows={data || []}
            caption="Verification requests you have raised"
            empty={
              <EmptyState
                icon="inbox"
                title="No requests raised yet"
                description="Send a request to a holder to begin verifying a credential."
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
