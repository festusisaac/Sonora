import { StellarNetworkConfig } from './stellarNetworkConfig';
import { validateStellarAddress } from './validation';
import { StellarAccountInfo } from '../../types/stellar';
import { AssetBalance } from '../../types/wallet';

export class StellarAccountService {
  /**
   * Loads account details and sequence from Horizon Testnet.
   * Returns null if account does not exist (404).
   */
  public static async getAccountInfo(
    publicKey: string
  ): Promise<StellarAccountInfo | null> {
    const validation = validateStellarAddress(publicKey);
    if (!validation.isValid) {
      throw new Error(`Invalid address format: ${validation.error}`);
    }

    const server = StellarNetworkConfig.getHorizonServer();

    try {
      const response = await server.loadAccount(publicKey);

      return {
        accountId: response.id,
        sequence: response.sequence,
        subentryCount: response.subentry_count,
        balances: response.balances.map((b: any) => ({
          asset_type: b.asset_type,
          asset_code: b.asset_code,
          asset_issuer: b.asset_issuer,
          balance: b.balance,
          buying_liabilities: b.buying_liabilities,
          selling_liabilities: b.selling_liabilities,
          is_authorized: b.is_authorized,
        })),
        flags: {
          auth_required: response.flags?.auth_required,
          auth_revocable: response.flags?.auth_revocable,
          auth_immutable: response.flags?.auth_immutable,
          auth_clawback_enabled: response.flags?.auth_clawback_enabled,
        },
      };
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 404
      ) {
        return null;
      }
      const message = err instanceof Error ? err.message : 'Failed to query Stellar account';
      throw new Error(message);
    }
  }

  /**
   * Helper that retrieves parsed AssetBalance array for wallet state.
   */
  public static async getBalances(publicKey: string): Promise<AssetBalance[]> {
    const info = await this.getAccountInfo(publicKey);
    if (!info) return [];

    return info.balances.map((b) => {
      const isNative = b.asset_type === 'native';
      return {
        code: isNative ? 'XLM' : b.asset_code || 'UNKNOWN',
        balance: b.balance,
        issuer: isNative ? undefined : b.asset_issuer,
        buyingLiabilities: b.buying_liabilities,
        sellingLiabilities: b.selling_liabilities,
      };
    });
  }
}
