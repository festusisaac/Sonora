import {
  PreparedTransactionDetails,
  TransactionSubmissionResult,
} from '../../types/transaction';
import { validateStellarAddress } from './validation';
import { getHorizonServer } from './client';

/**
 * Transaction Service Foundation
 *
 * SECURITY ENFORCEMENT:
 * - Real signing is NOT implemented in Phase 1 / Phase 1.1.
 * - Transactions require explicit user confirmation before signing.
 * - Testnet Horizon only.
 * - No fake transaction success responses.
 */

export interface TransactionBuilderInput {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string;
  assetCode: string;
  assetIssuer?: string;
  memo?: string;
}

/**
 * Builds and validates a transaction structure
 */
export async function prepareTransaction(
  input: TransactionBuilderInput
): Promise<PreparedTransactionDetails> {
  const destValidation = validateStellarAddress(input.destinationPublicKey);
  if (!destValidation.isValid) {
    throw new Error(`Invalid destination address: ${destValidation.error}`);
  }

  const numAmount = parseFloat(input.amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Transaction amount must be a positive number');
  }

  return {
    recipientAddress: input.destinationPublicKey,
    amount: input.amount,
    assetCode: input.assetCode.toUpperCase(),
    assetIssuer: input.assetIssuer,
    feeStroops: '100',
    memo: input.memo,
    isConfirmedByUser: false,
  };
}

/**
 * Validates a 64-character hexadecimal transaction hash
 */
export function isValidTransactionHash(hash: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(hash.trim());
}

/**
 * Transaction Verification Interface
 * Checks real transaction status on Stellar Testnet by hash.
 * Never returns a fake success response.
 */
export async function verifyTransactionByHash(
  txHash: string
): Promise<TransactionSubmissionResult> {
  const trimmedHash = txHash.trim();

  if (!isValidTransactionHash(trimmedHash)) {
    return {
      successful: false,
      transactionHash: trimmedHash,
      errorMessage: 'Invalid transaction hash: expected 64 hexadecimal characters.',
    };
  }

  const server = getHorizonServer();
  try {
    const tx = await server.transactions().transaction(trimmedHash).call();
    return {
      successful: tx.successful,
      transactionHash: tx.hash,
      ledger: tx.ledger_attr,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Transaction verification failed';
    return {
      successful: false,
      transactionHash: trimmedHash,
      errorMessage: message,
    };
  }
}
