import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * BIP-39 Mnemonic Service
 *
 * Implements cryptographically secure BIP-39 mnemonic generation,
 * normalization, and checksum validation.
 *
 * Security Requirements:
 * - 256 bits of cryptographically secure entropy for 24-word phrases.
 * - Uses platform-native crypto.getRandomValues via @scure/bip39.
 * - Mnemonics are never logged or stored in unencrypted memory.
 */
export class MnemonicService {
  /**
   * Generates a 24-word English BIP-39 mnemonic with 256-bit entropy.
   */
  public static generate24WordMnemonic(): string {
    // 256 bits entropy = 24 words in BIP-39 (256 entropy + 8 checksum = 264 bits / 11 = 24 words)
    return generateMnemonic(wordlist, 256);
  }

  /**
   * Normalizes a mnemonic string: trims whitespace, lowers case, collapses whitespace.
   */
  public static normalizeMnemonic(mnemonic: string): string {
    if (!mnemonic) return '';
    return mnemonic
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  /**
   * Validates whether a mnemonic string has valid words and checksum.
   * By default, strictly requires 24 words. If allow12Words is true, allows 12 words as well.
   */
  public static validate(
    mnemonic: string,
    options: { allow12Words?: boolean } = {}
  ): { isValid: boolean; error?: string } {
    const normalized = this.normalizeMnemonic(mnemonic);
    if (!normalized) {
      return { isValid: false, error: 'Recovery phrase cannot be empty.' };
    }

    const words = normalized.split(' ');
    const requiredWords = options.allow12Words ? [12, 24] : [24];

    if (!requiredWords.includes(words.length)) {
      return {
        isValid: false,
        error: `Recovery phrase must contain exactly ${options.allow12Words ? '12 or 24' : '24'} words (received ${words.length}).`,
      };
    }

    // Verify each word exists in the BIP-39 English wordlist
    const wordSet = new Set(wordlist);
    const invalidWords = words.filter((w) => !wordSet.has(w));
    if (invalidWords.length > 0) {
      return {
        isValid: false,
        error: `Unrecognized word in phrase: "${invalidWords[0]}". Please check spelling.`,
      };
    }

    // Verify BIP-39 checksum
    const isValidChecksum = validateMnemonic(normalized, wordlist);
    if (!isValidChecksum) {
      return {
        isValid: false,
        error: 'Invalid recovery phrase checksum. Please check word order and spelling.',
      };
    }

    return { isValid: true };
  }

  /**
   * Returns array of words from normalized mnemonic.
   */
  public static splitMnemonic(mnemonic: string): string[] {
    const normalized = this.normalizeMnemonic(mnemonic);
    return normalized ? normalized.split(' ') : [];
  }

  /**
   * Helper to get word list for auto-complete or verification options.
   */
  public static getWordlist(): string[] {
    return wordlist;
  }
}
