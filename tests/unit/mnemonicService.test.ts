import { MnemonicService } from '../../src/services/wallet/mnemonicService';

describe('MnemonicService', () => {
  it('generates a valid 24-word recovery phrase with 256 bits of entropy', () => {
    const mnemonic = MnemonicService.generate24WordMnemonic();
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(24);

    const validation = MnemonicService.validate(mnemonic);
    expect(validation.isValid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  it('normalizes whitespace and case properly', () => {
    const raw = '   ABANDON   abandon   Abandon   about  ';
    const normalized = MnemonicService.normalizeMnemonic(raw);
    expect(normalized).toBe('abandon abandon abandon about');
  });

  it('rejects empty or whitespace-only phrases', () => {
    const res1 = MnemonicService.validate('');
    expect(res1.isValid).toBe(false);
    expect(res1.error).toContain('empty');

    const res2 = MnemonicService.validate('   ');
    expect(res2.isValid).toBe(false);
  });

  it('strictly rejects non-24 word phrases by default', () => {
    const twelveWords =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const validation = MnemonicService.validate(twelveWords);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('must contain exactly 24 words');
  });

  it('accepts 12-word phrases when allow12Words option is explicitly true', () => {
    const twelveWords =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const validation = MnemonicService.validate(twelveWords, { allow12Words: true });
    expect(validation.isValid).toBe(true);
  });

  it('rejects words not in the BIP-39 English dictionary', () => {
    const fakeMnemonic =
      'apple banana cherry nonexistentword abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const validation = MnemonicService.validate(fakeMnemonic);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('Unrecognized word in phrase: "nonexistentword"');
  });

  it('rejects mnemonics with invalid checksums', () => {
    // 24 valid BIP-39 words but swapped word order (checksum will fail)
    const swappedOrderMnemonic =
      'hurt bench jump file august wise shallow faculty impulse spring exact slush thunder author capable act festival slice deposit sauce coconut afford frown better';
    const validation = MnemonicService.validate(swappedOrderMnemonic);
    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('checksum');
  });

  it('splits mnemonic into words array', () => {
    const phrase = 'abandon abandon about';
    const words = MnemonicService.splitMnemonic(phrase);
    expect(words).toEqual(['abandon', 'abandon', 'about']);
  });
});
