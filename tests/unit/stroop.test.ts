import {
  decimalToStroops,
  stroopsToDecimal,
  formatStroopAmount,
  STROOPS_PER_XLM,
} from '../../src/utils/stroop';

describe('Stellar Stroop & Exact Decimal Arithmetic Utility', () => {
  it('converts exact decimal XLM strings to integer stroops', () => {
    expect(decimalToStroops('1')).toBe(10_000_000n);
    expect(decimalToStroops('1.5')).toBe(15_000_000n);
    expect(decimalToStroops('100.1234567')).toBe(1_001_234_567n);
    expect(decimalToStroops('0.0000001')).toBe(1n); // Minimum stroop
    expect(decimalToStroops('10000')).toBe(100_000_000_000n);
  });

  it('converts stroops back to normalized decimal strings', () => {
    expect(stroopsToDecimal(10_000_000n)).toBe('1');
    expect(stroopsToDecimal(15_000_000n)).toBe('1.5');
    expect(stroopsToDecimal(1_001_234_567n)).toBe('100.1234567');
    expect(stroopsToDecimal(1n)).toBe('0.0000001');
    expect(stroopsToDecimal(0n)).toBe('0');
  });

  it('preserves precision without floating point errors', () => {
    // In IEEE 754 float: 0.1 + 0.2 = 0.30000000000000004
    const stroopA = decimalToStroops('0.1');
    const stroopB = decimalToStroops('0.2');
    const sum = stroopA + stroopB;

    expect(sum).toBe(3_000_000n);
    expect(stroopsToDecimal(sum)).toBe('0.3');
  });

  it('rejects amounts exceeding 7 decimal places', () => {
    expect(() => decimalToStroops('1.12345678')).toThrow(
      'exceeds Stellar maximum precision'
    );
  });

  it('rejects zero or negative amounts', () => {
    expect(() => decimalToStroops('0')).toThrow('greater than zero');
    expect(() => decimalToStroops('-5')).toThrow('Invalid amount format');
    expect(() => decimalToStroops('abc')).toThrow('Invalid amount format');
    expect(() => decimalToStroops('')).toThrow('cannot be empty');
  });

  it('formats amounts into accessible string with asset code', () => {
    expect(formatStroopAmount(50_000_000n, 'XLM')).toBe('5 XLM');
    expect(formatStroopAmount(250_000_000n, 'USDC')).toBe('25 USDC');
  });
});
