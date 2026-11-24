/**
 * Local Non-Sensitive Storage Service
 * Strictly for UI preferences (theme mode, high contrast, talkback verbosity, last connected public key)
 *
 * SECURITY ENFORCEMENT:
 * - NEVER store private keys, seeds, or confidential credentials here.
 */

const memoryFallback = new Map<string, string>();

export class LocalPreferencesService {
  private static PREFIX = 'sonora_pref_';

  public static async getPreference<T>(key: string, defaultValue: T): Promise<T> {
    const prefixedKey = `${this.PREFIX}${key}`;
    const value = memoryFallback.get(prefixedKey);
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  public static async setPreference<T>(key: string, value: T): Promise<void> {
    const prefixedKey = `${this.PREFIX}${key}`;
    memoryFallback.set(prefixedKey, JSON.stringify(value));
  }

  public static async removePreference(key: string): Promise<void> {
    const prefixedKey = `${this.PREFIX}${key}`;
    memoryFallback.delete(prefixedKey);
  }
}
