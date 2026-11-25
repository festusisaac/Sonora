import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { HapticsService } from '../../services/device/haptics';

export interface SpeakingIndicatorProps {
  onStop: () => void;
  message?: string;
}

export const SpeakingIndicator: React.FC<SpeakingIndicatorProps> = ({
  onStop,
  message = 'Speaking response…',
}) => {
  const handleStop = async () => {
    await HapticsService.impactMedium();
    onStop();
  };

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Audio playing: ${message}. Double tap stop button to interrupt.`}
      style={styles.container}
    >
      <View style={styles.waveBarGroup}>
        <View style={[styles.waveBar, { height: 12 }]} />
        <View style={[styles.waveBar, { height: 18 }]} />
        <View style={[styles.waveBar, { height: 14 }]} />
      </View>

      <SonoraText variant="label" style={styles.text}>
        {message}
      </SonoraText>

      <TouchableOpacity
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Interrupt and stop speaking"
        accessibilityHint="Stops audio response immediately"
        onPress={handleStop}
        style={styles.stopBtn}
      >
        <SonoraText variant="label" style={styles.stopText}>
          Stop
        </SonoraText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.black,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  waveBarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.black,
    borderRadius: 1.5,
  },
  text: {
    flex: 1,
    color: colors.black,
    fontWeight: '700',
  },
  stopBtn: {
    backgroundColor: colors.black,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  stopText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
