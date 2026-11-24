import * as SecureStore from 'expo-secure-store';

/**
 * Secure Storage Service
 * Strictly for small sensitive secrets (e.g., encrypted credentials, auth tokens)
 * Uses Android Keystore / iOS Keychain.
 *
 * SECURITY ENFORCEMENT:
 * - Never store plaintext unencrypted recovery seeds here without proper key-derivation.
 * - Never store public balances or non-sensitive caches here.
 */
export class SecureStorageService {
  private static PREFIX = 'sonora_sec_';

  /**
   * Save a sensitive string value
   */
  public static async setItem(key: string, value: string): Promise<void> {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Hardware-backed SecureStore is not available on this device');
    }

    await SecureStore.setItemAsync(`${this.PREFIX}${key}`, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  }

  /**
   * Retrieve a sensitive string value
   */
  public static async getItem(key: string): Promise<string | null> {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (!isAvailable) {
      return null;
    }

    return SecureStore.getItemAsync(`${this.PREFIX}${key}`);
  }

  /**
   * Delete a sensitive entry
   */
  public static async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(`${this.PREFIX}${key}`);
  }
}
