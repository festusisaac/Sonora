import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { useWallet } from '../../src/hooks/useWallet';
import { useStellarBalances } from '../../src/hooks/useStellarBalances';
import { useTransactionPreparation } from '../../src/hooks/useTransactionPreparation';
import { HapticsService } from '../../src/services/device/haptics';
import { TTSService } from '../../src/services/speech/tts';
import { ENV } from '../../src/config/env';
import { AssetIdentifier, MemoType } from '../../src/types/transaction.types';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function SendScreen() {
  const { publicKey } = useWallet();
  const { reserves } = useStellarBalances();
  const { prepareTransaction, isPreparing, prepareError } = useTransactionPreparation();

  const [recipient, setRecipient] = useState<string>('');
  const [recipientLabel, setRecipientLabel] = useState<string>('');
  const [selectedAssetCode, setSelectedAssetCode] = useState<'XLM' | 'USDC'>('XLM');
  const [amount, setAmount] = useState<string>('');
  const [memoType, setMemoType] = useState<MemoType>('none');
  const [memoValue, setMemoValue] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');

  const handlePasteRecipient = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setRecipient(text.trim());
      await HapticsService.selection();
      setAnnouncement(`Pasted address from clipboard: ${text.slice(0, 8)}...`);
    }
  };

  const handleReviewPayment = async () => {
    if (!publicKey) {
      Alert.alert('No Wallet', 'Please create or unlock a wallet first.');
      return;
    }

    if (!recipient.trim()) {
      Alert.alert('Missing Recipient', 'Please enter a valid Stellar recipient address.');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Missing Amount', 'Please enter a payment amount.');
      return;
    }

    const isNative = selectedAssetCode === 'XLM';
    const asset: AssetIdentifier = {
      code: selectedAssetCode,
      isNative,
      issuer: isNative ? undefined : ENV.usdcIssuer,
    };

    try {
      await HapticsService.impactMedium();
      await prepareTransaction({
        sourceAddress: publicKey,
        destinationAddress: recipient.trim(),
        asset,
        amount: amount.trim(),
        recipientLabel: recipientLabel.trim() || undefined,
        memo:
          memoType !== 'none' && memoValue.trim()
            ? { type: memoType, value: memoValue.trim() }
            : undefined,
      });

      router.push('/send/confirm' as any);
    } catch (err) {
      await HapticsService.notificationError();
      const msg = err instanceof Error ? err.message : 'Transaction preparation failed.';
      setAnnouncement(`Validation error: ${msg}`);
      await TTSService.speak(msg);
    }
  };

  const handleSpokenSummary = async () => {
    const avail = reserves ? `${reserves.availableXlm} XLM` : 'loading';
    const text = `Send payment screen on Stellar Testnet. Your available balance is ${avail}. Enter recipient address and payment amount. All payments require explicit review and authorization.`;
    setAnnouncement(text);
    await TTSService.speak(text);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            Send Payment
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.subtitle}>
            Stellar Testnet Transfer
          </AccessibleText>
        </View>

        {/* Available Balance Preview */}
        <Card style={styles.balanceCard}>
          <AccessibleText variant="label" style={styles.balanceLabel}>
            AVAILABLE SPENDABLE BALANCE
          </AccessibleText>
          <AccessibleText variant="title" style={styles.balanceAmount}>
            {reserves ? `${reserves.availableXlm} XLM` : '0.00 XLM'}
          </AccessibleText>
          {reserves ? (
            <AccessibleText variant="caption" style={styles.reserveNote}>
              Total: {reserves.totalXlm} XLM (Account Reserve: {reserves.minimumReserve} XLM)
            </AccessibleText>
          ) : null}
          <AccessibleButton
            label="Audio Guidance"
            accessibilityHint="Speaks current available balance and guidance aloud"
            variant="secondary"
            onPress={handleSpokenSummary}
            style={styles.guidanceBtn}
          />
        </Card>

        {/* Recipient Input */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardLabel}>
            RECIPIENT STELLAR ADDRESS
          </AccessibleText>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="G..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            accessible={true}
            accessibilityLabel="Recipient address"
            accessibilityHint="Type or paste 56-character Stellar public address starting with G"
          />

          <View style={styles.inputActions}>
            <AccessibleButton
              label="Paste Address"
              accessibilityHint="Pastes address from device clipboard"
              variant="secondary"
              onPress={handlePasteRecipient}
              style={styles.actionBtn}
            />
          </View>

          <AccessibleText variant="label" style={[styles.cardLabel, { marginTop: spacing.md }]}>
            CONTACT LABEL (OPTIONAL)
          </AccessibleText>
          <TextInput
            style={styles.input}
            value={recipientLabel}
            onChangeText={setRecipientLabel}
            placeholder="e.g. Musa, Office, Alice"
            placeholderTextColor={colors.textMuted}
            accessible={true}
            accessibilityLabel="Optional contact label"
            accessibilityHint="Note: contact labels are unverified local labels and do not verify identity"
          />
          <AccessibleText variant="caption" style={styles.disclaimerText}>
            Notice: Valid address format does not verify the identity of the recipient.
          </AccessibleText>
        </Card>

        {/* Asset Selector */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardLabel}>
            SELECT ASSET
          </AccessibleText>
          <View style={styles.assetSelector}>
            <AccessibleButton
              label="XLM (Native)"
              accessibilityHint="Select native Stellar Lumens"
              variant={selectedAssetCode === 'XLM' ? 'primary' : 'secondary'}
              onPress={() => setSelectedAssetCode('XLM')}
              style={styles.assetBtn}
            />
            <AccessibleButton
              label="USDC (Testnet)"
              accessibilityHint="Select Testnet USDC asset"
              variant={selectedAssetCode === 'USDC' ? 'primary' : 'secondary'}
              onPress={() => setSelectedAssetCode('USDC')}
              style={styles.assetBtn}
            />
          </View>
        </Card>

        {/* Amount Input */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardLabel}>
            AMOUNT ({selectedAssetCode})
          </AccessibleText>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            accessible={true}
            accessibilityLabel="Payment amount"
            accessibilityHint={`Enter amount in ${selectedAssetCode}. Maximum 7 decimal places.`}
          />
        </Card>

        {/* Memo Input */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardLabel}>
            MEMO TYPE
          </AccessibleText>
          <View style={styles.memoTypeRow}>
            {(['none', 'text', 'id'] as MemoType[]).map((t) => (
              <AccessibleButton
                key={t}
                label={t.toUpperCase()}
                accessibilityHint={`Select memo type ${t}`}
                variant={memoType === t ? 'primary' : 'secondary'}
                onPress={() => setMemoType(t)}
                style={styles.memoTypeBtn}
              />
            ))}
          </View>

          {memoType !== 'none' && (
            <TextInput
              style={[styles.input, { marginTop: spacing.md }]}
              value={memoValue}
              onChangeText={setMemoValue}
              placeholder={memoType === 'text' ? 'Max 28 bytes UTF-8 text' : '64-bit integer ID'}
              placeholderTextColor={colors.textMuted}
              accessible={true}
              accessibilityLabel={`${memoType.toUpperCase()} memo value`}
            />
          )}
        </Card>

        {/* Error Feedback */}
        {prepareError ? (
          <AccessibleText
            variant="caption"
            style={styles.errorText}
            accessibilityLiveRegion="assertive"
          >
            {prepareError}
          </AccessibleText>
        ) : null}

        {/* Review Action */}
        <AccessibleButton
          label={isPreparing ? 'Validating Payment...' : 'Review Payment Details'}
          accessibilityHint="Proceeds to explicit transaction review screen"
          variant="primary"
          onPress={handleReviewPayment}
          disabled={isPreparing || !recipient.trim() || !amount.trim()}
          style={styles.reviewButton}
        />
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
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    color: colors.primary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  balanceCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  balanceLabel: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: 28,
    color: colors.textPrimary,
  },
  reserveNote: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  guidanceBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  card: {
    marginBottom: spacing.md,
  },
  cardLabel: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 48,
  },
  inputActions: {
    marginTop: spacing.sm,
    flexDirection: 'row',
  },
  actionBtn: {
    alignSelf: 'flex-start',
  },
  disclaimerText: {
    color: colors.warning,
    marginTop: spacing.xs,
  },
  assetSelector: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  assetBtn: {
    flex: 1,
    minHeight: 48,
  },
  memoTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  memoTypeBtn: {
    flex: 1,
    minHeight: 48,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  reviewButton: {
    marginTop: spacing.md,
    width: '100%',
  },
});
