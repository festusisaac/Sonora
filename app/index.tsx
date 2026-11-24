import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { AccessibleButton } from '../src/components/common/AccessibleButton';
import { AccessibleText } from '../src/components/common/AccessibleText';
import { Card } from '../src/components/common/Card';
import { ScreenReaderAnnouncement } from '../src/components/accessibility/ScreenReaderAnnouncement';
import { useSonoraAssistant } from '../src/hooks/useSonoraAssistant';
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

  const [textInput, setTextInput] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');

  const handleMicPress = async () => {
    if (assistantState === 'listening') {
      await stopListening();
      setAnnouncement('Listening stopped.');
    } else {
      setAnnouncement('Listening. Please speak now.');
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

  const handleQuickReply = async (reply: string) => {
    await HapticsService.selection();
    setAnnouncement(`Selected quick reply: ${reply}`);
    await processUserInput(reply);
  };

  const handleNavigate = async (route: '/wallet' | '/send' | '/receive' | '/contacts' | '/settings') => {
    await HapticsService.selection();
    router.push(route);
  };

  const handleProceedToConfirm = async () => {
    await HapticsService.impactMedium();
    router.push('/send/confirm');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container} accessible={false}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.titleRow}>
            <AccessibleText variant="title" accessibilityRole="header" style={styles.brandTitle}>
              SONORA
            </AccessibleText>
            <View style={styles.badge}>
              <AccessibleText variant="caption" style={styles.badgeText}>
                TESTNET
              </AccessibleText>
            </View>
          </View>
          <AccessibleText variant="subtitle" style={styles.tagline}>
            Your voice. Your money. Your control.
          </AccessibleText>
        </View>

        {/* Assistant Visual Status Indicator */}
        <Card style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                assistantState === 'listening' && styles.statusListening,
                assistantState === 'thinking' && styles.statusThinking,
                assistantState === 'speaking' && styles.statusSpeaking,
              ]}
            />
            <AccessibleText
              variant="label"
              style={styles.statusLabel}
              accessibilityLiveRegion="assertive"
            >
              {assistantState === 'listening'
                ? 'LISTENING — SPEAK NOW'
                : assistantState === 'thinking'
                ? 'THINKING...'
                : assistantState === 'speaking'
                ? 'SPEAKING RESPONSE'
                : 'ASSISTANT READY'}
            </AccessibleText>
          </View>

          {lastSpokenMessage ? (
            <AccessibleText variant="body" style={styles.lastSpokenText}>
              &quot;{lastSpokenMessage}&quot;
            </AccessibleText>
          ) : (
            <AccessibleText variant="body" style={styles.greetingText}>
              Tap the large button below and speak your request. Try saying: &quot;Check my balance&quot; or &quot;Send 5 XLM to David&quot;.
            </AccessibleText>
          )}

          {/* Assistant Direct Controls (Repeat / Stop / Cancel) */}
          <View style={styles.controlsRow}>
            {assistantState === 'speaking' ? (
              <AccessibleButton
                label="Stop Voice"
                accessibilityHint="Silences spoken response immediately"
                variant="secondary"
                onPress={stopSpeaking}
                style={styles.controlBtn}
              />
            ) : null}

            <AccessibleButton
              label="Repeat"
              accessibilityHint="Re-speaks the last assistant message"
              variant="secondary"
              onPress={repeatLastResponse}
              style={styles.controlBtn}
            />

            {workflowStep !== 'idle' ? (
              <AccessibleButton
                label="Cancel Action"
                accessibilityHint="Cancels active payment workflow"
                variant="danger"
                onPress={cancelWorkflow}
                style={styles.controlBtn}
              />
            ) : null}
          </View>
        </Card>

        {/* Prepared Payment Draft Card (Review State) */}
        {workflowStep === 'awaiting_review' && activeDraft ? (
          <Card style={styles.reviewCard}>
            <AccessibleText variant="label" style={styles.reviewCardHeader}>
              TRANSACTION REVIEW
            </AccessibleText>
            <View style={styles.reviewDetailRow}>
              <AccessibleText variant="body" style={styles.reviewFieldLabel}>
                Recipient:
              </AccessibleText>
              <AccessibleText variant="subtitle" style={styles.reviewFieldValue}>
                {activeDraft.recipientName || activeDraft.recipient?.slice(0, 8) + '...'}
              </AccessibleText>
            </View>

            <View style={styles.reviewDetailRow}>
              <AccessibleText variant="body" style={styles.reviewFieldLabel}>
                Amount:
              </AccessibleText>
              <AccessibleText variant="subtitle" style={styles.reviewFieldValue}>
                {activeDraft.amount} {activeDraft.asset || 'XLM'}
              </AccessibleText>
            </View>

            <View style={styles.reviewDetailRow}>
              <AccessibleText variant="body" style={styles.reviewFieldLabel}>
                Network Fee:
              </AccessibleText>
              <AccessibleText variant="body" style={styles.reviewFieldValue}>
                {activeDraft.fee} XLM
              </AccessibleText>
            </View>

            {activeDraft.memo ? (
              <View style={styles.reviewDetailRow}>
                <AccessibleText variant="body" style={styles.reviewFieldLabel}>
                  Memo:
                </AccessibleText>
                <AccessibleText variant="body" style={styles.reviewFieldValue}>
                  {activeDraft.memo}
                </AccessibleText>
              </View>
            ) : null}

            <AccessibleButton
              label="Review & Authorize"
              accessibilityHint="Navigates to secure biometric signing screen"
              variant="primary"
              onPress={handleProceedToConfirm}
              style={styles.reviewAuthorizeBtn}
            />
          </Card>
        ) : null}

        {/* Primary Large Voice Action Button */}
        <AccessibleButton
          label={
            assistantState === 'listening'
              ? 'Listening... (Tap to finish)'
              : 'Tap to Speak'
          }
          accessibilityHint="Double tap to start or stop speaking with the assistant"
          variant="primary"
          onPress={handleMicPress}
          style={[
            styles.voiceActionBtn,
            assistantState === 'listening' && styles.voiceActionBtnListening,
          ]}
        />

        {/* Suggested Quick Replies */}
        <View style={styles.quickRepliesContainer}>
          <AccessibleText variant="caption" style={styles.quickReplyTitle}>
            QUICK ACTIONS:
          </AccessibleText>
          <View style={styles.quickRepliesGrid}>
            {suggestedQuickReplies.map((reply, idx) => (
              <AccessibleButton
                key={idx}
                label={reply}
                accessibilityHint={`Asks assistant: ${reply}`}
                variant="secondary"
                onPress={() => handleQuickReply(reply)}
                style={styles.quickReplyBtn}
              />
            ))}
          </View>
        </View>

        {/* Text Input Option for Quiet / Noisy Environments */}
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInputField}
            placeholder="Or type a message to SONORA..."
            placeholderTextColor={colors.brandSecondaryText}
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={handleSendText}
            accessibilityLabel="Type request to assistant"
            accessibilityHint="Alternative text input for speaking"
          />
          <AccessibleButton
            label="Send"
            accessibilityHint="Sends typed request to assistant"
            variant="primary"
            onPress={handleSendText}
            style={styles.textSendBtn}
          />
        </View>

        {/* Recent Conversation Turns Feed */}
        {messages.length > 0 ? (
          <View style={styles.turnsContainer}>
            <AccessibleText variant="label" style={styles.turnsHeader}>
              CONVERSATION TRANSCRIPT
            </AccessibleText>
            {messages.slice(-6).map((turn) => (
              <View
                key={turn.id}
                style={[
                  styles.turnBubble,
                  turn.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <AccessibleText variant="caption" style={styles.turnRoleLabel}>
                  {turn.role === 'user' ? 'YOU' : 'SONORA'}
                </AccessibleText>
                <AccessibleText variant="body" style={styles.turnContent}>
                  {turn.content}
                </AccessibleText>
              </View>
            ))}
          </View>
        ) : null}

        {/* Secondary Navigation Section */}
        <View style={styles.navSection}>
          <AccessibleText variant="label" style={styles.navHeader}>
            MANUAL WALLET VIEWS
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
              label="Verified Contacts"
              accessibilityHint="Navigates to verified contacts directory"
              variant="secondary"
              onPress={() => handleNavigate('/contacts')}
              style={styles.navButton}
            />
            <AccessibleButton
              label="Receive Address"
              accessibilityHint="Navigates to receive screen with QR code"
              variant="secondary"
              onPress={() => handleNavigate('/receive')}
              style={styles.navButton}
            />
            <AccessibleButton
              label="Settings & Speed"
              accessibilityHint="Navigates to settings and preferences"
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
    backgroundColor: colors.brandMilky,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  brandHeader: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.brandBlack,
    letterSpacing: 2,
  },
  badge: {
    backgroundColor: colors.brandYellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.brandBlack,
    fontWeight: 'bold',
    fontSize: 11,
  },
  tagline: {
    color: colors.brandSecondaryText,
    marginTop: spacing.xs,
  },
  statusCard: {
    backgroundColor: colors.brandWhite,
    borderColor: colors.brandBorder,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandSecondaryText,
  },
  statusListening: {
    backgroundColor: colors.danger,
  },
  statusThinking: {
    backgroundColor: colors.brandYellow,
  },
  statusSpeaking: {
    backgroundColor: colors.success,
  },
  statusLabel: {
    color: colors.brandBlack,
    letterSpacing: 1,
  },
  lastSpokenText: {
    color: colors.brandBlack,
    fontSize: 16,
    lineHeight: 22,
    marginVertical: spacing.xs,
  },
  greetingText: {
    color: colors.brandSecondaryText,
    lineHeight: 22,
    marginVertical: spacing.xs,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  controlBtn: {
    minHeight: 40,
    paddingVertical: spacing.xs,
  },
  reviewCard: {
    backgroundColor: colors.brandWhite,
    borderColor: colors.brandYellow,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  reviewCardHeader: {
    color: colors.brandBlack,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  reviewFieldLabel: {
    color: colors.brandSecondaryText,
  },
  reviewFieldValue: {
    color: colors.brandBlack,
    fontWeight: 'bold',
  },
  reviewAuthorizeBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brandYellow,
  },
  voiceActionBtn: {
    minHeight: 60,
    backgroundColor: colors.brandYellow,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  voiceActionBtnListening: {
    backgroundColor: colors.danger,
  },
  quickRepliesContainer: {
    marginBottom: spacing.md,
  },
  quickReplyTitle: {
    color: colors.brandSecondaryText,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  quickRepliesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickReplyBtn: {
    minHeight: 44,
  },
  textInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  textInputField: {
    flex: 1,
    backgroundColor: colors.brandWhite,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    color: colors.brandBlack,
    minHeight: 48,
  },
  textSendBtn: {
    minWidth: 72,
    backgroundColor: colors.brandBlack,
  },
  turnsContainer: {
    marginBottom: spacing.lg,
  },
  turnsHeader: {
    color: colors.brandSecondaryText,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  turnBubble: {
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  userBubble: {
    backgroundColor: colors.brandWhite,
    borderColor: colors.brandBorder,
    borderWidth: 1,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantBubble: {
    backgroundColor: colors.brandMilky,
    borderColor: colors.brandBorder,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  turnRoleLabel: {
    fontWeight: 'bold',
    color: colors.brandSecondaryText,
    marginBottom: 2,
  },
  turnContent: {
    color: colors.brandBlack,
  },
  navSection: {
    marginTop: spacing.md,
  },
  navHeader: {
    color: colors.brandSecondaryText,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  navGrid: {
    gap: spacing.sm,
  },
  navButton: {
    width: '100%',
  },
});
