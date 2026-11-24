import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { useWalletStore } from '../../src/store/walletStore';
import { TTSService } from '../../src/services/speech/tts';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function WalletScreen() {
  const { publicKey, status, balances } = useWalletStore();

  const handleSpeakBalance = async () => {
    const text = balances.length
      ? `Your balance is ${balances.map((b) => `${b.balance} ${b.code}`).join(', ')}.`
      : 'No wallet loaded or balance is zero. This is a Stellar Testnet preview.';
    await TTSService.speak(text);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <AccessibleText variant="label" style={styles.label}>
          NETWORK STATUS
        </AccessibleText>
        <AccessibleText variant="title" style={styles.value}>
          Stellar Testnet
        </AccessibleText>
        <AccessibleText variant="caption" style={styles.subvalue}>
          Status: {status}
        </AccessibleText>
      </Card>

      <Card style={styles.card}>
        <AccessibleText variant="label" style={styles.label}>
          PUBLIC ADDRESS
        </AccessibleText>
        <AccessibleText variant="body" style={styles.address}>
          {publicKey || 'Not connected (Phase 1 preview)'}
        </AccessibleText>
      </Card>

      <AccessibleButton
        label="Speak Current Balance"
        accessibilityHint="Speaks your current Testnet asset balance out loud"
        onPress={handleSpeakBalance}
        style={styles.speakButton}
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
  label: {
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 22,
    color: colors.textPrimary,
  },
  subvalue: {
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  address: {
    fontFamily: 'monospace',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  speakButton: {
    marginTop: spacing.md,
  },
});
