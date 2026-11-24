import { MnemonicService } from './mnemonicService';
import { WalletDerivationService } from './walletDerivationService';
import { WalletKeyStorage } from '../security/walletKeyStorage';

export interface WalletRestorationResult {
  publicKey: string;
  derivationPath: string;
}

/**
 * Wallet Restoration Service
 *
 * Validates user-supplied recovery phrases, derives primary Stellar keys
 * via SEP-0005, and securely stores keys into Android Keystore.
 */
export class WalletRestorationService {
  /**
   * Restores an existing wallet from a 24-word or 12-word recovery phrase.
   */
  public static async restoreFromMnemonic(
    mnemonicInput: string,
    passphrase = ''
  ): Promise<WalletRestorationResult> {
    const normalized = MnemonicService.normalizeMnemonic(mnemonicInput);

    // 1. Validate mnemonic (allowing both 24-word and 12-word phrases for recovery compatibility)
    const validation = MnemonicService.validate(normalized, { allow12Words: true });
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid recovery phrase.');
    }

    // 2. Derive Primary Account (m/44'/148'/0')
    const derived = WalletDerivationService.deriveKeypair(normalized, 0, passphrase);

    // 3. Save to hardware-backed Keystore (marked as backed up since user already has the phrase)
    await WalletKeyStorage.saveWallet({
      mnemonic: normalized,
      secretKey: derived.secretKey,
      publicKey: derived.publicKey,
      isBackedUp: true,
      accountIndex: 0,
    });

    return {
      publicKey: derived.publicKey,
      derivationPath: derived.derivationPath,
    };
  }
}
