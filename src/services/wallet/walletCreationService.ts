import { MnemonicService } from './mnemonicService';
import { WalletDerivationService } from './walletDerivationService';
import { WalletKeyStorage } from '../security/walletKeyStorage';
import { BackupChallenge, BackupChallengeItem } from '../../types/wallet';

export interface WalletCreationResult {
  mnemonic: string;
  words: string[];
  publicKey: string;
  derivationPath: string;
}

/**
 * Wallet Creation Service
 *
 * Coordinates non-custodial wallet generation, SEP-0005 key derivation,
 * secure storage, and accessible recovery phrase backup challenges.
 */
export class WalletCreationService {
  /**
   * Generates a brand new 24-word wallet, derives account 0, and stores keys in Keystore.
   * By default, the wallet is marked as NOT backed up until the user passes the challenge.
   */
  public static async createWallet(): Promise<WalletCreationResult> {
    // 1. Generate 24-word English mnemonic with 256-bit entropy
    const mnemonic = MnemonicService.generate24WordMnemonic();
    const words = MnemonicService.splitMnemonic(mnemonic);

    // 2. Derive Primary Account (m/44'/148'/0')
    const derived = WalletDerivationService.deriveKeypair(mnemonic, 0);

    // 3. Save to hardware-backed Keystore
    await WalletKeyStorage.saveWallet({
      mnemonic,
      secretKey: derived.secretKey,
      publicKey: derived.publicKey,
      isBackedUp: false,
      accountIndex: 0,
    });

    return {
      mnemonic,
      words,
      publicKey: derived.publicKey,
      derivationPath: derived.derivationPath,
    };
  }

  /**
   * Generates an accessible backup verification challenge.
   * Randomly chooses 3 distinct word indices from 1 to 24.
   * For each target index, generates 3 distractor words from the BIP-39 wordlist
   * to provide an accessible choice for visually impaired users.
   */
  public static createBackupChallenge(mnemonic: string): BackupChallenge {
    const words = MnemonicService.splitMnemonic(mnemonic);
    if (words.length !== 24) {
      throw new Error(`Expected 24 words for backup challenge, received ${words.length}`);
    }

    const fullWordlist = MnemonicService.getWordlist();

    // Select 3 distinct random 1-based indices (e.g. 5, 12, 19)
    const indices: number[] = [];
    while (indices.length < 3) {
      const randIdx = Math.floor(Math.random() * 24) + 1;
      if (!indices.includes(randIdx)) {
        indices.push(randIdx);
      }
    }
    indices.sort((a, b) => a - b);

    const challengeItems: BackupChallengeItem[] = indices.map((idx) => {
      const correctWord = words[idx - 1];

      // Pick 3 distractor words
      const options = [correctWord];
      while (options.length < 4) {
        const distractor = fullWordlist[Math.floor(Math.random() * fullWordlist.length)];
        if (!options.includes(distractor) && distractor !== correctWord) {
          options.push(distractor);
        }
      }

      // Shuffle options deterministically
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        index: idx,
        word: correctWord,
        options,
      };
    });

    return { challengeItems };
  }

  /**
   * Verifies the user's answers to the backup challenge and updates Keystore status.
   */
  public static async verifyBackupAnswers(
    answers: { index: number; selectedWord: string }[],
    challenge: BackupChallenge
  ): Promise<{ success: boolean; error?: string }> {
    if (answers.length !== challenge.challengeItems.length) {
      return {
        success: false,
        error: `Please answer all ${challenge.challengeItems.length} verification questions.`,
      };
    }

    for (const item of challenge.challengeItems) {
      const userAnswer = answers.find((a) => a.index === item.index);
      if (!userAnswer || userAnswer.selectedWord.toLowerCase() !== item.word.toLowerCase()) {
        return {
          success: false,
          error: `Word #${item.index} does not match your recovery phrase. Please check your notes.`,
        };
      }
    }

    // Mark as verified in hardware Keystore
    await WalletKeyStorage.setBackupVerified(true);
    return { success: true };
  }
}
