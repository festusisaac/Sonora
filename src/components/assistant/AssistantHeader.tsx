import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SonoraText } from '../ui/SonoraText';
import { SonoraStatusIndicator, AssistantStatus } from '../ui/SonoraStatusIndicator';

export interface AssistantHeaderProps {
  status: AssistantStatus;
  network?: string;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export const AssistantHeader: React.FC<AssistantHeaderProps> = ({
  status,
  network = 'TESTNET',
  onOpenSettings,
  onOpenHelp,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          <SonoraText variant="title" accessibilityRole="header" style={styles.brandTitle}>
            SONORA
          </SonoraText>
          <View
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`Active network: Stellar ${network}`}
            style={styles.networkBadge}
          >
            <SonoraText variant="label" style={styles.networkText}>
              {network}
            </SonoraText>
          </View>
        </View>

        <View style={styles.actionGroup}>
          {onOpenHelp ? (
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Help and spoken instructions"
              accessibilityHint="Hear guidance on using SONORA with voice"
              onPress={onOpenHelp}
              style={styles.iconBtn}
            >
              <SonoraText variant="label" style={styles.iconText}>
                Help
              </SonoraText>
            </TouchableOpacity>
          ) : null}
          {onOpenSettings ? (
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Settings and Preferences"
              accessibilityHint="Opens voice speed, privacy, and wallet settings"
              onPress={onOpenSettings}
              style={styles.iconBtn}
            >
              <SonoraText variant="label" style={styles.iconText}>
                Settings
              </SonoraText>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.statusRow}>
        <SonoraStatusIndicator status={status} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.milky,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.black,
  },
  networkBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.black,
  },
  statusRow: {
    marginTop: spacing.xs,
  },
});
