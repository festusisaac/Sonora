import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { SonoraCard } from '../ui/SonoraCard';
import { TTSService } from '../../services/speech/tts';
import { HapticsService } from '../../services/device/haptics';

export interface TransactionReviewProps {
  recipientName?: string;
  recipientAddress: string;
  amount: string;
  assetCode: string;
  network?: string;
  estimatedFeeStroops?: number;
  totalDebit?: string;
  status?: string;
  memo?: string;
  onSpeakReview?: () => void;
}

export const TransactionReview: React.FC<TransactionReviewProps> = ({
  recipientName,
  recipientAddress,
  amount,
  assetCode,
  network = 'Stellar Testnet',
  estimatedFeeStroops = 100,
  totalDebit,
  status = 'Ready for Authorization',
  memo,
  onSpeakReview,
}) => {
  const feeInXlm = (estimatedFeeStroops / 10000000).toFixed(7);
  const calculatedTotal = totalDebit || (assetCode === 'XLM' ? (parseFloat(amount || '0') + parseFloat(feeInXlm)).toFixed(7) : amount);

  const handleSpeak = async () => {
    await HapticsService.impactMedium();
    if (onSpeakReview) {
      onSpeakReview();
      return;
    }
    const reviewText = `Transaction Review: Sending ${amount} ${assetCode} to ${recipientName ? `${recipientName}, address ${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)}` : recipientAddress.slice(0, 8)}. Network is ${network}. Network fee is ${feeInXlm} XLM. Total debit will be ${calculatedTotal} ${assetCode}.${memo ? ` Memo: ${memo}.` : ''} Please confirm to proceed.`;
    await TTSService.speak(reviewText);
  };

  return (
    <SonoraCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <SonoraText variant="label" style={styles.badgeText}>
            TRANSACTION REVIEW
          </SonoraText>
        </View>

        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Read full transaction review aloud"
          accessibilityHint="Speaks recipient, amount, fees, and total debit"
          onPress={handleSpeak}
          style={styles.speakBtn}
        >
          <SonoraText variant="label" style={styles.speakBtnText}>
            Hear Details
          </SonoraText>
        </TouchableOpacity>
      </View>

      <View style={styles.amountDisplay}>
        <SonoraText variant="label" style={styles.amountLabel}>
          PAYMENT AMOUNT
        </SonoraText>
        <SonoraText variant="financial" style={styles.amountValue}>
          {amount} {assetCode}
        </SonoraText>
      </View>

      <View style={styles.detailsList}>
        <View style={styles.detailRow}>
          <SonoraText variant="caption" style={styles.detailKey}>
            Recipient:
          </SonoraText>
          <SonoraText variant="body" style={styles.detailVal} numberOfLines={1}>
            {recipientName ? `${recipientName} (${recipientAddress.slice(0, 4)}...${recipientAddress.slice(-4)})` : `${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}`}
          </SonoraText>
        </View>

        <View style={styles.detailRow}>
          <SonoraText variant="caption" style={styles.detailKey}>
            Network:
          </SonoraText>
          <SonoraText variant="body" style={styles.detailVal}>
            {network}
          </SonoraText>
        </View>

        <View style={styles.detailRow}>
          <SonoraText variant="caption" style={styles.detailKey}>
            Network Fee:
          </SonoraText>
          <SonoraText variant="body" style={styles.detailVal}>
            {feeInXlm} XLM
          </SonoraText>
        </View>

        {memo ? (
          <View style={styles.detailRow}>
            <SonoraText variant="caption" style={styles.detailKey}>
              Memo:
            </SonoraText>
            <SonoraText variant="body" style={styles.detailVal}>
              {memo}
            </SonoraText>
          </View>
        ) : null}

        <View style={[styles.detailRow, styles.totalRow]}>
          <SonoraText variant="title" style={styles.totalKey}>
            Total Debit:
          </SonoraText>
          <SonoraText variant="title" style={styles.totalVal}>
            {calculatedTotal} {assetCode}
          </SonoraText>
        </View>
      </View>

      <View style={styles.statusFooter}>
        <SonoraText variant="caption" style={styles.statusLabel}>
          Status: <SonoraText variant="caption" style={styles.statusText}>{status}</SonoraText>
        </SonoraText>
      </View>
    </SonoraCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  speakBtn: {
    backgroundColor: colors.milky,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speakBtnText: {
    color: colors.black,
    fontWeight: '700',
    fontSize: 11,
  },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  amountLabel: {
    color: colors.secondary,
    fontSize: 11,
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  amountValue: {
    color: colors.black,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  detailsList: {
    backgroundColor: colors.milky,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    color: colors.secondary,
    fontWeight: '600',
  },
  detailVal: {
    color: colors.black,
    fontWeight: '700',
    maxWidth: '65%',
  },
  totalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalKey: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.black,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.black,
  },
  statusFooter: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  statusLabel: {
    color: colors.secondary,
  },
  statusText: {
    fontWeight: '700',
    color: colors.black,
  },
});
