/**
 * Safe Environment Configuration
 * Only public Testnet parameters are exposed to the client bundle.
 */

export interface AppConfig {
  stellarNetwork: 'TESTNET';
  horizonUrl: string;
  networkPassphrase: string;
  usdcIssuer: string;
  isTestnet: boolean;
}

export const ENV: AppConfig = {
  stellarNetwork: 'TESTNET',
  horizonUrl:
    process.env.EXPO_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  networkPassphrase:
    process.env.EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE ||
    'Test SDF Network ; September 2015',
  usdcIssuer:
    process.env.EXPO_PUBLIC_USDC_TESTNET_ISSUER ||
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  isTestnet: true,
};
