import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { ScreenReaderAnnouncement } from '../../src/components/accessibility/ScreenReaderAnnouncement';
import { useWallet } from '../../src/hooks/useWallet';
import { TTSService } from '../../src/services/speech/tts';
import { HapticsService } from '../../src/services/device/haptics';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function WalletScreen() {
  const {
    publicKey,
    status,
    balances,
    isBackedUp,
    isLoading,
    refreshBalances,
    fundTestnetAccount,
    disconnectAndClearWallet,
    initializeFromStorage,
  } = useWallet();

  const [announcement, setAnnouncement] = useState<string>('');
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);

  useEffect(() => {
    initializeFromStorage().then(() => {
      if (publicKey) {
        refreshBalances();
      }
    });
  }, [publicKey, initializeFromStorage, refreshBalances]);

  const handleSpeakBalance = async () => {
    const text = balances.length
      ? `Your balance is ${balances.map((b) => `${b.balance} ${b.code}`).join(', ')}.`
      : 'Your account balance is currently empty on Stellar Testnet. You can fund it with Friendbot.';
    setAnnouncement(text);
    await TTSService.speak(text);
  };

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    await Clipboard.setStringAsync(publicKey);
    await HapticsService.notificationSuccess();
    setAnnouncement('Public address copied to clipboard.');
    Alert.alert('Address Copied', 'Your Stellar public address was copied to clipboard.');
  };

  const handleFundFriendbot = async () => {
    await HapticsService.impactMedium();
    setFundingMessage('Requesting 10,000 XLM from Stellar Friendbot...');
    setAnnouncement('Requesting Testnet funds from Friendbot. Please wait.');

    const res = await fundTestnetAccount();
    if (res.success) {
      await HapticsService.notificationSuccess();
      setFundingMessage('Account funded successfully with 10,000 Testnet XLM!');
      setAnnouncement('Account funded with 10,000 Testnet XLM. Balance updated.');
      await TTSService.speak('Account funded successfully with 10,000 Testnet XLM.');
    } else {
      await HapticsService.notificationError();
      setFundingMessage(res.message);
      setAnnouncement(res.message);
      await TTSService.speak(res.message);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to remove this wallet from your device? Ensure you have backed up your 24-word recovery phrase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectAndClearWallet();
            await HapticsService.notificationWarning();
            setAnnouncement('Wallet disconnected and removed from device.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenReaderAnnouncement message={announcement} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* If no wallet is present */}
        {!publicKey ? (
          <View style={styles.emptyContainer}>
            <View style={styles.header}>
              <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
                Stellar Wallet
              </AccessibleText>
              <AccessibleText variant="subtitle" style={styles.subtitle}>
                No wallet configured yet.
              </AccessibleText>
            </View>

            <Card style={styles.card}>
              <AccessibleText variant="label" style={styles.cardHeader}>
                GET STARTED
              </AccessibleText>
              <AccessibleText variant="body" style={styles.cardBody}>
                Create a new non-custodial 24-word Stellar wallet, or restore an existing one from your recovery phrase.
              </AccessibleText>

              <View style={styles.buttonGroup}>
                <AccessibleButton
                  label="Create New Wallet"
                  accessibilityHint="Generates a new 24-word recovery phrase and Stellar account"
                  variant="primary"
                  onPress={() => router.push('/wallet/create' as any)}
                  style={styles.actionBtn}
                />
                <AccessibleButton
                  label="Restore Existing Wallet"
                  accessibilityHint="Restores a wallet from a 24-word or 12-word recovery phrase"
                  variant="secondary"
                  onPress={() => router.push('/wallet/restore' as any)}
                  style={styles.actionBtn}
                />
              </View>
            </Card>
          </View>
        ) : (
          /* Active Wallet View */
          <View>
            {/* Header */}
            <View style={styles.header}>
              <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
                Wallet Overview
              </AccessibleText>
              <AccessibleText variant="subtitle" style={styles.subtitle}>
                Non-Custodial Stellar Account
              </AccessibleText>
            </View>

            {/* Backup Status Warning / Badge */}
            {!isBackedUp ? (
              <Card style={styles.unverifiedBackupCard}>
                <AccessibleText variant="label" style={styles.unverifiedTitle}>
                  ⚠️ BACKUP REQUIRED
                </AccessibleText>
                <AccessibleText variant="body" style={styles.unverifiedBody}>
                  You have not verified your 24-word recovery phrase. If you lose your phone, your funds cannot be recovered.
                </AccessibleText>
                <AccessibleButton
                  label="Verify Backup Now"
                  accessibilityHint="Takes you to the backup verification challenge"
                  variant="primary"
                  onPress={() => router.push('/wallet/backup-verify' as any)}
                  style={styles.verifyBtn}
                />
              </Card>
            ) : (
              <View style={styles.backedUpBadge}>
                <AccessibleText variant="caption" style={styles.backedUpText}>
                  ✓ Recovery Phrase Verified & Secured
                </AccessibleText>
              </View>
            )}

            {/* Network Card */}
            <Card style={styles.card}>
              <AccessibleText variant="label" style={styles.label}>
                NETWORK
              </AccessibleText>
              <AccessibleText variant="title" style={styles.value}>
                Stellar Testnet
              </AccessibleText>
              <AccessibleText variant="caption" style={styles.subvalue}>
                Status: {status}
              </AccessibleText>
            </Card>

            {/* Public Address Card */}
            <Card style={styles.card}>
              <AccessibleText variant="label" style={styles.label}>
                PUBLIC ADDRESS
              </AccessibleText>
              <AccessibleText
                variant="body"
                style={styles.address}
                accessible={true}
                accessibilityLabel={`Public address: ${publicKey}`}
              >
                {publicKey}
              </AccessibleText>
              <AccessibleButton
                label="Copy Public Address"
                accessibilityHint="Copies your full 56-character public address to clipboard"
                variant="secondary"
                onPress={handleCopyAddress}
                style={styles.copyBtn}
              />
            </Card>

            {/* Balances Card */}
            <Card style={styles.card}>
              <AccessibleText variant="label" style={styles.label}>
                BALANCES
              </AccessibleText>
              {balances.length > 0 ? (
                balances.map((b) => (
                  <View key={b.code} style={styles.balanceRow}>
                    <AccessibleText variant="title" style={styles.balanceAmount}>
                      {b.balance}
                    </AccessibleText>
                    <AccessibleText variant="subtitle" style={styles.balanceCode}>
                      {b.code}
                    </AccessibleText>
                  </View>
                ))
              ) : (
                <AccessibleText variant="body" style={styles.emptyBalanceText}>
                  0.00 XLM (Account not yet funded on Testnet)
                </AccessibleText>
              )}

              <View style={styles.balanceActions}>
                <AccessibleButton
                  label="Speak Balance"
                  accessibilityHint="Speaks your balances aloud"
                  variant="secondary"
                  onPress={handleSpeakBalance}
                  style={styles.flexBtn}
                />
                <AccessibleButton
                  label="Refresh"
                  accessibilityHint="Reloads balances from Stellar Horizon"
                  variant="secondary"
                  onPress={() => refreshBalances()}
                  disabled={isLoading}
                  style={styles.flexBtn}
                />
              </View>
            </Card>

            {/* Friendbot Testnet Funding */}
            <Card style={styles.fundingCard}>
              <AccessibleText variant="label" style={styles.fundingLabel}>
                TESTNET XLM FAUCET
              </AccessibleText>
              <AccessibleText variant="body" style={styles.fundingBody}>
                Need test funds? Request 10,000 free Testnet XLM from the official Stellar Friendbot.
              </AccessibleText>

              <AccessibleButton
                label={isLoading ? 'Funding Account...' : 'Fund with Friendbot (+10,000 XLM)'}
                accessibilityHint="Requests 10,000 Testnet XLM from the Friendbot faucet"
                variant="primary"
                onPress={handleFundFriendbot}
                disabled={isLoading}
                style={styles.fundingBtn}
              />

              {fundingMessage ? (
                <AccessibleText
                  variant="caption"
                  style={styles.fundingStatus}
                  accessibilityLiveRegion="polite"
                >
                  {fundingMessage}
                </AccessibleText>
              ) : null}
            </Card>

            {/* Disconnect Danger Zone */}
            <View style={styles.dangerZone}>
              <AccessibleButton
                label="Disconnect Wallet"
                accessibilityHint="Removes this wallet from this device"
                variant="danger"
                onPress={handleDisconnect}
                style={styles.disconnectBtn}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    color: colors.primary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  cardBody: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
  unverifiedBackupCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: spacing.md,
  },
  unverifiedTitle: {
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  unverifiedBody: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  verifyBtn: {
    marginTop: spacing.sm,
  },
  backedUpBadge: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
  },
  backedUpText: {
    color: colors.success,
    fontWeight: 'bold',
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
    fontSize: 14,
    lineHeight: 20,
  },
  copyBtn: {
    marginTop: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  balanceAmount: {
    fontSize: 28,
    color: colors.textPrimary,
  },
  balanceCode: {
    fontSize: 18,
    color: colors.accent,
  },
  emptyBalanceText: {
    color: colors.textMuted,
    marginVertical: spacing.sm,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  flexBtn: {
    flex: 1,
  },
  fundingCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  fundingLabel: {
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  fundingBody: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fundingBtn: {
    width: '100%',
  },
  fundingStatus: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dangerZone: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  disconnectBtn: {
    width: '100%',
  },
});
