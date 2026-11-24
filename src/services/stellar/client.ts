import { Horizon, Networks } from '@stellar/stellar-sdk';
import { ENV } from '../../config/env';

/**
 * Singleton Horizon Server instance for Stellar Testnet
 */
let horizonServer: Horizon.Server | null = null;

export function getHorizonServer(): Horizon.Server {
  if (!horizonServer) {
    horizonServer = new Horizon.Server(ENV.horizonUrl, {
      allowHttp: false,
    });
  }
  return horizonServer;
}

export function getNetworkPassphrase(): string {
  return Networks.TESTNET;
}
