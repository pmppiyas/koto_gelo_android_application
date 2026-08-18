import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserBalance } from '../types/balance.types';
import { Card } from '../../../../components/ui/Card';
import { AmountDisplay } from '../../../../components/expense/AmountDisplay';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

export interface MemberBalanceListProps {
  balances: UserBalance[];
  currency?: string;
}

export const MemberBalanceList: React.FC<MemberBalanceListProps> = ({
  balances,
  currency = 'BDT',
}) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.header}>Member Balances</Text>
      {balances.map(b => (
        <View key={b.userId} style={styles.row}>
          <Text style={styles.name}>{b.userName}</Text>
          <AmountDisplay
            amount={b.netBalance}
            currency={currency}
            type={b.netBalance > 0 ? 'income' : b.netBalance < 0 ? 'expense' : 'neutral'}
            size="sm"
          />
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
});
