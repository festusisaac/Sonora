import {
  Account,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { StellarNetworkConfig } from './stellarNetworkConfig';
import { StellarAssetService } from './stellarAssetService';
import { StellarMemoService } from './stellarMemoService';
import { StellarFeeService } from './stellarFeeService';
import {
  StellarTransactionValidator,
  TransactionValidationInput,
} from './stellarTransactionValidator';
import {
  PreparedPaymentTransaction,
  AssetIdentifier,
  MemoDetails,
} from '../../types/transaction.types';
import { uint8ArrayToHex } from '../../utils/stroop';

export interface BuildTransactionParams {
  sourceAddress: string;
  destinationAddress: string;
  asset: AssetIdentifier;
  amount: string;
  memo?: MemoDetails;
  recipientLabel?: string;
  customFeeStroops?: bigint;
}

export class StellarTransactionBuilderService {
  /**
   * Prepares and constructs an unsigned Stellar payment transaction.
   * Performs full pre-flight validation, loads the live account sequence,
   * estimates fee, and generates the exact transaction hash.
   */
  public static async preparePaymentTransaction(
    params: BuildTransactionParams
  ): Promise<PreparedPaymentTransaction> {
    StellarNetworkConfig.assertTestnet();

    // 1. Live Fee Estimation
    const feeStroops =
      params.customFeeStroops ||
      (await StellarFeeService.getRecommendedFeeStroops());

    // 2. Pre-flight Validation
    const valInput: TransactionValidationInput = {
      sourceAddress: params.sourceAddress,
      destinationAddress: params.destinationAddress,
      asset: params.asset,
      amount: params.amount,
      memo: params.memo,
      customFeeStroops: feeStroops,
    };

    const validation = await StellarTransactionValidator.validatePayment(valInput);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // 3. Load latest source account sequence from Horizon
    const server = StellarNetworkConfig.getHorizonServer();
    const sourceAccountResponse = await server.loadAccount(params.sourceAddress);

    // Instantiate SDK Account object
    const sourceAccount = new Account(
      sourceAccountResponse.id,
      sourceAccountResponse.sequence
    );

    // 4. Instantiate TransactionBuilder
    const builder = new TransactionBuilder(sourceAccount, {
      fee: feeStroops.toString(),
      networkPassphrase: StellarNetworkConfig.getNetworkPassphrase(),
    });

    // 5. Add Operation: CreateAccount if recipient is new, otherwise Payment
    if (validation.isNewAccount) {
      builder.addOperation(
        Operation.createAccount({
          destination: params.destinationAddress,
          startingBalance: params.amount,
        })
      );
    } else {
      const stellarAsset = StellarAssetService.toStellarAsset(params.asset);
      builder.addOperation(
        Operation.payment({
          destination: params.destinationAddress,
          asset: stellarAsset,
          amount: params.amount,
        })
      );
    }

    // 6. Add Memo if provided
    if (params.memo && params.memo.type !== 'none' && params.memo.value) {
      const sdkMemo = StellarMemoService.toStellarMemo(params.memo);
      builder.addMemo(sdkMemo);
    }

    // 7. Timebounds (5 minutes validity)
    builder.setTimeout(StellarNetworkConfig.DEFAULT_TIMEBOUND_SECONDS);

    // 8. Build Unsigned Transaction
    const unsignedTx = builder.build();

    // 9. Deterministic 64-character SHA-256 transaction hash
    const transactionHash = uint8ArrayToHex(unsignedTx.hash());
    const unsignedXdr = unsignedTx.toXDR();

    const isNative = params.asset.isNative || params.asset.code.toUpperCase() === 'XLM';
    const totalDebitStroops = isNative
      ? validation.amountStroops + feeStroops
      : validation.amountStroops;

    const transactionId = `tx_${Date.now()}_${transactionHash.slice(0, 8)}`;

    return {
      transactionId,
      transactionHash,
      sourceAddress: params.sourceAddress,
      destinationAddress: params.destinationAddress,
      recipientLabel: params.recipientLabel,
      asset: params.asset,
      amount: params.amount,
      amountStroops: validation.amountStroops.toString(),
      estimatedFeeStroops: feeStroops.toString(),
      totalEstimatedDebitStroops: totalDebitStroops.toString(),
      memo: params.memo || { type: 'none' },
      isNewAccount: validation.isNewAccount,
      sequence: sourceAccountResponse.sequence,
      unsignedXdr,
      network: 'TESTNET',
      createdAt: Date.now(),
    };
  }
}
