import { useCallback, useEffect, useState } from 'react';
import walletService from '../services/walletService';

/** Connects to an injected EVM wallet and tracks account/network changes. */
export function useWallet() {
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const available = walletService.isAvailable();

  const refresh = useCallback(async () => {
    const addr = await walletService.getConnectedAddress();
    setAddress(addr);
    setNetwork(addr ? await walletService.getNetwork() : null);
  }, []);

  useEffect(() => {
    refresh();
    const offAccounts = walletService.onAccountsChanged((accounts) => {
      setAddress(accounts?.[0] || null);
    });
    const offChain = walletService.onChainChanged(() => refresh());
    return () => {
      offAccounts?.();
      offChain?.();
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await walletService.connectWallet();
      setAddress(addr);
      setNetwork(await walletService.getNetwork());
      return addr;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    walletService.disconnect();
    setAddress(null);
    setNetwork(null);
  }, []);

  return { address, network, connect, disconnect, connecting, error, setError, available };
}

export default useWallet;
