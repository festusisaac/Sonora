import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { SonoraCard } from '../ui/SonoraCard';
import { TTSService } from '../../services/speech/tts';
import { HapticsService } from '../../services/device/haptics';

export interface BalanceAsset {
  code: string;
  balance: string;
  availableBalance?: string;
}

export interface BalanceSummaryProps {
  balances: BalanceAsset[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({
  balances,
  onRefresh,
  isLoading = false,
}) => {
  const xlmBalance = balances.find((b) => b.code === 'XLM')?.balance || '0.00';
  const otherAssets = balances.filter((b) => b.code !== 'XLM');

  const handleSpeak = async () => {
    await HapticsService.impactMedium();
    const assetsText = otherAssets.length
      ? otherAssets.map((a) => `${a.balance} ${a.code}`).join(', and ')
      : '';
    const message = `Your total Stellar balance is ${xlmBalance} Lumens.${assetsText ? ` Other assets: ${assetsText}.` : ''}`;
    await TTSService.speak(message);
  };

  return (
    <SonoraCard variant="elevated" style={styles.card}>
      <View style={styles.topRow}>
        <SonoraText variant="label" style={styles.label}>
          TOTAL STELLAR BALANCE
        </SonoraText>

        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Read balance out loud"
          accessibilityHint="Speaks your total balance through voice"
          onPress={handleSpeak}
          style={styles.speakBtn}
        >
          <SonoraText variant="label" style={styles.speakBtnText}>
            Speak
          </SonoraText>
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <SonoraText variant="financial" style={styles.amountText}>
          {xlmBalance}
        </SonoraText>
        <SonoraText variant="subtitle" style={styles.assetCode}>
          XLM
        </SonoraText>
      </View>

      {otherAssets.length > 0 ? (
        <View style={styles.otherAssetsContainer}>
          {otherAssets.map((asset) => (
            <View key={asset.code} style={styles.otherAssetRow}>
              <SonoraText variant="caption" style={styles.otherAssetCode}>
                {asset.code}:
              </SonoraText>
              <SonoraText variant="body" style={styles.otherAssetBalance}>
                {asset.balance}
              </SonoraText>
            </View>
          ))}
        </View>
      ) : null}

      {onRefresh ? (
        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Refresh balances from Stellar Testnet"
          onPress={onRefresh}
          disabled={isLoading}
          style={styles.refreshBtn}
        >
          <SonoraText variant="caption" style={styles.refreshText}>
            {isLoading ? 'Updating…' : 'Tap to refresh'}
          </SonoraText>
        </TouchableOpacity>
      ) : null}
    </SonoraCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.secondary,
    letterSpacing: 0.5,
    fontWeight: '700',
    fontSize: 11,
  },
  speakBtn: {
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.black,
  },
  speakBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 11,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  amountText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.black,
  },
  assetCode: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
  },
  otherAssetsContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  otherAssetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otherAssetCode: {
    fontWeight: '600',
    color: colors.secondary,
  },
  otherAssetBalance: {
    fontWeight: '700',
    color: colors.black,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  refreshText: {
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
