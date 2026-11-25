import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SonoraButton } from '../src/components/ui/SonoraButton';
import { ScreenReaderAnnouncement } from '../src/components/accessibility/ScreenReaderAnnouncement';
import {
  AssistantHeader,
  AssistantConversation,
  VoiceInputControl,
  ListeningIndicator,
  ProcessingIndicator,
  SpeakingIndicator,
  AssistantActionControls,
  MessageItem,
} from '../src/components/assistant';
import { TransactionReview } from '../src/components/wallet/TransactionReview';
import { useSonoraAssistant } from '../src/hooks/useSonoraAssistant';
import { useWalletStore } from '../src/store/walletStore';
import { TTSService } from '../src/services/speech/tts';
import { HapticsService } from '../src/services/device/haptics';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';

export default function HomeScreen() {
  const {
    messages,
    assistantState,
    workflowStep,
    activeDraft,
    lastSpokenMessage,
    suggestedQuickReplies,
    startListening,
    stopListening,
    stopSpeaking,
    processUserInput,
    repeatLastResponse,
    cancelWorkflow,
  } = useSonoraAssistant();

  const { publicKey } = useWalletStore();
  const [textInput, setTextInput] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');
  const conversationScrollRef = useRef<any>(null);

  // Spoken greeting on first enter
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        const welcomeSpeech = publicKey
          ? 'Welcome back to SONORA. Your Stellar wallet is ready. Tap the center button or speak to get started.'
          : 'Welcome to SONORA. Your voice-first Stellar wallet. You do not have a wallet yet. Double tap Create Wallet or speak to begin.';
        setAnnouncement(welcomeSpeech);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [publicKey]);

  const handleMicToggle = async () => {
    if (assistantState === 'listening') {
      await stopListening();
      setAnnouncement('Microphone closed. Processing request.');
    } else {
      setAnnouncement('Listening now. Please speak clearly.');
      await startListening();
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;
    const prompt = textInput.trim();
    setTextInput('');
    setAnnouncement(`Sent: ${prompt}`);
    await processUserInput(prompt);
  };

  const handleQuickAction = async (command: string) => {
    await HapticsService.selection();
    setAnnouncement(`Selected: ${command}`);
    await processUserInput(command);
  };

  const handleOpenHelp = async () => {
    await HapticsService.impactMedium();
    const helpText =
      'SONORA Help: You can speak naturally at any time. Say "What is my balance?", "Send 10 XLM to David", "Show receiving address", or "Show transaction history". Tap Stop Voice to interrupt at any point.';
    setAnnouncement(helpText);
    await TTSService.speak(helpText);
  };

  const handleNavigate = async (
    route: '/wallet' | '/send' | '/receive' | '/contacts' | '/settings' | '/onboarding'
  ) => {
    await HapticsService.selection();
    router.push(route);
  };

  const handleProceedToConfirm = async () => {
    await HapticsService.impactHeavy();
    router.push('/send/confirm');
  };

  // Convert assistant state for indicator
  const mappedStatus =
    assistantState === 'listening'
      ? 'listening'
      : assistantState === 'thinking'
      ? 'processing'
      : assistantState === 'speaking'
      ? 'speaking'
      : 'ready';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />

      {/* 1. Header with Identity, Network & Help */}
      <AssistantHeader
        status={mappedStatus}
        network="TESTNET"
        onOpenHelp={handleOpenHelp}
        onOpenSettings={() => handleNavigate('/settings')}
      />

      <View style={styles.content}>
        {/* 2. Central Conversational Transcript Area */}
        <View style={styles.conversationWrapper}>
          <AssistantConversation
            messages={messages as MessageItem[]}
            onRepeatMessage={repeatLastResponse}
            scrollViewRef={conversationScrollRef}
          />
        </View>

        {/* 3. Live State Indicators */}
        {assistantState === 'listening' ? (
          <View style={styles.indicatorContainer}>
            <ListeningIndicator />
          </View>
        ) : null}

        {assistantState === 'thinking' ? (
          <View style={styles.indicatorContainer}>
            <ProcessingIndicator message="SONORA is thinking…" />
          </View>
        ) : null}

        {assistantState === 'speaking' ? (
          <View style={styles.indicatorContainer}>
            <SpeakingIndicator
              message="Speaking response…"
              onStop={stopSpeaking}
            />
          </View>
        ) : null}

        {/* 4. Active Transaction Draft Card */}
        {workflowStep === 'awaiting_review' && activeDraft ? (
          <View style={styles.draftContainer}>
            <TransactionReview
              recipientName={activeDraft.recipientName}
              recipientAddress={activeDraft.recipient || ''}
              amount={activeDraft.amount || '0'}
              assetCode={activeDraft.asset || 'XLM'}
              estimatedFeeStroops={activeDraft.fee ? parseFloat(activeDraft.fee) * 10000000 : 100}
              memo={activeDraft.memo}
              status="Awaiting Your Authorization"
            />
            <View style={styles.draftButtonRow}>
              <SonoraButton
                label="Review & Authorize"
                accessibilityHint="Opens hardware biometric prompt to sign and submit payment"
                variant="primary"
                size="large"
                onPress={handleProceedToConfirm}
                style={styles.authorizeBtn}
              />
              <SonoraButton
                label="Cancel"
                accessibilityHint="Cancels this payment draft"
                variant="danger"
                onPress={cancelWorkflow}
                style={styles.cancelBtn}
              />
            </View>
          </View>
        ) : null}

        {/* 5. Prompt Alternative & Quick Queries */}
        <AssistantActionControls
          onRepeatLast={lastSpokenMessage ? repeatLastResponse : undefined}
          onStopSpeaking={assistantState === 'speaking' ? stopSpeaking : undefined}
          isSpeaking={assistantState === 'speaking'}
          quickActions={suggestedQuickReplies}
          onQuickAction={handleQuickAction}
        />

        {/* 6. Central Large Microphone / Voice Control */}
        <View style={styles.micSection}>
          <VoiceInputControl
            isListening={assistantState === 'listening'}
            isProcessing={assistantState === 'thinking'}
            onPress={handleMicToggle}
          />
        </View>

        {/* 7. Text Input Fallback (for noisy / quiet settings) */}
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Or type a question to SONORA…"
            placeholderTextColor={colors.secondary}
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={handleSendText}
            accessibilityLabel="Type request to assistant"
            accessibilityHint="Text-based alternative to speaking"
          />
          <SonoraButton
            label="Send"
            accessibilityHint="Submits typed message"
            variant="dark"
            onPress={handleSendText}
            style={styles.sendButton}
          />
        </View>

        {/* 8. Quick Navigation Bar (Accessible & Clean) */}
        <View style={styles.navBar}>
          <SonoraButton
            label="Wallet"
            accessibilityHint="Opens wallet balance and account status"
            variant="secondary"
            size="compact"
            onPress={() => handleNavigate('/wallet')}
            style={styles.navPill}
          />
          <SonoraButton
            label="Receive"
            accessibilityHint="Opens receiving address and QR code"
            variant="secondary"
            size="compact"
            onPress={() => handleNavigate('/receive')}
            style={styles.navPill}
          />
          <SonoraButton
            label="Contacts"
            accessibilityHint="Opens saved address book"
            variant="secondary"
            size="compact"
            onPress={() => handleNavigate('/contacts')}
            style={styles.navPill}
          />
          <SonoraButton
            label="Onboarding"
            accessibilityHint="Replays voice onboarding tutorial"
            variant="secondary"
            size="compact"
            onPress={() => handleNavigate('/onboarding')}
            style={styles.navPill}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.milky,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  conversationWrapper: {
    flex: 1,
    minHeight: 140,
  },
  indicatorContainer: {
    paddingHorizontal: spacing.md,
  },
  draftContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  draftButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  authorizeBtn: {
    flex: 2,
  },
  cancelBtn: {
    flex: 1,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.black,
    fontSize: 14,
  },
  sendButton: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  navBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  navPill: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
});
