export type TransactionLifecycleStatus =
  | 'draft'
  | 'validating'
  | 'awaiting_confirmation'
  | 'awaiting_authentication'
  | 'signing'
  | 'signed'
  | 'submitting'
  | 'pending_verification'
  | 'successful'
  | 'failed'
  | 'submission_uncertain';

export interface AssetIdentifier {
  code: string;
  issuer?: string;
  isNative: boolean;
}

export type MemoType = 'none' | 'text' | 'id' | 'hash' | 'return';

export interface MemoDetails {
  type: MemoType;
  value?: string;
}

export interface PreparedPaymentTransaction {
  transactionId: string;
  transactionHash: string; // 64-character SHA-256 hash of unsigned transaction
  sourceAddress: string;
  destinationAddress: string;
  recipientLabel?: string;
  asset: AssetIdentifier;
  amount: string; // Decimal string
  amountStroops: string; // BigInt string
  estimatedFeeStroops: string;
  totalEstimatedDebitStroops: string;
  memo: MemoDetails;
  isNewAccount: boolean;
  sequence: string;
  unsignedXdr: string;
  network: 'TESTNET';
  createdAt: number;
}

export interface TransactionAuthorization {
  transactionHash: string;
  authorizedAt: number;
  userConfirmed: boolean;
}

export interface SignedTransactionResult {
  signedXdr: string;
  transactionHash: string;
}

export interface TransactionSubmissionResult {
  status?: 'submitted' | 'failed' | 'uncertain';
  successful: boolean; // Backward-compatible boolean flag
  transactionHash?: string;
  ledger?: number;
  errorMessage?: string;
  horizonResult?: any;
}

export interface VerifiedTransactionResult {
  status: 'successful' | 'failed' | 'pending';
  transactionHash: string;
  ledger?: number;
  actualFeeStroops?: string;
  source: string;
  destination: string;
  assetCode: string;
  amount: string;
  memo?: string;
  timestamp?: string;
  errorMessage?: string;
}

export interface TransactionHistoryItem {
  id: string;
  type: 'payment' | 'create_account';
  direction: 'incoming' | 'outgoing';
  counterparty: string;
  assetCode: string;
  assetIssuer?: string;
  amount: string;
  transactionHash: string;
  createdAt: string;
  ledgerSequence?: number;
  memo?: string;
}

// Backward compatibility with Phase 1 types
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
