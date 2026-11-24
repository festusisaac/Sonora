import {
  Account,
  Operation,
  TransactionBuilder,
  Asset,
  Networks,
} from '@stellar/stellar-sdk';
import { StellarTransactionSubmissionService } from '../../src/services/stellar/stellarTransactionSubmissionService';
import { StellarTransactionVerificationService } from '../../src/services/stellar/stellarTransactionVerificationService';
import { StellarNetworkConfig } from '../../src/services/stellar/stellarNetworkConfig';

describe('Transaction Submission & Verification Services', () => {
  const sourceAddress = 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6';
  const destinationAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  const sourceAccount = new Account(sourceAddress, '100');
  const realTx = new TransactionBuilder(sourceAccount, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: Asset.native(),
        amount: '10.0000000',
      })
    )
    .setTimeout(300)
    .build();

  const dummySignedXdr = realTx.toXDR();
  const dummyTxHash = Array.from(realTx.hash())
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles submission error gracefully and extracts rejection details', async () => {
    const mockServer = {
      submitTransaction: jest.fn().mockRejectedValueOnce({
        response: {
          data: {
            title: 'Transaction Failed',
            extras: {
              result_codes: {
                transaction: 'tx_failed',
                operations: ['op_underfunded'],
              },
            },
          },
        },
      }),
    };

    jest.spyOn(StellarNetworkConfig, 'getHorizonServer').mockReturnValue(mockServer as any);

    const res = await StellarTransactionSubmissionService.submitSignedTransaction(
      dummySignedXdr,
      dummyTxHash
    );

    expect(res.status).toBe('failed');
    expect(res.successful).toBe(false);
    expect(res.errorMessage).toContain('tx_failed: op_underfunded');
  });

  it('marks submission as uncertain upon network timeout to prevent double spending', async () => {
    const timeoutErr = new Error('Network timeout');
    timeoutErr.name = 'AbortError';

    const mockServer = {
      submitTransaction: jest.fn().mockRejectedValueOnce(timeoutErr),
      transactions: jest.fn().mockReturnValue({
        transaction: jest.fn().mockReturnValue({
          call: jest.fn().mockRejectedValueOnce(new Error('Not found (404)')),
        }),
      }),
    };

    jest.spyOn(StellarNetworkConfig, 'getHorizonServer').mockReturnValue(mockServer as any);

    const res = await StellarTransactionSubmissionService.submitSignedTransaction(
      dummySignedXdr,
      dummyTxHash
    );

    expect(res.status).toBe('uncertain');
    expect(res.successful).toBe(false);
    expect(res.errorMessage).toContain('status is uncertain');
  });

  it('verifies on-chain transaction by hash and extracts ledger sequence and actual fee', async () => {
    const mockTx = {
      hash: dummyTxHash,
      successful: true,
      ledger_attr: 1234567,
      fee_charged: 100,
      source_account: sourceAddress,
      created_at: '2026-11-24T22:00:00Z',
      operations: jest.fn().mockResolvedValueOnce({
        records: [
          {
            type: 'payment',
            to: destinationAddress,
            asset_type: 'native',
            amount: '15.0000000',
          },
        ],
      }),
    };

    const mockServer = {
      transactions: jest.fn().mockReturnValue({
        transaction: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValueOnce(mockTx),
        }),
      }),
    };

    jest.spyOn(StellarNetworkConfig, 'getHorizonServer').mockReturnValue(mockServer as any);

    const verification = await StellarTransactionVerificationService.verifyTransaction(dummyTxHash);

    expect(verification.status).toBe('successful');
    expect(verification.ledger).toBe(1234567);
    expect(verification.actualFeeStroops).toBe('100');
    expect(verification.amount).toBe('15.0000000');
    expect(verification.destination).toBe(destinationAddress);
  });
});
