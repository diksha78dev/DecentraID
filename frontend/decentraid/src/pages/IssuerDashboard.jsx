import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card, { CardHeader, StatCard } from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAsync } from '../hooks/useAsync';
import credentialService from '../services/credentialService';
import { useAuth } from '../context/AuthContext';
import { effectiveStatus, formatDate } from '../utils/format';
import { ISSUER_STATUS } from '../utils/constants';

export default function IssuerDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => credentialService.list(), []);
  const list = data || [];

  const counts = {
    issued: list.length,
    active: list.filter((c) => effectiveStatus(c) === 'ACTIVE').length,
    revoked: list.filter((c) => c.status === 'REVOKED').length,
    expired: list.filter((c) => effectiveStatus(c) === 'EXPIRED').length,
  };

  const authorized = user?.status === ISSUER_STATUS.AUTHORIZED;

  const columns = [
    {
      key: 'id',
      header: 'Credential',
      primary: true,
      cell: (row) => (
        <Link to={'/credentials/' + encodeURIComponent(row.credentialId)} className="block min-w-0">
          <span className="data block text-ink">{row.credentialId}</span>
          <span className="block truncate text-xs text-ink-soft">{row.type}</span>
        </Link>
      ),
    },
    { key: 'holder', header: 'Holder', cell: (row) => row.holderName },
    { key: 'issued', header: 'Issued', cell: (row) => formatDate(row.issuedAt) },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={effectiveStatus(row)} /> },
  ];

  return (
    <>
      <PageHeader
        title={'Issued by ' + (user?.organization || user?.name || 'your organisation')}
        description="Credentials you have anchored, and their current status."
        action={
          <Link to="/issuer/issue">
            <Button disabled={!authorized}>Issue credential</Button>
          </Link>
        }
      />

      {!authorized ? (
        <Card className="mb-6 border-warn-500/30 bg-warn-50 p-5">
          <p className="text-sm font-medium text-warn-700">
            Your organisation is not authorised to issue credentials.
          </p>
          <p className="mt-1 text-sm text-warn-700/90">
            A registry administrator must authorise this account before issuance is possible.
          </p>
        </Card>
      ) : null}

      {error ? (
        <ErrorState compact error={error} onRetry={reload} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Credentials issued" value={counts.issued} loading={loading} />
          <StatCard label="Active" value={counts.active} tone="ok" loading={loading} />
          <StatCard label="Revoked" value={counts.revoked} tone="bad" loading={loading} />
          <StatCard label="Expired" value={counts.expired} tone="warn" loading={loading} />
        </div>
      )}

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Recently issued"
          action={
            <Link to="/issuer/credentials">
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
            caption="Recently issued credentials"
            empty={
              <EmptyState
                title="No credentials issued yet"
                description="Issue your first credential to a holder's wallet address."
                action={
                  authorized ? (
                    <Link to="/issuer/issue">
                      <Button>Issue credential</Button>
                    </Link>
                  ) : null
                }
              />
            }
          />
        )}
      </Card>
    </>
  );
}
