import { validateStellarAddress } from './validation';
import { StellarAccountService } from './stellarAccountService';
import { StellarAssetService } from './stellarAssetService';
import { AssetIdentifier } from '../../types/transaction.types';
import { RecipientValidationResult } from '../../types/stellar';
import { decimalToStroops } from '../../utils/stroop';

/**
 * Recipient Account Validation Service
 *
 * Validates recipient addresses, verifies ledger existence on Testnet,
 * checks trustline compatibility for issued assets, and enforces Stellar
 * account creation reserve rules.
 *
 * CRITICAL SECURITY NOTICE:
 * A syntactically valid Stellar address does NOT prove identity or ownership.
 * Address validation only guarantees mathematical formatting and ledger readiness.
 */
export class StellarRecipientService {
  /**
   * Validates a recipient account for a proposed payment.
   */
  public static async validateRecipient(
    destinationAddress: string,
    asset: AssetIdentifier,
    amount?: string
  ): Promise<RecipientValidationResult> {
    const warnings: string[] = [];

    // 1. Format and checksum validation
    const addrVal = validateStellarAddress(destinationAddress);
    if (!addrVal.isValid) {
      return {
        isValidAddress: false,
        exists: false,
        canReceiveAsset: false,
        requiresAccountCreation: false,
        warnings: [],
        error: addrVal.error || 'Invalid Stellar address format.',
      };
    }

    // 2. Query ledger state on Testnet
    const accountInfo = await StellarAccountService.getAccountInfo(destinationAddress);
    const exists = accountInfo !== null;

    // 3. Handle non-existent accounts on ledger
    if (!exists) {
      // Non-existent account can ONLY receive native XLM via create_account
      if (!asset.isNative && asset.code.toUpperCase() !== 'XLM') {
        return {
          isValidAddress: true,
          exists: false,
          canReceiveAsset: false,
          requiresAccountCreation: true,
          warnings: [
            'Destination account does not exist on Stellar Testnet and cannot receive issued tokens.',
          ],
          error:
            'Destination account does not exist. An account must be created and funded with XLM and add a trustline before receiving issued assets.',
        };
      }

      // Check minimum account creation balance (Stellar base reserve requires >= 1.0 XLM to create)
      const MIN_CREATE_ACCOUNT_STROOPS = 10_000_000n; // 1.0 XLM
      let meetsMinimum = true;
      if (amount) {
        try {
          const stroops = decimalToStroops(amount);
          if (stroops < MIN_CREATE_ACCOUNT_STROOPS) {
            meetsMinimum = false;
          }
        } catch {
          // Amount parsing error will be handled by amount validator
        }
      }

      if (!meetsMinimum) {
        return {
          isValidAddress: true,
          exists: false,
          canReceiveAsset: false,
          requiresAccountCreation: true,
          warnings: [
            'Destination account does not exist. A minimum of 1.0 XLM is required to fund and create a new account.',
          ],
          error:
            'Destination account is new. Stellar requires at least 1.0 XLM to create an account on the network.',
        };
      }

      return {
        isValidAddress: true,
        exists: false,
        canReceiveAsset: true,
        requiresAccountCreation: true,
        warnings: [
          'Destination account is not yet active on Testnet. Sending this payment will create and activate the account.',
        ],
      };
    }

    // 4. Handle existing account
    if (asset.isNative || asset.code.toUpperCase() === 'XLM') {
      return {
        isValidAddress: true,
        exists: true,
        canReceiveAsset: true,
        requiresAccountCreation: false,
        destinationAccountInfo: accountInfo,
        warnings,
      };
    }

    // 5. Existing account + Issued Asset (Check Trustline)
    if (!asset.issuer) {
      return {
        isValidAddress: true,
        exists: true,
        canReceiveAsset: false,
        requiresAccountCreation: false,
        destinationAccountInfo: accountInfo,
        warnings,
        error: `Issued asset "${asset.code}" requires an issuer address to verify trustline.`,
      };
    }

    const trustline = StellarAssetService.hasAuthorizedTrustline(
      accountInfo,
      asset.code,
      asset.issuer
    );

    if (!trustline.hasTrustline) {
      return {
        isValidAddress: true,
        exists: true,
        canReceiveAsset: false,
        requiresAccountCreation: false,
        destinationAccountInfo: accountInfo,
        hasTrustline: false,
        isTrustlineAuthorized: false,
        warnings: [
          `Recipient has not established a trustline for ${asset.code}.`,
        ],
        error: `Recipient cannot receive ${asset.code}. They must establish a trustline to issuer ${asset.issuer} first.`,
      };
    }

    if (!trustline.isAuthorized) {
      return {
        isValidAddress: true,
        exists: true,
        canReceiveAsset: false,
        requiresAccountCreation: false,
        destinationAccountInfo: accountInfo,
        hasTrustline: true,
        isTrustlineAuthorized: false,
        warnings: [
          `Recipient's trustline for ${asset.code} is unauthorized by the asset issuer.`,
        ],
        error: `Recipient's trustline for ${asset.code} is unauthorized by the issuer.`,
      };
    }

    return {
      isValidAddress: true,
      exists: true,
      canReceiveAsset: true,
      requiresAccountCreation: false,
      destinationAccountInfo: accountInfo,
      hasTrustline: true,
      isTrustlineAuthorized: true,
      warnings,
    };
  }
}
