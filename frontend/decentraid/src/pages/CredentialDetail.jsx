import { useParams, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import Badge from '../components/common/Badge';
import DataValue from '../components/common/DataValue';
import ErrorState from '../components/common/ErrorState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Textarea } from '../components/common/Input';
import { useAsync, useMutation } from '../hooks/useAsync';
import credentialService from '../services/credentialService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';
import { formatDate, formatDateTime, effectiveStatus } from '../utils/format';
import { useState } from 'react';

export default function CredentialDetail() {
  const { credentialId } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [reason, setReason] = useState('');

  const { data, loading, error, reload } = useAsync(
    () => credentialService.getById(credentialId),
    [credentialId],
  );
  const revoke = useMutation((why) => credentialService.revoke(credentialId, why));

  const status = data ? effectiveStatus(data) : null;
  const canRevoke = role === ROLES.ISSUER && data?.issuerId === user?.id && data?.status === 'ACTIVE';

  const doRevoke = async () => {
    try {
      await revoke.mutate(reason);
      toast.success(credentialId + ' revoked.');
      setConfirmRevoke(false);
      setReason('');
      reload();
    } catch (err) {
      toast.error(err?.message || 'The credential could not be revoked.');
    }
  };

  if (loading && !data) {
    return (
      <Card className="flex items-center justify-center py-20">
        <LoadingSpinner size={28} label="Loading credential" />
      </Card>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Credential" description={credentialId} />
        <Card>
          <ErrorState title="Unable to load this credential" error={error} onRetry={reload} />
        </Card>
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <PageHeader
        title={data.type}
        description={data.title && data.title !== data.type ? data.title : undefined}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            {canRevoke ? (
              <Button variant="danger" onClick={() => setConfirmRevoke(true)}>
                Revoke
              </Button>
            ) : null}
            {role === ROLES.VERIFIER ? (
              <Link to={'/verification/' + encodeURIComponent(data.credentialId)}>
                <Button>Verify now</Button>
              </Link>
            ) : null}
          </div>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <Badge tone="brass">Blockchain-backed integrity record</Badge>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader title="Credential record" />
          <CardBody className="p-0">
            <dl className="divide-y divide-line">
              {[
                ['Credential ID', data.credentialId, 'mono'],
                ['Credential type', data.type],
                ['Issuer', data.issuerName],
                ['Holder', data.holderName],
                ['Issued at', formatDate(data.issuedAt)],
                ['Expires at', data.expiresAt ? formatDate(data.expiresAt) : 'No expiry'],
              ].map(([label, value, variant]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="text-sm text-ink-soft">{label}</dt>
                  <dd className={variant === 'mono' ? 'data text-ink' : 'text-sm text-ink'}>{value}</dd>
                </div>
              ))}

              <div className="px-5 py-3.5">
                <dt className="mb-1.5 text-sm text-ink-soft">Holder reference</dt>
                <dd>
                  <DataValue value={data.holderWallet} truncate label="holder wallet" />
                </dd>
              </div>

              <div className="px-5 py-3.5">
                <dt className="mb-1.5 text-sm text-ink-soft">Credential hash</dt>
                <dd>
                  <DataValue value={data.hash} truncate lead={20} tail={12} label="credential hash" />
                </dd>
              </div>

              {data.status === 'REVOKED' ? (
                <div className="bg-bad-50 px-5 py-3.5">
                  <dt className="text-sm font-medium text-bad-700">Revoked</dt>
                  <dd className="mt-1 text-sm text-bad-700/90">
                    {formatDateTime(data.revokedAt)}
                    {data.revocationReason ? ' · ' + data.revocationReason : ''}
                  </dd>
                </div>
              ) : null}
            </dl>
          </CardBody>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Blockchain record" />
            <CardBody className="space-y-4 text-sm">
              <div>
                <p className="text-ink-soft">Anchoring transaction</p>
                <div className="mt-1 space-y-1.5">
                  <DataValue
                    value={data.anchorTxRef}
                    truncate
                    lead={14}
                    tail={8}
                    label="anchoring transaction"
                  />
                  {data.simulated ? <Badge tone="brass">Simulated · mock mode</Badge> : null}
                </div>
              </div>
              {data.revocationTxRef ? (
                <div>
                  <p className="text-ink-soft">Revocation transaction</p>
                  <div className="mt-1">
                    <DataValue
                      value={data.revocationTxRef}
                      truncate
                      lead={14}
                      tail={8}
                      label="revocation transaction"
                    />
                  </div>
                </div>
              ) : null}
              <div>
                <p className="text-ink-soft">On-chain state</p>
                <p className="mt-0.5 text-ink">
                  {data.status === 'REVOKED' ? 'Revocation flag set' : 'Anchored and not revoked'}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Document</h2>
            {data.documentReference ? (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  Held off-chain by the issuing organisation at this reference.
                </p>
                <div className="mt-2 overflow-hidden">
                  <DataValue
                    value={data.documentReference}
                    truncate
                    lead={18}
                    tail={8}
                    label="document reference"
                  />
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">No document reference was recorded.</p>
            )}
            <p className="mt-4 border-t border-line pt-4 text-xs text-ink-soft">
              Only a hash of the metadata above is anchored. Personal information and the
              certificate document are never written to the blockchain.
            </p>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmRevoke}
        onCancel={() => setConfirmRevoke(false)}
        onConfirm={doRevoke}
        pending={revoke.pending}
        title="Revoke this credential?"
        confirmLabel="Revoke credential"
        description={data.credentialId + ' · ' + data.holderName}
      >
        <p className="text-sm text-ink-muted">
          Anyone verifying this credential will receive REVOKED from now on. This cannot be undone
          from the frontend.
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
