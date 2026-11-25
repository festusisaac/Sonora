import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { SonoraButton } from '../../src/components/ui/SonoraButton';
import { SonoraText } from '../../src/components/ui/SonoraText';
import { SonoraCard } from '../../src/components/ui/SonoraCard';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { TTSService } from '../../src/services/speech/tts';
import { HapticsService } from '../../src/services/device/haptics';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [announcement, setAnnouncement] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const speakText = async (text: string) => {
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

  // Step 1: Welcome
  const handleStep1 = () => {
    const text =
      'Step 1: Welcome to SONORA. Your voice. Your money. Your control. SONORA is an AI-powered, voice-first Stellar wallet crafted specifically for blind and visually impaired people. Tap Next to continue.';
    speakText(text);
  };

  // Step 2: Voice-First Introduction
  const handleStep2 = () => {
    const text =
      'Step 2: Voice-First Interaction. With SONORA, you do not need to look at cards or search for buttons. You speak naturally to check your balance, send Lumens or USDC, and manage contacts. Tap Next to learn about permissions.';
    speakText(text);
  };

  // Step 3: Permissions & Accessibility
  const handleStep3 = () => {
    const text =
      'Step 3: Microphone and Accessibility Permissions. To listen to your voice commands, SONORA requires microphone access. We never record your voice secretly. TalkBack screen reader gestures work seamlessly across all screens.';
    speakText(text);
  };

  // Step 4: Security & Non-Custodial Ownership
  const handleStep4 = () => {
    const text =
      'Step 4: Non-Custodial Security. Your wallet keys and recovery phrase are stored exclusively on your device, protected by your Android fingerprint or PIN. The AI assistant can prepare transactions, but only YOU can authorize payments.';
    speakText(text);
  };

  // Step 5: Wallet Choice
  const handleStep5 = () => {
    const text =
      'Step 5: Setup Choice. You can create a brand new Stellar wallet, or restore an existing wallet using your 24-word recovery phrase. Which would you like to do?';
    speakText(text);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Progress Badge */}
        <View style={styles.progressRow}>
          <View style={styles.stepBadge}>
            <SonoraText variant="label" style={styles.stepBadgeText}>
              STEP {currentStep} OF 5
            </SonoraText>
          </View>
          <SonoraText variant="caption" style={styles.stepIndicatorText}>
            Voice Onboarding Guide
          </SonoraText>
        </View>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <SonoraCard variant="elevated" style={styles.card}>
            <SonoraText variant="title" accessibilityRole="header" style={styles.cardTitle}>
              Welcome to SONORA
            </SonoraText>
            <SonoraText variant="subtitle" style={styles.tagline}>
              Your voice. Your money. Your control.
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              SONORA is an AI-first Stellar wallet designed from the ground up for blind and visually impaired people.
            </SonoraText>

            <View style={styles.audioActionRow}>
              <SonoraButton
                label={isPlayingAudio ? 'Speaking…' : 'Hear Introduction'}
                accessibilityHint="Reads welcome introduction aloud"
                variant="primary"
                onPress={handleStep1}
                disabled={isPlayingAudio}
                style={styles.flexBtn}
              />
              {isPlayingAudio ? (
                <SonoraButton
                  label="Stop"
                  accessibilityHint="Stops voice playback"
                  variant="danger"
                  onPress={handleStopAudio}
                />
              ) : null}
            </View>

            <SonoraButton
              label="Next: How Voice Works"
              accessibilityHint="Proceeds to voice guidance explanation"
              variant="dark"
              onPress={() => setCurrentStep(2)}
              style={styles.nextBtn}
            />
          </SonoraCard>
        )}

        {/* Step 2: Voice-First Introduction */}
        {currentStep === 2 && (
          <SonoraCard variant="elevated" style={styles.card}>
            <SonoraText variant="title" accessibilityRole="header" style={styles.cardTitle}>
              Voice is Your Primary Interface
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              Instead of navigating complex forms and tiny buttons, talk to SONORA like a personal assistant.
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              Try saying: &quot;What is my balance?&quot;, &quot;Send 10 XLM to David&quot;, or &quot;Show my receiving address&quot;.
            </SonoraText>

            <View style={styles.audioActionRow}>
              <SonoraButton
                label={isPlayingAudio ? 'Speaking…' : 'Hear Spoken Details'}
                accessibilityHint="Reads voice interaction guidelines"
                variant="primary"
                onPress={handleStep2}
                disabled={isPlayingAudio}
                style={styles.flexBtn}
              />
              {isPlayingAudio ? (
                <SonoraButton
                  label="Stop"
                  accessibilityHint="Stops voice playback"
                  variant="danger"
                  onPress={handleStopAudio}
                />
              ) : null}
            </View>

            <View style={styles.navRow}>
              <SonoraButton
                label="Back"
                accessibilityHint="Goes back to previous step"
                variant="secondary"
                onPress={() => setCurrentStep(1)}
                style={styles.flexBtn}
              />
              <SonoraButton
                label="Next: Permissions"
                accessibilityHint="Proceeds to permission details"
                variant="dark"
                onPress={() => setCurrentStep(3)}
                style={styles.flexBtn}
              />
            </View>
          </SonoraCard>
        )}

        {/* Step 3: Permissions & Accessibility */}
        {currentStep === 3 && (
          <SonoraCard variant="elevated" style={styles.card}>
            <SonoraText variant="title" accessibilityRole="header" style={styles.cardTitle}>
              Microphone & Permissions
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              SONORA uses your microphone to transcribe speech commands into wallet actions.
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              The microphone never activates secretly. Android TalkBack works in harmony with SONORA without conflicting audio.
            </SonoraText>

            <View style={styles.audioActionRow}>
              <SonoraButton
                label={isPlayingAudio ? 'Speaking…' : 'Hear Permission Info'}
                accessibilityHint="Reads microphone permission details aloud"
                variant="primary"
                onPress={handleStep3}
                disabled={isPlayingAudio}
                style={styles.flexBtn}
              />
              {isPlayingAudio ? (
                <SonoraButton
                  label="Stop"
                  accessibilityHint="Stops voice playback"
                  variant="danger"
                  onPress={handleStopAudio}
                />
              ) : null}
            </View>

            <View style={styles.navRow}>
              <SonoraButton
                label="Back"
                accessibilityHint="Goes back"
                variant="secondary"
                onPress={() => setCurrentStep(2)}
                style={styles.flexBtn}
              />
              <SonoraButton
                label="Next: Security"
                accessibilityHint="Proceeds to non-custodial security"
                variant="dark"
                onPress={() => setCurrentStep(4)}
                style={styles.flexBtn}
              />
            </View>
          </SonoraCard>
        )}

        {/* Step 4: Security & Non-Custodial Ownership */}
        {currentStep === 4 && (
          <SonoraCard variant="elevated" style={styles.card}>
            <SonoraText variant="title" accessibilityRole="header" style={styles.cardTitle}>
              Non-Custodial Security
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              You own your money. Your recovery phrase and private keys are saved only on your device, secured by biometric authentication.
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              The AI companion can NEVER sign a transaction or send funds on its own.
            </SonoraText>

            <View style={styles.audioActionRow}>
              <SonoraButton
                label={isPlayingAudio ? 'Speaking…' : 'Hear Security Safeguards'}
                accessibilityHint="Reads security safeguards aloud"
                variant="primary"
                onPress={handleStep4}
                disabled={isPlayingAudio}
                style={styles.flexBtn}
              />
              {isPlayingAudio ? (
                <SonoraButton
                  label="Stop"
                  accessibilityHint="Stops voice playback"
                  variant="danger"
                  onPress={handleStopAudio}
                />
              ) : null}
            </View>

            <View style={styles.navRow}>
              <SonoraButton
                label="Back"
                accessibilityHint="Goes back"
                variant="secondary"
                onPress={() => setCurrentStep(3)}
                style={styles.flexBtn}
              />
              <SonoraButton
                label="Next: Setup Wallet"
                accessibilityHint="Proceeds to wallet creation or restoration"
                variant="dark"
                onPress={() => setCurrentStep(5)}
                style={styles.flexBtn}
              />
            </View>
          </SonoraCard>
        )}

        {/* Step 5: Wallet Choice */}
        {currentStep === 5 && (
          <SonoraCard variant="elevated" style={styles.card}>
            <SonoraText variant="title" accessibilityRole="header" style={styles.cardTitle}>
              Set Up Your Wallet
            </SonoraText>
            <SonoraText variant="body" style={styles.bodyText}>
              Create a new wallet or restore an existing one from a 24-word recovery phrase.
            </SonoraText>

            <SonoraButton
              label={isPlayingAudio ? 'Speaking…' : 'Hear Options'}
              accessibilityHint="Speaks wallet setup choices aloud"
              variant="secondary"
              onPress={handleStep5}
              disabled={isPlayingAudio}
              style={styles.hearBtn}
            />

            <SonoraButton
              label="Create New Stellar Wallet"
              accessibilityHint="Generates a new secure non-custodial Stellar wallet"
              variant="primary"
              size="large"
              onPress={() => {
                HapticsService.impactHeavy();
                router.push('/wallet/create');
              }}
              style={styles.createBtn}
            />

            <SonoraButton
              label="Restore Existing Wallet"
              accessibilityHint="Restores a wallet from a 24-word recovery phrase"
              variant="secondary"
              onPress={() => {
                HapticsService.selection();
                router.push('/wallet/restore');
              }}
              style={styles.restoreBtn}
            />

            <SonoraButton
              label="Skip to AI Companion"
              accessibilityHint="Navigates directly to the home assistant screen"
              variant="dark"
              onPress={() => {
                HapticsService.selection();
                router.replace('/');
              }}
              style={styles.skipBtn}
            />
          </SonoraCard>
        )}
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepBadge: {
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  stepBadgeText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: 11,
  },
  stepIndicatorText: {
    color: colors.secondary,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.black,
    fontWeight: '800',
    fontSize: 22,
  },
  tagline: {
    color: colors.secondary,
    fontWeight: '600',
  },
  bodyText: {
    color: colors.black,
    lineHeight: 22,
  },
  audioActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  flexBtn: {
    flex: 1,
  },
  nextBtn: {
    marginTop: spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hearBtn: {
    marginBottom: spacing.xs,
  },
  createBtn: {
    marginVertical: spacing.xs,
  },
  restoreBtn: {
    marginVertical: spacing.xs,
  },
  skipBtn: {
    marginTop: spacing.sm,
  },
});
