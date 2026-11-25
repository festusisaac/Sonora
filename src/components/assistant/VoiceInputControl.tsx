import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  AccessibilityState,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { HapticsService } from '../../services/device/haptics';

export interface VoiceInputControlProps {
  isListening: boolean;
  isProcessing?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * VoiceInputControl
 * High-contrast, large touch target (80x80dp) microphone control.
 * Primary voice action button for blind users.
 */
export const VoiceInputControl: React.FC<VoiceInputControlProps> = ({
  isListening,
  isProcessing = false,
  onPress,
  disabled = false,
}) => {
  const handlePress = async () => {
    if (disabled || isProcessing) return;
    await HapticsService.impactHeavy();
    onPress();
  };

  const accessibilityState: AccessibilityState = {
    selected: isListening,
    busy: isProcessing,
    disabled,
  };

  const getLabel = () => {
    if (isProcessing) return 'Thinking… Please wait';
    if (isListening) return 'Stop listening';
    return 'Speak to SONORA';
  };

  const getHint = () => {
    if (isProcessing) return 'SONORA is processing your request';
    if (isListening) return 'Double tap to stop microphone';
    return 'Double tap to activate microphone and speak your request';
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={getLabel()}
        accessibilityHint={getHint()}
        accessibilityState={accessibilityState}
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={disabled || isProcessing}
        style={[
          styles.button,
          isListening && styles.buttonListening,
          isProcessing && styles.buttonProcessing,
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color={colors.white} />
        ) : (
          <View style={styles.iconContainer}>
            {/* Minimalist accessible mic shape */}
            <View
              style={[
                styles.micStem,
                isListening && styles.micStemListening,
              ]}
            />
            <View
              style={[
                styles.micBase,
                isListening && styles.micBaseListening,
              ]}
            />
          </View>
        )}
      </TouchableOpacity>

      <SonoraText
        variant="label"
        style={[
          styles.statusCaption,
          isListening && styles.statusCaptionListening,
        ]}
      >
        {isListening ? 'Listening… Tap to finish' : isProcessing ? 'Processing…' : 'Tap to speak'}
      </SonoraText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.black,
    elevation: 4,
  },
  buttonListening: {
    backgroundColor: colors.black,
    borderColor: colors.yellow,
    transform: [{ scale: 1.05 }],
  },
  buttonProcessing: {
    backgroundColor: colors.black,
    borderColor: colors.border,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micStem: {
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.black,
  },
  micStemListening: {
    backgroundColor: colors.yellow,
  },
  micBase: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.black,
    marginTop: 4,
  },
  micBaseListening: {
    backgroundColor: colors.yellow,
  },
  statusCaption: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 13,
  },
  statusCaptionListening: {
    color: colors.black,
  },
});
