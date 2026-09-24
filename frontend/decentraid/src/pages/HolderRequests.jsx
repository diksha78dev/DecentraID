import { useState, useMemo } from 'react';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import CredentialCard from '../components/credentials/CredentialCard';
import { useAsync, useMutation } from '../hooks/useAsync';
import verificationService from '../services/verificationService';
import credentialService from '../services/credentialService';
import { useToast } from '../context/ToastContext';
import { REQUEST_STATUS } from '../utils/constants';
import { formatDate, effectiveStatus } from '../utils/format';

export default function HolderRequests() {
  const requests = useAsync(() => verificationService.listRequests(), []);
  const credentials = useAsync(() => credentialService.list(), []);
  const toast = useToast();

  const [active, setActive] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const respond = useMutation((id, payload) => verificationService.respond(id, payload));

  /**
   * When the verifier asked for a specific credential or type, the matching
   * credentials are offered first — but the holder can still share any
   * credential they hold, or none at all.
   */
  const candidates = useMemo(() => {
    const all = credentials.data || [];
    if (!active) return all;
    const preferred = all.filter(
      (c) =>
        (active.credentialId && c.credentialId === active.credentialId) ||
        (active.credentialType && c.type === active.credentialType),
    );
    const rest = all.filter((c) => !preferred.includes(c));
    return [...preferred, ...rest];
  }, [credentials.data, active]);

  const openRequest = (request) => {
    setActive(request);
    const match = (credentials.data || []).find(
      (c) =>
        (request.credentialId && c.credentialId === request.credentialId) ||
        (request.credentialType && c.type === request.credentialType),
    );
    setSelectedId(match?.credentialId || null);
  };

  const close = () => {
    setActive(null);
    setSelectedId(null);
  };

  const approve = async () => {
    if (!selectedId) return;
    try {
      await respond.mutate(active.id, { decision: 'APPROVE', credentialId: selectedId });
      toast.success(selectedId + ' shared with ' + active.verifierName + '.');
      close();
      requests.reload();
    } catch (err) {
      toast.error(err?.message || 'The response could not be sent.');
    }
  };

  const reject = async () => {
    try {
      await respond.mutate(active.id, { decision: 'REJECT' });
      toast.info('Request declined. Nothing was shared.');
      close();
      requests.reload();
    } catch (err) {
      toast.error(err?.message || 'The response could not be sent.');
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Request ID',
      primary: true,
      cell: (row) => <span className="data text-ink">{row.id}</span>,
    },
    { key: 'verifier', header: 'Verifier', cell: (row) => row.verifierName },
    {
      key: 'credential',
      header: 'Requested',
      cell: (row) => (
        <span className="text-ink">
          {row.credentialId || row.credentialType || 'Any credential'}
        </span>
      ),
    },
    { key: 'created', header: 'Date', cell: (row) => formatDate(row.createdAt) },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (row) =>
        row.status === REQUEST_STATUS.PENDING ? (
          <Button size="sm" onClick={() => openRequest(row)}>
            Review request
          </Button>
        ) : (
          <span className="text-sm text-ink-soft">
            {row.status === REQUEST_STATUS.APPROVED ? 'Shared ' + row.sharedCredentialId : 'Declined'}
          </span>
        ),
    },
  ];

  const selected = candidates.find((c) => c.credentialId === selectedId);
  const selectedStatus = selected ? effectiveStatus(selected) : null;

  return (
    <>
      <PageHeader
        title="Verification requests"
        description="Organisations asking to confirm one of your credentials. You decide what is shared."
      />

      <Card className="overflow-hidden">
        {requests.loading ? (
          <TableSkeleton rows={4} />
        ) : requests.error ? (
          <ErrorState
            title="Unable to load verification requests"
            error={requests.error}
            onRetry={requests.reload}
          />
        ) : (
          <Table
            columns={columns}
            rows={requests.data || []}
            caption="Verification requests addressed to you"
            empty={
              <EmptyState
                icon="inbox"
                title="No requests yet"
                description="When a verifier asks to check one of your credentials, it will appear here for your approval."
              />
            }
          />
        )}
      </Card>

      <Modal
        open={Boolean(active)}
        onClose={respond.pending ? undefined : close}
        size="lg"
        title={'Request from ' + (active?.verifierName || '')}
        description={active ? 'Request ' + active.id : ''}
        footer={
          <>
            <Button variant="secondary" onClick={reject} disabled={respond.pending}>
              Reject
            </Button>
            <Button onClick={approve} loading={respond.pending} disabled={!selectedId}>
              Approve &amp; share
            </Button>
          </>
        }
      >
        {active ? (
          <>
            <dl className="mb-5 grid gap-3 rounded-lg bg-canvas p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-soft">Requested credential</dt>
                <dd className="mt-0.5 text-ink">
                  {active.credentialId || active.credentialType || 'Any credential'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">Purpose</dt>
                <dd className="mt-0.5 text-ink">{active.purpose || 'Not stated'}</dd>
              </div>
            </dl>

            <h3 className="mb-1 text-sm font-semibold text-ink">Choose what to share</h3>
            <p className="mb-4 text-sm text-ink-soft">
              The verifier receives the credential metadata and a verification result — not your
              documents.
            </p>

            {credentials.loading ? (
              <p className="text-sm text-ink-soft">Loading your credentials…</p>
            ) : !candidates.length ? (
              <EmptyState
                title="You hold no credentials to share"
                description="Once an issuer issues a credential to your wallet, you can share it here."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {candidates.map((c) => (
                  <CredentialCard
                    key={c.id}
                    credential={c}
                    selectable
                    selected={selectedId === c.credentialId}
                    onSelect={(cred) => setSelectedId(cred.credentialId)}
                  />
                ))}
              </div>
            )}

            {selected && selectedStatus !== 'ACTIVE' ? (
              <p className="mt-4 rounded-md border border-warn-500/30 bg-warn-50 px-3.5 py-2.5 text-sm text-warn-700">
                This credential is {selectedStatus.toLowerCase()}. The verifier will receive that
                result rather than a valid one.
              </p>
            ) : null}

            {respond.error ? (
              <div className="mt-4">
                <ErrorState compact error={respond.error} />
              </div>
            ) : null}
          </>
        ) : null}
      </Modal>
    </>
  );
}
