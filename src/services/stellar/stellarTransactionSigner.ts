import {
  TransactionBuilder,
  Keypair,
  Transaction,
} from '@stellar/stellar-sdk';
import { StellarNetworkConfig } from './stellarNetworkConfig';
import { StellarTransactionAuthorizer } from './stellarTransactionAuthorizer';
import { WalletKeyStorage } from '../security/walletKeyStorage';
import { DeviceAuthenticationService } from '../security/deviceAuthenticationService';
import {
  PreparedPaymentTransaction,
  TransactionAuthorization,
  SignedTransactionResult,
} from '../../types/transaction.types';
import { uint8ArrayToHex } from '../../utils/stroop';

/**
 * Local Transaction Signing Service
 *
 * Implements secure local transaction signing integrated with Phase 2
 * Android Keystore hardware protection and device biometric verification.
 *
 * SECURITY INVARIANTS:
 * 1. Requires valid explicit user authorization bound to the exact transaction hash.
 * 2. Requires successful biometric / device passcode verification.
 * 3. Secret keys are never logged, never stored in Zustand, and never sent across the network.
 * 4. Signing is done strictly in-memory; secret reference is wiped immediately afterwards.
 */
export class StellarTransactionSigner {
  /**
   * Authorizes and signs a prepared transaction locally on the device.
   */
  public static async signTransaction(
    preparedTx: PreparedPaymentTransaction,
    authorization: TransactionAuthorization
  ): Promise<SignedTransactionResult> {
    StellarNetworkConfig.assertTestnet();

    // 1. Verify Authorization Binding
    const isAuthValid = StellarTransactionAuthorizer.isAuthorized(
      preparedTx,
      authorization
    );
    if (!isAuthValid) {
      throw new Error(
        'Transaction signing rejected: Missing or invalid user authorization for this transaction.'
      );
    }

    // 2. Hardware Biometric / Device Passcode Verification
    const authResult = await DeviceAuthenticationService.authenticate(
      'Authorize transaction signature with biometrics or PIN'
    );
    if (!authResult.success) {
      throw new Error(
        authResult.error || 'Biometric authentication cancelled. Signing aborted.'
      );
    }

    // 3. Retrieve Secret Seed from Hardware Keystore
    let secretKey: string | null = null;
    try {
      secretKey = await WalletKeyStorage.getSecretKey();
      if (!secretKey) {
        throw new Error('Wallet secret key not found in secure storage.');
      }

      // 4. Reconstitute Keypair in Memory
      const keypair = Keypair.fromSecret(secretKey);

      // Verify that the signing keypair matches the source address
      if (keypair.publicKey() !== preparedTx.sourceAddress) {
        throw new Error(
          'Signing key mismatch: active wallet does not match transaction source address.'
        );
      }

      // 5. Parse Unsigned Transaction from XDR
      const tx = TransactionBuilder.fromXDR(
        preparedTx.unsignedXdr,
        StellarNetworkConfig.getNetworkPassphrase()
      ) as Transaction;

      // 6. Cryptographically Sign the Transaction Envelope
      tx.sign(keypair);

      const signedXdr = tx.toXDR();
      const signedHash = uint8ArrayToHex(tx.hash());

      return {
        signedXdr,
        transactionHash: signedHash,
      };
    } finally {
      // 7. Security Invariant: Wipe secret key reference from memory scope
      secretKey = null;
    }
  }
}
