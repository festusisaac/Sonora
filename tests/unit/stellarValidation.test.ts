import { validateStellarAddress } from '../../src/services/stellar/validation';

describe('Stellar Address Validation', () => {
  it('should validate a syntactically correct Testnet ed25519 public address', () => {
    // Valid standard Stellar ed25519 public address
    const validAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    const result = validateStellarAddress(validAddress);

    expect(result.isValid).toBe(true);
    expect(result.address).toBe(validAddress);
    expect(result.error).toBeUndefined();
  });

  it('should reject an address that does not begin with G', () => {
    const invalidPrefix = 'SBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    const result = validateStellarAddress(invalidPrefix);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('must begin with uppercase G');
  });

  it('should reject an address with invalid length', () => {
    const shortAddress = 'GBBD47IF6LWK7P7';
    const result = validateStellarAddress(shortAddress);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid address length');
  });

  it('should reject an empty address', () => {
    const result = validateStellarAddress('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('cannot be empty');
  });
});
