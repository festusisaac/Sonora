import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function OnboardingScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <AccessibleText variant="title" style={styles.title}>
          Voice Onboarding
        </AccessibleText>
        <AccessibleText variant="body" style={styles.description}>
          Welcome to SONORA. Learn voice gestures and how to check your balance independently.
        </AccessibleText>
      </Card>
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
  },
});
