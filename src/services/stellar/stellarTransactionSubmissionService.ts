import { TransactionBuilder, Transaction } from '@stellar/stellar-sdk';
import { StellarNetworkConfig } from './stellarNetworkConfig';
import { TransactionSubmissionResult } from '../../types/transaction.types';
import { uint8ArrayToHex } from '../../utils/stroop';

export class StellarTransactionSubmissionService {
  /**
   * Submits a signed transaction envelope to Stellar Testnet.
   * Implements robust timeout and uncertainty handling to prevent double spends.
   */
  public static async submitSignedTransaction(
    signedXdr: string,
    expectedHash: string
  ): Promise<TransactionSubmissionResult> {
    StellarNetworkConfig.assertTestnet();

    const server = StellarNetworkConfig.getHorizonServer();
    const tx = TransactionBuilder.fromXDR(
      signedXdr,
      StellarNetworkConfig.getNetworkPassphrase()
    ) as Transaction;

    const actualHash = uint8ArrayToHex(tx.hash());
    if (actualHash !== expectedHash) {
      return {
        status: 'failed',
        successful: false,
        transactionHash: expectedHash,
        errorMessage: 'Transaction hash mismatch: signed envelope does not match expected hash.',
      };
    }

    try {
      const response = await server.submitTransaction(tx);
      return {
        status: 'submitted',
        successful: true,
        transactionHash: response.hash,
        ledger: response.ledger,
        horizonResult: response,
      };
    } catch (err: unknown) {
      return this.handleSubmissionError(err, actualHash);
    }
  }

  /**
   * Analyzes submission errors and handles timeouts by checking ledger state.
   */
  private static async handleSubmissionError(
    err: unknown,
    txHash: string
  ): Promise<TransactionSubmissionResult> {
    // Check if error is a network timeout or connection reset
    const isTimeout =
      (err instanceof Error &&
        (err.name === 'AbortError' ||
          err.message.toLowerCase().includes('timeout') ||
          err.message.toLowerCase().includes('network error'))) ||
      (typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'ECONNABORTED');

    if (isTimeout) {
      // Investigate whether the transaction made it to the ledger before returning
      const ledgerCheck = await this.investigateTransaction(txHash);
      if (ledgerCheck) {
        return ledgerCheck;
      }

      // If unresolved, flag as submission_uncertain to prevent accidental duplicate submission
      return {
        status: 'uncertain',
        successful: false,
        transactionHash: txHash,
        errorMessage:
          'Network submission timed out. The transaction status is uncertain. Please do not retry until verified.',
      };
    }

    // Parse Horizon transaction error codes
    let errorDetail = 'Transaction submission failed.';
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as any).response?.data
    ) {
      const data = (err as any).response.data;
      const resultCodes = data.extras?.result_codes;
      if (resultCodes) {
        const txCode = resultCodes.transaction;
        const opCodes = resultCodes.operations ? resultCodes.operations.join(', ') : '';
        errorDetail = `Stellar rejection [${txCode}${opCodes ? `: ${opCodes}` : ''}]: ${data.title || data.detail || ''}`;
      } else if (data.detail) {
        errorDetail = data.detail;
      }
    } else if (err instanceof Error) {
      errorDetail = err.message;
    }

    return {
      status: 'failed',
      successful: false,
      transactionHash: txHash,
      errorMessage: errorDetail,
    };
  }

  /**
   * Checks whether a transaction was actually included on the Stellar ledger.
   */
  public static async investigateTransaction(
    txHash: string
  ): Promise<TransactionSubmissionResult | null> {
    try {
      const server = StellarNetworkConfig.getHorizonServer();
      const tx = await server.transactions().transaction(txHash).call();

      if (tx) {
        return {
          status: tx.successful ? 'submitted' : 'failed',
          successful: tx.successful,
          transactionHash: tx.hash,
          ledger: tx.ledger_attr,
          horizonResult: tx,
        };
      }
      return null;
    } catch {
      // Horizon returns 404 if transaction is not on chain
      return null;
    }
  }
}
