import { StrKey } from '@stellar/stellar-sdk';
import { AddressValidationResult } from '../../types/stellar';

/**
 * Validates a Stellar Public Address (G... format)
 * Rule: Validating format does not mean authenticating identity.
 */
export function validateStellarAddress(address: string): AddressValidationResult {
  const trimmed = address.trim();

  if (!trimmed) {
    return {
      isValid: false,
      address: trimmed,
      error: 'Stellar address cannot be empty',
    };
  }

  if (trimmed.length !== 56) {
    return {
      isValid: false,
      address: trimmed,
      error: `Invalid address length (${trimmed.length}). Expected 56 characters.`,
    };
  }

  if (!trimmed.startsWith('G')) {
    return {
      isValid: false,
      address: trimmed,
      error: 'Stellar public addresses must begin with uppercase G.',
    };
  }

  try {
    const isValid = StrKey.isValidEd25519PublicKey(trimmed);
    return {
      isValid,
      address: trimmed,
      error: isValid ? undefined : 'Invalid Stellar checksum or character encoding.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown validation error';
    return {
      isValid: false,
      address: trimmed,
      error: message,
    };
  }
}
