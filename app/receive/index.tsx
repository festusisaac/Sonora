import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  TextInput,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { useWalletStore } from '../../src/store/walletStore';
import { TTSService } from '../../src/services/speech/tts';
import { HapticsService } from '../../src/services/device/haptics';
import { ProactiveGuidance } from '../../src/services/ai/proactiveGuidance';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function ReceiveScreen() {
  const { publicKey } = useWalletStore();
  const [announcement, setAnnouncement] = useState<string>('');
  const [reqAmount, setReqAmount] = useState<string>('');
  const [reqMemo, setReqMemo] = useState<string>('');
  const [reqAsset, setReqAsset] = useState<'XLM' | 'USDC'>('XLM');
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);

  const activeAddress = publicKey || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  const handleSpeakAddress = async () => {
    const formatted = ProactiveGuidance.formatAddressForSpeech(activeAddress);
    const speech = `Your public receiving address is ${formatted}. You can safely share this address to receive funds.`;
    setAnnouncement(speech);
    await HapticsService.impactMedium();
    await TTSService.speak(speech);
  };

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(activeAddress);
    await HapticsService.notificationSuccess();
    setAnnouncement('Public address copied to clipboard.');
  };

  const handleShareAddress = async () => {
    try {
      await HapticsService.selection();
      await Share.share({
        message: activeAddress,
        title: 'My Stellar Address',
      });
    } catch {
      setAnnouncement('Could not open share menu.');
    }
  };

  const handleExplainDifference = async () => {
    const speech =
      'Difference explanation: Your wallet address is your permanent public key where anyone can send any supported asset anytime. A payment request specifies an exact amount and optional memo for a specific transaction.';
    setAnnouncement(speech);
    await HapticsService.selection();
    await TTSService.speak(speech);
  };

  const handleGeneratePaymentRequest = () => {
    let uri = `web+stellar:pay?destination=${activeAddress}`;
    if (reqAmount.trim()) {
      uri += `&amount=${encodeURIComponent(reqAmount.trim())}`;
    }
    if (reqAsset !== 'XLM') {
      uri += `&asset_code=${encodeURIComponent(reqAsset)}`;
    }
    if (reqMemo.trim()) {
      uri += `&memo=${encodeURIComponent(reqMemo.trim())}&memo_type=MEMO_TEXT`;
    }
    setGeneratedUri(uri);
    HapticsService.notificationSuccess();
    setAnnouncement(`Payment request created for ${reqAmount || 'any amount'} ${reqAsset}.`);
  };

  const handleShareRequestUri = async () => {
    if (!generatedUri) return;
    await HapticsService.selection();
    await Share.share({
      message: generatedUri,
      title: 'Stellar Payment Request',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Navigation Back */}
        <AccessibleButton
          label="← Back to Home"
          accessibilityHint="Returns to main voice assistant screen"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backBtn}
        />

        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            Receive Payments
          </AccessibleText>
          <AccessibleText variant="body" style={styles.subtitle}>
            Share your public address or generate payment requests for Stellar Testnet.
          </AccessibleText>
        </View>

        {/* Public Address Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            YOUR PUBLIC STELLAR ADDRESS
          </AccessibleText>

          <View style={styles.addressBox}>
            <AccessibleText
              variant="caption"
              style={styles.addressText}
              accessibilityLabel={`Public address: ${activeAddress}`}
            >
              {activeAddress}
            </AccessibleText>
          </View>

          <View style={styles.actionRow}>
            <AccessibleButton
              label="Speak Address"
              accessibilityHint="Reads your public address aloud clearly"
              variant="primary"
              onPress={handleSpeakAddress}
              style={styles.actionBtn}
            />
            <AccessibleButton
              label="Copy"
              accessibilityHint="Copies public address to clipboard"
              variant="secondary"
              onPress={handleCopyAddress}
              style={styles.actionBtn}
            />
            <AccessibleButton
              label="Share"
              accessibilityHint="Opens native share sheet to share address"
              variant="secondary"
              onPress={handleShareAddress}
              style={styles.actionBtn}
            />
          </View>

          <AccessibleButton
            label="Explain Address vs Payment Request"
            accessibilityHint="Plays spoken explanation of addresses versus payment requests"
            variant="secondary"
            onPress={handleExplainDifference}
            style={styles.explainBtn}
          />
        </Card>

        {/* Payment Request Generator Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            CREATE PAYMENT REQUEST (SEP-0007)
          </AccessibleText>
          <AccessibleText variant="body" style={styles.fieldHint}>
            Specify an exact amount and memo to request from another wallet.
          </AccessibleText>

          <AccessibleText variant="caption" style={styles.inputLabel}>
            Requested Amount
          </AccessibleText>
          <TextInput
            style={styles.input}
            placeholder="e.g. 10 or 25.5"
            placeholderTextColor={colors.brandSecondaryText}
            value={reqAmount}
            onChangeText={setReqAmount}
            keyboardType="decimal-pad"
            accessibilityLabel="Requested amount input"
            accessibilityHint="Enter the numeric amount you wish to request"
          />

          <AccessibleText variant="caption" style={styles.inputLabel}>
            Select Asset
          </AccessibleText>
          <View style={styles.assetToggleRow}>
            <AccessibleButton
              label="Native XLM"
              accessibilityHint="Requests Stellar Lumens"
              variant={reqAsset === 'XLM' ? 'primary' : 'secondary'}
              onPress={() => setReqAsset('XLM')}
              style={styles.assetBtn}
            />
            <AccessibleButton
              label="USDC Token"
              accessibilityHint="Requests test USDC tokens"
              variant={reqAsset === 'USDC' ? 'primary' : 'secondary'}
              onPress={() => setReqAsset('USDC')}
              style={styles.assetBtn}
            />
          </View>

          <AccessibleText variant="caption" style={styles.inputLabel}>
            Optional Memo
          </AccessibleText>
          <TextInput
            style={styles.input}
            placeholder="e.g. For dinner"
            placeholderTextColor={colors.brandSecondaryText}
            value={reqMemo}
            onChangeText={setReqMemo}
            maxLength={28}
            accessibilityLabel="Optional memo text input"
            accessibilityHint="Enter up to 28 characters for the memo"
          />

          <AccessibleButton
            label="Generate Payment Request"
            accessibilityHint="Builds standard SEP-0007 Stellar payment URI"
            variant="primary"
            onPress={handleGeneratePaymentRequest}
            style={styles.generateBtn}
          />

          {generatedUri ? (
            <View style={styles.generatedBox}>
              <AccessibleText variant="label" style={styles.uriLabel}>
                GENERATED STELLAR URI:
              </AccessibleText>
              <AccessibleText variant="caption" style={styles.uriText}>
                {generatedUri}
              </AccessibleText>
              <AccessibleButton
                label="Share Payment Request"
                accessibilityHint="Shares the generated payment request link"
                variant="primary"
                onPress={handleShareRequestUri}
                style={styles.shareUriBtn}
              />
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brandMilky,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.brandBlack,
  },
  subtitle: {
    color: colors.brandSecondaryText,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.brandWhite,
    borderColor: colors.brandBorder,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.brandBlack,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  addressBox: {
    backgroundColor: colors.brandMilky,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    marginBottom: spacing.md,
  },
  addressText: {
    color: colors.brandBlack,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 90,
  },
  explainBtn: {
    marginTop: spacing.sm,
  },
  fieldHint: {
    color: colors.brandSecondaryText,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.brandSecondaryText,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.brandMilky,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.brandBlack,
    minHeight: 48,
    fontSize: 16,
  },
  assetToggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  assetBtn: {
    flex: 1,
    minHeight: 44,
  },
  generateBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brandYellow,
  },
  generatedBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.brandMilky,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.brandYellow,
  },
  uriLabel: {
    color: colors.brandBlack,
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  uriText: {
    color: colors.brandBlack,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  shareUriBtn: {
    backgroundColor: colors.brandYellow,
  },
});
