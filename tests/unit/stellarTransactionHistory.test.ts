import { StellarTransactionHistoryService } from '../../src/services/stellar/stellarTransactionHistoryService';
import { StellarNetworkConfig } from '../../src/services/stellar/stellarNetworkConfig';

describe('StellarTransactionHistoryService', () => {
  const activeAccount = 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6';
  const counterparty = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('retrieves and categorizes incoming and outgoing payments', async () => {
    const mockPaymentsCall = jest.fn().mockResolvedValueOnce({
      records: [
        {
          id: 'op_1',
          type: 'payment',
          from: activeAccount,
          to: counterparty,
          asset_type: 'native',
          amount: '10.0000000',
          transaction_hash: '937ae91f6ab6f12461d9936dfc1375ea5312d097f3f1eb6fed6a82fbe38c8582',
          created_at: '2026-11-24T20:00:00Z',
          paging_token: '1001',
        },
        {
          id: 'op_2',
          type: 'payment',
          from: counterparty,
          to: activeAccount,
          asset_type: 'credit_alphanum4',
          asset_code: 'USDC',
          asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          amount: '50.0000000',
          transaction_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          created_at: '2026-11-24T21:00:00Z',
          paging_token: '1002',
        },
      ],
    });

    const mockServer = {
      payments: jest.fn().mockReturnValue({
        forAccount: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              call: mockPaymentsCall,
            }),
          }),
        }),
      }),
    };

    jest.spyOn(StellarNetworkConfig, 'getHorizonServer').mockReturnValue(mockServer as any);

    const page = await StellarTransactionHistoryService.getAccountPaymentHistory(activeAccount);

    expect(page.items).toHaveLength(2);

    // Item 1: Outgoing payment
    expect(page.items[0].direction).toBe('outgoing');
    expect(page.items[0].counterparty).toBe(counterparty);
    expect(page.items[0].amount).toBe('10.0000000');
    expect(page.items[0].assetCode).toBe('XLM');

    // Item 2: Incoming payment
    expect(page.items[1].direction).toBe('incoming');
    expect(page.items[1].counterparty).toBe(counterparty);
    expect(page.items[1].amount).toBe('50.0000000');
    expect(page.items[1].assetCode).toBe('USDC');

    // Pagination cursors
    expect(page.nextCursor).toBe('1002');
    expect(page.prevCursor).toBe('1001');
  });
});
