import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { useAIStore } from '../../src/store/aiStore';
import { useWalletStore } from '../../src/store/walletStore';
import { TTSService } from '../../src/services/speech/tts';
import { HapticsService } from '../../src/services/device/haptics';
import { StellarTestnetFundingService } from '../../src/services/stellar/stellarTestnetFundingService';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function SettingsScreen() {
  const { highContrast, setHighContrast } = useAppTheme();
  const { speechSpeed, setSpeechSpeed, clearConversation } = useAIStore();
  const { publicKey } = useWalletStore();

  const [announcement, setAnnouncement] = useState<string>('');
  const [isFunding, setIsFunding] = useState<boolean>(false);

  const handleSetSpeed = async (speed: number) => {
    setSpeechSpeed(speed);
    await HapticsService.selection();
    const speedLabel = speed === 0.8 ? 'slower' : speed === 1.2 ? 'faster' : 'normal';
    const text = `Speech speed set to ${speedLabel}.`;
    setAnnouncement(text);
    await TTSService.speak(text, { rate: speed });
  };

  const toggleContrast = async () => {
    const next = !highContrast;
    setHighContrast(next);
    await HapticsService.impactMedium();
    const text = next ? 'High contrast mode enabled.' : 'Standard contrast mode enabled.';
    setAnnouncement(text);
    await TTSService.speak(text);
  };

  const handleClearTranscript = async () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to delete your conversation history for privacy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Transcript',
          style: 'destructive',
          onPress: async () => {
            clearConversation();
            await HapticsService.notificationSuccess();
            const text = 'Conversation history cleared successfully.';
            setAnnouncement(text);
            await TTSService.speak(text);
          },
        },
      ]
    );
  };

  const handleFundTestnet = async () => {
    if (!publicKey) {
      Alert.alert('No Account', 'Please connect or create a wallet first.');
      return;
    }
    setIsFunding(true);
    setAnnouncement('Requesting 10,000 Testnet XLM from Friendbot...');
    try {
      await StellarTestnetFundingService.fundAccount(publicKey);
      await HapticsService.notificationSuccess();
      const text = 'Friendbot funding complete! 10,000 Testnet XLM received.';
      setAnnouncement(text);
      await TTSService.speak(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Friendbot funding failed';
      setAnnouncement(`Funding error: ${msg}`);
      Alert.alert('Funding Error', msg);
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <AccessibleButton
          label="← Back to Home"
          accessibilityHint="Returns to main voice assistant screen"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backBtn}
        />

        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            Accessibility & Settings
          </AccessibleText>
          <AccessibleText variant="body" style={styles.subtitle}>
            Adjust voice speed, contrast, data privacy, and Stellar Testnet preferences.
          </AccessibleText>
        </View>

        {/* Voice Speech Speed Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            TEXT-TO-SPEECH SPEED
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            Adjust how fast SONORA speaks responses to you. Current: {speechSpeed}x.
          </AccessibleText>

          <View style={styles.speedRow}>
            <AccessibleButton
              label="0.8x Slower"
              accessibilityHint="Sets speech playback rate to slower speed"
              variant={speechSpeed === 0.8 ? 'primary' : 'secondary'}
              onPress={() => handleSetSpeed(0.8)}
              style={styles.speedBtn}
            />
            <AccessibleButton
              label="1.0x Normal"
              accessibilityHint="Sets speech playback rate to normal speed"
              variant={speechSpeed === 1.0 ? 'primary' : 'secondary'}
              onPress={() => handleSetSpeed(1.0)}
              style={styles.speedBtn}
            />
            <AccessibleButton
              label="1.2x Faster"
              accessibilityHint="Sets speech playback rate to faster speed"
              variant={speechSpeed === 1.2 ? 'primary' : 'secondary'}
              onPress={() => handleSetSpeed(1.2)}
              style={styles.speedBtn}
            />
          </View>
        </Card>

        {/* Visual Contrast Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            VISUAL ACCESSIBILITY
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            Toggle high contrast color scheme for improved readability on AMOLED displays.
          </AccessibleText>

          <AccessibleButton
            label={highContrast ? 'High Contrast Mode: ON' : 'High Contrast Mode: OFF'}
            accessibilityHint="Toggles high contrast color theme"
            variant={highContrast ? 'primary' : 'secondary'}
            onPress={toggleContrast}
            style={styles.actionBtn}
          />
        </Card>

        {/* Privacy & Conversation Hygiene Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            PRIVACY & DATA HYGIENE
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            SONORA never sends your recovery phrase or private keys to external AI models or cloud storage.
          </AccessibleText>

          <AccessibleButton
            label="Clear Conversation Transcript"
            accessibilityHint="Permanently clears your spoken chat history from this device"
            variant="danger"
            onPress={handleClearTranscript}
            style={styles.actionBtn}
          />
        </Card>

        {/* Stellar Testnet Faucet Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            STELLAR TESTNET FUNDING
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            Need test XLM? Request free test funds directly from Stellar Friendbot.
          </AccessibleText>

          <AccessibleButton
            label={isFunding ? 'Funding from Friendbot...' : 'Request 10,000 Test XLM'}
            accessibilityHint="Requests test funds for testing payments on Stellar Testnet"
            variant="primary"
            onPress={handleFundTestnet}
            disabled={isFunding}
            style={styles.fundBtn}
          />
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
  bodyText: {
    color: colors.brandSecondaryText,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  speedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  speedBtn: {
    flex: 1,
    minHeight: 48,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
  fundBtn: {
    marginTop: spacing.xs,
    backgroundColor: colors.brandYellow,
  },
});
