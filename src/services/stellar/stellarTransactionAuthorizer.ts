import {
  PreparedPaymentTransaction,
  TransactionAuthorization,
} from '../../types/transaction.types';

/**
 * Strict Transaction Authorization Boundary Service
 *
 * Enforces that no transaction can be signed without explicit user confirmation.
 * The authorization token is mathematically bound to the exact 64-character
 * transaction hash of the prepared transaction.
 *
 * TAMPER INVALIDATION:
 * If ANY transaction field (recipient, amount, asset, memo, fee, network) is modified,
 * the transaction hash changes, automatically invalidating any prior authorization.
 */
export class StellarTransactionAuthorizer {
  /**
   * Generates a valid authorization token for an explicitly confirmed transaction.
   */
  public static authorizeTransaction(
    preparedTx: PreparedPaymentTransaction
  ): TransactionAuthorization {
    if (!preparedTx.transactionHash || preparedTx.transactionHash.length !== 64) {
      throw new Error('Cannot authorize transaction without valid 64-character hash.');
    }

    return {
      transactionHash: preparedTx.transactionHash,
      authorizedAt: Date.now(),
      userConfirmed: true,
    };
  }

  /**
   * Validates whether an authorization token is valid for a given transaction.
   */
  public static isAuthorized(
    preparedTx: PreparedPaymentTransaction,
    authorization?: TransactionAuthorization
  ): boolean {
    if (!authorization) return false;
    if (!authorization.userConfirmed) return false;
    if (authorization.transactionHash !== preparedTx.transactionHash) return false;

    // Optional freshness check (authorization valid for up to 5 minutes)
    const MAX_AUTH_AGE_MS = 5 * 60 * 1000;
    if (Date.now() - authorization.authorizedAt > MAX_AUTH_AGE_MS) {
      return false;
    }

    return true;
  }
}
