import { useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';
import { WalletCreationService, WalletCreationResult } from '../services/wallet/walletCreationService';
import { WalletRestorationService, WalletRestorationResult } from '../services/wallet/walletRestorationService';
import { WalletKeyStorage } from '../services/security/walletKeyStorage';
import { StellarTestnetFundingService } from '../services/stellar/stellarTestnetFundingService';
import { fetchStellarAccount } from '../services/stellar/account';
import { BackupChallenge, FriendbotResponse } from '../types/wallet';

export function useWallet() {
  const {
    publicKey,
    status,
    network,
    balances,
    isBackedUp,
    isUnlocked,
    isLoading,
    errorMessage,
    setPublicKey,
    setBalances,
    setStatus,
    setBackedUp,
    setUnlocked,
    setLoading,
    setError,
    resetWallet,
    initializeFromStorage,
  } = useWalletStore();

  /**
   * Refreshes balances from the Horizon server.
   */
  const refreshBalances = useCallback(
    async (targetKey?: string) => {
      const key = targetKey || publicKey;
      if (!key) return;

      try {
        const result = await fetchStellarAccount(key);
        setBalances(result.balances);
      } catch {
        // Account may not be created on chain yet (empty balance)
        setBalances([]);
      }
    },
    [publicKey, setBalances]
  );

  /**
   * Generates a new 24-word non-custodial wallet and stores it in Keystore.
   */
  const createWallet = useCallback(async (): Promise<WalletCreationResult> => {
    setLoading(true);
    try {
      const result = await WalletCreationService.createWallet();
      setPublicKey(result.publicKey);
      setBackedUp(false);
      setUnlocked(true);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Wallet creation failed.';
      setError(msg);
      throw err;
    }
  }, [setLoading, setPublicKey, setBackedUp, setUnlocked, setError]);

  /**
   * Restores an existing wallet from a 24-word or 12-word recovery phrase.
   */
  const restoreWallet = useCallback(
    async (mnemonic: string, passphrase = ''): Promise<WalletRestorationResult> => {
      setLoading(true);
      try {
        const result = await WalletRestorationService.restoreFromMnemonic(mnemonic, passphrase);
        setPublicKey(result.publicKey);
        setBackedUp(true);
        setUnlocked(true);
        setLoading(false);

        // Fetch balances in background
        void refreshBalances(result.publicKey);
        return result;
      } catch (err) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Wallet restoration failed.';
        setError(msg);
        throw err;
      }
    },
    [setLoading, setPublicKey, setBackedUp, setUnlocked, refreshBalances, setError]
  );

  /**
   * Creates a random backup verification challenge for a mnemonic phrase.
   */
  const createBackupChallenge = useCallback((mnemonic: string): BackupChallenge => {
    return WalletCreationService.createBackupChallenge(mnemonic);
  }, []);

  /**
   * Verifies the user's answers to the backup challenge.
   */
  const verifyBackup = useCallback(
    async (
      answers: { index: number; selectedWord: string }[],
      challenge: BackupChallenge
    ): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      try {
        const result = await WalletCreationService.verifyBackupAnswers(answers, challenge);
        if (result.success) {
          setBackedUp(true);
        }
        setLoading(false);
        return result;
      } catch (err) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : 'Verification failed.';
        return { success: false, error: msg };
      }
    },
    [setLoading, setBackedUp]
  );

  /**
   * Requests 10,000 Testnet XLM from Friendbot.
   */
  const fundTestnetAccount = useCallback(async (): Promise<FriendbotResponse> => {
    if (!publicKey) {
      return { success: false, message: 'No active wallet to fund.' };
    }

    setLoading(true);
    try {
      const response = await StellarTestnetFundingService.fundAccount(publicKey);
      if (response.success) {
        // Give Horizon a brief moment to index the transaction then reload
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await refreshBalances(publicKey);
      }
      setLoading(false);
      return response;
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Funding failed.';
      return { success: false, message: msg };
    }
  }, [publicKey, setLoading, refreshBalances]);

  /**
   * Clears the current wallet from hardware Keystore and resets store.
   */
  const disconnectAndClearWallet = useCallback(async () => {
    await WalletKeyStorage.clearWallet();
    resetWallet();
  }, [resetWallet]);

  return {
    publicKey,
    status,
    network,
    balances,
    isBackedUp,
    isUnlocked,
    isLoading,
    errorMessage,
    createWallet,
    restoreWallet,
    createBackupChallenge,
    verifyBackup,
    refreshBalances,
    fundTestnetAccount,
    disconnectAndClearWallet,
    initializeFromStorage,
    setStatus,
  };
}
