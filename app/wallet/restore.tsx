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
import { MnemonicService } from '../../src/services/wallet/mnemonicService';
import { HapticsService } from '../../src/services/device/haptics';
import { TTSService } from '../../src/services/speech/tts';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function RestoreWalletScreen() {
  const { restoreWallet, isLoading } = useWallet();
  const [phraseInput, setPhraseInput] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const words = MnemonicService.splitMnemonic(phraseInput);
  const wordCount = words.length;

  const handleTextChange = (text: string) => {
    setPhraseInput(text);
    setErrorStatus(null);
  };

  const handlePasteClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setPhraseInput(text);
      await HapticsService.selection();
      const count = MnemonicService.splitMnemonic(text).length;
      setAnnouncement(`Pasted ${count} words from clipboard.`);
    }
  };

  const handleClear = () => {
    setPhraseInput('');
    setErrorStatus(null);
  };

  const handleRestore = async () => {
    const validation = MnemonicService.validate(phraseInput, { allow12Words: true });
    if (!validation.isValid) {
      const errorMsg = validation.error || 'Invalid recovery phrase.';
      setErrorStatus(errorMsg);
      await TTSService.speak(errorMsg);
      await HapticsService.notificationError();
      return;
    }

    try {
      await restoreWallet(phraseInput);
      await HapticsService.notificationSuccess();
      await TTSService.speak('Wallet restored successfully from recovery phrase.');
      Alert.alert(
        'Wallet Restored',
        'Your Stellar Testnet wallet has been restored successfully.',
        [{ text: 'Go to Wallet', onPress: () => router.replace('/wallet') }]
      );
    } catch (err) {
      await HapticsService.notificationError();
      const msg = err instanceof Error ? err.message : 'Wallet restoration failed.';
      setErrorStatus(msg);
      await TTSService.speak('Wallet restoration encountered an error.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            Restore Wallet
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.subtitle}>
            Enter your 24-word or 12-word recovery phrase
          </AccessibleText>
        </View>

        {/* Input Card */}
        <Card style={styles.inputCard}>
          <AccessibleText variant="label" style={styles.inputLabel}>
            RECOVERY PHRASE
          </AccessibleText>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={phraseInput}
            onChangeText={handleTextChange}
            placeholder="e.g. apple banana cherry dog elephant..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            accessible={true}
            accessibilityLabel="Recovery phrase input"
            accessibilityHint="Type or paste your recovery phrase separated by spaces"
          />

          <View style={styles.counterRow}>
            <AccessibleText variant="caption" style={styles.counterText}>
              Word count: {wordCount} (requires 24 words, or 12 words)
            </AccessibleText>
            {phraseInput.length > 0 && (
              <AccessibleButton
                label="Clear"
                variant="secondary"
                onPress={handleClear}
                style={styles.clearBtn}
              />
            )}
          </View>
        </Card>

        {/* Error Feedback */}
        {errorStatus ? (
          <AccessibleText
            variant="caption"
            style={styles.errorText}
            accessibilityLiveRegion="assertive"
          >
            {errorStatus}
          </AccessibleText>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AccessibleButton
            label="Paste from Clipboard"
            accessibilityHint="Pastes recovery phrase from device clipboard"
            variant="secondary"
            onPress={handlePasteClipboard}
            style={styles.button}
          />

          <AccessibleButton
            label={isLoading ? 'Restoring Wallet...' : 'Restore Wallet'}
            accessibilityHint="Restores the wallet and derives your Stellar Testnet account"
            variant="primary"
            onPress={handleRestore}
            disabled={wordCount === 0 || isLoading}
            style={styles.button}
          />
        </View>
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
  inputCard: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  counterText: {
    color: colors.textSecondary,
  },
  clearBtn: {
    paddingHorizontal: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    width: '100%',
  },
});
