import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { TTSService } from '../../src/services/speech/tts';
import { HapticsService } from '../../src/services/device/haptics';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function OnboardingScreen() {
  const [announcement, setAnnouncement] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const handlePlayWelcome = async () => {
    const text =
      'Welcome to SONORA. Your voice. Your money. Your control. SONORA is a voice-first Stellar wallet designed for blind and visually impaired people. You can check your balance, send payments, receive funds, and manage contacts completely through spoken conversation.';
    setAnnouncement(text);
    setIsPlayingAudio(true);
    await HapticsService.impactMedium();

    try {
      await TTSService.speak(text, {
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleExplainSecurity = async () => {
    const text =
      'Security notice: SONORA is non-custodial. Your recovery phrase and private keys are stored only on your device and protected by your biometric security. Recovery phrases are never sent to external AI servers or cloud providers.';
    setAnnouncement(text);
    setIsPlayingAudio(true);
    await HapticsService.selection();

    try {
      await TTSService.speak(text, {
        onDone: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleStopAudio = async () => {
    await TTSService.stop();
    setIsPlayingAudio(false);
    setAnnouncement('Audio stopped.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            Welcome to SONORA
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.tagline}>
            Your voice. Your money. Your control.
          </AccessibleText>
          <View style={styles.badge}>
            <AccessibleText variant="caption" style={styles.badgeText}>
              ACCESSIBLE STELLAR WALLET
            </AccessibleText>
          </View>
        </View>

        {/* Overview Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            HOW SONORA WORKS
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            SONORA is an AI-first Stellar wallet companion designed specifically for blind and visually impaired individuals.
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            Instead of searching for buttons or complex visual menus, you speak naturally: &quot;Check my balance&quot;, &quot;Send 5 XLM to Amina&quot;, or &quot;Show my address&quot;.
          </AccessibleText>

          <View style={styles.audioActionRow}>
            <AccessibleButton
              label={isPlayingAudio ? 'Playing Introduction...' : 'Hear Spoken Introduction'}
              accessibilityHint="Plays clear audio introduction to SONORA"
              variant="primary"
              onPress={handlePlayWelcome}
              disabled={isPlayingAudio}
              style={styles.audioBtn}
            />
            {isPlayingAudio ? (
              <AccessibleButton
                label="Stop"
                accessibilityHint="Silences audio introduction"
                variant="danger"
                onPress={handleStopAudio}
                style={styles.stopBtn}
              />
            ) : null}
          </View>
        </Card>

        {/* Security & Non-Custodial Ownership Card */}
        <Card style={styles.card}>
          <AccessibleText variant="label" style={styles.cardTitle}>
            SECURITY & PRIVACY GUARANTEE
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            You retain 100% exclusive ownership of your funds. Private keys and recovery words never leave your phone.
          </AccessibleText>
          <AccessibleText variant="body" style={styles.bodyText}>
            The AI companion assists you with preparation, but can NEVER sign or submit payments without your explicit biometric authorization.
          </AccessibleText>

          <AccessibleButton
            label="Hear Security Details"
            accessibilityHint="Plays spoken explanation of wallet security safeguards"
            variant="secondary"
            onPress={handleExplainSecurity}
            style={styles.actionBtn}
          />
        </Card>

        {/* Next Steps: Wallet Setup */}
        <View style={styles.setupSection}>
          <AccessibleText variant="label" style={styles.setupHeader}>
            GET STARTED
          </AccessibleText>

          <AccessibleButton
            label="Create New Stellar Wallet"
            accessibilityHint="Generates a new secure non-custodial Stellar wallet"
            variant="primary"
            onPress={() => {
              HapticsService.impactMedium();
              router.push('/wallet/create');
            }}
            style={styles.primarySetupBtn}
          />

          <AccessibleButton
            label="Restore Existing Wallet"
            accessibilityHint="Restores a wallet from a 24-word recovery phrase"
            variant="secondary"
            onPress={() => {
              HapticsService.selection();
              router.push('/wallet/restore');
            }}
            style={styles.secondarySetupBtn}
          />

          <AccessibleButton
            label="Skip to AI Companion"
            accessibilityHint="Navigates directly to the home voice assistant"
            variant="secondary"
            onPress={() => {
              HapticsService.selection();
              router.replace('/');
            }}
            style={styles.secondarySetupBtn}
          />
        </View>
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
  header: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.brandBlack,
    textAlign: 'center',
  },
  tagline: {
    color: colors.brandSecondaryText,
    marginTop: spacing.xs,
    fontSize: 16,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: spacing.sm,
  },
  badgeText: {
    color: colors.brandBlack,
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 1,
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
  audioActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  audioBtn: {
    flex: 1,
    backgroundColor: colors.brandYellow,
  },
  stopBtn: {
    minWidth: 70,
  },
  actionBtn: {
    marginTop: spacing.xs,
  },
  setupSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  setupHeader: {
    color: colors.brandSecondaryText,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  primarySetupBtn: {
    backgroundColor: colors.brandYellow,
    minHeight: 56,
  },
  secondarySetupBtn: {
    minHeight: 52,
  },
});
