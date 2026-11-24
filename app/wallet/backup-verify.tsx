import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { useWallet } from '../../src/hooks/useWallet';
import { WalletKeyStorage } from '../../src/services/security/walletKeyStorage';
import { HapticsService } from '../../src/services/device/haptics';
import { TTSService } from '../../src/services/speech/tts';
import { BackupChallenge } from '../../src/types/wallet';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function BackupVerifyScreen() {
  const { mnemonic: paramMnemonic } = useLocalSearchParams<{ mnemonic?: string }>();
  const { createBackupChallenge, verifyBackup, isLoading } = useWallet();

  const [challenge, setChallenge] = useState<BackupChallenge | null>(null);
  const [selectedWords, setSelectedWords] = useState<Record<number, string>>({});
  const [announcement, setAnnouncement] = useState<string>('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let activeMnemonic = paramMnemonic;
      if (!activeMnemonic) {
        activeMnemonic = (await WalletKeyStorage.getMnemonic()) || '';
      }

      if (activeMnemonic) {
        try {
          const generatedChallenge = createBackupChallenge(activeMnemonic);
          setChallenge(generatedChallenge);
          setAnnouncement(
            'Backup verification challenge. Please select the correct word for each of the three requested positions.'
          );
        } catch {
          Alert.alert('Error', 'Could not initialize backup challenge.');
        }
      } else {
        Alert.alert('No Wallet Found', 'No wallet found to verify.', [
          { text: 'Go Back', onPress: () => router.back() },
        ]);
      }
    })();
  }, [paramMnemonic, createBackupChallenge]);

  const handleSelectWord = async (index: number, word: string) => {
    await HapticsService.selection();
    setSelectedWords((prev) => ({ ...prev, [index]: word }));
    setErrorStatus(null);
  };

  const handleVerify = async () => {
    if (!challenge) return;

    const answers = Object.entries(selectedWords).map(([idxStr, word]) => ({
      index: Number(idxStr),
      selectedWord: word,
    }));

    if (answers.length < challenge.challengeItems.length) {
      const msg = `Please answer all ${challenge.challengeItems.length} questions before confirming.`;
      setErrorStatus(msg);
      await TTSService.speak(msg);
      await HapticsService.notificationWarning();
      return;
    }

    const result = await verifyBackup(answers, challenge);
    if (result.success) {
      await HapticsService.notificationSuccess();
      await TTSService.speak('Backup verified successfully! Your wallet is now active.');
      Alert.alert(
        'Backup Verified!',
        'Your recovery phrase backup has been verified. You can now use your wallet.',
        [{ text: 'Continue', onPress: () => router.replace('/wallet') }]
      );
    } else {
      await HapticsService.notificationError();
      setErrorStatus(result.error || 'Verification failed. Please re-check your backup words.');
      await TTSService.speak('Verification failed. One or more words did not match.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            Verify Backup
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.subtitle}>
            Step 2 of 2: Confirm 3 Random Words
          </AccessibleText>
        </View>

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <AccessibleText variant="body" style={styles.instructionsText}>
            Select the word that matches each requested position from your written backup notes.
          </AccessibleText>
        </Card>

        {/* Questions */}
        {challenge?.challengeItems.map((item) => (
          <Card key={item.index} style={styles.questionCard}>
            <AccessibleText variant="label" style={styles.questionTitle}>
              WHAT IS WORD #{item.index}?
            </AccessibleText>

            <View style={styles.optionsGrid}>
              {item.options.map((opt) => {
                const isSelected = selectedWords[item.index] === opt;
                return (
                  <AccessibleButton
                    key={opt}
                    label={opt}
                    accessibilityHint={`Select ${opt} as word number ${item.index}`}
                    variant={isSelected ? 'primary' : 'secondary'}
                    onPress={() => handleSelectWord(item.index, opt)}
                    style={styles.optionButton}
                  />
                );
              })}
            </View>
          </Card>
        ))}

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

        {/* Submit */}
        <AccessibleButton
          label={isLoading ? 'Verifying...' : 'Confirm Backup'}
          accessibilityHint="Submits your answers to complete the backup verification"
          variant="primary"
          onPress={handleVerify}
          disabled={isLoading}
          style={styles.submitButton}
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
  instructionsCard: {
    marginBottom: spacing.lg,
  },
  instructionsText: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  questionCard: {
    marginBottom: spacing.md,
  },
  questionTitle: {
    color: colors.accent,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    minWidth: '47%',
    minHeight: 48,
  },
  errorText: {
    color: colors.danger,
    marginVertical: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
});
