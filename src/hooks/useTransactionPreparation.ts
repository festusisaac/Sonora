import { useState, useCallback } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import {
  StellarTransactionBuilderService,
  BuildTransactionParams,
} from '../services/stellar/stellarTransactionBuilder';
import { PreparedPaymentTransaction } from '../types/transaction.types';

export function useTransactionPreparation() {
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);

  const {
    currentPreparedTransaction,
    setPreparedTransaction,
    clearTransaction,
    setStatus,
  } = useTransactionStore();

  const prepareTransaction = useCallback(
    async (params: BuildTransactionParams): Promise<PreparedPaymentTransaction> => {
      setIsPreparing(true);
      setPrepareError(null);
      setStatus('validating');

      try {
        const prepared =
          await StellarTransactionBuilderService.preparePaymentTransaction(params);

        setPreparedTransaction(prepared);
        setIsPreparing(false);
        return prepared;
      } catch (err) {
        setIsPreparing(false);
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to prepare transaction.';
        setPrepareError(msg);
        setStatus('failed');
        throw err;
      }
    },
    [setPreparedTransaction, setStatus]
  );

  return {
    isPreparing,
    prepareError,
    preparedTransaction: currentPreparedTransaction,
    prepareTransaction,
    clearTransaction,
  };
}
