import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { useTransactionSubmission } from '../../src/hooks/useTransactionSubmission';
import { useTransactionStore } from '../../src/store/transactionStore';
import { HapticsService } from '../../src/services/device/haptics';
import { TTSService } from '../../src/services/speech/tts';
import { stroopsToDecimal } from '../../src/utils/stroop';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function ConfirmScreen() {
  const { currentPreparedTransaction } = useTransactionStore();
  const {
    executePayment,
    isProcessing,
    stepMessage,
    verificationResult,
    status,
    errorMessage,
  } = useTransactionSubmission();

  const [announcement, setAnnouncement] = useState<string>('');

  if (!currentPreparedTransaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <AccessibleText variant="title" style={styles.title}>
            No Transaction Found
          </AccessibleText>
          <AccessibleText variant="body" style={styles.emptyBody}>
            No prepared transaction details are available for review.
          </AccessibleText>
          <AccessibleButton
            label="Return to Send"
            accessibilityHint="Goes back to send payment form"
            variant="primary"
            onPress={() => router.replace('/send')}
            style={styles.returnBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  const tx = currentPreparedTransaction;
  const isSuccessful = status === 'successful' && verificationResult?.status === 'successful';
  const feeDecimal = stroopsToDecimal(BigInt(tx.estimatedFeeStroops));
  const totalDebitDecimal = stroopsToDecimal(BigInt(tx.totalEstimatedDebitStroops));

  const handleReadSummary = async () => {
    const memoDesc =
      tx.memo.type !== 'none' && tx.memo.value
        ? `Memo type ${tx.memo.type}: ${tx.memo.value}.`
        : 'No memo attached.';
    const text = `Review payment details. Sending ${tx.amount} ${tx.asset.code} to address ${tx.destinationAddress.slice(0, 8)} on Stellar Testnet. Estimated network fee is ${feeDecimal} XLM. ${memoDesc} Explicit user authorization is required to sign and submit.`;

    setAnnouncement(text);
    await TTSService.speak(text);
  };

  const handleAuthorizeAndSign = async () => {
    await HapticsService.impactHeavy();
    setAnnouncement('Starting local transaction authorization and signing...');

    try {
      const result = await executePayment(tx);
      if (result.status === 'successful') {
        await HapticsService.notificationSuccess();
        const successMsg = `Payment of ${tx.amount} ${tx.asset.code} verified on Stellar ledger ${result.ledger}.`;
        setAnnouncement(successMsg);
        await TTSService.speak(successMsg);
      } else {
        await HapticsService.notificationError();
        const failMsg = `Payment failed: ${result.errorMessage || 'Ledger execution rejected.'}`;
        setAnnouncement(failMsg);
        await TTSService.speak(failMsg);
      }
    } catch (err) {
      await HapticsService.notificationError();
      const msg = err instanceof Error ? err.message : 'Transaction failed.';
      setAnnouncement(`Transaction error: ${msg}`);
      await TTSService.speak(msg);
    }
  };

  const handleCopyHash = async () => {
    const hash = verificationResult?.transactionHash || tx.transactionHash;
    await Clipboard.setStringAsync(hash);
    await HapticsService.notificationSuccess();
    Alert.alert('Hash Copied', 'Transaction hash copied to clipboard.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            {isSuccessful ? 'Payment Confirmed' : 'Review Payment'}
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.subtitle}>
            {isSuccessful ? 'Verified On-Chain' : 'Explicit Authorization Required'}
          </AccessibleText>
        </View>

        {/* Success Banner */}
        {isSuccessful ? (
          <Card style={styles.successCard}>
            <AccessibleText variant="label" style={styles.successTitle}>
              ✓ TRANSACTION CONFIRMED ON LEDGER
            </AccessibleText>
            <AccessibleText variant="body" style={styles.successBody}>
              Your payment has been successfully recorded in Stellar Testnet ledger #{verificationResult?.ledger}.
            </AccessibleText>

            <View style={styles.receiptRow}>
              <AccessibleText variant="caption" style={styles.receiptLabel}>
                Transaction Hash:
              </AccessibleText>
              <AccessibleText variant="caption" style={styles.hashText}>
                {verificationResult?.transactionHash}
              </AccessibleText>
            </View>

            <AccessibleButton
              label="Copy Transaction Hash"
              accessibilityHint="Copies 64-character transaction hash to clipboard"
              variant="secondary"
              onPress={handleCopyHash}
              style={styles.copyBtn}
            />

            <AccessibleButton
              label="Done (Return to Wallet)"
              accessibilityHint="Navigates to wallet overview"
              variant="primary"
              onPress={() => router.replace('/wallet')}
              style={styles.doneBtn}
            />
          </Card>
        ) : (
          /* Pre-authorization Review */
          <View>
            {/* Identity & Address Notice */}
            <Card style={styles.warningCard}>
              <AccessibleText variant="label" style={styles.warningTitle}>
                IDENTITY & SECURITY NOTICE
              </AccessibleText>
              <AccessibleText variant="body" style={styles.warningBody}>
                Validating the address format does NOT prove the identity of the recipient. Once submitted, Stellar payments cannot be reversed.
              </AccessibleText>
            </Card>

            {/* Transaction Parameters Breakdown */}
            <Card style={styles.card}>
              <AccessibleText variant="label" style={styles.fieldLabel}>
                RECIPIENT ADDRESS
              </AccessibleText>
              <AccessibleText variant="body" style={styles.addressValue}>
                {tx.destinationAddress}
              </AccessibleText>

              {tx.recipientLabel && (
                <View style={styles.labelRow}>
                  <AccessibleText variant="caption" style={styles.fieldLabel}>
                    Contact Label:
                  </AccessibleText>
                  <AccessibleText variant="body" style={styles.labelValue}>
                    {tx.recipientLabel} (Unverified local tag)
                  </AccessibleText>
                </View>
              )}

              {tx.isNewAccount && (
                <View style={styles.newAccountBadge}>
                  <AccessibleText variant="caption" style={styles.newAccountText}>
                    New Account: Payment will activate destination on ledger.
                  </AccessibleText>
                </View>
              )}
            </Card>

            {/* Amount & Asset */}
            <Card style={styles.card}>
              <AccessibleText variant="label" style={styles.fieldLabel}>
                PAYMENT AMOUNT
              </AccessibleText>
              <View style={styles.amountRow}>
                <AccessibleText variant="title" style={styles.amountValue}>
                  {tx.amount}
                </AccessibleText>
                <AccessibleText variant="subtitle" style={styles.assetCode}>
                  {tx.asset.code}
                </AccessibleText>
              </View>

              <View style={styles.divider} />

              <View style={styles.feeRow}>
                <AccessibleText variant="body" style={styles.feeLabel}>
                  Estimated Network Fee:
                </AccessibleText>
                <AccessibleText variant="body" style={styles.feeValue}>
                  {feeDecimal} XLM
                </AccessibleText>
              </View>

              <View style={styles.feeRow}>
                <AccessibleText variant="label" style={styles.totalLabel}>
                  Total Debit from Source:
                </AccessibleText>
                <AccessibleText variant="label" style={styles.totalValue}>
                  {totalDebitDecimal} {tx.asset.code === 'XLM' ? 'XLM' : `${tx.asset.code} + Fee`}
                </AccessibleText>
              </View>

              {/* Memo */}
              {tx.memo.type !== 'none' && tx.memo.value && (
                <View style={styles.memoSection}>
                  <View style={styles.divider} />
                  <AccessibleText variant="caption" style={styles.fieldLabel}>
                    Attached Memo ({tx.memo.type.toUpperCase()}):
                  </AccessibleText>
                  <AccessibleText variant="body" style={styles.memoText}>
                    {tx.memo.value}
                  </AccessibleText>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.feeRow}>
                <AccessibleText variant="caption" style={styles.feeLabel}>
                  Network:
                </AccessibleText>
                <AccessibleText variant="caption" style={styles.networkBadge}>
                  Stellar Testnet (m/44&apos;/148&apos;/0&apos;)
                </AccessibleText>
              </View>
            </Card>

            {/* Read Summary Aloud */}
            <AccessibleButton
              label="Speak Transaction Summary"
              accessibilityHint="Speaks complete transaction review aloud"
              variant="secondary"
              onPress={handleReadSummary}
              disabled={isProcessing}
              style={styles.summaryBtn}
            />

            {/* Processing State */}
            {isProcessing && (
              <Card style={styles.processingCard}>
                <ActivityIndicator color={colors.primary} size="large" />
                <AccessibleText variant="body" style={styles.processingText}>
                  {stepMessage || 'Processing transaction...'}
                </AccessibleText>
              </Card>
            )}

            {/* Error Message */}
            {errorMessage ? (
              <AccessibleText
                variant="caption"
                style={styles.errorText}
                accessibilityLiveRegion="assertive"
              >
                {errorMessage}
              </AccessibleText>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <AccessibleButton
                label={isProcessing ? 'Authorizing & Signing...' : 'Authorize & Sign Payment'}
                accessibilityHint="Authorizes payment using device biometrics or PIN and submits to Stellar"
                variant="primary"
                onPress={handleAuthorizeAndSign}
                disabled={isProcessing}
                style={styles.actionButton}
              />

              <AccessibleButton
                label="Cancel & Modify"
                accessibilityHint="Cancels this transaction review and returns to editing"
                variant="secondary"
                onPress={() => router.back()}
                disabled={isProcessing}
                style={styles.actionButton}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    color: colors.primary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyBody: {
    color: colors.textMuted,
    marginVertical: spacing.lg,
    textAlign: 'center',
  },
  returnBtn: {
    width: '100%',
  },
  header: {
    marginBottom: spacing.md,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: spacing.md,
  },
  warningTitle: {
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  warningBody: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  card: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  addressValue: {
    fontFamily: 'monospace',
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  labelRow: {
    marginTop: spacing.sm,
  },
  labelValue: {
    color: colors.textSecondary,
  },
  newAccountBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 6,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  newAccountText: {
    color: colors.accent,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  amountValue: {
    fontSize: 32,
    color: colors.textPrimary,
  },
  assetCode: {
    fontSize: 20,
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.sm,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  feeLabel: {
    color: colors.textSecondary,
  },
  feeValue: {
    color: colors.textPrimary,
  },
  totalLabel: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  totalValue: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  memoSection: {
    marginTop: spacing.xs,
  },
  memoText: {
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  networkBadge: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  summaryBtn: {
    marginBottom: spacing.md,
    width: '100%',
  },
  processingCard: {
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  processingText: {
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginBottom: spacing.md,
  },
  successTitle: {
    color: colors.success,
    marginBottom: spacing.xs,
  },
  successBody: {
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  receiptRow: {
    backgroundColor: colors.surfaceRaised,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  receiptLabel: {
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  hashText: {
    fontFamily: 'monospace',
    color: colors.textSecondary,
    fontSize: 12,
  },
  copyBtn: {
    width: '100%',
  },
  doneBtn: {
    width: '100%',
    marginTop: spacing.md,
  },
});
