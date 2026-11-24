import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { TTSService } from '../../src/services/speech/tts';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function SendScreen() {
  const handleSpokenGuidance = async () => {
    await TTSService.speak(
      'Send Payment screen. In Phase 2, you will be able to speak: Send 25 USDC to Musa. All transactions require explicit confirmation.'
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <AccessibleText variant="title" style={styles.title}>
          Send Payment
        </AccessibleText>
        <AccessibleText variant="body" style={styles.description}>
          Voice-guided payment creation and recipient verification on Stellar Testnet. Real funds and unconfirmed payments are prohibited by design.
        </AccessibleText>
      </Card>

      <AccessibleButton
        label="Spoken Guidance"
        accessibilityHint="Plays spoken explanation of the send payment workflow"
        onPress={handleSpokenGuidance}
        variant="primary"
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
