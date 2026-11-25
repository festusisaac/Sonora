import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export interface SonoraTextProps extends TextProps {
  variant?: 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'financial';
  color?: string;
}

/**
 * SonoraText
 * Scalable accessible text element adhering to the Sonora high-contrast typography.
 */
export const SonoraText: React.FC<SonoraTextProps> = ({
  children,
  variant = 'body',
  color,
  style,
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'display':
        return styles.display;
      case 'title':
        return styles.title;
      case 'subtitle':
        return styles.subtitle;
      case 'financial':
        return styles.financial;
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
      style={[styles.base, getVariantStyle(), color ? { color } : null, style]}
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
  display: {
    fontSize: typography.fontSizes.display,
    fontWeight: typography.fontWeights.heavy,
    lineHeight: typography.fontSizes.display * typography.lineHeights.tight,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.fontSizes.xl * typography.lineHeights.tight,
  },
  subtitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.secondary,
    lineHeight: typography.fontSizes.lg * typography.lineHeights.normal,
  },
  financial: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.black,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.regular,
    lineHeight: typography.fontSizes.md * typography.lineHeights.normal,
  },
  caption: {
    fontSize: typography.fontSizes.sm,
    color: colors.secondary,
    lineHeight: typography.fontSizes.sm * typography.lineHeights.normal,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.secondary,
  },
});
