import { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import DataValue from '../components/common/DataValue';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { Textarea } from '../components/common/Input';
import { useAsync, useMutation } from '../hooks/useAsync';
import adminService from '../services/adminService';
import { useToast } from '../context/ToastContext';
import { ISSUER_STATUS } from '../utils/constants';
import { formatDate } from '../utils/format';

export default function AdminIssuers() {
  const { data, loading, error, reload } = useAsync(() => adminService.listIssuers(), []);
  const toast = useToast();

  const [authorizeTarget, setAuthorizeTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [reason, setReason] = useState('');

  const authorize = useMutation((issuer) =>
    issuer.status === ISSUER_STATUS.SUSPENDED
      ? adminService.setIssuerStatus(issuer.id, ISSUER_STATUS.AUTHORIZED)
      : adminService.authorizeIssuer({ issuerId: issuer.id, walletAddress: issuer.walletAddress }),
  );
  const suspend = useMutation((issuer, why) =>
    adminService.setIssuerStatus(issuer.id, ISSUER_STATUS.SUSPENDED, why),
  );

  const confirmAuthorize = async () => {
    try {
      await authorize.mutate(authorizeTarget);
      toast.success((authorizeTarget.organization || authorizeTarget.name) + ' can now issue credentials.');
      setAuthorizeTarget(null);
      reload();
    } catch (err) {
      toast.error(err?.message || 'The issuer could not be authorised.');
    }
  };

  const confirmSuspend = async () => {
    try {
      await suspend.mutate(suspendTarget, reason);
      toast.success((suspendTarget.organization || suspendTarget.name) + ' can no longer issue credentials.');
      setSuspendTarget(null);
      setReason('');
      reload();
    } catch (err) {
      toast.error(err?.message || 'The issuer could not be suspended.');
    }
  };

  const columns = [
    {
      key: 'issuer',
      header: 'Issuer',
      primary: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{row.organization || row.name}</p>
          <p className="truncate text-xs text-ink-soft">{row.name} · {row.email}</p>
        </div>
      ),
    },
    {
      key: 'wallet',
      header: 'Wallet address',
      cell: (row) => <DataValue value={row.walletAddress} truncate label="wallet address" />,
    },
    {
      key: 'issued',
      header: 'Issued',
      cell: (row) => <span className="tabular-nums">{row.credentialsIssued ?? 0}</span>,
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setViewTarget(row)}>
            View
          </Button>
          {row.status !== ISSUER_STATUS.AUTHORIZED ? (
            <Button size="sm" onClick={() => setAuthorizeTarget(row)}>
              Authorise
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setSuspendTarget(row)}>
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Issuer management"
        description="Only authorised organisations can anchor new credentials. Suspending an issuer stops future issuance; it does not revoke credentials already issued."
      />

      <Card className="overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <Table
            columns={columns}
            rows={data || []}
            caption="Registered issuing organisations"
            empty={
              <EmptyState
                title="No issuers registered"
                description="Organisations appear here once they register with the registry."
                icon="records"
              />
            }
          />
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(authorizeTarget)}
        onCancel={() => setAuthorizeTarget(null)}
        onConfirm={confirmAuthorize}
        pending={authorize.pending}
        tone="primary"
        title="Authorise this issuer?"
        confirmLabel="Authorise issuer"
        description={authorizeTarget?.organization || authorizeTarget?.name}
      >
        <p className="text-sm text-ink-muted">
          The organisation will be able to issue credentials immediately. This writes an issuer
          authorisation to the registry contract.
        </p>
        {authorizeTarget ? (
          <div className="mt-4 rounded-lg bg-canvas p-3">
            <p className="text-xs text-ink-soft">Wallet address</p>
            <DataValue value={authorizeTarget.walletAddress} label="wallet address" />
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onCancel={() => {
          setSuspendTarget(null);
          setReason('');
        }}
        onConfirm={confirmSuspend}
        pending={suspend.pending}
        title="Suspend this issuer?"
        confirmLabel="Suspend issuer"
        description={suspendTarget?.organization || suspendTarget?.name}
      >
        <p className="text-sm text-ink-muted">
          The organisation will not be able to issue further credentials. Credentials it has
          already issued stay valid until revoked.
        </p>
        <Textarea
          className="mt-4"
          label="Reason (recorded in the audit log)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Accreditation under review"
        />
      </ConfirmDialog>

      <Modal
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title={viewTarget?.organization || viewTarget?.name || 'Issuer'}
        description="Registry record"
      >
        {viewTarget ? (
          <dl className="space-y-3.5 text-sm">
            {[
              ['Contact', viewTarget.name],
              ['Email', viewTarget.email],
              ['Credentials issued', String(viewTarget.credentialsIssued ?? 0)],
              ['Authorised on', viewTarget.authorizedAt ? formatDate(viewTarget.authorizedAt) : '—'],
              ['Suspended on', viewTarget.suspendedAt ? formatDate(viewTarget.suspendedAt) : '—'],
              ['Suspension reason', viewTarget.suspensionReason || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="text-right text-ink">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-6">
              <dt className="text-ink-soft">Status</dt>
              <dd>
                <StatusBadge status={viewTarget.status} />
              </dd>
            </div>
            <div className="border-t border-line pt-3.5">
              <dt className="mb-1 text-ink-soft">Wallet address</dt>
              <dd>
                <DataValue value={viewTarget.walletAddress} label="wallet address" />
              </dd>
            </div>
          </dl>
        ) : null}
      </Modal>
    </>
  );
}
