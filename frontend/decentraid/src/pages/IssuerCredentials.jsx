import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { Input, Select, Textarea } from '../components/common/Input';
import { useAsync, useMutation } from '../hooks/useAsync';
import credentialService from '../services/credentialService';
import { useToast } from '../context/ToastContext';
import { formatDate, effectiveStatus } from '../utils/format';

export default function IssuerCredentials() {
  const { data, loading, error, reload } = useAsync(() => credentialService.list(), []);
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [reason, setReason] = useState('');

  const revoke = useMutation((credential, why) => credentialService.revoke(credential.credentialId, why));

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data || []).filter((c) => {
      const matchesQuery =
        !needle ||
        c.credentialId.toLowerCase().includes(needle) ||
        c.type.toLowerCase().includes(needle) ||
        c.holderName?.toLowerCase().includes(needle);
      const matchesStatus = !status || effectiveStatus(c) === status;
      return matchesQuery && matchesStatus;
    });
  }, [data, query, status]);

  const confirmRevoke = async () => {
    try {
      await revoke.mutate(revokeTarget, reason);
      toast.success(revokeTarget.credentialId + ' revoked. Verifiers now receive REVOKED.');
      setRevokeTarget(null);
      setReason('');
      reload();
    } catch (err) {
      toast.error(err?.message || 'The credential could not be revoked.');
    }
  };

  const columns = [
    {
      key: 'credentialId',
      header: 'Credential ID',
      primary: true,
      cell: (row) => (
        <Link
          to={'/credentials/' + encodeURIComponent(row.credentialId)}
          className="data text-ink hover:text-seal-600"
        >
          {row.credentialId}
        </Link>
      ),
    },
    { key: 'holder', header: 'Holder', cell: (row) => row.holderName },
    { key: 'type', header: 'Type', cell: (row) => row.type },
    { key: 'issued', header: 'Issued', cell: (row) => formatDate(row.issuedAt) },
    {
      key: 'expires',
      header: 'Expires',
      cell: (row) => (row.expiresAt ? formatDate(row.expiresAt) : 'No expiry'),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={effectiveStatus(row)} /> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Link to={'/credentials/' + encodeURIComponent(row.credentialId)}>
            <Button size="sm" variant="ghost">
              View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            disabled={row.status === 'REVOKED'}
            onClick={() => setRevokeTarget(row)}
          >
            {row.status === 'REVOKED' ? 'Revoked' : 'Revoke'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Issued credentials"
        description="Revoking a credential takes effect for every verifier immediately."
        action={
          <Link to="/issuer/issue">
            <Button>Issue credential</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Search by credential ID, type or holder"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search credentials"
        />
        <Select
          className="sm:w-48"
          aria-label="Filter by status"
          placeholder="All statuses"
          options={['ACTIVE', 'REVOKED', 'EXPIRED']}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            caption="Credentials issued by your organisation"
            empty={
              <EmptyState
                title={query || status ? 'Nothing matches those filters' : 'No credentials issued yet'}
                description={
                  query || status
                    ? 'Clear the search or status filter to see all credentials.'
                    : 'Issue a credential to a holder to see it listed here.'
                }
                action={
                  !query && !status ? (
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

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onCancel={() => {
          setRevokeTarget(null);
          setReason('');
        }}
        onConfirm={confirmRevoke}
        pending={revoke.pending}
        title="Revoke this credential?"
        confirmLabel="Revoke credential"
        description={revokeTarget ? revokeTarget.credentialId + ' · ' + revokeTarget.holderName : ''}
      >
        <p className="text-sm text-ink-muted">
          Anyone verifying this credential will receive REVOKED from now on. The frontend cannot
          reverse this — restoring it requires a new credential.
        </p>
        <Textarea
          className="mt-4"
          label="Reason (shown to verifiers)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Issued in error"
        />
      </ConfirmDialog>
    </>
  );
}
