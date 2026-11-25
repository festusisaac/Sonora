import React, { useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import { SonoraText } from '../ui/SonoraText';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface AccessibleStatusProps {
  message: string;
  type?: 'polite' | 'assertive';
  visible?: boolean;
}

export const AccessibleStatus: React.FC<AccessibleStatusProps> = ({
  message,
  type = 'polite',
  visible = true,
}) => {
  useEffect(() => {
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);

  if (!visible || !message) return null;

  return (
    <View
      accessible={true}
      accessibilityLiveRegion={type}
      accessibilityRole="alert"
      accessibilityLabel={message}
      style={styles.container}
    >
      <SonoraText variant="caption" style={styles.text}>
        {message}
      </SonoraText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs,
  },
  text: {
    color: colors.secondary,
    fontWeight: '600',
  },
});
