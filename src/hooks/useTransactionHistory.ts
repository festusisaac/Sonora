import { useState, useCallback, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useTransactionStore } from '../store/transactionStore';
import {
  StellarTransactionHistoryService,
  HistoryQueryOptions,
} from '../services/stellar/stellarTransactionHistoryService';

export function useTransactionHistory() {
  const { publicKey } = useWalletStore();
  const { history, setHistory, appendHistory } = useTransactionStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const fetchHistory = useCallback(
    async (options?: HistoryQueryOptions) => {
      if (!publicKey) return;

      setIsLoading(true);
      setError(null);

      try {
        const page =
          await StellarTransactionHistoryService.getAccountPaymentHistory(
            publicKey,
            options
          );

        if (options?.cursor) {
          appendHistory(page.items);
        } else {
          setHistory(page.items);
        }
        setNextCursor(page.nextCursor);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to load transaction history.';
        setError(msg);
      }
    },
    [publicKey, setHistory, appendHistory]
  );

  const loadMore = useCallback(() => {
    if (nextCursor && !isLoading) {
      fetchHistory({ cursor: nextCursor });
    }
  }, [nextCursor, isLoading, fetchHistory]);

  const refreshHistory = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    let isMounted = true;
    if (publicKey) {
      void Promise.resolve().then(() => {
        if (isMounted) {
          void fetchHistory();
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [publicKey, fetchHistory]);

  return {
    history,
    isLoading,
    error,
    hasMore: Boolean(nextCursor),
    loadMore,
    refreshHistory,
  };
}
