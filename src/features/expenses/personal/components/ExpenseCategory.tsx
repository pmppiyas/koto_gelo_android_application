import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExpenseCategoryIcon } from '../../../../components/expense/ExpenseCategoryIcon';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';
import { colors } from '../../../../theme/colors';

export interface ExpenseCategoryProps {
  category: string;
}

export const ExpenseCategory: React.FC<ExpenseCategoryProps> = ({ category }) => {
  return (
    <View style={styles.container}>
      <ExpenseCategoryIcon category={category} size={28} />
      <Text style={styles.text}>{category.replace(/_/g, ' ')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  text: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
});
