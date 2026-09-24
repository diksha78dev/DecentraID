import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import CredentialCard from '../components/credentials/CredentialCard';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import DataValue from '../components/common/DataValue';
import { useAsync } from '../hooks/useAsync';
import credentialService from '../services/credentialService';
import verificationService from '../services/verificationService';
import { useAuth } from '../context/AuthContext';
import { REQUEST_STATUS } from '../utils/constants';
import { effectiveStatus } from '../utils/format';

export default function HolderDashboard() {
  const { user } = useAuth();
  const credentials = useAsync(() => credentialService.list(), []);
  const requests = useAsync(() => verificationService.listRequests({ status: REQUEST_STATUS.PENDING }), []);

  const list = credentials.data || [];
  const pending = requests.data?.length || 0;
  const active = list.filter((c) => effectiveStatus(c) === 'ACTIVE').length;

  return (
    <>
      <PageHeader
        title={'Credentials held by ' + (user?.name || 'you')}
        description="Nothing is shared until you approve a verification request."
      >
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge tone="seal">{active} active</Badge>
          <span className="inline-flex items-center gap-2 text-xs text-ink-soft">
            Wallet
            <DataValue value={user?.walletAddress} truncate label="your wallet address" />
          </span>
        </div>
      </PageHeader>

      {pending > 0 ? (
        <Card className="mb-6 flex flex-col gap-3 border-seal-200 bg-seal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-seal-700">
              {pending} verification request{pending > 1 ? 's are' : ' is'} waiting for your response.
            </p>
            <p className="mt-0.5 text-sm text-seal-700/80">
              You choose which credential to share, or decline the request.
            </p>
          </div>
          <Link to="/holder/requests">
            <Button size="sm">Review requests</Button>
          </Link>
        </Card>
      ) : null}

      {credentials.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : credentials.error ? (
        <Card>
          <ErrorState
            title="Unable to load credentials"
            error={credentials.error}
            onRetry={credentials.reload}
          />
        </Card>
      ) : !list.length ? (
        <Card>
          <EmptyState
            title="No credentials yet"
            description="Credentials issued to your wallet address will appear here automatically."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((credential) => (
            <CredentialCard key={credential.id} credential={credential} />
          ))}
        </div>
      )}
    </>
  );
}
