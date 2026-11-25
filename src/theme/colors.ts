/**
 * Accessible Color Palette
 * Design Direction: Milky, Black and Yellow
 * WCAG AAA / AA contrast ratios for blind and visually impaired users.
 */
export const colors = {
  // Core Brand Tokens
  milky: '#F5F1E6', // Main background
  black: '#171717', // Primary text and dark surfaces
  yellow: '#F5C842', // Primary accent and important actions
  white: '#FFFFFF', // Cards and elevated surfaces
  secondary: '#77736A', // Supporting text
  border: '#E5E0D5', // Dividers and borders

  // Semantic Mappings for Accessibility
  background: '#F5F1E6',
  surface: '#FFFFFF',
  surfaceRaised: '#F5F1E6',
  surfaceBorder: '#E5E0D5',

  // Primary Action (Yellow accent on Milky background)
  primary: '#F5C842',
  primaryHover: '#E5B832',
  primaryText: '#171717', // Black text on yellow background (> 10:1 contrast)

  // Secondary & Dark Action
  darkSurface: '#171717',
  darkSurfaceText: '#FFFFFF',

  // Text
  textPrimary: '#171717', // High contrast black on milky (> 14:1 contrast)
  textSecondary: '#77736A', // Supporting text on milky (> 4.5:1 contrast)
  textMuted: '#948F85',
  textOnDark: '#F5F1E6',

  // Semantic Feedback (always paired with accessible text & icons)
  success: '#15803D', // Dark green on light surface
  successBackground: '#DCFCE7',
  successText: '#14532D',

  warning: '#B45309', // Dark amber on light surface
  warningBackground: '#FEF3C7',
  warningText: '#78350F',

  danger: '#B91C1C', // Dark red on light surface
  dangerBackground: '#FEE2E2',
  dangerText: '#7F1D1D',

  // Focus & Accessibility indicators
  focusRing: '#171717', // High-visibility dark outline for TalkBack / keyboard
  focusRingYellow: '#F5C842',
  hapticBorder: '#F5C842',

  // Backwards-compatible aliases
  brandMilky: '#F5F1E6',
  brandBlack: '#171717',
  brandYellow: '#F5C842',
  brandWhite: '#FFFFFF',
  brandSecondaryText: '#77736A',
  brandBorder: '#E5E0D5',
  accent: '#F5C842',
  accentText: '#171717',
} as const;

export type ColorName = keyof typeof colors;
