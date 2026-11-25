import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  AccessibilityState,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { HapticsService } from '../../services/device/haptics';

export interface SonoraIconButtonProps {
  accessibilityLabel: string;
  accessibilityHint?: string;
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost';
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SonoraIconButton: React.FC<SonoraIconButtonProps> = ({
  accessibilityLabel,
  accessibilityHint,
  onPress,
  children,
  variant = 'secondary',
  size = spacing.touchTargetComfortable,
  disabled = false,
  style,
}) => {
  const handlePress = () => {
    if (disabled) return;
    void HapticsService.selection();
    onPress();
  };

  const accessibilityState: AccessibilityState = {
    disabled,
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return colors.yellow;
      case 'dark':
        return colors.black;
      case 'ghost':
        return 'transparent';
      case 'secondary':
      default:
        return colors.white;
    }
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: Math.max(size, spacing.touchTargetMin),
          height: Math.max(size, spacing.touchTargetMin),
          borderRadius: Math.max(size, spacing.touchTargetMin) / 2,
          backgroundColor: getBackgroundColor(),
        },
        variant !== 'ghost' && styles.border,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  border: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
});
