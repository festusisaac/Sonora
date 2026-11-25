import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export interface AccessibleTextProps extends TextProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  contrast?: 'normal' | 'high';
}

/**
 * AccessibleText
 * Scalable text supporting Android large fonts & TalkBack.
 */
export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  variant = 'body',
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      case 'body':
      default:
        return styles.body;
    }
  };

  return (
    <Text
      accessible={true}
      maxFontSizeMultiplier={2.5}
      style={[styles.base, getVariantStyle(), style]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: colors.black,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.fontSizes.xxl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.secondary,
    lineHeight: typography.fontSizes.lg * typography.lineHeights.normal,
  },
  body: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.regular,
    lineHeight: typography.fontSizes.md * typography.lineHeights.normal,
  },
  caption: {
    fontSize: typography.fontSizes.sm,
    color: colors.secondary,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.secondary,
  },
});
