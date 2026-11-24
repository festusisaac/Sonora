import { StellarNetworkConfig } from './stellarNetworkConfig';
import { validateStellarAddress } from './validation';
import { TransactionHistoryItem } from '../../types/transaction.types';

export interface HistoryQueryOptions {
  limit?: number;
  cursor?: string;
  order?: 'asc' | 'desc';
}

export interface TransactionHistoryPage {
  items: TransactionHistoryItem[];
  nextCursor?: string;
  prevCursor?: string;
}

export class StellarTransactionHistoryService {
  /**
   * Fetches payment history for an account on Stellar Testnet.
   */
  public static async getAccountPaymentHistory(
    publicKey: string,
    options: HistoryQueryOptions = {}
  ): Promise<TransactionHistoryPage> {
    StellarNetworkConfig.assertTestnet();

    const validation = validateStellarAddress(publicKey);
    if (!validation.isValid) {
      throw new Error(`Invalid account address: ${validation.error}`);
    }

    const server = StellarNetworkConfig.getHorizonServer();
    const limit = options.limit || 20;
    const order = options.order || 'desc';

    try {
      let callBuilder = server
        .payments()
        .forAccount(publicKey)
        .order(order)
        .limit(limit);

      if (options.cursor) {
        callBuilder = callBuilder.cursor(options.cursor);
      }

      const response = await callBuilder.call();
      const items: TransactionHistoryItem[] = [];

      for (const op of response.records) {
        const anyOp = op as any;

        if (anyOp.type === 'payment') {
          const isOutgoing = anyOp.from === publicKey;
          const isNative = anyOp.asset_type === 'native';

          items.push({
            id: anyOp.id,
            type: 'payment',
            direction: isOutgoing ? 'outgoing' : 'incoming',
            counterparty: isOutgoing ? anyOp.to : anyOp.from,
            assetCode: isNative ? 'XLM' : anyOp.asset_code || 'UNKNOWN',
            assetIssuer: isNative ? undefined : anyOp.asset_issuer,
            amount: anyOp.amount,
            transactionHash: anyOp.transaction_hash,
            createdAt: anyOp.created_at,
          });
        } else if (anyOp.type === 'create_account') {
          const isOutgoing = anyOp.funder === publicKey;

          items.push({
            id: anyOp.id,
            type: 'create_account',
            direction: isOutgoing ? 'outgoing' : 'incoming',
            counterparty: isOutgoing ? anyOp.account : anyOp.funder,
            assetCode: 'XLM',
            amount: anyOp.starting_balance,
            transactionHash: anyOp.transaction_hash,
            createdAt: anyOp.created_at,
          });
        }
      }

      // Extract pagination cursors
      let nextCursor: string | undefined;
      let prevCursor: string | undefined;

      if (response.records.length > 0) {
        nextCursor = response.records[response.records.length - 1].paging_token;
        prevCursor = response.records[0].paging_token;
      }

      return {
        items,
        nextCursor,
        prevCursor,
      };
    } catch (err: unknown) {
      // Return empty array if account is not found on ledger (404)
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as any).response?.status === 404
      ) {
        return { items: [] };
      }

      const msg =
        err instanceof Error ? err.message : 'Failed to retrieve transaction history.';
      throw new Error(msg);
    }
  }

  /**
   * Fetches details of a specific transaction by 64-character hash.
   */
  public static async getTransactionDetails(hash: string): Promise<any> {
    StellarNetworkConfig.assertTestnet();
    const server = StellarNetworkConfig.getHorizonServer();
    try {
      const tx = await server.transactions().transaction(hash).call();
      return {
        id: tx.id,
        successful: tx.successful,
        hash: tx.hash,
        ledger: tx.ledger_attr,
        createdAt: tx.created_at,
        sourceAccount: tx.source_account,
        feeCharged: tx.fee_charged,
        memo: tx.memo,
        memoType: tx.memo_type,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction not found or could not be loaded.';
      throw new Error(msg);
    }
  }
}
