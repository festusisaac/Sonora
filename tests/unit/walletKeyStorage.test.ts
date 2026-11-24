import * as SecureStore from 'expo-secure-store';
import { WalletKeyStorage } from '../../src/services/security/walletKeyStorage';

describe('WalletKeyStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves wallet mnemonic, secret key, public key, and metadata', async () => {
    const params = {
      mnemonic: 'apple banana cherry dog elephant fox grape horse island jacket kangaroo lion monkey nurse orange parrot queen rabbit tiger umbrella violet wolf zebra zoo',
      secretKey: 'SAEWIVK3VLNEJ3WEJRZXQGDAS5NVG2BYSYDFRSH4GKVTS5RXNVED5AX7',
      publicKey: 'GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ',
      isBackedUp: false,
    };

    await WalletKeyStorage.saveWallet(params);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_mnemonic',
      params.mnemonic,
      expect.any(Object)
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_secret_key',
      params.secretKey,
      expect.any(Object)
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_public_key',
      params.publicKey,
      expect.any(Object)
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_backup_verified',
      'false',
      expect.any(Object)
    );
  });

  it('retrieves public key and reports hasWallet', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ');

    const pubKey = await WalletKeyStorage.getPublicKey();
    expect(pubKey).toBe('GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ');

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ');
    const hasWallet = await WalletKeyStorage.hasWallet();
    expect(hasWallet).toBe(true);
  });

  it('updates backup verification state', async () => {
    await WalletKeyStorage.setBackupVerified(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'sonora_sec_wallet_backup_verified',
      'true',
      expect.any(Object)
    );
  });

  it('clears all wallet entries when clearWallet is called', async () => {
    await WalletKeyStorage.clearWallet();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sonora_sec_wallet_mnemonic');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sonora_sec_wallet_secret_key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sonora_sec_wallet_public_key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sonora_sec_wallet_backup_verified');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sonora_sec_wallet_metadata');
  });
});
