import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../../../components/ui/Card';
import { AmountDisplay } from '../../../../components/expense/AmountDisplay';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

export interface BalanceCardProps {
  title?: string;
  netBalance: number;
  currency?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  title = 'Your Balance',
  netBalance,
  currency = 'BDT',
}) => {
  const type = netBalance > 0 ? 'income' : netBalance < 0 ? 'expense' : 'neutral';
  const label = netBalance > 0 ? 'You are owed' : netBalance < 0 ? 'You owe' : 'Settled up';

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.status}>{label}</Text>
      <AmountDisplay
        amount={Math.abs(netBalance)}
        currency={currency}
        type={type}
        size="xl"
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  status: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    color: colors.text,
  },
});
