import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GroupExpense } from '../types/groupExpense.types';
import { Card } from '../../../../components/ui/Card';
import { AmountDisplay } from '../../../../components/expense/AmountDisplay';
import { ExpenseCategoryIcon } from '../../../../components/expense/ExpenseCategoryIcon';
import { formatDate } from '../../../../utils/date';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

export interface GroupExpenseCardProps {
  expense: GroupExpense;
  onPress?: () => void;
}

export const GroupExpenseCard: React.FC<GroupExpenseCardProps> = ({
  expense,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.left}>
          <ExpenseCategoryIcon category={expense.category} size={42} />
          <View style={styles.details}>
            <Text style={styles.title}>{expense.title}</Text>
            <Text style={styles.subtitle}>
              {formatDate(expense.date)} • Split {expense.splitType.toLowerCase()}
            </Text>
          </View>
        </View>
        <AmountDisplay
          amount={expense.amount}
          currency={expense.currency}
          size="md"
        />
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  details: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
