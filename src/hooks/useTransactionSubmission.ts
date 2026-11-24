import { useState, useCallback } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { StellarTransactionAuthorizer } from '../services/stellar/stellarTransactionAuthorizer';
import { StellarTransactionSigner } from '../services/stellar/stellarTransactionSigner';
import { StellarTransactionSubmissionService } from '../services/stellar/stellarTransactionSubmissionService';
import { StellarTransactionVerificationService } from '../services/stellar/stellarTransactionVerificationService';
import {
  PreparedPaymentTransaction,
  VerifiedTransactionResult,
} from '../types/transaction.types';

export function useTransactionSubmission() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepMessage, setStepMessage] = useState<string>('');

  const {
    currentPreparedTransaction,
    authorization,
    submissionResult,
    verificationResult,
    status,
    errorMessage,
    setAuthorization,
    setSubmissionResult,
    setVerificationResult,
    setStatus,
    setError,
    clearTransaction,
  } = useTransactionStore();

  /**
   * Step 1: User explicitly confirms review and authorizes transaction.
   */
  const authorizePayment = useCallback(
    (tx?: PreparedPaymentTransaction) => {
      const target = tx || currentPreparedTransaction;
      if (!target) {
        throw new Error('No prepared transaction to authorize.');
      }

      const auth = StellarTransactionAuthorizer.authorizeTransaction(target);
      setAuthorization(auth);
      return auth;
    },
    [currentPreparedTransaction, setAuthorization]
  );

  /**
   * Step 2: Executes Signing -> Submission -> Ledger Verification pipeline.
   */
  const executePayment = useCallback(
    async (
      tx?: PreparedPaymentTransaction
    ): Promise<VerifiedTransactionResult> => {
      const target = tx || currentPreparedTransaction;
      if (!target) {
        throw new Error('No prepared transaction to execute.');
      }

      setIsProcessing(true);
      setError(null);

      try {
        // A. Authorize
        setStepMessage('Obtaining transaction authorization...');
        const auth = authorizePayment(target);

        // B. Biometric Authentication & Local Signing
        setStepMessage('Authenticating and signing transaction locally...');
        setStatus('signing');
        const signed = await StellarTransactionSigner.signTransaction(
          target,
          auth
        );
        setStatus('signed');

        // C. Network Submission
        setStepMessage('Submitting transaction to Stellar Testnet...');
        setStatus('submitting');
        const submission =
          await StellarTransactionSubmissionService.submitSignedTransaction(
            signed.signedXdr,
            signed.transactionHash
          );
        setSubmissionResult(submission);

        if (submission.status === 'failed') {
          throw new Error(submission.errorMessage || 'Transaction rejected by Stellar network.');
        }

        if (submission.status === 'uncertain') {
          setStatus('submission_uncertain');
          setStepMessage('Submission timed out. Verification uncertain.');
          return {
            status: 'pending',
            transactionHash: signed.transactionHash,
            source: target.sourceAddress,
            destination: target.destinationAddress,
            assetCode: target.asset.code,
            amount: target.amount,
            errorMessage: submission.errorMessage,
          };
        }

        // D. Ledger Verification
        setStepMessage('Verifying transaction inclusion on Stellar ledger...');
        setStatus('pending_verification');
        const verification =
          await StellarTransactionVerificationService.pollVerification(
            signed.transactionHash
          );
        setVerificationResult(verification);

        if (verification.status === 'successful') {
          setStatus('successful');
          setStepMessage('Payment confirmed on Stellar ledger!');
        } else if (verification.status === 'failed') {
          setStatus('failed');
          setStepMessage('Payment failed on ledger execution.');
        } else {
          setStatus('pending_verification');
          setStepMessage('Payment is pending ledger ingestion.');
        }

        setIsProcessing(false);
        return verification;
      } catch (err) {
        setIsProcessing(false);
        const msg =
          err instanceof Error ? err.message : 'Transaction execution failed.';
        setError(msg);
        setStatus('failed');
        setStepMessage(`Error: ${msg}`);
        throw err;
      }
    },
    [
      currentPreparedTransaction,
      authorizePayment,
      setStatus,
      setSubmissionResult,
      setVerificationResult,
      setError,
    ]
  );

  return {
    isProcessing,
    stepMessage,
    status,
    errorMessage,
    authorization,
    submissionResult,
    verificationResult,
    authorizePayment,
    executePayment,
    clearTransaction,
  };
}
