import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { HapticsService } from '../../services/device/haptics';

export interface AssistantActionControlsProps {
  onRepeatLast?: () => void;
  onStopSpeaking?: () => void;
  onQuickAction?: (actionText: string) => void;
  quickActions?: string[];
  isSpeaking?: boolean;
}

export const AssistantActionControls: React.FC<AssistantActionControlsProps> = ({
  onRepeatLast,
  onStopSpeaking,
  onQuickAction,
  quickActions = ['What is my balance?', 'Show receiving address', 'Help me send money'],
  isSpeaking = false,
}) => {
  const handleQuick = async (text: string) => {
    await HapticsService.selection();
    if (onQuickAction) {
      onQuickAction(text);
    }
  };

  return (
    <View style={styles.container}>
      {/* Primary Voice Actions (Repeat, Stop) */}
      <View style={styles.primaryActionRow}>
        {onRepeatLast ? (
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Repeat last response"
            accessibilityHint="Replays the assistant's previous spoken message"
            onPress={onRepeatLast}
            style={styles.actionPill}
          >
            <SonoraText variant="label" style={styles.pillText}>
              Repeat Last
            </SonoraText>
          </TouchableOpacity>
        ) : null}

        {isSpeaking && onStopSpeaking ? (
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Stop speaking"
            accessibilityHint="Silences current voice speech"
            onPress={onStopSpeaking}
            style={[styles.actionPill, styles.stopPill]}
          >
            <SonoraText variant="label" style={styles.stopText}>
              Stop Voice
            </SonoraText>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Suggested Quick Queries */}
      {quickActions.length > 0 && onQuickAction ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessible={false}
          contentContainerStyle={styles.quickScroll}
        >
          {quickActions.map((query) => (
            <TouchableOpacity
              key={query}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Quick command: ${query}`}
              accessibilityHint="Sends this command to SONORA"
              onPress={() => handleQuick(query)}
              style={styles.suggestionPill}
            >
              <SonoraText variant="body" style={styles.suggestionText}>
                {query}
              </SonoraText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  primaryActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 13,
  },
  stopPill: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  stopText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  quickScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  suggestionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    justifyContent: 'center',
  },
  suggestionText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '500',
  },
});
