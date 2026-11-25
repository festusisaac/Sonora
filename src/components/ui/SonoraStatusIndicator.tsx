import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { SonoraText } from './SonoraText';

export type AssistantStatus =
  | 'idle'
  | 'ready'
  | 'listening'
  | 'processing'
  | 'responding'
  | 'speaking'
  | 'paused'
  | 'offline'
  | 'error';

export interface SonoraStatusIndicatorProps {
  status: AssistantStatus;
  customLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * SonoraStatusIndicator
 * Displays status with both visual dot/badge AND clear text so status is NEVER communicated by color alone.
 */
export const SonoraStatusIndicator: React.FC<SonoraStatusIndicatorProps> = ({
  status,
  customLabel,
  style,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          dotColor: colors.yellow,
          label: customLabel || 'Listening… Speak now',
          badgeBg: '#FEF9C3',
          badgeText: colors.black,
        };
      case 'processing':
        return {
          dotColor: colors.black,
          label: customLabel || 'Processing… Please wait',
          badgeBg: colors.milky,
          badgeText: colors.black,
        };
      case 'speaking':
        return {
          dotColor: colors.yellow,
          label: customLabel || 'Speaking',
          badgeBg: '#FEF9C3',
          badgeText: colors.black,
        };
      case 'ready':
        return {
          dotColor: colors.success,
          label: customLabel || 'Ready to listen',
          badgeBg: colors.successBackground,
          badgeText: colors.successText,
        };
      case 'offline':
        return {
          dotColor: colors.secondary,
          label: customLabel || 'Offline mode active',
          badgeBg: colors.border,
          badgeText: colors.secondary,
        };
      case 'error':
        return {
          dotColor: colors.danger,
          label: customLabel || 'Connection issue',
          badgeBg: colors.dangerBackground,
          badgeText: colors.dangerText,
        };
      case 'paused':
        return {
          dotColor: colors.warning,
          label: customLabel || 'Paused',
          badgeBg: colors.warningBackground,
          badgeText: colors.warningText,
        };
      case 'idle':
      default:
        return {
          dotColor: colors.secondary,
          label: customLabel || 'Assistant ready',
          badgeBg: colors.white,
          badgeText: colors.secondary,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Assistant status: ${config.label}`}
      style={[styles.container, { backgroundColor: config.badgeBg }, style]}
    >
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <SonoraText
        variant="label"
        style={[styles.text, { color: config.badgeText }]}
      >
        {config.label}
      </SonoraText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
  },
});
