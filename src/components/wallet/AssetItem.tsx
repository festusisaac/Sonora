import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { SonoraCard } from '../ui/SonoraCard';

export interface AssetItemProps {
  code: string;
  balance: string;
  issuer?: string;
  onPress?: () => void;
}

export const AssetItem: React.FC<AssetItemProps> = ({
  code,
  balance,
  issuer,
  onPress,
}) => {
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Asset ${code}, balance: ${balance} units.`}
      accessibilityHint={onPress ? 'Tap to view asset details' : undefined}
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <SonoraCard variant="elevated" style={styles.card}>
        <View style={styles.contentRow}>
          <View style={styles.badge}>
            <SonoraText variant="title" style={styles.badgeText}>
              {code.slice(0, 3)}
            </SonoraText>
          </View>
          <View style={styles.detailsColumn}>
            <SonoraText variant="title" style={styles.codeText}>
              {code}
            </SonoraText>
            {issuer ? (
              <SonoraText variant="caption" style={styles.issuerText} numberOfLines={1}>
                {issuer.slice(0, 4)}...{issuer.slice(-4)}
              </SonoraText>
            ) : (
              <SonoraText variant="caption" style={styles.nativeText}>
                Stellar Native Asset
              </SonoraText>
            )}
          </View>
          <View style={styles.balanceColumn}>
            <SonoraText variant="title" style={styles.balanceText}>
              {balance}
            </SonoraText>
            <SonoraText variant="caption" style={styles.unitText}>
              {code}
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.black,
  },
  detailsColumn: {
    flex: 1,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
  issuerText: {
    color: colors.secondary,
    fontSize: 12,
  },
  nativeText: {
    color: colors.secondary,
    fontSize: 12,
  },
  balanceColumn: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.black,
  },
  unitText: {
    fontSize: 11,
    color: colors.secondary,
  },
});
