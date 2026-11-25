import React, { useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';

export interface ListeningIndicatorProps {
  transcript?: string;
}

export const ListeningIndicator: React.FC<ListeningIndicatorProps> = ({
  transcript,
}) => {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Microphone active. Listening for your command.');
  }, []);

  return (
    <View
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Microphone active. ${transcript ? `Heard: ${transcript}` : 'Listening for your voice.'}`}
      style={styles.container}
    >
      <View style={styles.pulseDot} />
      <View style={styles.textColumn}>
        <SonoraText variant="label" style={styles.title}>
          LISTENING NOW
        </SonoraText>
        <SonoraText variant="body" style={styles.transcript}>
          {transcript || 'Speak naturally…'}
        </SonoraText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.yellow,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  pulseDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.black,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.black,
    letterSpacing: 0.5,
  },
  transcript: {
    color: colors.black,
    fontSize: 14,
    marginTop: 2,
  },
});
