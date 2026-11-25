import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, AccessibilityInfo } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';

export interface ProcessingIndicatorProps {
  message?: string;
}

export const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({
  message = 'SONORA is thinking…',
}) => {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={message}
      style={styles.container}
    >
      <ActivityIndicator size="small" color={colors.black} />
      <SonoraText variant="label" style={styles.text}>
        {message}
      </SonoraText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.milky,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginVertical: spacing.xs,
  },
  text: {
    color: colors.secondary,
    fontWeight: '600',
  },
});
