import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BalanceSummary } from '../../types/transaction';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';

export interface BalanceCardProps {
  balanceSummary: BalanceSummary;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balanceSummary }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current Balance</Text>
      <Text style={styles.balance}>
        ৳ {balanceSummary.totalBalance.toLocaleString('en-US')}
      </Text>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.column}>
          <Text style={styles.label}>You are owed</Text>
          <Text style={styles.owedText}>
            +৳{balanceSummary.youAreOwed.toLocaleString('en-US')}
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.column}>
          <Text style={styles.label}>You owe</Text>
          <Text style={styles.oweText}>
            -৳{balanceSummary.youOwe.toLocaleString('en-US')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  label: {
    fontSize: typography.xs,
    color: colors.primaryLight,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  balance: {
    fontSize: typography.hero,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: spacing.md,
  },
  owedText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: '#86EFAC',
  },
  oweText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: '#FCA5A5',
  },
});
