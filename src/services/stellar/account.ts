import { getHorizonServer } from './client';
import { validateStellarAddress } from './validation';
import { AssetBalance } from '../../types/wallet';
import { StellarAccountInfo } from '../../types/stellar';

interface BalanceLineAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  buying_liabilities?: string;
  selling_liabilities?: string;
}

/**
 * Fetches account details and balances safely from the Testnet Horizon server
 */
export async function fetchStellarAccount(
  publicKey: string
): Promise<{ accountInfo: StellarAccountInfo; balances: AssetBalance[] }> {
  const validation = validateStellarAddress(publicKey);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid Stellar address');
  }

  const server = getHorizonServer();

  try {
    const response = await server.loadAccount(publicKey);

    const balances: AssetBalance[] = response.balances.map((b) => {
      const item = b as unknown as BalanceLineAsset;
      if (item.asset_type === 'native') {
        return {
          code: 'XLM',
          balance: item.balance,
          buyingLiabilities: item.buying_liabilities,
          sellingLiabilities: item.selling_liabilities,
        };
      } else {
        return {
          code: item.asset_code || 'UNKNOWN',
          balance: item.balance,
          issuer: item.asset_issuer,
          buyingLiabilities: item.buying_liabilities,
          sellingLiabilities: item.selling_liabilities,
        };
      }
    });

    return {
      accountInfo: {
        accountId: response.id,
        sequence: response.sequence,
        subentryCount: response.subentry_count,
        balances: response.balances.map((b) => {
          const item = b as unknown as BalanceLineAsset;
          return {
            asset_type: item.asset_type,
            balance: item.balance,
            asset_code: item.asset_code,
            asset_issuer: item.asset_issuer,
          };
        }),
      },
      balances,
    };
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      throw new Error(
        'Account not funded on Testnet. Fund your account with Friendbot first.'
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to load Stellar account';
    throw new Error(message);
  }
}
