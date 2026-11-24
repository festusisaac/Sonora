import { WalletCreationService } from '../../src/services/wallet/walletCreationService';
import { WalletRestorationService } from '../../src/services/wallet/walletRestorationService';
import * as SecureStore from 'expo-secure-store';

describe('Wallet Creation & Restoration Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a new wallet, generates 24 words and derives public key', async () => {
    const result = await WalletCreationService.createWallet();

    expect(result.words).toHaveLength(24);
    expect(result.publicKey).toMatch(/^G[A-Z0-9]{55}$/);
    expect(result.derivationPath).toBe("m/44'/148'/0'");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_mnemonic',
      result.mnemonic,
      expect.any(Object)
    );
  });

  it('generates an accessible backup challenge with 3 questions and 4 options each', () => {
    const mnemonic =
      'bench hurt jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better';

    const challenge = WalletCreationService.createBackupChallenge(mnemonic);
    expect(challenge.challengeItems).toHaveLength(3);

    challenge.challengeItems.forEach((item) => {
      expect(item.index).toBeGreaterThanOrEqual(1);
      expect(item.index).toBeLessThanOrEqual(24);
      expect(item.options).toHaveLength(4);
      expect(item.options).toContain(item.word);
    });
  });

  it('verifies correct backup challenge answers and marks backup verified', async () => {
    const mnemonic =
      'bench hurt jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better';

    const challenge = WalletCreationService.createBackupChallenge(mnemonic);
    const correctAnswers = challenge.challengeItems.map((item) => ({
      index: item.index,
      selectedWord: item.word,
    }));

    const verifyRes = await WalletCreationService.verifyBackupAnswers(correctAnswers, challenge);
    expect(verifyRes.success).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_backup_verified',
      'true',
      expect.any(Object)
    );
  });

  it('rejects incorrect backup challenge answers', async () => {
    const mnemonic =
      'bench hurt jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better';

    const challenge = WalletCreationService.createBackupChallenge(mnemonic);
    const wrongAnswers = challenge.challengeItems.map((item) => ({
      index: item.index,
      selectedWord: 'wrongword',
    }));

    const verifyRes = await WalletCreationService.verifyBackupAnswers(wrongAnswers, challenge);
    expect(verifyRes.success).toBe(false);
    expect(verifyRes.error).toContain('does not match');
  });

  it('restores wallet from valid 24-word recovery phrase', async () => {
    const mnemonic =
      'bench hurt jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better';

    const result = await WalletRestorationService.restoreFromMnemonic(mnemonic);
    expect(result.publicKey).toBe('GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ');
    expect(result.derivationPath).toBe("m/44'/148'/0'");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_backup_verified',
      'true',
      expect.any(Object)
    );
  });

  it('rejects invalid recovery phrase during restoration', async () => {
    const invalidPhrase = 'apple banana cherry invalid phrase';
    await expect(
      WalletRestorationService.restoreFromMnemonic(invalidPhrase)
    ).rejects.toThrow();
  });
});
