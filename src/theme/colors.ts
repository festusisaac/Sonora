/**
 * Accessible Color Palette
 * Designed with WCAG AAA / AA contrast ratios for visually impaired users.
 */
export const colors = {
  // High contrast background & surfaces
  background: '#0B0F19',
  surface: '#151C2C',
  surfaceRaised: '#1E293B',
  surfaceBorder: '#334155',

  // Primary brand & action colors (high luminance on dark)
  primary: '#38BDF8', // Sky 400 - high contrast
  primaryHover: '#0EA5E9',
  primaryText: '#04131F',

  // Secondary & Accents
  accent: '#A78BFA', // Violet 400
  accentText: '#1E1B4B',

  // Semantic
  success: '#34D399', // Emerald 400
  successText: '#022C22',
  warning: '#FBBF24', // Amber 400
  warningText: '#451A03',
  danger: '#F87171', // Red 400
  dangerText: '#450A0A',

  // High contrast text
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#CBD5E1', // Slate 300
  textMuted: '#94A3B8', // Slate 400

  // Focus & Accessibility indicators
  focusRing: '#FACC15', // High-visibility yellow outline for TalkBack/Key Focus
  hapticBorder: '#60A5FA',

  // Established SONORA Brand Palette
  brandMilky: '#F5F1E6',
  brandBlack: '#171717',
  brandYellow: '#F5C842',
  brandWhite: '#FFFFFF',
  brandSecondaryText: '#77736A',
  brandBorder: '#E5E0D5',
} as const;

export type ColorName = keyof typeof colors;
