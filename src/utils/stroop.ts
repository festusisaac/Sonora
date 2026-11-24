/**
 * Stellar Stroop & Decimal Arithmetic Utility
 *
 * Requirements:
 * - 1 XLM = 10,000,000 stroops (10^7).
 * - Maximum 7 decimal places for Stellar asset precision.
 * - Zero native JavaScript floating-point arithmetic for financial calculations.
 * - String-based integer BigInt parsing and formatting to eliminate 0.1 + 0.2 rounding errors.
 */

export const STROOPS_PER_XLM = 10_000_000n;
export const MAX_STELLAR_DECIMALS = 7;

/**
 * Converts a 32-byte Uint8Array hash into a lowercase 64-character hex string.
 */
export function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a decimal string to integer stroops (BigInt) without using floating point arithmetic.
 * Example: "10.5" -> 105000000n
 * Example: "0.0000001" -> 1n
 */
export function decimalToStroops(amount: string): bigint {
  const trimmed = amount.trim();

  if (!trimmed) {
    throw new Error('Amount cannot be empty');
  }

  // Reject negative numbers or invalid characters
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid amount format: "${trimmed}". Must be a positive decimal number.`);
  }

  const parts = trimmed.split('.');
  const wholePart = parts[0];
  const fractionalPart = parts[1] || '';

  if (fractionalPart.length > MAX_STELLAR_DECIMALS) {
    throw new Error(
      `Amount "${trimmed}" exceeds Stellar maximum precision of 7 decimal places.`
    );
  }

  // Pad fractional part with zeros to 7 digits
  const paddedFraction = fractionalPart.padEnd(MAX_STELLAR_DECIMALS, '0');
  const combined = `${wholePart}${paddedFraction}`;

  const stroops = BigInt(combined);
  if (stroops <= 0n) {
    throw new Error('Amount must be greater than zero.');
  }

  return stroops;
}

/**
 * Converts integer stroops (BigInt) back to a normalized decimal string.
 * Example: 105000000n -> "10.5"
 * Example: 1n -> "0.0000001"
 */
export function stroopsToDecimal(stroops: bigint, keepTrailingZeros = false): string {
  if (stroops < 0n) {
    throw new Error('Stroops cannot be negative.');
  }

  const str = stroops.toString().padStart(MAX_STELLAR_DECIMALS + 1, '0');
  const splitIdx = str.length - MAX_STELLAR_DECIMALS;
  const whole = str.slice(0, splitIdx);
  const fraction = str.slice(splitIdx);

  if (keepTrailingZeros) {
    return `${whole}.${fraction}`;
  }

  // Trim unnecessary trailing zeros
  const trimmedFraction = fraction.replace(/0+$/, '');
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

/**
 * Safely format stroops into an accessible, human-readable string.
 * e.g. "10.50 XLM"
 */
export function formatStroopAmount(stroops: bigint, assetCode = 'XLM'): string {
  return `${stroopsToDecimal(stroops)} ${assetCode}`;
}
