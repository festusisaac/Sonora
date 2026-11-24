import { StellarMemoService } from '../../src/services/stellar/stellarMemoService';
import { MemoDetails } from '../../src/types/transaction.types';

describe('StellarMemoService', () => {
  it('validates text memo up to 28 UTF-8 bytes', () => {
    const validAscii: MemoDetails = { type: 'text', value: 'Invoice #12345' };
    expect(StellarMemoService.validateMemo(validAscii).isValid).toBe(true);

    // Exact 28 bytes
    const exact28Bytes: MemoDetails = {
      type: 'text',
      value: '1234567890123456789012345678',
    };
    expect(StellarMemoService.validateMemo(exact28Bytes).isValid).toBe(true);
    expect(StellarMemoService.getUtf8ByteLength(exact28Bytes.value!)).toBe(28);

    // 29 bytes (exceeds)
    const tooLong: MemoDetails = {
      type: 'text',
      value: '12345678901234567890123456789',
    };
    const valTooLong = StellarMemoService.validateMemo(tooLong);
    expect(valTooLong.isValid).toBe(false);
    expect(valTooLong.error).toContain('Maximum allowed is 28 UTF-8 bytes');
  });

  it('correctly accounts for multi-byte UTF-8 characters', () => {
    // Each emoji is 4 UTF-8 bytes: 8 emojis = 32 bytes > 28 bytes
    const emojiMemo: MemoDetails = {
      type: 'text',
      value: '👋🎉🚀💎🔥🌟✨🎊', // 8 emojis = 32 bytes
    };
    const val = StellarMemoService.validateMemo(emojiMemo);
    expect(val.isValid).toBe(false);
    expect(val.error).toContain('too long');
  });

  it('validates ID memos (64-bit unsigned integers)', () => {
    const validId: MemoDetails = { type: 'id', value: '123456789' };
    expect(StellarMemoService.validateMemo(validId).isValid).toBe(true);

    const maxUint64: MemoDetails = {
      type: 'id',
      value: '18446744073709551615',
    };
    expect(StellarMemoService.validateMemo(maxUint64).isValid).toBe(true);

    const negativeId: MemoDetails = { type: 'id', value: '-123' };
    expect(StellarMemoService.validateMemo(negativeId).isValid).toBe(false);

    const stringId: MemoDetails = { type: 'id', value: 'abc' };
    expect(StellarMemoService.validateMemo(stringId).isValid).toBe(false);
  });

  it('validates 32-byte hex Hash and Return memos (64 hex characters)', () => {
    const validHash: MemoDetails = {
      type: 'hash',
      value: '937ae91f6ab6f12461d9936dfc1375ea5312d097f3f1eb6fed6a82fbe38c8582',
    };
    expect(StellarMemoService.validateMemo(validHash).isValid).toBe(true);

    const invalidLength: MemoDetails = {
      type: 'hash',
      value: '1234abcd',
    };
    expect(StellarMemoService.validateMemo(invalidLength).isValid).toBe(false);

    const nonHex: MemoDetails = {
      type: 'return',
      value: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
    };
    expect(StellarMemoService.validateMemo(nonHex).isValid).toBe(false);
  });

  it('instantiates valid Stellar SDK Memo objects', () => {
    const textMemo = StellarMemoService.toStellarMemo({
      type: 'text',
      value: 'Payment OK',
    });
    expect(textMemo.type).toBe('text');

    const noneMemo = StellarMemoService.toStellarMemo({ type: 'none' });
    expect(noneMemo.type).toBe('none');
  });
});
