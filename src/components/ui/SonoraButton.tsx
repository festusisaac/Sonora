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

export interface SonoraButtonProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'danger';
  size?: 'default' | 'large' | 'compact';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
}

/**
 * SonoraButton
 * Accessible primary action button matching the Milky/Black/Yellow design system.
 * Touch target strictly >= 48dp.
 */
export const SonoraButton: React.FC<SonoraButtonProps> = ({
  label,
  onPress,
  accessibilityHint,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
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
    if (disabled) return colors.border;
    switch (variant) {
      case 'secondary':
        return colors.white;
      case 'dark':
        return colors.black;
      case 'danger':
        return colors.danger;
      case 'primary':
      default:
        return colors.yellow;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.secondary;
    switch (variant) {
      case 'secondary':
        return colors.black;
      case 'dark':
        return colors.white;
      case 'danger':
        return colors.white;
      case 'primary':
      default:
        return colors.black;
    }
  };

  const getMinHeight = () => {
    switch (size) {
      case 'large':
        return 60;
      case 'compact':
        return spacing.touchTargetMin;
      case 'default':
      default:
        return 52;
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
        {
          backgroundColor: getBackgroundColor(),
          minHeight: getMinHeight(),
        },
        variant === 'secondary' && styles.secondaryBorder,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          accessibilityLabel="Loading"
        />
      ) : (
        <>
          {leftIcon}
          <Text
            maxFontSizeMultiplier={2.0}
            style={[
              styles.text,
              { color: getTextColor() },
              size === 'large' && styles.largeText,
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryBorder: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.7,
  },
  text: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
  },
  largeText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
});
