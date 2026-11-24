import { StellarRecipientService } from '../../src/services/stellar/stellarRecipientService';
import { StellarAccountService } from '../../src/services/stellar/stellarAccountService';

jest.mock('../../src/services/stellar/stellarAccountService');

describe('StellarRecipientService', () => {
  const existingAddress = 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6';
  const uncreatedAddress = 'GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ';
  const issuerAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid address strings', async () => {
    const res = await StellarRecipientService.validateRecipient(
      'INVALID_ADDRESS',
      { code: 'XLM', isNative: true }
    );
    expect(res.isValidAddress).toBe(false);
    expect(res.canReceiveAsset).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('identifies an existing account that can receive XLM', async () => {
    (StellarAccountService.getAccountInfo as jest.Mock).mockResolvedValueOnce({
      accountId: existingAddress,
      sequence: '100',
      subentryCount: 0,
      balances: [{ asset_type: 'native', balance: '50.0' }],
    });

    const res = await StellarRecipientService.validateRecipient(
      existingAddress,
      { code: 'XLM', isNative: true }
    );

    expect(res.isValidAddress).toBe(true);
    expect(res.exists).toBe(true);
    expect(res.canReceiveAsset).toBe(true);
    expect(res.requiresAccountCreation).toBe(false);
  });

  it('flags uncreated accounts and enforces 1.0 XLM minimum funding requirement', async () => {
    (StellarAccountService.getAccountInfo as jest.Mock).mockResolvedValueOnce(null);

    // If amount >= 1.0 XLM: can create
    const canCreateRes = await StellarRecipientService.validateRecipient(
      uncreatedAddress,
      { code: 'XLM', isNative: true },
      '5.0'
    );
    expect(canCreateRes.exists).toBe(false);
    expect(canCreateRes.requiresAccountCreation).toBe(true);
    expect(canCreateRes.canReceiveAsset).toBe(true);

    // If amount < 1.0 XLM: fails minimum account creation reserve
    (StellarAccountService.getAccountInfo as jest.Mock).mockResolvedValueOnce(null);
    const belowMinRes = await StellarRecipientService.validateRecipient(
      uncreatedAddress,
      { code: 'XLM', isNative: true },
      '0.5'
    );
    expect(belowMinRes.canReceiveAsset).toBe(false);
    expect(belowMinRes.error).toContain('at least 1.0 XLM');
  });

  it('rejects issued asset payments to uncreated accounts', async () => {
    (StellarAccountService.getAccountInfo as jest.Mock).mockResolvedValueOnce(null);

    const res = await StellarRecipientService.validateRecipient(
      uncreatedAddress,
      { code: 'USDC', issuer: issuerAddress, isNative: false },
      '10.0'
    );
    expect(res.canReceiveAsset).toBe(false);
    expect(res.error).toContain('before receiving issued assets');
  });

  it('rejects issued asset payment if recipient account has no trustline', async () => {
    (StellarAccountService.getAccountInfo as jest.Mock).mockResolvedValueOnce({
      accountId: existingAddress,
      sequence: '100',
      subentryCount: 0,
      balances: [{ asset_type: 'native', balance: '50.0' }], // No USDC trustline
    });

    const res = await StellarRecipientService.validateRecipient(
      existingAddress,
      { code: 'USDC', issuer: issuerAddress, isNative: false }
    );
    expect(res.canReceiveAsset).toBe(false);
    expect(res.error).toContain('must establish a trustline');
  });
});
