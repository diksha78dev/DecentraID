import { useParams, Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import DataValue from '../components/common/DataValue';
import Badge from '../components/common/Badge';
import ErrorState from '../components/common/ErrorState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import VerificationStatus from '../components/verification/VerificationStatus';
import { useAsync } from '../hooks/useAsync';
import verificationService from '../services/verificationService';
import { formatDate, formatDateTime } from '../utils/format';
import { CONFIG } from '../utils/constants';

/**
 * The verdict screen.
 *
 * Every visit re-runs the check rather than replaying a stored answer, which is
 * what makes a revoked credential report as revoked the moment the issuer acts.
 */
export default function VerificationResult() {
  const { credentialId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(
    () => verificationService.verify(credentialId),
    [credentialId],
  );

  const snapshot = data?.snapshot;
  const explorer = CONFIG.explorerBaseUrl && data?.transactionRef && !data?.simulated
    ? CONFIG.explorerBaseUrl.replace(/\/$/, '') + '/tx/' + data.transactionRef
    : null;

  return (
    <>
      <PageHeader
        title="Verification result"
        description={'Credential ' + credentialId}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button onClick={reload} loading={loading}>
              Check again
            </Button>
          </div>
        }
      />

      {loading && !data ? (
        <Card className="flex items-center justify-center py-20">
          <LoadingSpinner size={28} label="Checking the integrity record" />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState
            title="Verification request failed"
            error={error}
            onRetry={reload}
          />
        </Card>
      ) : data ? (
        <>
          <VerificationStatus result={data.result} reason={data.reason} />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader
                title="Credential record"
                description="Metadata covered by the anchored integrity record."
              />
              <CardBody className="p-0">
                <dl className="divide-y divide-line">
                  {[
                    ['Credential ID', snapshot?.credentialId || credentialId, 'mono'],
                    ['Credential type', snapshot?.type || '—'],
                    ['Title', snapshot?.title || '—'],
                    ['Issuer', snapshot?.issuerName || '—'],
                    ['Holder', snapshot?.holderName || '—'],
                    ['Issued on', snapshot?.issuedAt ? formatDate(snapshot.issuedAt) : '—'],
                    [
                      'Expires on',
                      snapshot?.expiresAt ? formatDate(snapshot.expiresAt) : 'No expiry',
                    ],
                  ].map(([label, value, variant]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <dt className="text-sm text-ink-soft">{label}</dt>
                      <dd className={variant === 'mono' ? 'data text-ink' : 'text-sm text-ink'}>
                        {value}
                      </dd>
                    </div>
                  ))}

                  <div className="px-5 py-3.5">
                    <dt className="mb-1.5 text-sm text-ink-soft">Holder reference</dt>
                    <dd>
                      <DataValue value={snapshot?.holderWallet} truncate label="holder wallet" />
                    </dd>
                  </div>

                  <div className="px-5 py-3.5">
                    <dt className="mb-1.5 text-sm text-ink-soft">Credential hash</dt>
                    <dd className="overflow-hidden">
                      <DataValue value={snapshot?.hash} truncate lead={20} tail={12} label="credential hash" />
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>

            <aside className="space-y-4">
              <Card>
                <CardHeader title="Check details" />
                <CardBody className="space-y-4 text-sm">
                  <div>
                    <p className="text-ink-soft">Verification reference</p>
                    <div className="mt-1">
                      <DataValue value={data.id} truncate lead={12} tail={6} label="verification reference" />
                    </div>
                  </div>
                  <div>
                    <p className="text-ink-soft">Checked at</p>
                    <p className="mt-0.5 text-ink">{formatDateTime(data.checkedAt)}</p>
                  </div>
                  <div>
                    <p className="text-ink-soft">Transaction reference</p>
                    {data.transactionRef ? (
                      <div className="mt-1 space-y-1.5">
                        <DataValue
                          value={data.transactionRef}
                          truncate
                          lead={14}
                          tail={8}
                          label="transaction reference"
                        />
                        {data.simulated ? (
                          <Badge tone="brass">Simulated · mock mode</Badge>
                        ) : explorer ? (
                          <a
                            href={explorer}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="block text-sm text-seal-600 underline underline-offset-4"
                          >
                            View on block explorer
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-0.5 text-ink-soft">Not available</p>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card className="p-5">
                <h2 className="text-sm font-semibold text-ink">What this check covers</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  The credential metadata above is hashed and compared with the integrity record
                  anchored by the issuer, along with the issuer&apos;s authorisation and the
                  revocation flag. The certificate document itself is held off-chain by the issuing
                  organisation.
                </p>
              </Card>

              {snapshot?.credentialId ? (
                <Link
                  to={'/credentials/' + encodeURIComponent(snapshot.credentialId)}
                  className="block"
                >
                  <Button variant="secondary" className="w-full">
                    Open credential detail
                  </Button>
                </Link>
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
    </>
  );
}
