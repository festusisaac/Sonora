import { Horizon } from '@stellar/stellar-sdk';
import { StellarNetworkConfig } from './stellarNetworkConfig';

/**
 * Singleton Horizon Server and Network Passphrase accessor
 * Delegates to centralized StellarNetworkConfig service.
 */
export function getHorizonServer(): Horizon.Server {
  return StellarNetworkConfig.getHorizonServer();
}

export function getNetworkPassphrase(): string {
  return StellarNetworkConfig.getNetworkPassphrase();
}
