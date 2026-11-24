import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { StellarAccountService } from '../services/stellar/stellarAccountService';
import { StellarBalanceService } from '../services/stellar/stellarBalanceService';
import { AccountReserveDetails } from '../../src/types/stellar';

export function useStellarBalances() {
  const { publicKey, setBalances } = useWalletStore();
  const [reserves, setReserves] = useState<AccountReserveDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const accountInfo = await StellarAccountService.getAccountInfo(publicKey);
      if (accountInfo) {
        const reserveDetails =
          StellarBalanceService.calculateAccountReserves(accountInfo);
        setReserves(reserveDetails);

        const assetBalances = await StellarAccountService.getBalances(publicKey);
        setBalances(assetBalances);
      } else {
        setReserves(null);
        setBalances([]);
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch account balance.';
      setError(msg);
    }
  }, [publicKey, setBalances]);

  useEffect(() => {
    let isMounted = true;
    if (publicKey) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          void refresh();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [publicKey, refresh]);

  return {
    reserves,
    isLoading,
    error,
    refresh,
  };
}
