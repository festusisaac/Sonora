import { Asset } from '@stellar/stellar-sdk';
import { validateStellarAddress } from './validation';
import { AssetIdentifier } from '../../types/transaction.types';
import { StellarAccountInfo } from '../../types/stellar';

export class StellarAssetService {
  /**
   * Validates an asset code and optional issuer.
   */
  public static validateAssetIdentifier(asset: AssetIdentifier): {
    isValid: boolean;
    error?: string;
  } {
    const code = asset.code.trim().toUpperCase();

    if (!code) {
      return { isValid: false, error: 'Asset code cannot be empty.' };
    }

    if (asset.isNative || code === 'XLM') {
      return { isValid: true };
    }

    // Issued Asset: Asset code must be 1-12 alphanumeric characters
    if (!/^[a-zA-Z0-9]{1,12}$/.test(code)) {
      return {
        isValid: false,
        error: `Invalid asset code: "${code}". Stellar asset codes must be 1 to 12 alphanumeric characters.`,
      };
    }

    if (!asset.issuer) {
      return {
        isValid: false,
        error: `Issued asset "${code}" requires an issuer public address.`,
      };
    }

    const issuerValidation = validateStellarAddress(asset.issuer);
    if (!issuerValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid asset issuer address: ${issuerValidation.error}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Instantiates an official Stellar SDK Asset object.
   */
  public static toStellarAsset(asset: AssetIdentifier): Asset {
    const validation = this.validateAssetIdentifier(asset);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    if (asset.isNative || asset.code.toUpperCase() === 'XLM') {
      return Asset.native();
    }

    return new Asset(asset.code.toUpperCase(), asset.issuer!);
  }

  /**
   * Checks if an account has a valid and authorized trustline for an issued asset.
   */
  public static hasAuthorizedTrustline(
    accountInfo: StellarAccountInfo,
    assetCode: string,
    assetIssuer: string
  ): { hasTrustline: boolean; isAuthorized: boolean } {
    const line = accountInfo.balances.find(
      (b) =>
        b.asset_code?.toUpperCase() === assetCode.toUpperCase() &&
        b.asset_issuer === assetIssuer
    );

    if (!line) {
      return { hasTrustline: false, isAuthorized: false };
    }

    // Default is_authorized is true if not specified in Horizon
    const isAuthorized = line.is_authorized !== false;
    return { hasTrustline: true, isAuthorized };
  }
}
