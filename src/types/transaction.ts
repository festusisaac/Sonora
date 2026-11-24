export type TransactionPreparationStatus =
  | 'idle'
  | 'validating'
  | 'ready_for_confirmation'
  | 'signing_requested'
  | 'submitting'
  | 'submitted'
  | 'failed';

export interface PreparedTransactionDetails {
  recipientAddress: string;
  recipientName?: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string;
  feeStroops: string;
  memo?: string;
  isConfirmedByUser: boolean;
}

export interface TransactionSubmissionResult {
  successful: boolean;
  transactionHash?: string;
  ledger?: number;
  errorMessage?: string;
}
