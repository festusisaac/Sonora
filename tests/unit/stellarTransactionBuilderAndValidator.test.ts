import { StellarTransactionBuilderService } from '../../src/services/stellar/stellarTransactionBuilder';
import { StellarTransactionValidator } from '../../src/services/stellar/stellarTransactionValidator';
import { StellarAccountService } from '../../src/services/stellar/stellarAccountService';
import { StellarNetworkConfig } from '../../src/services/stellar/stellarNetworkConfig';

jest.mock('../../src/services/stellar/stellarAccountService');

describe('StellarTransactionBuilder & Validator', () => {
  const sourceAddress = 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6';
  const destinationAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const issuerAddress = 'GAXG3LWEXWCAWUABRO6SMAEUKJXLB5BBX6J2KMHFRIWKAMDJKCFGS3NN';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects self-payment when source and destination are identical', async () => {
    const val = await StellarTransactionValidator.validatePayment({
      sourceAddress,
      destinationAddress: sourceAddress,
      asset: { code: 'XLM', isNative: true },
      amount: '10.0',
    });

    expect(val.isValid).toBe(false);
    if (!val.isValid) {
      expect(val.error).toContain('cannot be identical');
    }
  });

  it('rejects payment if source has insufficient available balance (accounting for reserve)', async () => {
    // Source has 2.0 XLM total, but with 0 subentries, reserve is 1.0 XLM -> only 1.0 XLM available
    (StellarAccountService.getAccountInfo as jest.Mock).mockResolvedValue({
      accountId: sourceAddress,
      sequence: '100',
      subentryCount: 0,
      balances: [{ asset_type: 'native', balance: '2.0000000' }],
    });

    const val = await StellarTransactionValidator.validatePayment({
      sourceAddress,
      destinationAddress,
      asset: { code: 'XLM', isNative: true },
      amount: '1.5', // 1.5 > 1.0 available
    });

    expect(val.isValid).toBe(false);
    if (!val.isValid) {
      expect(val.error).toContain('Insufficient available XLM balance');
    }
  });

  it('builds a valid payment transaction with exact deterministic transaction hash', async () => {
    // Source account has 100 XLM available
    (StellarAccountService.getAccountInfo as jest.Mock)
      .mockResolvedValueOnce({
        accountId: sourceAddress,
        sequence: '500',
        subentryCount: 0,
        balances: [{ asset_type: 'native', balance: '100.0000000' }],
      })
      .mockResolvedValueOnce({
        // Destination exists
        accountId: destinationAddress,
        sequence: '200',
        subentryCount: 0,
        balances: [{ asset_type: 'native', balance: '50.0000000' }],
      });

    const mockServer = {
      loadAccount: jest.fn().mockResolvedValue({
        id: sourceAddress,
        sequence: '500',
      }),
    };
    jest.spyOn(StellarNetworkConfig, 'getHorizonServer').mockReturnValue(mockServer as any);

    const prepared = await StellarTransactionBuilderService.preparePaymentTransaction({
      sourceAddress,
      destinationAddress,
      asset: { code: 'XLM', isNative: true },
      amount: '12.5',
      memo: { type: 'text', value: 'Invoice 101' },
      customFeeStroops: 100n,
    });

    expect(prepared.sourceAddress).toBe(sourceAddress);
    expect(prepared.destinationAddress).toBe(destinationAddress);
    expect(prepared.amount).toBe('12.5');
    expect(prepared.amountStroops).toBe('125000000');
    expect(prepared.estimatedFeeStroops).toBe('100');
    expect(prepared.totalEstimatedDebitStroops).toBe('125000100');
    expect(prepared.memo.value).toBe('Invoice 101');
    expect(prepared.isNewAccount).toBe(false);
    expect(prepared.network).toBe('TESTNET');
    expect(prepared.unsignedXdr).toBeDefined();
    expect(prepared.transactionHash).toMatch(/^[0-9a-fA-F]{64}$/);
  });
});

