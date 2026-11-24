import { create } from 'zustand';
import { AssetBalance, NetworkType, WalletConnectionStatus } from '../types/wallet';
import { WalletKeyStorage } from '../services/security/walletKeyStorage';

export interface WalletStoreState {
  status: WalletConnectionStatus;
  publicKey: string | null;
  network: NetworkType;
  balances: AssetBalance[];
  isBackedUp: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
  errorMessage: string | null;

  // Actions
  setPublicKey: (key: string | null) => void;
  setBalances: (balances: AssetBalance[]) => void;
  setStatus: (status: WalletConnectionStatus) => void;
  setNetwork: (network: NetworkType) => void;
  setBackedUp: (backedUp: boolean) => void;
  setUnlocked: (unlocked: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeFromStorage: () => Promise<void>;
  resetWallet: () => void;
}

export const useWalletStore = create<WalletStoreState>((set) => ({
  status: 'idle',
  publicKey: null,
  network: 'TESTNET',
  balances: [],
  isBackedUp: false,
  isUnlocked: false,
  isLoading: false,
  lastUpdated: null,
  errorMessage: null,

  setPublicKey: (publicKey) =>
    set({
      publicKey,
      status: publicKey ? 'connected' : 'idle',
      isUnlocked: Boolean(publicKey),
      errorMessage: null,
    }),

  setBalances: (balances) =>
    set({
      balances,
      lastUpdated: Date.now(),
    }),

  setStatus: (status) => set({ status }),

  setNetwork: (network) => set({ network }),

  setBackedUp: (isBackedUp) => set({ isBackedUp }),

  setUnlocked: (isUnlocked) => set({ isUnlocked }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (errorMessage) =>
    set({
      errorMessage,
      status: 'error',
    }),

  initializeFromStorage: async () => {
    try {
      set({ isLoading: true });
      const pubKey = await WalletKeyStorage.getPublicKey();
      const isBackedUp = await WalletKeyStorage.isBackupVerified();

      if (pubKey) {
        set({
          publicKey: pubKey,
          status: 'connected',
          isBackedUp,
          isUnlocked: true,
          isLoading: false,
        });
      } else {
        set({
          publicKey: null,
          status: 'idle',
          isBackedUp: false,
          isUnlocked: false,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  resetWallet: () =>
    set({
      status: 'idle',
      publicKey: null,
      balances: [],
      isBackedUp: false,
      isUnlocked: false,
      isLoading: false,
      lastUpdated: null,
      errorMessage: null,
    }),
}));
