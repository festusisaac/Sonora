import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { useWallet } from '../../src/hooks/useWallet';
import { HapticsService } from '../../src/services/device/haptics';
import { TTSService } from '../../src/services/speech/tts';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function CreateWalletScreen() {
  const { createWallet, isLoading } = useWallet();
  const [mnemonic, setMnemonic] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState<string>('');
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await createWallet();
        if (isMounted) {
          setMnemonic(result.mnemonic);
          setWords(result.words);
          setAnnouncement(
            'New 24-word recovery phrase generated. Please write down these words in order and store them in a secure location.'
          );
        }
      } catch {
        if (isMounted) {
          Alert.alert(
            'Wallet Generation Error',
            'Could not generate wallet securely. Please try again.'
          );
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [createWallet]);

  const handleCopyPhrase = async () => {
    if (!mnemonic) return;
    await Clipboard.setStringAsync(mnemonic);
    setHasCopied(true);
    await HapticsService.notificationSuccess();
    setAnnouncement('Recovery phrase copied to clipboard. Paste and store securely.');
  };

  const handleProceedToVerification = async () => {
    if (!mnemonic) return;
    await HapticsService.selection();
    // Navigate to backup verification with the generated mnemonic passed via param
    router.push({
      pathname: '/wallet/backup-verify' as any,
      params: { mnemonic },
    });
  };

  const handleSpeakInstruction = async () => {
    await TTSService.speak(
      'Notice: To safeguard your privacy against eavesdropping, your recovery phrase words are never spoken aloud automatically. Write down the twenty-four words displayed on screen, or copy them to a secure password manager.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            New Recovery Phrase
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.subtitle}>
            Step 1 of 2: Write Down Your 24 Words
          </AccessibleText>
        </View>

        {/* Security Warning Notice */}
        <Card style={styles.warningCard}>
          <AccessibleText variant="label" style={styles.warningTitle}>
            CRITICAL SECURITY NOTICE
          </AccessibleText>
          <AccessibleText variant="body" style={styles.warningBody}>
            These 24 words are the ONLY way to recover your funds. Never share them with anyone, including SONORA support.
          </AccessibleText>
          <AccessibleButton
            label="Read Privacy Notice"
            accessibilityHint="Speaks audio notice explaining why words are not read aloud automatically"
            variant="secondary"
            onPress={handleSpeakInstruction}
            style={styles.instructionButton}
          />
        </Card>

        {/* Words Grid */}
        <View style={styles.wordsContainer} accessible={true} accessibilityLabel="Recovery words list">
          {words.map((word, index) => (
            <View
              key={index}
              style={styles.wordBadge}
              accessible={true}
              accessibilityLabel={`Word number ${index + 1}: ${word}`}
            >
              <AccessibleText variant="caption" style={styles.wordNumber}>
                {index + 1}.
              </AccessibleText>
              <AccessibleText variant="body" style={styles.wordText}>
                {word}
              </AccessibleText>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AccessibleButton
            label={hasCopied ? 'Phrase Copied' : 'Copy Phrase to Clipboard'}
            accessibilityHint="Copies all 24 words to your device clipboard"
            variant="secondary"
            onPress={handleCopyPhrase}
            disabled={!mnemonic || isLoading}
            style={styles.button}
          />

          <AccessibleButton
            label="Verify Recovery Phrase"
            accessibilityHint="Proceeds to confirmation challenge to verify you backed up your phrase"
            variant="primary"
            onPress={handleProceedToVerification}
            disabled={!mnemonic || isLoading}
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
    backgroundColor: colors.milky,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    color: colors.black,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  warningTitle: {
    color: colors.warning,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  warningBody: {
    color: colors.black,
    lineHeight: 20,
  },
  instructionButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  wordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: '45%',
    minHeight: 48,
  },
  wordNumber: {
    color: colors.secondary,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  wordText: {
    color: colors.black,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    width: '100%',
  },
});
