import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BalanceSummary } from '../../types/transaction';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';

export interface SummaryCardProps {
  balanceSummary: BalanceSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ balanceSummary }) => {
  return (
    <View style={styles.container}>
      <View style={[styles.card, styles.incomeCard]}>
        <View style={[styles.iconWrapper, styles.incomeIconBg]}>
          <Feather name="arrow-down-left" size={14} color={colors.secondary} />
        </View>
        <Text style={styles.label}>Income</Text>
        <Text style={styles.amount}>
          ৳{balanceSummary.totalIncome.toLocaleString('en-US')}
        </Text>
      </View>

      <View style={[styles.card, styles.expenseCard]}>
        <View style={[styles.iconWrapper, styles.expenseIconBg]}>
          <Feather name="arrow-up-right" size={14} color={colors.danger} />
        </View>
        <Text style={styles.label}>Expense</Text>
        <Text style={styles.amount}>
          ৳{balanceSummary.totalExpense.toLocaleString('en-US')}
        </Text>
      </View>

      <View style={[styles.card, styles.savingsCard]}>
        <View style={[styles.iconWrapper, styles.savingsIconBg]}>
          <Feather name="bookmark" size={14} color={colors.accent} />
        </View>
        <Text style={styles.label}>Savings</Text>
        <Text style={styles.amount}>
          ৳{balanceSummary.savings.toLocaleString('en-US')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderTopWidth: 3,
  },
  incomeCard: {
    borderTopColor: colors.secondary,
  },
  expenseCard: {
    borderTopColor: colors.danger,
  },
  savingsCard: {
    borderTopColor: colors.accent,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  incomeIconBg: {
    backgroundColor: colors.secondaryLight,
  },
  expenseIconBg: {
    backgroundColor: colors.dangerLight,
  },
  savingsIconBg: {
    backgroundColor: colors.accentLight,
  },
  label: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  amount: {
    fontSize: typography.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
