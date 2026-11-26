import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SonoraText } from '../src/components/ui/SonoraText';
import { SonoraButton } from '../src/components/ui/SonoraButton';
import { ScreenReaderAnnouncement } from '../src/components/accessibility/ScreenReaderAnnouncement';
import { VoiceOrb } from '../src/components/assistant/VoiceOrb';
import { TransactionReview } from '../src/components/wallet/TransactionReview';
import { useSonoraAssistant } from '../src/hooks/useSonoraAssistant';
import { useWalletStore } from '../src/store/walletStore';
import { TTSService } from '../src/services/speech/tts';
import { HapticsService } from '../src/services/device/haptics';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';

export default function HomeScreen() {
  const {
    assistantState,
    workflowStep,
    activeDraft,
    lastSpokenMessage,
    startListening,
    stopListening,
    stopSpeaking,
    repeatLastResponse,
    cancelWorkflow,
  } = useSonoraAssistant();

  const { publicKey } = useWalletStore();
  const [announcement, setAnnouncement] = useState<string>('');
  const insets = useSafeAreaInsets();

  // Spoken greeting on first launch
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        const welcomeSpeech = publicKey
          ? 'Welcome to SONORA. Tap the center orb to speak.'
          : 'Welcome to SONORA. Your voice-first Stellar wallet. Tap the center orb to begin.';
        setAnnouncement(welcomeSpeech);
        TTSService.speak(welcomeSpeech).catch(() => {});
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [publicKey]);

  const handleOrbPress = async () => {
    if (assistantState === 'speaking') {
      await stopSpeaking();
      setAnnouncement('Voice stopped.');
      return;
    }

    if (assistantState === 'listening') {
      await stopListening();
      setAnnouncement('Processing your request…');
    } else {
      setAnnouncement('Listening now. Please speak.');
      await startListening();
    }
  };

  const handleOpenSettings = async () => {
    await HapticsService.selection();
    router.push('/settings');
  };

  const handleProceedToConfirm = async () => {
    await HapticsService.impactHeavy();
    router.push('/send/confirm');
  };

  const isReviewVisible = workflowStep === 'awaiting_review' && Boolean(activeDraft);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />

      {/* 1. Minimal Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <SonoraText variant="title" accessibilityRole="header" style={styles.brandTitle}>
            SONORA
          </SonoraText>
          <View
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="Network: Stellar Testnet"
            style={styles.networkBadge}
          >
            <SonoraText variant="label" style={styles.networkText}>
              TESTNET
            </SonoraText>
          </View>
        </View>

        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          accessibilityHint="Open voice speed, wallet security, and accessibility settings"
          onPress={handleOpenSettings}
          style={styles.settingsButton}
        >
          <SonoraText variant="label" style={styles.settingsText}>
            Settings
          </SonoraText>
        </TouchableOpacity>
      </View>

      {/* 2. Main Hero Content: The Pure Conversational Voice Centerpiece */}
      <View style={styles.centerContainer}>
        <VoiceOrb
          state={assistantState}
          onPress={handleOrbPress}
        />

        {/* Live Spoken Transcription Display (for low-vision / reassurance) */}
        {lastSpokenMessage ? (
          <View
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`SONORA said: ${lastSpokenMessage}`}
            style={styles.spokenCard}
          >
            <SonoraText variant="caption" style={styles.spokenHeader}>
              SONORA
            </SonoraText>
            <SonoraText variant="body" style={styles.spokenBody} numberOfLines={3}>
              “{lastSpokenMessage}”
            </SonoraText>
            <View style={styles.spokenActions}>
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Repeat response"
                onPress={repeatLastResponse}
                style={styles.repeatBtn}
              >
                <SonoraText variant="caption" style={styles.repeatBtnText}>
                  Repeat
                </SonoraText>
              </TouchableOpacity>
              {assistantState === 'speaking' ? (
                <TouchableOpacity
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Stop speaking"
                  onPress={stopSpeaking}
                  style={styles.stopBtn}
                >
                  <SonoraText variant="caption" style={styles.stopBtnText}>
                    Stop
                  </SonoraText>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>

      {/* 3. Bottom Minimal Guidance */}
      <View style={styles.bottomBar}>
        <SonoraText variant="caption" style={styles.bottomHint}>
          Voice-first crypto companion. Tap orb or say “Help” at any time.
        </SonoraText>
      </View>

      {/* 4. Crypto Action Sheet: Only slides up when a transaction is ready */}
      {isReviewVisible && activeDraft ? (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isReviewVisible}
          onRequestClose={cancelWorkflow}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md },
              ]}
            >
              <TransactionReview
                recipientName={activeDraft.recipientName}
                recipientAddress={activeDraft.recipient || ''}
                amount={activeDraft.amount || '0'}
                assetCode={activeDraft.asset || 'XLM'}
                estimatedFeeStroops={activeDraft.fee ? parseFloat(activeDraft.fee) * 10000000 : 100}
                memo={activeDraft.memo}
                status="Awaiting Authorization"
              />

              <View style={styles.modalButtonRow}>
                <SonoraButton
                  label="Authorize Payment"
                  accessibilityHint="Triggers fingerprint or PIN authentication to sign transaction"
                  variant="primary"
                  size="large"
                  onPress={handleProceedToConfirm}
                  style={styles.authorizeButton}
                />
                <SonoraButton
                  label="Cancel"
                  accessibilityHint="Cancels this transaction"
                  variant="danger"
                  size="large"
                  onPress={cancelWorkflow}
                  style={styles.cancelButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.milky,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.black,
  },
  networkBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },
  settingsButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 38,
    justifyContent: 'center',
  },
  settingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  spokenCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    width: '100%',
    maxWidth: 380,
    marginTop: 20,
    gap: 4,
  },
  spokenHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
    letterSpacing: 0.5,
  },
  spokenBody: {
    color: colors.black,
    fontSize: 15,
    lineHeight: 22,
  },
  spokenActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  repeatBtn: {
    backgroundColor: colors.milky,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repeatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.black,
  },
  stopBtn: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stopBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  bottomHint: {
    color: colors.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 23, 23, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.milky,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.md,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  authorizeButton: {
    flex: 2,
  },
  cancelButton: {
    flex: 1,
  },
});
