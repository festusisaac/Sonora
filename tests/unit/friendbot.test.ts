import { StellarTestnetFundingService } from '../../src/services/stellar/stellarTestnetFundingService';
import { ENV } from '../../src/config/env';

describe('StellarTestnetFundingService (Friendbot)', () => {
  const originalFetch = globalThis.fetch;
  const validTestnetAddress = 'GC3MMSXBWHL6CPOAVERSJITX7BH76YU252WGLUOM5CJX3E7UCYZBTPJQ';

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('rejects funding when address is invalid', async () => {
    const res = await StellarTestnetFundingService.fundAccount('INVALID_ADDRESS');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Invalid');
  });

  it('rejects funding when network is not TESTNET', async () => {
    const origNet = ENV.stellarNetwork;
    try {
      (ENV as any).stellarNetwork = 'MAINNET';
      await expect(
        StellarTestnetFundingService.fundAccount(validTestnetAddress)
      ).rejects.toThrow('strictly forbidden');
    } finally {
      (ENV as any).stellarNetwork = origNet;
    }
  });

  it('handles successful Friendbot funding (HTTP 200)', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce({
        hash: 'test_tx_hash_1234567890abcdef',
      }),
    } as any);

    const res = await StellarTestnetFundingService.fundAccount(validTestnetAddress);
    expect(res.success).toBe(true);
    expect(res.txHash).toBe('test_tx_hash_1234567890abcdef');
    expect(res.message).toContain('Account funded successfully');
  });

  it('handles Friendbot 400 bad request / already exists', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValueOnce({
        detail: 'Account already funded',
      }),
    } as any);

    const res = await StellarTestnetFundingService.fundAccount(validTestnetAddress);
    expect(res.success).toBe(false);
    expect(res.message).toContain('Account already funded');
  });

  it('handles Friendbot 429 rate limit', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as any);

    const res = await StellarTestnetFundingService.fundAccount(validTestnetAddress);
    expect(res.success).toBe(false);
    expect(res.message).toContain('rate limit exceeded');
  });

  it('handles network abort / timeout', async () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';
    globalThis.fetch = jest.fn().mockRejectedValueOnce(abortErr);

    const res = await StellarTestnetFundingService.fundAccount(validTestnetAddress);
    expect(res.success).toBe(false);
    expect(res.message).toContain('timed out');
  });
});
