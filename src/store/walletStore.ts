import { create } from 'zustand';
import { AssetBalance, NetworkType, WalletConnectionStatus } from '../types/wallet';

export interface WalletStoreState {
  status: WalletConnectionStatus;
  publicKey: string | null;
  network: NetworkType;
  balances: AssetBalance[];
  lastUpdated: number | null;
  errorMessage: string | null;

  // Actions
  setPublicKey: (key: string | null) => void;
  setBalances: (balances: AssetBalance[]) => void;
  setStatus: (status: WalletConnectionStatus) => void;
  setNetwork: (network: NetworkType) => void;
  setError: (error: string | null) => void;
  resetWallet: () => void;
}

export const useWalletStore = create<WalletStoreState>((set) => ({
  status: 'idle',
  publicKey: null,
  network: 'TESTNET',
  balances: [],
  lastUpdated: null,
  errorMessage: null,

  setPublicKey: (publicKey) =>
    set({
      publicKey,
      status: publicKey ? 'connected' : 'idle',
      errorMessage: null,
    }),

  setBalances: (balances) =>
    set({
      balances,
      lastUpdated: Date.now(),
    }),

  setStatus: (status) => set({ status }),

  setNetwork: (network) => set({ network }),

  setError: (errorMessage) =>
    set({
      errorMessage,
      status: 'error',
    }),

  resetWallet: () =>
    set({
      status: 'idle',
      publicKey: null,
      balances: [],
      lastUpdated: null,
      errorMessage: null,
    }),
}));
