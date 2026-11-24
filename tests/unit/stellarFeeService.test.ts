import { StellarFeeService } from '../../src/services/stellar/stellarFeeService';
import { StellarNetworkConfig } from '../../src/services/stellar/stellarNetworkConfig';

describe('StellarFeeService', () => {
  it('returns recommended fee within network safe bounds', async () => {
    const feeStroops = await StellarFeeService.getRecommendedFeeStroops();
    expect(feeStroops).toBeGreaterThanOrEqual(StellarNetworkConfig.BASE_FEE_STROOPS);
    expect(feeStroops).toBeLessThanOrEqual(StellarNetworkConfig.MAX_SAFE_FEE_STROOPS);
  });

  it('provides complete fee stats breakdown', async () => {
    const stats = await StellarFeeService.getFeeStats();
    expect(stats.minFeeStroops).toBeDefined();
    expect(stats.modeFeeStroops).toBeDefined();
    expect(stats.recommendedFeeStroops).toBeDefined();
    expect(stats.maxSafeFeeStroops).toBe(StellarNetworkConfig.MAX_SAFE_FEE_STROOPS.toString());
  });
});
