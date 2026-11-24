import { StellarNetworkConfig } from '../../src/services/stellar/stellarNetworkConfig';
import { ENV } from '../../src/config/env';

describe('StellarNetworkConfig', () => {
  it('identifies network as TESTNET and returns Testnet passphrase', () => {
    expect(StellarNetworkConfig.NETWORK_NAME).toBe('TESTNET');
    expect(StellarNetworkConfig.getNetworkPassphrase()).toBe(
      'Test SDF Network ; September 2015'
    );
  });

  it('provides singleton Horizon Server instance targeting Testnet', () => {
    const server1 = StellarNetworkConfig.getHorizonServer();
    const server2 = StellarNetworkConfig.getHorizonServer();
    expect(server1).toBe(server2);
    expect(server1.serverURL.toString()).toContain('horizon-testnet.stellar.org');
  });

  it('strictly throws fatal error if Mainnet is attempted', () => {
    const origNetwork = ENV.stellarNetwork;
    try {
      (ENV as any).stellarNetwork = 'PUBLIC';
      expect(() => StellarNetworkConfig.assertTestnet()).toThrow(
        'FATAL SECURITY VIOLATION: Non-Testnet environment detected'
      );
    } finally {
      (ENV as any).stellarNetwork = origNetwork;
    }
  });

  it('enforces economic constants: 0.5 XLM base reserve and 100 stroops base fee', () => {
    expect(StellarNetworkConfig.BASE_RESERVE_STROOPS).toBe(5_000_000n);
    expect(StellarNetworkConfig.BASE_FEE_STROOPS).toBe(100n);
    expect(StellarNetworkConfig.MAX_SAFE_FEE_STROOPS).toBe(100_000n);
  });
});
