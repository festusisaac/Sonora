import { StellarNetworkConfig } from './stellarNetworkConfig';
import { VerifiedTransactionResult } from '../../types/transaction.types';

export class StellarTransactionVerificationService {
  /**
   * Verifies the actual ledger result of a transaction on Stellar Testnet.
   * Confirms ledger inclusion, success status, actual fee charged, and payment details.
   */
  public static async verifyTransaction(
    txHash: string
  ): Promise<VerifiedTransactionResult> {
    StellarNetworkConfig.assertTestnet();

    const trimmedHash = txHash.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(trimmedHash)) {
      return {
        status: 'failed',
        transactionHash: trimmedHash,
        source: '',
        destination: '',
        assetCode: '',
        amount: '0',
        errorMessage: 'Invalid transaction hash: expected 64 hexadecimal characters.',
      };
    }

    const server = StellarNetworkConfig.getHorizonServer();

    try {
      // 1. Fetch transaction record from Horizon
      const tx = await server.transactions().transaction(trimmedHash).call();

      if (!tx) {
        return {
          status: 'pending',
          transactionHash: trimmedHash,
          source: '',
          destination: '',
          assetCode: '',
          amount: '0',
          errorMessage: 'Transaction not yet found on ledger. May be pending ingestion.',
        };
      }

      // 2. Fetch operations included in the transaction
      const ops = await tx.operations();
      const firstOp = ops.records[0] as any;

      let destination = '';
      let assetCode = 'XLM';
      let amount = '0';

      if (firstOp) {
        if (firstOp.type === 'payment') {
          destination = firstOp.to;
          assetCode = firstOp.asset_type === 'native' ? 'XLM' : firstOp.asset_code;
          amount = firstOp.amount;
        } else if (firstOp.type === 'create_account') {
          destination = firstOp.account;
          assetCode = 'XLM';
          amount = firstOp.starting_balance;
        }
      }

      return {
        status: tx.successful ? 'successful' : 'failed',
        transactionHash: tx.hash,
        ledger: tx.ledger_attr,
        actualFeeStroops: tx.fee_charged?.toString(),
        source: tx.source_account,
        destination,
        assetCode,
        amount,
        memo: tx.memo,
        timestamp: tx.created_at,
        errorMessage: tx.successful ? undefined : 'Transaction failed on ledger execution.',
      };
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as any).response?.status === 404
      ) {
        return {
          status: 'pending',
          transactionHash: trimmedHash,
          source: '',
          destination: '',
          assetCode: '',
          amount: '0',
          errorMessage: 'Transaction has not yet appeared on the ledger.',
        };
      }

      return {
        status: 'failed',
        transactionHash: trimmedHash,
        source: '',
        destination: '',
        assetCode: '',
        amount: '0',
        errorMessage:
          err instanceof Error ? err.message : 'Error verifying transaction on ledger.',
      };
    }
  }

  /**
   * Polls ledger verification until transaction is resolved or timeout reached.
   */
  public static async pollVerification(
    txHash: string,
    maxAttempts = 5,
    intervalMs = 2000
  ): Promise<VerifiedTransactionResult> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.verifyTransaction(txHash);
      if (result.status === 'successful' || result.status === 'failed') {
        return result;
      }
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    return {
      status: 'pending',
      transactionHash: txHash,
      source: '',
      destination: '',
      assetCode: '',
      amount: '0',
      errorMessage: 'Verification pending: transaction was submitted but ledger confirmation timed out.',
    };
  }
}
