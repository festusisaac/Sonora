import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { TTSService } from '../../services/speech/tts';
import { HapticsService } from '../../services/device/haptics';

export interface AssistantMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  onRepeat?: (content: string) => void;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  role,
  content,
  onRepeat,
}) => {
  const isAssistant = role === 'assistant';
  const isSystem = role === 'system';

  const handleSpeakSingleMessage = async () => {
    await HapticsService.selection();
    if (onRepeat) {
      onRepeat(content);
    } else {
      await TTSService.speak(content);
    }
  };

  if (isSystem) {
    return (
      <View
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`System note: ${content}`}
        style={styles.systemContainer}
      >
        <SonoraText variant="caption" style={styles.systemText}>
          {content}
        </SonoraText>
      </View>
    );
  }

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${isAssistant ? 'SONORA said' : 'You said'}: ${content}`}
      style={[
        styles.row,
        isAssistant ? styles.assistantRow : styles.userRow,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isAssistant ? styles.assistantBubble : styles.userBubble,
        ]}
      >
        <View style={styles.bubbleHeader}>
          <SonoraText
            variant="caption"
            style={[
              styles.speakerLabel,
              isAssistant ? styles.assistantLabel : styles.userLabel,
            ]}
          >
            {isAssistant ? 'SONORA' : 'YOU'}
          </SonoraText>

          {isAssistant ? (
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Listen again"
              accessibilityHint="Re-reads this message out loud"
              onPress={handleSpeakSingleMessage}
              style={styles.repeatIconBtn}
            >
              <SonoraText variant="caption" style={styles.repeatIconText}>
                Repeat
              </SonoraText>
            </TouchableOpacity>
          ) : null}
        </View>

        <SonoraText
          variant="body"
          style={[
            styles.messageText,
            isAssistant ? styles.assistantText : styles.userText,
          ]}
        >
          {content}
        </SonoraText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: spacing.xs,
    width: '100%',
    flexDirection: 'row',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: spacing.md,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.black,
    borderTopRightRadius: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  speakerLabel: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  assistantLabel: {
    color: colors.secondary,
  },
  userLabel: {
    color: colors.yellow,
  },
  repeatIconBtn: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.milky,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repeatIconText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.black,
  },
  messageText: {
    lineHeight: 22,
  },
  assistantText: {
    color: colors.black,
  },
  userText: {
    color: colors.white,
  },
  systemContainer: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.border,
    borderRadius: 12,
    marginVertical: spacing.xs,
  },
  systemText: {
    fontSize: 12,
    color: colors.secondary,
    textAlign: 'center',
  },
});
