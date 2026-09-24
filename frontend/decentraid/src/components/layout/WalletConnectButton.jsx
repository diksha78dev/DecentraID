import Button from '../common/Button';
import Badge from '../common/Badge';
import { useWallet } from '../../hooks/useWallet';
import { shortenHex } from '../../utils/format';
import { useToast } from '../../context/ToastContext';

/**
 * Wallet connection is optional in this build: the backend owns authentication.
 * The address is shown so a demonstration can point at the account that would
 * sign on-chain transactions.
 */
export default function WalletConnectButton({ compact = false }) {
  const { address, network, connect, disconnect, connecting, available } = useWallet();
  const toast = useToast();

  const onConnect = async () => {
    try {
      const addr = await connect();
      toast.success('Wallet connected · ' + shortenHex(addr));
    } catch (err) {
      toast.error(err?.message || 'Wallet connection rejected.');
    }
  };

  if (!available) {
    return (
      <Badge tone="neutral" className={compact ? '' : 'h-9 px-3'}>
        No wallet detected
      </Badge>
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        {network && !network.matches ? (
          <Badge tone="warn" dot>
            Wrong network
          </Badge>
        ) : null}
        <button
          type="button"
          onClick={disconnect}
          title={address + ' — click to disconnect'}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm hover:bg-canvas"
        >
          <span className="h-2 w-2 rounded-full bg-ok-500" />
          <span className="data">{shortenHex(address)}</span>
        </button>
      </div>
    );
  }

  return (
    <Button variant="secondary" size="md" onClick={onConnect} loading={connecting}>
      Connect wallet
    </Button>
  );
}
