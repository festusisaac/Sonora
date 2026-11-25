import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { SonoraCard } from '../ui/SonoraCard';
import { TTSService } from '../../services/speech/tts';
import { HapticsService } from '../../services/device/haptics';

export interface TransactionItemProps {
  id: string;
  direction: 'inbound' | 'outbound';
  amount: string;
  assetCode: string;
  counterparty: string;
  status: 'successful' | 'pending' | 'failed';
  date: string;
  memo?: string;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  direction,
  amount,
  assetCode,
  counterparty,
  status,
  date,
  memo,
  onPress,
}) => {
  const isInbound = direction === 'inbound';
  const shortAddress = counterparty
    ? `${counterparty.slice(0, 4)}...${counterparty.slice(-4)}`
    : 'Unknown';

  const getStatusBadge = () => {
    switch (status) {
      case 'successful':
        return { label: 'Verified', bg: colors.successBackground, color: colors.successText };
      case 'failed':
        return { label: 'Failed', bg: colors.dangerBackground, color: colors.dangerText };
      case 'pending':
      default:
        return { label: 'Pending', bg: colors.warningBackground, color: colors.warningText };
    }
  };

  const badge = getStatusBadge();

  const handleSpeak = async () => {
    await HapticsService.selection();
    const narration = `${isInbound ? 'Received' : 'Sent'} ${amount} ${assetCode} ${isInbound ? 'from' : 'to'} ${shortAddress}. Status: ${badge.label}. Date: ${date}.${memo ? ` Memo: ${memo}.` : ''}`;
    await TTSService.speak(narration);
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${isInbound ? 'Received' : 'Sent'} ${amount} ${assetCode}. Status: ${badge.label}. Tap to hear details.`}
      onPress={onPress || handleSpeak}
      activeOpacity={0.7}
    >
      <SonoraCard variant="elevated" style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.directionGroup}>
            <View
              style={[
                styles.arrowBadge,
                isInbound ? styles.inboundBadge : styles.outboundBadge,
              ]}
            >
              <SonoraText variant="label" style={styles.arrowText}>
                {isInbound ? '↓' : '↑'}
              </SonoraText>
            </View>
            <View>
              <SonoraText variant="title" style={styles.directionTitle}>
                {isInbound ? 'Received' : 'Sent'}
              </SonoraText>
              <SonoraText variant="caption" style={styles.dateText}>
                {date}
              </SonoraText>
            </View>
          </View>

          <View style={styles.amountColumn}>
            <SonoraText
              variant="title"
              style={[
                styles.amountText,
                isInbound ? styles.inboundAmount : styles.outboundAmount,
              ]}
            >
              {isInbound ? `+${amount}` : `-${amount}`} {assetCode}
            </SonoraText>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <SonoraText variant="caption" style={[styles.statusText, { color: badge.color }]}>
                {badge.label}
              </SonoraText>
            </View>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <SonoraText variant="caption" style={styles.counterpartyText}>
            {isInbound ? 'From: ' : 'To: '}{shortAddress}
          </SonoraText>
          {memo ? (
            <SonoraText variant="caption" style={styles.memoText} numberOfLines={1}>
              Memo: {memo}
            </SonoraText>
          ) : null}
        </View>
      </SonoraCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  directionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  arrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inboundBadge: {
    backgroundColor: colors.successBackground,
  },
  outboundBadge: {
    backgroundColor: colors.milky,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.black,
  },
  directionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
  },
  dateText: {
    fontSize: 11,
    color: colors.secondary,
  },
  amountColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  inboundAmount: {
    color: colors.success,
  },
  outboundAmount: {
    color: colors.black,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  counterpartyText: {
    color: colors.secondary,
    fontSize: 12,
  },
  memoText: {
    color: colors.secondary,
    fontSize: 12,
    maxWidth: '50%',
  },
});
