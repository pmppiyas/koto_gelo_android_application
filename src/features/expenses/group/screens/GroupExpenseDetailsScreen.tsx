import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { Card } from '../../../../components/ui/Card';
import { AmountDisplay } from '../../../../components/expense/AmountDisplay';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';
import { colors } from '../../../../theme/colors';

export const GroupExpenseDetailsScreen: React.FC = () => {
  return (
    <Screen>
      <Header title="Group Expense Details" />
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Team Lunch</Text>
          <AmountDisplay amount={1500} currency="BDT" size="xl" />
          <Text style={styles.subtitle}>Paid by You • Split Equally</Text>
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
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
