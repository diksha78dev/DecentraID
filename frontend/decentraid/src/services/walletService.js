import { CONFIG, STORAGE_KEYS } from '../utils/constants';

/**
 * EVM wallet access, isolated so it can be swapped or extended without
 * touching components.
 *
 * This module never handles private keys or seed phrases. It only requests
 * accounts from an injected provider (MetaMask) and reads the current chain.
 */

export class WalletError extends Error {
  constructor(message, code = 'WALLET_ERROR') {
    super(message);
    this.name = 'WalletError';
    this.code = code;
  }
}

export const isWalletAvailable = () =>
  typeof window !== 'undefined' && Boolean(window.ethereum);

function remember(address) {
  try {
    if (address) localStorage.setItem(STORAGE_KEYS.WALLET, address);
    else localStorage.removeItem(STORAGE_KEYS.WALLET);
  } catch {
    /* ignore */
  }
}

export const walletService = {
  isAvailable: isWalletAvailable,

  /** Prompts the wallet for account access. Returns the selected address. */
  async connectWallet() {
    if (!isWalletAvailable()) {
      throw new WalletError(
        'No EVM wallet detected. Install MetaMask to connect an address.',
        'NO_PROVIDER',
      );
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts?.[0];
      if (!address) throw new WalletError('No account was shared by the wallet.', 'NO_ACCOUNT');
      remember(address);
      return address;
    } catch (err) {
      if (err?.code === 4001) {
        throw new WalletError('Wallet connection rejected.', 'REJECTED');
      }
      throw err instanceof WalletError
        ? err
        : new WalletError('Could not connect to the wallet.', 'CONNECT_FAILED');
    }
  },

  /** Returns an already-authorized address without prompting, or null. */
  async getConnectedAddress() {
    if (!isWalletAvailable()) return null;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const address = accounts?.[0] || null;
      remember(address);
      return address;
    } catch {
      return null;
    }
  },

  /** Current chain id (hex) plus whether it matches the configured network. */
  async getNetwork() {
    if (!isWalletAvailable()) return null;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return {
        chainId,
        name: CONFIG.chainName,
        expected: CONFIG.chainId || null,
        matches: CONFIG.chainId ? chainId?.toLowerCase() === CONFIG.chainId.toLowerCase() : true,
      };
    } catch {
      return null;
    }
  },

  /**
   * Signs a plaintext challenge. Reserved for wallet-based login once the
   * backend issues nonces; unused by the current authentication flow.
   */
  async signMessage(message, address) {
    if (!isWalletAvailable()) throw new WalletError('No wallet available.', 'NO_PROVIDER');
    const from = address || (await this.getConnectedAddress());
    if (!from) throw new WalletError('Connect a wallet before signing.', 'NO_ACCOUNT');
    try {
      return await window.ethereum.request({ method: 'personal_sign', params: [message, from] });
    } catch (err) {
      if (err?.code === 4001) throw new WalletError('Signature request rejected.', 'REJECTED');
      throw new WalletError('Could not sign the message.', 'SIGN_FAILED');
    }
  },

  disconnect() {
    remember(null);
  },

  onAccountsChanged(handler) {
    if (!isWalletAvailable()) return () => {};
    window.ethereum.on?.('accountsChanged', handler);
    return () => window.ethereum.removeListener?.('accountsChanged', handler);
  },

  onChainChanged(handler) {
    if (!isWalletAvailable()) return () => {};
    window.ethereum.on?.('chainChanged', handler);
    return () => window.ethereum.removeListener?.('chainChanged', handler);
  },
};

export default walletService;
