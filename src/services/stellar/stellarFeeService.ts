import { StellarNetworkConfig } from './stellarNetworkConfig';
import { FeeStatsResult } from '../../types/stellar';

export class StellarFeeService {
  /**
   * Retrieves live fee stats from Horizon Testnet.
   */
  public static async getFeeStats(): Promise<FeeStatsResult> {
    try {
      const server = StellarNetworkConfig.getHorizonServer();
      const feeStats = await server.feeStats();

      const minFee = BigInt(feeStats.fee_charged?.min || '100');
      const modeFee = BigInt(feeStats.fee_charged?.mode || '100');

      // Recommended fee is mode + small cushion (or base fee if network is calm)
      let recommended = modeFee > StellarNetworkConfig.BASE_FEE_STROOPS ? modeFee : StellarNetworkConfig.BASE_FEE_STROOPS;
      if (recommended > StellarNetworkConfig.MAX_SAFE_FEE_STROOPS) {
        recommended = StellarNetworkConfig.MAX_SAFE_FEE_STROOPS;
      }

      return {
        minFeeStroops: minFee.toString(),
        modeFeeStroops: modeFee.toString(),
        recommendedFeeStroops: recommended.toString(),
        maxSafeFeeStroops: StellarNetworkConfig.MAX_SAFE_FEE_STROOPS.toString(),
      };
    } catch {
      // Graceful fallback to network standard base fee
      return {
        minFeeStroops: StellarNetworkConfig.BASE_FEE_STROOPS.toString(),
        modeFeeStroops: StellarNetworkConfig.BASE_FEE_STROOPS.toString(),
        recommendedFeeStroops: StellarNetworkConfig.BASE_FEE_STROOPS.toString(),
        maxSafeFeeStroops: StellarNetworkConfig.MAX_SAFE_FEE_STROOPS.toString(),
      };
    }
  }

  /**
   * Helper that returns the recommended fee in stroops as BigInt.
   */
  public static async getRecommendedFeeStroops(): Promise<bigint> {
    const stats = await this.getFeeStats();
    return BigInt(stats.recommendedFeeStroops);
  }
}
