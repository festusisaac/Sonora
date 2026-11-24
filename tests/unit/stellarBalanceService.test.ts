import { StellarBalanceService } from '../../src/services/stellar/stellarBalanceService';
import { StellarAccountInfo } from '../../src/types/stellar';

describe('StellarBalanceService', () => {
  it('correctly calculates minimum account reserve based on subentry count: (2 + subentries) * 0.5 XLM', () => {
    // 0 subentries -> (2 + 0) * 0.5 = 1.0 XLM reserve
    const account0Subentries: StellarAccountInfo = {
      accountId: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      sequence: '100',
      subentryCount: 0,
      balances: [{ asset_type: 'native', balance: '100.0000000' }],
    };

    const res0 = StellarBalanceService.calculateAccountReserves(account0Subentries);
    expect(res0.minimumReserve).toBe('1');
    expect(res0.minimumReserveStroops).toBe(10_000_000n);
    expect(res0.availableXlm).toBe('99');
    expect(res0.availableXlmStroops).toBe(990_000_000n);

    // 4 subentries -> (2 + 4) * 0.5 = 3.0 XLM reserve
    const account4Subentries: StellarAccountInfo = {
      accountId: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      sequence: '100',
      subentryCount: 4,
      balances: [{ asset_type: 'native', balance: '10.0000000' }],
    };

    const res4 = StellarBalanceService.calculateAccountReserves(account4Subentries);
    expect(res4.minimumReserve).toBe('3');
    expect(res4.minimumReserveStroops).toBe(30_000_000n);
    expect(res4.availableXlm).toBe('7');
    expect(res4.availableXlmStroops).toBe(70_000_000n);
  });

  it('subtracts selling liabilities from available XLM', () => {
    const accountWithLiabilities: StellarAccountInfo = {
      accountId: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      sequence: '100',
      subentryCount: 2, // Reserve = (2 + 2) * 0.5 = 2.0 XLM
      balances: [
        {
          asset_type: 'native',
          balance: '50.0000000',
          selling_liabilities: '5.0000000',
        },
      ],
    };

    const res = StellarBalanceService.calculateAccountReserves(accountWithLiabilities);
    // Available = 50.0 - 2.0 (reserve) - 5.0 (selling liabilities) = 43.0 XLM
    expect(res.minimumReserve).toBe('2');
    expect(res.availableXlm).toBe('43');
    expect(res.availableXlmStroops).toBe(430_000_000n);
  });

  it('calculates max spendable XLM after subtracting estimated fee', () => {
    const account: StellarAccountInfo = {
      accountId: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      sequence: '100',
      subentryCount: 0,
      balances: [{ asset_type: 'native', balance: '2.0000000' }],
    };

    // Available = 2.0 - 1.0 (reserve) = 1.0 XLM (10,000,000 stroops)
    // Fee = 100 stroops -> Max spendable = 9,999,900 stroops (0.99999 XLM)
    const res = StellarBalanceService.calculateAccountReserves(account, 100n);
    expect(res.availableXlm).toBe('1');
    expect(res.maxSpendableXlmStroops).toBe(9_999_900n);
    expect(res.maxSpendableXlm).toBe('0.99999');
  });

  it('calculates available balance for issued assets minus selling liabilities', () => {
    const account: StellarAccountInfo = {
      accountId: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      sequence: '100',
      subentryCount: 1,
      balances: [
        { asset_type: 'native', balance: '100.0000000' },
        {
          asset_type: 'credit_alphanum4',
          asset_code: 'USDC',
          asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          balance: '250.0000000',
          selling_liabilities: '25.0000000',
        },
      ],
    };

    const usdcRes = StellarBalanceService.calculateIssuedAssetAvailable(
      account,
      'USDC',
      'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    );

    // 250 - 25 = 225
    expect(usdcRes.available).toBe('225');
    expect(usdcRes.availableStroops).toBe(2_250_000_000n);
  });
});
