import { create } from 'zustand';
import {
  PreparedTransactionDetails,
  TransactionPreparationStatus,
} from '../types/transaction';

export interface TransactionStoreState {
  status: TransactionPreparationStatus;
  currentTransaction: PreparedTransactionDetails | null;
  submissionHash: string | null;
  errorMessage: string | null;

  // Actions
  setTransactionDraft: (draft: Omit<PreparedTransactionDetails, 'isConfirmedByUser'>) => void;
  setUserConfirmation: (confirmed: boolean) => void;
  setStatus: (status: TransactionPreparationStatus) => void;
  setSubmissionHash: (hash: string | null) => void;
  setError: (error: string | null) => void;
  clearTransaction: () => void;
}

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  status: 'idle',
  currentTransaction: null,
  submissionHash: null,
  errorMessage: null,

  setTransactionDraft: (draft) =>
    set({
      currentTransaction: {
        ...draft,
        isConfirmedByUser: false,
      },
      status: 'ready_for_confirmation',
      errorMessage: null,
    }),

  setUserConfirmation: (confirmed) =>
    set((state) => ({
      currentTransaction: state.currentTransaction
        ? { ...state.currentTransaction, isConfirmedByUser: confirmed }
        : null,
      status: confirmed ? 'ready_for_confirmation' : 'idle',
    })),

  setStatus: (status) => set({ status }),

  setSubmissionHash: (submissionHash) =>
    set({
      submissionHash,
      status: 'submitted',
    }),

  setError: (errorMessage) =>
    set({
      errorMessage,
      status: 'failed',
    }),

  clearTransaction: () =>
    set({
      status: 'idle',
      currentTransaction: null,
      submissionHash: null,
      errorMessage: null,
    }),
}));
