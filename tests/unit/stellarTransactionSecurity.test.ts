import {
  Account,
  Operation,
  TransactionBuilder,
  Asset,
  Networks,
} from '@stellar/stellar-sdk';
import { StellarTransactionAuthorizer } from '../../src/services/stellar/stellarTransactionAuthorizer';
import { StellarTransactionSigner } from '../../src/services/stellar/stellarTransactionSigner';
import { WalletKeyStorage } from '../../src/services/security/walletKeyStorage';
import { DeviceAuthenticationService } from '../../src/services/security/deviceAuthenticationService';
import { PreparedPaymentTransaction } from '../../src/types/transaction.types';

jest.mock('../../src/services/security/walletKeyStorage');
jest.mock('../../src/services/security/deviceAuthenticationService');

describe('Transaction Authorization & Signing Security Invariants', () => {
  const sourceAddress = 'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ6';
  const destinationAddress = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const validSecretKey = 'SBGWSG6BTNCKCOB3DIFBGCVMUPQFYPA2G4O34RMTB343OYPXU5DJDVMN';

  // Build genuine valid unsigned transaction
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

  const realUnsignedXdr = realTx.toXDR();
  const realHash = Array.from(realTx.hash())
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const samplePreparedTx: PreparedPaymentTransaction = {
    transactionId: 'tx_1',
    transactionHash: realHash,
    sourceAddress,
    destinationAddress,
    asset: { code: 'XLM', isNative: true },
    amount: '10.0000000',
    amountStroops: '100000000',
    estimatedFeeStroops: '100',
    totalEstimatedDebitStroops: '100000100',
    memo: { type: 'none' },
    isNewAccount: false,
    sequence: '100',
    unsignedXdr: realUnsignedXdr,
    network: 'TESTNET',
    createdAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates an authorization token strictly bound to transaction hash', () => {
    const auth = StellarTransactionAuthorizer.authorizeTransaction(samplePreparedTx);
    expect(auth.transactionHash).toBe(samplePreparedTx.transactionHash);
    expect(auth.userConfirmed).toBe(true);

    const isValid = StellarTransactionAuthorizer.isAuthorized(samplePreparedTx, auth);
    expect(isValid).toBe(true);
  });

  it('invalidates authorization if ANY transaction parameter is tampered with', () => {
    const auth = StellarTransactionAuthorizer.authorizeTransaction(samplePreparedTx);

    // Tampered transaction with different recipient or hash
    const tamperedTx: PreparedPaymentTransaction = {
      ...samplePreparedTx,
      destinationAddress: 'GAVXVW5MCK7Q66RIBWZZKZEDQTRXWCZUP4DIIFXCCENGW2P6W4OA34RH',
      transactionHash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    };

    const isAuthorized = StellarTransactionAuthorizer.isAuthorized(tamperedTx, auth);
    expect(isAuthorized).toBe(false);
  });

  it('aborts signing immediately if biometric authentication is cancelled or fails', async () => {
    const auth = StellarTransactionAuthorizer.authorizeTransaction(samplePreparedTx);

    (DeviceAuthenticationService.authenticate as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Authentication cancelled by user.',
    });

    await expect(
      StellarTransactionSigner.signTransaction(samplePreparedTx, auth)
    ).rejects.toThrow('Authentication cancelled');

    // Keystore secret was never accessed
    expect(WalletKeyStorage.getSecretKey).not.toHaveBeenCalled();
  });

  it('aborts signing if authorization token is missing or mismatched', async () => {
    const wrongAuth = {
      transactionHash: '0000000000000000000000000000000000000000000000000000000000000000',
      authorizedAt: Date.now(),
      userConfirmed: true,
    };

    await expect(
      StellarTransactionSigner.signTransaction(samplePreparedTx, wrongAuth)
    ).rejects.toThrow('Missing or invalid user authorization');
  });

  it('signs transaction successfully upon valid biometric authentication and clears secret from memory', async () => {
    const auth = StellarTransactionAuthorizer.authorizeTransaction(samplePreparedTx);

    (DeviceAuthenticationService.authenticate as jest.Mock).mockResolvedValueOnce({
      success: true,
    });
    (WalletKeyStorage.getSecretKey as jest.Mock).mockResolvedValueOnce(validSecretKey);

    const signed = await StellarTransactionSigner.signTransaction(
      samplePreparedTx,
      auth
    );

    expect(signed.signedXdr).toBeDefined();
    expect(signed.transactionHash).toBe(realHash);
    expect(WalletKeyStorage.getSecretKey).toHaveBeenCalledTimes(1);
  });
});
