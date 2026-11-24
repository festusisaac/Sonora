import { StellarNetworkConfig } from './stellarNetworkConfig';
import { StellarAccountInfo, AccountReserveDetails } from '../../types/stellar';
import {
  decimalToStroops,
  stroopsToDecimal,
} from '../../utils/stroop';

/**
 * Stellar Balance & Reserve Calculation Service
 *
 * Implements strict, non-floating-point financial calculations for Stellar accounts:
 * - Base Reserve: 0.5 XLM (5,000,000 stroops)
 * - Minimum Account Reserve = (2 + subentryCount) * Base Reserve
 * - Available XLM = Total XLM - Minimum Reserve - Selling Liabilities
 * - Max Spendable XLM = max(0, Available XLM - Estimated Fee)
 */
export class StellarBalanceService {
  /**
   * Computes the complete reserve and availability breakdown for an account.
   */
  public static calculateAccountReserves(
    accountInfo: StellarAccountInfo,
    estimatedFeeStroops = StellarNetworkConfig.BASE_FEE_STROOPS
  ): AccountReserveDetails {
    // 1. Locate Native XLM balance line
    const nativeLine = accountInfo.balances.find((b) => b.asset_type === 'native');
    const totalXlmStroops = nativeLine ? decimalToStroops(nativeLine.balance) : 0n;

    // 2. Selling liabilities on native XLM
    const sellingLiabilitiesStroops = nativeLine?.selling_liabilities
      ? decimalToStroops(nativeLine.selling_liabilities)
      : 0n;

    // 3. Minimum Reserve = (2 + subentries) * 0.5 XLM
    const subentryCount = accountInfo.subentryCount || 0;
    const minimumReserveStroops =
      BigInt(2 + subentryCount) * StellarNetworkConfig.BASE_RESERVE_STROOPS;

    // 4. Calculate Available XLM
    const lockedStroops = minimumReserveStroops + sellingLiabilitiesStroops;
    const availableXlmStroops =
      totalXlmStroops > lockedStroops ? totalXlmStroops - lockedStroops : 0n;

    // 5. Max spendable XLM after subtracting fee
    const maxSpendableXlmStroops =
      availableXlmStroops > estimatedFeeStroops
        ? availableXlmStroops - estimatedFeeStroops
        : 0n;

    return {
      totalXlmStroops,
      minimumReserveStroops,
      subentryCount,
      sellingLiabilitiesStroops,
      availableXlmStroops,
      maxSpendableXlmStroops,
      totalXlm: stroopsToDecimal(totalXlmStroops),
      minimumReserve: stroopsToDecimal(minimumReserveStroops),
      availableXlm: stroopsToDecimal(availableXlmStroops),
      maxSpendableXlm: stroopsToDecimal(maxSpendableXlmStroops),
    };
  }

  /**
   * Computes available balance for an issued asset.
   */
  public static calculateIssuedAssetAvailable(
    accountInfo: StellarAccountInfo,
    assetCode: string,
    assetIssuer: string
  ): { available: string; availableStroops: bigint } {
    const line = accountInfo.balances.find(
      (b) =>
        b.asset_code?.toUpperCase() === assetCode.toUpperCase() &&
        b.asset_issuer === assetIssuer
    );

    if (!line) {
      return { available: '0', availableStroops: 0n };
    }

    const totalStroops = decimalToStroops(line.balance);
    const sellingLiabilitiesStroops = line.selling_liabilities
      ? decimalToStroops(line.selling_liabilities)
      : 0n;

    const availableStroops =
      totalStroops > sellingLiabilitiesStroops
        ? totalStroops - sellingLiabilitiesStroops
        : 0n;

    return {
      available: stroopsToDecimal(availableStroops),
      availableStroops,
    };
  }
}
