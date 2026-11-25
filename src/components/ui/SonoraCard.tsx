import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface SonoraCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'flat' | 'accent' | 'dark';
}

export const SonoraCard: React.FC<SonoraCardProps> = ({
  children,
  variant = 'elevated',
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'flat':
        return styles.flat;
      case 'accent':
        return styles.accent;
      case 'dark':
        return styles.dark;
      case 'elevated':
      default:
        return styles.elevated;
    }
  };

  return (
    <View style={[styles.base, getVariantStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
  },
  elevated: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.milky,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.white,
    borderColor: colors.yellow,
  },
  dark: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
});
