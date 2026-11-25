import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { spacing } from '../../theme/spacing';
import { HapticsService } from '../../services/device/haptics';

export interface AccessibleActionProps {
  label: string;
  hint?: string;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AccessibleAction: React.FC<AccessibleActionProps> = ({
  label,
  hint,
  onPress,
  children,
  disabled = false,
  style,
}) => {
  const handlePress = async () => {
    if (disabled) return;
    await HapticsService.selection();
    onPress();
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: spacing.touchTargetMin,
    minWidth: spacing.touchTargetMin,
    justifyContent: 'center',
  },
});
