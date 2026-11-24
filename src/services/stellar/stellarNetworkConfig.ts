import { Horizon, Networks } from '@stellar/stellar-sdk';
import { ENV } from '../../config/env';

/**
 * Authoritative Stellar Network Configuration Service
 *
 * SAFETY INVARIANTS:
 * 1. SONORA is strictly a Stellar Testnet wallet in this phase.
 * 2. Transactions constructed or submitted must NEVER target Mainnet (Public network).
 * 3. No silent fallback to Mainnet is allowed under any circumstance.
 * 4. Centralizes Horizon instance, network passphrases, timeouts, and fee bounds.
 */
export class StellarNetworkConfig {
  public static readonly NETWORK_NAME = 'TESTNET' as const;
  public static readonly NETWORK_PASSPHRASE = Networks.TESTNET;
  public static readonly HORIZON_URL = ENV.horizonUrl || 'https://horizon-testnet.stellar.org';

  // Network Economic Constants (Testnet)
  public static readonly BASE_RESERVE_STROOPS = 5_000_000n; // 0.5 XLM per entry / subentry
  public static readonly BASE_FEE_STROOPS = 100n;           // 0.00001 XLM (100 stroops)
  public static readonly MAX_SAFE_FEE_STROOPS = 100_000n;   // 0.01 XLM maximum fee cap
  public static readonly DEFAULT_TIMEOUT_MS = 15_000;       // 15 seconds network timeout
  public static readonly DEFAULT_TIMEBOUND_SECONDS = 300;   // 5 minutes transaction validity

  private static horizonInstance: Horizon.Server | null = null;

  /**
   * Asserts that the current runtime environment is strictly Testnet.
   * Throws an immediate fatal security error if Mainnet is detected.
   */
  public static assertTestnet(): void {
    if (ENV.stellarNetwork !== 'TESTNET' || !ENV.isTestnet) {
      throw new Error(
        'FATAL SECURITY VIOLATION: Non-Testnet environment detected. SONORA only operates on Stellar Testnet.'
      );
    }
  }

  /**
   * Returns the singleton Horizon Server instance configured for Testnet.
   */
  public static getHorizonServer(): Horizon.Server {
    this.assertTestnet();

    if (!this.horizonInstance) {
      this.horizonInstance = new Horizon.Server(this.HORIZON_URL, {
        allowHttp: false,
      });
    }
    return this.horizonInstance;
  }

  /**
   * Returns the official Stellar Testnet network passphrase.
   */
  public static getNetworkPassphrase(): string {
    this.assertTestnet();
    return this.NETWORK_PASSPHRASE;
  }
}
