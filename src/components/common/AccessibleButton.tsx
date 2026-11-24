import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  AccessibilityState,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { HapticsService } from '../../services/device/haptics';

export interface AccessibleButtonProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
}

/**
 * AccessibleButton
 * Complies with TalkBack accessibility requirements:
 * - Minimum touch target 48x48dp (spacing.touchTargetMin)
 * - accessibilityRole="button"
 * - Spoken accessibilityLabel and accessibilityHint
 * - Haptic tactile feedback on touch
 */
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  onPress,
  accessibilityHint,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    void HapticsService.impactMedium();
    onPress();
  };

  const accessibilityState: AccessibilityState = {
    disabled: !!disabled || !!loading,
    busy: !!loading,
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceBorder;
    switch (variant) {
      case 'secondary':
        return colors.surfaceRaised;
      case 'danger':
        return colors.danger;
      case 'primary':
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'secondary':
        return colors.textPrimary;
      case 'danger':
        return colors.dangerText;
      case 'primary':
      default:
        return colors.primaryText;
    }
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'secondary' && styles.secondaryBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={getTextColor()}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text
          style={[styles.text, { color: getTextColor() }, textStyle]}
          maxFontSizeMultiplier={2.0}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: spacing.touchTargetComfortable,
    minWidth: spacing.touchTargetMin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  secondaryBorder: {
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
  },
  text: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    textAlign: 'center',
  },
});
