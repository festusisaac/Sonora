import { SecureStorageService, SecureStorageOptions } from '../storage/secureStore';
import { WalletMetadata } from '../../types/wallet';

/**
 * WalletKeyStorage
 *
 * Dedicated security service for non-custodial wallet secrets.
 * All sensitive values (BIP-39 mnemonic, Ed25519 secret key) are encrypted
 * and stored exclusively in Android Keystore / iOS Keychain via SecureStorageService.
 *
 * SECURITY INVARIANTS:
 * 1. Secrets are NEVER written to logs, console, or telemetry.
 * 2. Secrets are NEVER stored in Zustand, SQLite, or plain AsyncStorage.
 * 3. Secrets are decrypted strictly on-demand for signing or backup display,
 *    and never kept in persistent memory.
 */
export class WalletKeyStorage {
  private static readonly KEY_MNEMONIC = 'wallet_mnemonic';
  private static readonly KEY_SECRET_KEY = 'wallet_secret_key';
  private static readonly KEY_PUBLIC_KEY = 'wallet_public_key';
  private static readonly KEY_BACKUP_STATUS = 'wallet_backup_verified';
  private static readonly KEY_METADATA = 'wallet_metadata';

  /**
   * Securely saves new wallet keys and metadata.
   */
  public static async saveWallet(params: {
    mnemonic: string;
    secretKey: string;
    publicKey: string;
    isBackedUp: boolean;
    accountIndex?: number;
  }): Promise<void> {
    const { mnemonic, secretKey, publicKey, isBackedUp, accountIndex = 0 } = params;

    // 1. Store secret recovery phrase in Keystore
    await SecureStorageService.setItem(this.KEY_MNEMONIC, mnemonic);

    // 2. Store derived Ed25519 secret seed in Keystore
    await SecureStorageService.setItem(this.KEY_SECRET_KEY, secretKey);

    // 3. Store public key
    await SecureStorageService.setItem(this.KEY_PUBLIC_KEY, publicKey);

    // 4. Store backup status
    await SecureStorageService.setItem(
      this.KEY_BACKUP_STATUS,
      isBackedUp ? 'true' : 'false'
    );

    // 5. Store non-sensitive metadata
    const metadata: WalletMetadata = {
      publicKey,
      createdAt: Date.now(),
      isBackedUp,
      accountIndex,
      network: 'TESTNET',
    };
    await SecureStorageService.setItem(
      this.KEY_METADATA,
      JSON.stringify(metadata)
    );
  }

  /**
   * Retrieves the recovery phrase from secure hardware storage.
   */
  public static async getMnemonic(
    options?: SecureStorageOptions
  ): Promise<string | null> {
    return SecureStorageService.getItem(this.KEY_MNEMONIC, options);
  }

  /**
   * Retrieves the Ed25519 secret key from secure hardware storage.
   */
  public static async getSecretKey(
    options?: SecureStorageOptions
  ): Promise<string | null> {
    return SecureStorageService.getItem(this.KEY_SECRET_KEY, options);
  }

  /**
   * Retrieves the public key without needing biometric prompt.
   */
  public static async getPublicKey(): Promise<string | null> {
    return SecureStorageService.getItem(this.KEY_PUBLIC_KEY);
  }

  /**
   * Checks whether a wallet currently exists in secure storage.
   */
  public static async hasWallet(): Promise<boolean> {
    const pubKey = await this.getPublicKey();
    return Boolean(pubKey && pubKey.length > 0);
  }

  /**
   * Checks whether the user has verified their recovery phrase backup.
   */
  public static async isBackupVerified(): Promise<boolean> {
    const status = await SecureStorageService.getItem(this.KEY_BACKUP_STATUS);
    return status === 'true';
  }

  /**
   * Updates backup verification status.
   */
  public static async setBackupVerified(verified: boolean): Promise<void> {
    await SecureStorageService.setItem(
      this.KEY_BACKUP_STATUS,
      verified ? 'true' : 'false'
    );

    // Update metadata if present
    const metaStr = await SecureStorageService.getItem(this.KEY_METADATA);
    if (metaStr) {
      try {
        const meta: WalletMetadata = JSON.parse(metaStr);
        meta.isBackedUp = verified;
        if (verified) {
          meta.backupVerifiedAt = Date.now();
        }
        await SecureStorageService.setItem(
          this.KEY_METADATA,
          JSON.stringify(meta)
        );
      } catch {
        // Non-fatal if metadata update fails
      }
    }
  }

  /**
   * Retrieves non-sensitive wallet metadata.
   */
  public static async getMetadata(): Promise<WalletMetadata | null> {
    const raw = await SecureStorageService.getItem(this.KEY_METADATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as WalletMetadata;
    } catch {
      return null;
    }
  }

  /**
   * Completely purges all wallet secrets and data from Keystore.
   */
  public static async clearWallet(): Promise<void> {
    await SecureStorageService.deleteItem(this.KEY_MNEMONIC);
    await SecureStorageService.deleteItem(this.KEY_SECRET_KEY);
    await SecureStorageService.deleteItem(this.KEY_PUBLIC_KEY);
    await SecureStorageService.deleteItem(this.KEY_BACKUP_STATUS);
    await SecureStorageService.deleteItem(this.KEY_METADATA);
  }
}
