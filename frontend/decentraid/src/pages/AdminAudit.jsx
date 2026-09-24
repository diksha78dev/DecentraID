import { useState, useMemo } from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import DataValue from '../components/common/DataValue';
import Badge from '../components/common/Badge';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { Select } from '../components/common/Input';
import { useAsync } from '../hooks/useAsync';
import adminService from '../services/adminService';
import { formatDateTime } from '../utils/format';

const ACTION_LABEL = {
  ISSUER_AUTHORIZED: 'Issuer authorised',
  ISSUER_SUSPENDED: 'Issuer suspended',
  CREDENTIAL_ISSUED: 'Credential issued',
  CREDENTIAL_REVOKED: 'Credential revoked',
  VERIFICATION_REQUESTED: 'Verification requested',
  VERIFICATION_REJECTED: 'Request rejected',
  CREDENTIAL_SHARED: 'Credential shared',
};

const TONE = {
  CREDENTIAL_REVOKED: 'bad',
  ISSUER_SUSPENDED: 'bad',
  CREDENTIAL_ISSUED: 'ok',
  ISSUER_AUTHORIZED: 'ok',
};

export default function AdminAudit() {
  const { data, loading, error, reload } = useAsync(() => adminService.audit({ limit: 100 }), []);
  const [filter, setFilter] = useState('');

  const rows = useMemo(
    () => (data || []).filter((e) => !filter || e.action === filter),
    [data, filter],
  );

  const columns = [
    {
      key: 'action',
      header: 'Action',
      primary: true,
      cell: (row) => (
        <Badge tone={TONE[row.action] || 'neutral'}>{ACTION_LABEL[row.action] || row.action}</Badge>
      ),
    },
    { key: 'actor', header: 'Actor', cell: (row) => <span className="text-ink">{row.actor}</span> },
    {
      key: 'entity',
      header: 'Entity',
      cell: (row) => <span className="data text-ink-muted">{row.entity}</span>,
    },
    {
      key: 'tx',
      header: 'Transaction',
      cell: (row) =>
        row.transactionRef ? (
          <span className="inline-flex items-center gap-2">
            <DataValue value={row.transactionRef} truncate label="transaction reference" />
            {row.simulated ? (
              <span className="text-2xs text-ink-soft">simulated</span>
            ) : null}
          </span>
        ) : (
          <span className="text-ink-soft">Off-chain</span>
        ),
    },
    {
      key: 'time',
      header: 'Timestamp',
      className: 'text-right whitespace-nowrap',
      cell: (row) => <span className="text-ink-soft">{formatDateTime(row.timestamp)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit activity"
        description="Every registry action, with its transaction reference where one exists."
        action={
          <Select
            aria-label="Filter by action"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="All actions"
            options={Object.entries(ACTION_LABEL).map(([value, label]) => ({ value, label }))}
            className="w-56"
          />
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            caption="Audit log"
            empty={
              <EmptyState
                title={filter ? 'No entries of this type' : 'No activity recorded'}
                description={
                  filter
                    ? 'Change the filter to see other registry actions.'
                    : 'Actions taken across the registry will be listed here.'
                }
              />
            }
          />
        )}
      </Card>
    </>
  );
}
