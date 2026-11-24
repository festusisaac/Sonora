import { WalletDerivationService } from '../../src/services/wallet/walletDerivationService';

describe('SEP-0005 Stellar Key Derivation Vectors', () => {
  it('correctly derives Test Vector 1 (12 words)', () => {
    const mnemonic =
      'illness spike retreat truth genius clock brain pass fit cave bargain toe';
    const expectedSeed =
      'e4a5a632e70943ae7f07659df1332160937fad82587216a4c64315a0fb39497ee4a01f76ddab4cba68147977f3a147b6ad584c41808e8238a07f6cc4b582f186';
    const expectedAddress0 =
      'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6';
    const expectedSecret0 =
      'SBGWSG6BTNCKCOB3DIFBGCVMUPQFYPA2G4O34RMTB343OYPXU5DJDVMN';

    const seedHex = WalletDerivationService.deriveSeedHex(mnemonic);
    expect(seedHex).toBe(expectedSeed);

    const derived = WalletDerivationService.deriveKeypair(mnemonic, 0);
    expect(derived.derivationPath).toBe("m/44'/148'/0'");
    expect(derived.publicKey).toBe(expectedAddress0);
    expect(derived.secretKey).toBe(expectedSecret0);
  });

  it('correctly derives Test Vector 3 (24 words, multiple accounts)', () => {
    const mnemonic =
      'bench hurt jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better';
    const expectedSeed =
      '937ae91f6ab6f12461d9936dfc1375ea5312d097f3f1eb6fed6a82fbe38c85824da8704389831482db0433e5f6c6c9700ff1946aa75ad8cc2654d6e40f567866';

    const seedHex = WalletDerivationService.deriveSeedHex(mnemonic);
    expect(seedHex).toBe(expectedSeed);

    // Primary Account (index 0)
    const acc0 = WalletDerivationService.deriveKeypair(mnemonic, 0);
    expect(acc0.derivationPath).toBe("m/44'/148'/0'");
    expect(acc0.publicKey).toBe(
      'GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ'
    );
    expect(acc0.secretKey).toBe(
      'SAEWIVK3VLNEJ3WEJRZXQGDAS5NVG2BYSYDFRSH4GKVTS5RXNVED5AX7'
    );

    // Secondary Account (index 1)
    const acc1 = WalletDerivationService.deriveKeypair(mnemonic, 1);
    expect(acc1.derivationPath).toBe("m/44'/148'/1'");
    expect(acc1.publicKey).toBe(
      'GB3MTYFXPBZBUINVG72XR7AQ6P2I32CYSXWNRKJ2PV5H5C7EAM5YYISO'
    );
    expect(acc1.secretKey).toBe(
      'SBKSABCPDWXDFSZISAVJ5XKVIEWV4M5O3KBRRLSPY3COQI7ZP423FYB4'
    );
  });

  it('correctly derives Test Vector 4 (24 words with BIP-39 passphrase)', () => {
    const mnemonic =
      'cable spray genius state float twenty onion head street palace net private method loan turn phrase state blanket interest dry amazing dress blast tube';
    const passphrase = 'p4ssphr4se';
    const expectedSeed =
      'd425d39998fb42ce4cf31425f0eaec2f0a68f47655ea030d6d26e70200d8ff8bd4326b4bdf562ea8640a1501ae93ccd0fd7992116da5dfa24900e570a742a489';

    const seedHex = WalletDerivationService.deriveSeedHex(mnemonic, passphrase);
    expect(seedHex).toBe(expectedSeed);

    const derived = WalletDerivationService.deriveKeypair(mnemonic, 0, passphrase);
    expect(derived.derivationPath).toBe("m/44'/148'/0'");
    expect(derived.publicKey).toBe(
      'GDAHPZ2NSYIIHZXM56Y36SBVTV5QKFIZGYMMBHOU53ETUSWTP62B63EQ'
    );
    expect(derived.secretKey).toBe(
      'SAFWTGXVS7ELMNCXELFWCFZOPMHUZ5LXNBGUVRCY3FHLFPXK4QPXYP2X'
    );
  });

  it('correctly derives Test Vector 5 (12 words zero entropy)', () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const expectedSeed =
      '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4';

    const seedHex = WalletDerivationService.deriveSeedHex(mnemonic);
    expect(seedHex).toBe(expectedSeed);

    const derived = WalletDerivationService.deriveKeypair(mnemonic, 0);
    expect(derived.publicKey).toBe(
      'GB3JDWCQJCWMJ3IILWIGDTQJJC5567PGVEVXSCVPEQOTDN64VJBDQBYX'
    );
    expect(derived.secretKey).toBe(
      'SBUV3MRWKNS6AYKZ6E6MOUVF2OYMON3MIUASWL3JLY5E3ISDJFELYBRZ'
    );
  });
});
