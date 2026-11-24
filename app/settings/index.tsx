import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { useAppTheme } from '../../src/providers/ThemeProvider';
import { TTSService } from '../../src/services/speech/tts';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function SettingsScreen() {
  const { highContrast, setHighContrast } = useAppTheme();

  const toggleContrast = async () => {
    const next = !highContrast;
    setHighContrast(next);
    await TTSService.speak(
      next ? 'High contrast mode enabled' : 'Standard contrast mode enabled'
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <AccessibleText variant="title" style={styles.title}>
          Accessibility & Settings
        </AccessibleText>
        <AccessibleText variant="body" style={styles.description}>
          Configure voice speech rate, haptic feedback intensity, and TalkBack audio descriptions.
        </AccessibleText>
      </Card>

      <AccessibleButton
        label={highContrast ? 'High Contrast: ON' : 'High Contrast: OFF'}
        accessibilityHint="Toggles high contrast theme for visual clarity"
        onPress={toggleContrast}
        variant="secondary"
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  card: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.md,
  },
});
