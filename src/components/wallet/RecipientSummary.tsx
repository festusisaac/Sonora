import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { SonoraCard } from '../ui/SonoraCard';
import { TTSService } from '../../services/speech/tts';

export interface RecipientSummaryProps {
  name?: string;
  address: string;
  isVerified?: boolean;
  onPress?: () => void;
}

export const RecipientSummary: React.FC<RecipientSummaryProps> = ({
  name,
  address,
  isVerified = true,
  onPress,
}) => {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-6)}`;

  const handleSpeak = async () => {
    const text = `Recipient: ${name || 'Unsaved contact'}. Address: ${shortAddress}. ${isVerified ? 'Recipient account is active on Stellar Testnet.' : 'Recipient account is not yet funded on network.'}`;
    await TTSService.speak(text);
  };

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Recipient ${name || 'contact'}, address: ${shortAddress}. Tap to hear details.`}
      onPress={onPress || handleSpeak}
      activeOpacity={0.7}
    >
      <SonoraCard variant="elevated" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <SonoraText variant="title" style={styles.avatarText}>
              {(name || 'R').slice(0, 1).toUpperCase()}
            </SonoraText>
          </View>
          <View style={styles.info}>
            <SonoraText variant="title" style={styles.nameText}>
              {name || 'Stellar Recipient'}
            </SonoraText>
            <SonoraText variant="caption" style={styles.addressText}>
              {shortAddress}
            </SonoraText>
          </View>
          <View style={[styles.badge, isVerified ? styles.verifiedBadge : styles.unverifiedBadge]}>
            <SonoraText variant="caption" style={[styles.badgeText, isVerified ? styles.verifiedText : styles.unverifiedText]}>
              {isVerified ? 'Active' : 'New'}
            </SonoraText>
          </View>
        </View>
      </SonoraCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.milky,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '800',
    color: colors.black,
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  addressText: {
    color: colors.secondary,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadge: {
    backgroundColor: colors.successBackground,
  },
  unverifiedBadge: {
    backgroundColor: colors.warningBackground,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  verifiedText: {
    color: colors.successText,
  },
  unverifiedText: {
    color: colors.warningText,
  },
});
