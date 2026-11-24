import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { AccessibleButton } from '../src/components/common/AccessibleButton';
import { AccessibleText } from '../src/components/common/AccessibleText';
import { Card } from '../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../src/components/accessibility/ScreenReaderAnnouncement';
import { TTSService } from '../src/services/speech/tts';
import { HapticsService } from '../src/services/device/haptics';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';

export default function HomeScreen() {
  const [speechStatus, setSpeechStatus] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const handleTestVoice = async () => {
    const message =
      'Welcome to SONORA. Your voice. Your money. Your control. Text to speech engine is fully operational.';
    setSpeechStatus('Speaking...');
    setAnnouncement(message);
    setIsSpeaking(true);
    await HapticsService.impactMedium();

    try {
      await TTSService.speak(message, {
        onDone: () => {
          setSpeechStatus('Speech completed successfully.');
          setIsSpeaking(false);
          HapticsService.notificationSuccess();
        },
        onError: () => {
          setSpeechStatus('Spoken feedback encountered an issue.');
          setIsSpeaking(false);
          HapticsService.notificationError();
        },
      });
    } catch {
      setSpeechStatus('Could not initialize speech synthesis.');
      setIsSpeaking(false);
    }
  };

  const handleNavigate = async (route: '/wallet' | '/send' | '/receive' | '/contacts' | '/settings') => {
    await HapticsService.selection();
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView
        contentContainerStyle={styles.container}
        accessible={false}
      >
        {/* Header Branding */}
        <View style={styles.brandContainer} accessible={true} accessibilityRole="header">
          <AccessibleText variant="title" style={styles.brandTitle}>
            SONORA
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.tagline}>
            Your voice. Your money. Your control.
          </AccessibleText>
          <View style={styles.badge}>
            <AccessibleText variant="caption" style={styles.badgeText}>
              STELLAR TESTNET
            </AccessibleText>
          </View>
        </View>

        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <AccessibleText variant="body" style={styles.welcomeText}>
            Welcome to SONORA, an accessibility-first Stellar wallet designed for blind and visually impaired users.
          </AccessibleText>
        </Card>

        {/* Spoken Voice Demo Section */}
        <Card style={styles.actionCard}>
          <AccessibleText variant="label" style={styles.cardHeader}>
            VOICE SYNTHESIS TEST
          </AccessibleText>
          <AccessibleText variant="body" style={styles.demoDescription}>
            Test spoken audio feedback designed for voice-guided navigation.
          </AccessibleText>

          <AccessibleButton
            label={isSpeaking ? 'Speaking...' : 'Test Spoken Feedback'}
            accessibilityHint="Double tap to test audio voice feedback"
            onPress={handleTestVoice}
            disabled={isSpeaking}
            style={styles.voiceButton}
          />

          {speechStatus ? (
            <AccessibleText
              variant="caption"
              style={styles.statusText}
              accessibilityLiveRegion="polite"
            >
              Status: {speechStatus}
            </AccessibleText>
          ) : null}
        </Card>

        {/* Accessible Navigation Grid */}
        <View style={styles.navSection} accessible={true} accessibilityRole="navigation">
          <AccessibleText variant="label" style={styles.navHeader}>
            ACCESSIBLE NAVIGATION
          </AccessibleText>

          <View style={styles.navGrid}>
            <AccessibleButton
              label="Wallet Overview"
              accessibilityHint="Navigates to wallet balance and account status"
              variant="secondary"
              onPress={() => handleNavigate('/wallet')}
              style={styles.navButton}
            />
            <AccessibleButton
              label="Send Payment"
              accessibilityHint="Navigates to send payment screen"
              variant="secondary"
              onPress={() => handleNavigate('/send')}
              style={styles.navButton}
            />
            <AccessibleButton
              label="Receive"
              accessibilityHint="Navigates to receive screen with your public address"
              variant="secondary"
              onPress={() => handleNavigate('/receive')}
              style={styles.navButton}
            />
            <AccessibleButton
              label="Settings & Accessibility"
              accessibilityHint="Navigates to settings and accessibility preferences"
              variant="secondary"
              onPress={() => handleNavigate('/settings')}
              style={styles.navButton}
            />
          </View>
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
  brandContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  brandTitle: {
    letterSpacing: 3,
    color: colors.primary,
    fontSize: 36,
  },
  tagline: {
    marginTop: spacing.xs,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
  },
  badge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  badgeText: {
    color: colors.accent,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  welcomeCard: {
    marginBottom: spacing.lg,
  },
  welcomeText: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actionCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    color: colors.primary,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  demoDescription: {
    marginBottom: spacing.md,
    color: colors.textSecondary,
  },
  voiceButton: {
    marginTop: spacing.xs,
  },
  statusText: {
    marginTop: spacing.md,
    color: colors.success,
    textAlign: 'center',
  },
  navSection: {
    marginTop: spacing.sm,
  },
  navHeader: {
    color: colors.textMuted,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  navGrid: {
    gap: spacing.md,
  },
  navButton: {
    width: '100%',
  },
});
