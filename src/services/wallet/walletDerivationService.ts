import { mnemonicToSeedSync } from '@scure/bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@stellar/stellar-sdk';
import { DerivedKeypair } from '../../types/wallet';
import { MnemonicService } from './mnemonicService';

/**
 * Stellar SEP-0005 Key Derivation Service
 *
 * Implements SLIP-0010 hierarchical deterministic key derivation for Ed25519
 * along the standardized Stellar path: m/44'/148'/{accountIndex}'
 *
 * Specification:
 * - https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md
 * - BIP-39 mnemonic + optional passphrase -> 64-byte binary seed
 * - SLIP-0010 master key & child derivation -> 32-byte Ed25519 raw seed
 * - Keypair.fromRawEd25519Seed(seed) -> Stellar G... public key & S... secret key
 */
export class WalletDerivationService {
  public static readonly STELLAR_PURPOSE = 44;
  public static readonly STELLAR_COIN_TYPE = 148;

  /**
   * Constructs the canonical SEP-0005 derivation path for a given account index.
   * Format: m/44'/148'/{accountIndex}'
   */
  public static getDerivationPath(accountIndex = 0): string {
    if (accountIndex < 0 || !Number.isInteger(accountIndex)) {
      throw new Error(`Invalid account index: ${accountIndex}. Must be non-negative integer.`);
    }
    return `m/${this.STELLAR_PURPOSE}'/${this.STELLAR_COIN_TYPE}'/${accountIndex}'`;
  }

  /**
   * Derives BIP-39 64-byte seed as hex string.
   */
  public static deriveSeedHex(mnemonic: string, passphrase = ''): string {
    const normalized = MnemonicService.normalizeMnemonic(mnemonic);
    const seedBytes = mnemonicToSeedSync(normalized, passphrase);
    // Convert Uint8Array to hex string without relying on Node Buffer
    return Array.from(seedBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Derives a Stellar Keypair using SEP-0005.
   *
   * @param mnemonic 12 or 24 word BIP-39 mnemonic
   * @param accountIndex Account index (defaults to 0 for primary account)
   * @param passphrase Optional BIP-39 passphrase
   * @returns DerivedKeypair with public address, secret key, accountIndex, and path
   */
  public static deriveKeypair(
    mnemonic: string,
    accountIndex = 0,
    passphrase = ''
  ): DerivedKeypair {
    const derivationPath = this.getDerivationPath(accountIndex);
    const seedHex = this.deriveSeedHex(mnemonic, passphrase);

    // SLIP-0010 Ed25519 derivation
    const derived = derivePath(derivationPath, seedHex);
    const rawKeyBytes = Uint8Array.from(derived.key);

    // Instantiate Stellar Keypair from the 32-byte raw Ed25519 seed
    const keypair = Keypair.fromRawEd25519Seed(rawKeyBytes);

    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      accountIndex,
      derivationPath,
    };
  }

  /**
   * Helper to instantiate a Stellar Keypair directly from secret seed.
   */
  public static getKeypairFromSecret(secretKey: string): Keypair {
    return Keypair.fromSecret(secretKey);
  }
}
