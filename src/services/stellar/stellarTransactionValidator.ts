import { validateStellarAddress } from './validation';
import { StellarAccountService } from './stellarAccountService';
import { StellarBalanceService } from './stellarBalanceService';
import { StellarRecipientService } from './stellarRecipientService';
import { StellarAssetService } from './stellarAssetService';
import { StellarMemoService } from './stellarMemoService';
import { AssetIdentifier, MemoDetails } from '../../types/transaction.types';
import { decimalToStroops } from '../../utils/stroop';
import { StellarNetworkConfig } from './stellarNetworkConfig';

export interface TransactionValidationInput {
  sourceAddress: string;
  destinationAddress: string;
  asset: AssetIdentifier;
  amount: string;
  memo?: MemoDetails;
  customFeeStroops?: bigint;
}

export interface ValidationSuccessResult {
  isValid: true;
  sourceAccountInfo: any;
  recipientResult: any;
  amountStroops: bigint;
  feeStroops: bigint;
  totalDebitStroops: bigint;
  isNewAccount: boolean;
  warnings: string[];
}

export interface ValidationFailureResult {
  isValid: false;
  error: string;
  warnings: string[];
}

export type TransactionValidationResult =
  | ValidationSuccessResult
  | ValidationFailureResult;

export class StellarTransactionValidator {
  /**
   * Performs exhaustive pre-flight validation for a proposed Stellar payment.
   */
  public static async validatePayment(
    input: TransactionValidationInput
  ): Promise<TransactionValidationResult> {
    const warnings: string[] = [];

    // 1. Source Address Validation
    const srcVal = validateStellarAddress(input.sourceAddress);
    if (!srcVal.isValid) {
      return { isValid: false, error: `Invalid source address: ${srcVal.error}`, warnings };
    }

    // 2. Destination Address Validation
    const destVal = validateStellarAddress(input.destinationAddress);
    if (!destVal.isValid) {
      return { isValid: false, error: `Invalid destination address: ${destVal.error}`, warnings };
    }

    if (input.sourceAddress === input.destinationAddress) {
      return {
        isValid: false,
        error: 'Source and destination addresses cannot be identical.',
        warnings,
      };
    }

    // 3. Asset Validation
    const assetVal = StellarAssetService.validateAssetIdentifier(input.asset);
    if (!assetVal.isValid) {
      return { isValid: false, error: assetVal.error!, warnings };
    }

    // 4. Amount Validation (Exact Decimal / Stroop)
    let amountStroops: bigint;
    try {
      amountStroops = decimalToStroops(input.amount);
    } catch (err) {
      return {
        isValid: false,
        error: err instanceof Error ? err.message : 'Invalid payment amount.',
        warnings,
      };
    }

    // 5. Memo Validation
    const memoVal = StellarMemoService.validateMemo(input.memo);
    if (!memoVal.isValid) {
      return { isValid: false, error: memoVal.error!, warnings };
    }

    // 6. Source Account State on Ledger
    const sourceAccountInfo = await StellarAccountService.getAccountInfo(input.sourceAddress);
    if (!sourceAccountInfo) {
      return {
        isValid: false,
        error: 'Source account does not exist on Stellar Testnet. Fund account with Testnet XLM first.',
        warnings,
      };
    }

    // 7. Recipient Account State & Compatibility
    const recipientResult = await StellarRecipientService.validateRecipient(
      input.destinationAddress,
      input.asset,
      input.amount
    );

    if (!recipientResult.canReceiveAsset) {
      return {
        isValid: false,
        error: recipientResult.error || 'Recipient cannot receive this asset.',
        warnings: recipientResult.warnings,
      };
    }

    if (recipientResult.warnings?.length) {
      warnings.push(...recipientResult.warnings);
    }

    // 8. Fee & Balance / Reserve Calculations
    const feeStroops = input.customFeeStroops || StellarNetworkConfig.BASE_FEE_STROOPS;
    const reserves = StellarBalanceService.calculateAccountReserves(sourceAccountInfo, feeStroops);

    const isNative = input.asset.isNative || input.asset.code.toUpperCase() === 'XLM';

    if (isNative) {
      // Payment is in XLM: Source requires amount + fee <= availableXlmStroops
      const totalRequiredXlmStroops = amountStroops + feeStroops;

      if (totalRequiredXlmStroops > reserves.availableXlmStroops) {
        return {
          isValid: false,
          error: `Insufficient available XLM balance. Available: ${reserves.availableXlm} XLM (Account minimum reserve: ${reserves.minimumReserve} XLM). Required: ${input.amount} XLM + fee.`,
          warnings,
        };
      }

      return {
        isValid: true,
        sourceAccountInfo,
        recipientResult,
        amountStroops,
        feeStroops,
        totalDebitStroops: totalRequiredXlmStroops,
        isNewAccount: recipientResult.requiresAccountCreation,
        warnings,
      };
    } else {
      // Payment is in Issued Asset:
      // A) Source must have fee in XLM
      if (feeStroops > reserves.availableXlmStroops) {
        return {
          isValid: false,
          error: `Insufficient XLM to pay transaction fee (${feeStroops} stroops). Minimum reserve: ${reserves.minimumReserve} XLM.`,
          warnings,
        };
      }

      // B) Source must have available issued asset balance
      const issuedAvail = StellarBalanceService.calculateIssuedAssetAvailable(
        sourceAccountInfo,
        input.asset.code,
        input.asset.issuer!
      );

      if (amountStroops > issuedAvail.availableStroops) {
        return {
          isValid: false,
          error: `Insufficient ${input.asset.code} balance. Available: ${issuedAvail.available} ${input.asset.code}. Required: ${input.amount} ${input.asset.code}.`,
          warnings,
        };
      }

      return {
        isValid: true,
        sourceAccountInfo,
        recipientResult,
        amountStroops,
        feeStroops,
        totalDebitStroops: amountStroops, // Token debit is the amount; fee is paid separately in XLM
        isNewAccount: false,
        warnings,
      };
    }
  }
}
