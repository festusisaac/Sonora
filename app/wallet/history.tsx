import React from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessibleButton } from '../../src/components/common/AccessibleButton';
import { AccessibleText } from '../../src/components/common/AccessibleText';
import { Card } from '../../src/components/common/Card';
import { useTransactionHistory } from '../../src/hooks/useTransactionHistory';
import { TTSService } from '../../src/services/speech/tts';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function HistoryScreen() {
  const { history, isLoading, error, hasMore, loadMore, refreshHistory } =
    useTransactionHistory();

  const handleSpeakHistory = async () => {
    if (!history.length) {
      await TTSService.speak('No transaction history found on Stellar Testnet.');
      return;
    }

    const firstThree = history.slice(0, 3);
    const summary = firstThree
      .map(
        (item, i) =>
          `Transaction ${i + 1}: ${item.direction} payment of ${item.amount} ${item.assetCode}.`
      )
      .join(' ');

    await TTSService.speak(
      `Recent transaction history. Total items: ${history.length}. ${summary}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <AccessibleText variant="title" accessibilityRole="header" style={styles.title}>
            Transaction History
          </AccessibleText>
          <AccessibleText variant="subtitle" style={styles.subtitle}>
            Stellar Testnet Ledger Activity
          </AccessibleText>
        </View>

        {/* Audio Summary & Refresh */}
        <View style={styles.topActions}>
          <AccessibleButton
            label="Speak History"
            accessibilityHint="Reads recent transactions aloud"
            variant="secondary"
            onPress={handleSpeakHistory}
            style={styles.actionBtn}
          />
          <AccessibleButton
            label="Refresh"
            accessibilityHint="Reloads transactions from Stellar Horizon"
            variant="secondary"
            onPress={refreshHistory}
            disabled={isLoading}
            style={styles.actionBtn}
          />
        </View>

        {/* Loading Spinner */}
        {isLoading && !history.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AccessibleText variant="body" style={styles.loadingText}>
              Loading transactions from Stellar...
            </AccessibleText>
          </View>
        ) : null}

        {/* Error State */}
        {error ? (
          <AccessibleText variant="caption" style={styles.errorText}>
            {error}
          </AccessibleText>
        ) : null}

        {/* Empty History */}
        {!isLoading && !history.length && !error ? (
          <Card style={styles.emptyCard}>
            <AccessibleText variant="body" style={styles.emptyText}>
              No transaction history found on Stellar Testnet. Once you make or receive payments, they will appear here.
            </AccessibleText>
          </Card>
        ) : null}

        {/* Transaction Items */}
        {history.map((item) => {
          const isIncoming = item.direction === 'incoming';
          return (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.row}>
                <View
                  style={[
                    styles.directionBadge,
                    {
                      backgroundColor: isIncoming
                        ? colors.successText
                        : colors.surfaceRaised,
                      borderColor: isIncoming ? colors.success : colors.surfaceBorder,
                    },
                  ]}
                >
                  <AccessibleText
                    variant="caption"
                    style={{
                      color: isIncoming ? colors.success : colors.primary,
                      fontWeight: 'bold',
                    }}
                  >
                    {isIncoming ? '↓ RECEIVED' : '↑ SENT'}
                  </AccessibleText>
                </View>

                <AccessibleText variant="title" style={styles.itemAmount}>
                  {isIncoming ? '+' : '-'}
                  {item.amount} {item.assetCode}
                </AccessibleText>
              </View>

              <AccessibleText variant="caption" style={styles.counterparty}>
                {isIncoming ? 'From: ' : 'To: '}
                {item.counterparty}
              </AccessibleText>

              <View style={styles.footerRow}>
                <AccessibleText variant="caption" style={styles.timestamp}>
                  {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </AccessibleText>
                <AccessibleText variant="caption" style={styles.hashLink}>
                  #{item.transactionHash.slice(0, 8)}
                </AccessibleText>
              </View>
            </Card>
          );
        })}

        {/* Load More Button */}
        {hasMore && (
          <AccessibleButton
            label={isLoading ? 'Loading...' : 'Load Older Transactions'}
            accessibilityHint="Fetches the next page of transactions"
            variant="secondary"
            onPress={loadMore}
            disabled={isLoading}
            style={styles.loadMoreBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.milky,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    color: colors.black,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.secondary,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  emptyCard: {
    padding: spacing.lg,
    marginVertical: spacing.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  emptyText: {
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  itemCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  directionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  itemAmount: {
    fontSize: 20,
    color: colors.black,
    fontWeight: '800',
  },
  counterparty: {
    fontFamily: 'monospace',
    color: colors.secondary,
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
  timestamp: {
    color: colors.secondary,
  },
  hashLink: {
    color: colors.black,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  loadMoreBtn: {
    marginTop: spacing.md,
    width: '100%',
  },
});
