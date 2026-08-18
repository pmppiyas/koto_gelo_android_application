import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { Card } from '../../../../components/ui/Card';
import { AmountDisplay } from '../../../../components/expense/AmountDisplay';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';
import { colors } from '../../../../theme/colors';

export const PersonalExpenseDetailsScreen: React.FC = () => {
  return (
    <Screen>
      <Header title="Expense Details" />
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Grocery Store</Text>
          <AmountDisplay amount={120} currency="BDT" size="xl" type="expense" />
          <Text style={styles.category}>Category: GROCERIES</Text>
          <Text style={styles.date}>Date: Aug 17, 2026</Text>
        </Card>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginBottom: spacing.xs,
  },
  category: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  date: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
});
