import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { TTSService } from '../../src/services/speech/tts';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function ReceiveScreen() {
  const handleSpokenAddress = async () => {
    await TTSService.speak(
      'Receive screen. Your Stellar Testnet public address can be copied or shared safely.'
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <AccessibleText variant="title" style={styles.title}>
          Receive Payments
        </AccessibleText>
        <AccessibleText variant="body" style={styles.description}>
          Share your public Stellar address to receive Testnet XLM or test USDC tokens.
        </AccessibleText>
      </Card>

      <AccessibleButton
        label="Spoken Information"
        accessibilityHint="Plays spoken explanation of your public receiving address"
        onPress={handleSpokenAddress}
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
