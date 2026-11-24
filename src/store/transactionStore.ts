import { create } from 'zustand';
import {
  TransactionLifecycleStatus,
  PreparedPaymentTransaction,
  TransactionAuthorization,
  TransactionSubmissionResult,
  VerifiedTransactionResult,
  TransactionHistoryItem,
  // Backward compatibility types
  PreparedTransactionDetails,
} from '../types/transaction.types';

export interface TransactionStoreState {
  status: TransactionLifecycleStatus;
  currentPreparedTransaction: PreparedPaymentTransaction | null;
  authorization: TransactionAuthorization | null;
  submissionResult: TransactionSubmissionResult | null;
  verificationResult: VerifiedTransactionResult | null;
  history: TransactionHistoryItem[];
  isLoading: boolean;
  errorMessage: string | null;

  // Backward compatibility fields
  currentTransaction: PreparedTransactionDetails | null;
  submissionHash: string | null;

  // Actions
  setPreparedTransaction: (tx: PreparedPaymentTransaction | null) => void;
  setAuthorization: (auth: TransactionAuthorization | null) => void;
  setStatus: (status: TransactionLifecycleStatus) => void;
  setSubmissionResult: (res: TransactionSubmissionResult | null) => void;
  setVerificationResult: (res: VerifiedTransactionResult | null) => void;
  setHistory: (items: TransactionHistoryItem[]) => void;
  appendHistory: (items: TransactionHistoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTransaction: () => void;

  // Backward compatibility actions
  setTransactionDraft: (draft: Omit<PreparedTransactionDetails, 'isConfirmedByUser'>) => void;
  setUserConfirmation: (confirmed: boolean) => void;
  setSubmissionHash: (hash: string | null) => void;
}

export const useTransactionStore = create<TransactionStoreState>((set) => ({
  status: 'draft',
  currentPreparedTransaction: null,
  authorization: null,
  submissionResult: null,
  verificationResult: null,
  history: [],
  isLoading: false,
  errorMessage: null,

  // Backward compatibility initial state
  currentTransaction: null,
  submissionHash: null,

  setPreparedTransaction: (currentPreparedTransaction) =>
    set({
      currentPreparedTransaction,
      status: currentPreparedTransaction ? 'awaiting_confirmation' : 'draft',
      authorization: null, // Clear authorization on any new transaction
      submissionResult: null,
      verificationResult: null,
      errorMessage: null,
    }),

  setAuthorization: (authorization) =>
    set({
      authorization,
      status: authorization ? 'awaiting_authentication' : 'awaiting_confirmation',
    }),

  setStatus: (status) => set({ status }),

  setSubmissionResult: (submissionResult) =>
    set({
      submissionResult,
      submissionHash: submissionResult?.transactionHash || null,
      status: submissionResult?.status === 'submitted' ? 'submitting' : 'failed',
    }),

  setVerificationResult: (verificationResult) =>
    set({
      verificationResult,
      status: verificationResult?.status === 'successful' ? 'successful' : 'failed',
    }),

  setHistory: (history) => set({ history }),

  appendHistory: (newItems) =>
    set((state) => ({ history: [...state.history, ...newItems] })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (errorMessage) =>
    set({
      errorMessage,
      status: 'failed',
      isLoading: false,
    }),

  clearTransaction: () =>
    set({
      status: 'draft',
      currentPreparedTransaction: null,
      authorization: null,
      submissionResult: null,
      verificationResult: null,
      currentTransaction: null,
      submissionHash: null,
      errorMessage: null,
      isLoading: false,
    }),

  // Backward compatibility implementations
  setTransactionDraft: (draft) =>
    set({
      currentTransaction: {
        ...draft,
        isConfirmedByUser: false,
      },
      status: 'awaiting_confirmation',
      errorMessage: null,
    }),

  setUserConfirmation: (confirmed) =>
    set((state) => ({
      currentTransaction: state.currentTransaction
        ? { ...state.currentTransaction, isConfirmedByUser: confirmed }
        : null,
      status: confirmed ? 'awaiting_confirmation' : 'draft',
    })),

  setSubmissionHash: (submissionHash) =>
    set({
      submissionHash,
      status: 'submitting',
    }),
}));
