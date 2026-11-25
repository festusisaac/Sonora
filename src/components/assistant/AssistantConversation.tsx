import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/spacing';
import { AssistantMessage } from './AssistantMessage';
import { SonoraText } from '../ui/SonoraText';
import { colors } from '../../theme/colors';

export interface MessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface AssistantConversationProps {
  messages: MessageItem[];
  onRepeatMessage?: (content: string) => void;
  scrollViewRef?: React.RefObject<any>;
}

export const AssistantConversation: React.FC<AssistantConversationProps> = ({
  messages,
  onRepeatMessage,
  scrollViewRef,
}) => {
  if (messages.length === 0) {
    return (
      <View
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel="No messages yet. Tap the microphone below or use quick commands to get started."
        style={styles.emptyContainer}
      >
        <View style={styles.badge}>
          <SonoraText variant="label" style={styles.badgeText}>
            Voice-First Wallet
          </SonoraText>
        </View>
        <SonoraText variant="title" style={styles.emptyTitle}>
          How can I help you?
        </SonoraText>
        <SonoraText variant="body" style={styles.emptySubtitle}>
          You can ask: “What is my balance?”, “Send 10 XLM to David”, or “Show my address”.
        </SonoraText>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel={`Conversation transcript with ${messages.length} messages.`}
      contentContainerStyle={styles.listContainer}
      onContentSizeChange={() => (scrollViewRef?.current as any)?.scrollToEnd?.({ animated: true })}
    >
      {messages.map((item) => (
        <AssistantMessage
          key={item.id}
          id={item.id}
          role={item.role}
          content={item.content}
          timestamp={item.timestamp}
          onRepeat={onRepeatMessage}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginBottom: spacing.xs,
  },
  badgeText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyTitle: {
    color: colors.black,
    textAlign: 'center',
    fontWeight: '800',
  },
  emptySubtitle: {
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
