import * as SecureStore from 'expo-secure-store';

/**
 * Secure Storage Service
 *
 * ARCHITECTURAL SPECIFICATION & SECURITY AUDIT:
 * 1. Storage Mechanism:
 *    - On Android, `expo-secure-store` encrypts values using AES-256 GCM where
 *      the encryption key is generated and sealed within the Android Keystore system.
 *    - Key derivation uses hardware-backed TEE / StrongBox Keymaster on supported hardware.
 *    - Ciphertext is written to encrypted shared preferences.
 * 2. Size Constraints:
 *    - Android Keystore values are strictly limited to 2048 bytes per entry.
 *    - Ideal for BIP-39 mnemonic seeds and Ed25519 seed bytes.
 * 3. Separation of Concerns:
 *    - Wallet secrets MUST NEVER be written to Zustand stores, SQLite, or ordinary preferences.
 *    - Secrets are never output to console or telemetry.
 * 4. Biometric Authentication vs. Cryptographic Signing:
 *    - Biometric prompts (fingerprint / face) only authorize Keystore decryption.
 *    - Actual Ed25519 transaction signing is performed purely mathematical in-memory
 *      by `@stellar/stellar-sdk` using the momentarily decrypted keypair, which is immediately
 *      cleared after signature generation.
 */

export interface SecureStorageOptions {
  requireAuthentication?: boolean;
  authenticationPrompt?: string;
}

export class SecureStorageService {
  private static PREFIX = 'sonora_sec_';

  /**
   * Save a sensitive string value inside Android Keystore / iOS Keychain
   */
  public static async setItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      throw new Error(
        'Hardware-backed SecureStore is not available on this device'
      );
    }

    await SecureStore.setItemAsync(`${this.PREFIX}${key}`, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      requireAuthentication: options?.requireAuthentication ?? false,
      authenticationPrompt: options?.authenticationPrompt,
    });
  }

  /**
   * Retrieve a sensitive string value with optional biometric authorization
   */
  public static async getItem(
    key: string,
    options?: SecureStorageOptions
  ): Promise<string | null> {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      return null;
    }

    return SecureStore.getItemAsync(`${this.PREFIX}${key}`, {
      requireAuthentication: options?.requireAuthentication ?? false,
      authenticationPrompt: options?.authenticationPrompt,
    });
  }

  /**
   * Delete a sensitive entry from Keystore
   */
  public static async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${this.PREFIX}${key}`);
  }
}
