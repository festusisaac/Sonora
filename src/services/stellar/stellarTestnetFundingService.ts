import { ENV } from '../../config/env';
import { validateStellarAddress } from './validation';
import { getHorizonServer } from './client';
import { FriendbotResponse } from '../../types/wallet';

/**
 * Stellar Testnet Friendbot Funding Service
 *
 * Provides automated Testnet XLM funding for development, testing,
 * and onboarding verification.
 *
 * SAFETY GUARDS:
 * 1. Strictly refuses requests if the environment is NOT Testnet.
 * 2. Strictly validates Stellar public address formatting (G..., 56 chars, ed25519).
 * 3. Handles rate limiting (HTTP 429) and duplicate funding gracefully.
 */
export class StellarTestnetFundingService {
  private static readonly FRIENDBOT_BASE_URL = 'https://friendbot.stellar.org';

  /**
   * Requests 10,000 Testnet XLM from the official Stellar Friendbot.
   */
  public static async fundAccount(publicKey: string): Promise<FriendbotResponse> {
    // 1. Strict Testnet Safety Guard
    if (ENV.stellarNetwork !== 'TESTNET') {
      throw new Error(
        'Friendbot is exclusively available on Stellar Testnet. Mainnet funding is strictly forbidden.'
      );
    }

    // 2. Validate public key format
    const validation = validateStellarAddress(publicKey);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || 'Invalid Stellar public address format.',
      };
    }

    try {
      const url = `${this.FRIENDBOT_BASE_URL}?addr=${encodeURIComponent(publicKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const txHash = data?.hash || data?.transaction_hash;
        return {
          success: true,
          message: 'Account funded successfully with 10,000 Testnet XLM!',
          txHash,
        };
      }

      if (response.status === 400) {
        // Friendbot returns 400 if already funded or bad request
        const errJson = await response.json().catch(() => null);
        const detail = errJson?.detail || 'Account may already exist on Testnet or request limit reached.';
        return {
          success: false,
          message: `Friendbot request error: ${detail}`,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          message: 'Friendbot rate limit exceeded. Please wait a minute before requesting funds again.',
        };
      }

      return {
        success: false,
        message: `Friendbot returned HTTP status ${response.status}.`,
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: false,
          message: 'Friendbot request timed out. Please check your internet connection.',
        };
      }

      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error communicating with Friendbot.',
      };
    }
  }

  /**
   * Verifies whether an account is active on the Stellar Testnet Horizon server.
   */
  public static async checkAccountExists(publicKey: string): Promise<boolean> {
    try {
      const server = getHorizonServer();
      await server.loadAccount(publicKey);
      return true;
    } catch (err: unknown) {
      // Horizon returns 404 for uncreated accounts
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as { response?: { status?: number } }).response;
        if (resp?.status === 404) {
          return false;
        }
      }
      return false;
    }
  }
}
