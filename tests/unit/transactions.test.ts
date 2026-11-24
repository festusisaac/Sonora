import {
  prepareTransaction,
  isValidTransactionHash,
  verifyTransactionByHash,
} from '../../src/services/stellar/transactions';

describe('Stellar Transaction Service Audit', () => {
  const validDestination =
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const validSource =
    'GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU';

  it('correctly prepares a valid transaction draft with user confirmation set to false', async () => {
    const draft = await prepareTransaction({
      sourcePublicKey: validSource,
      destinationPublicKey: validDestination,
      amount: '50.25',
      assetCode: 'USDC',
    });

    expect(draft.recipientAddress).toBe(validDestination);
    expect(draft.amount).toBe('50.25');
    expect(draft.assetCode).toBe('USDC');
    expect(draft.feeStroops).toBe('100');
    expect(draft.isConfirmedByUser).toBe(false); // Security rule: never auto-confirmed
  });

  it('rejects invalid destination address format during preparation', async () => {
    await expect(
      prepareTransaction({
        sourcePublicKey: validSource,
        destinationPublicKey: 'INVALID_DESTINATION_ADDRESS',
        amount: '10',
        assetCode: 'XLM',
      })
    ).rejects.toThrow('Invalid destination address');
  });

  it('rejects zero or negative amounts', async () => {
    await expect(
      prepareTransaction({
        sourcePublicKey: validSource,
        destinationPublicKey: validDestination,
        amount: '-5',
        assetCode: 'XLM',
      })
    ).rejects.toThrow('Transaction amount must be a positive number');

    await expect(
      prepareTransaction({
        sourcePublicKey: validSource,
        destinationPublicKey: validDestination,
        amount: '0',
        assetCode: 'XLM',
      })
    ).rejects.toThrow('Transaction amount must be a positive number');
  });

  it('validates 64-character hexadecimal transaction hashes', () => {
    const validHash =
      '3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889';
    expect(isValidTransactionHash(validHash)).toBe(true);
    expect(isValidTransactionHash('short-hash')).toBe(false);
    expect(isValidTransactionHash('zzzz' + '0'.repeat(60))).toBe(false);
  });

  it('rejects malformed hashes without querying network in verifyTransactionByHash', async () => {
    const result = await verifyTransactionByHash('malformed-hash');
    expect(result.successful).toBe(false);
    expect(result.errorMessage).toContain('Invalid transaction hash');
  });
});
