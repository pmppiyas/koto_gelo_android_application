import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { AmountDisplay } from '../../../components/expense/AmountDisplay';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

export const DashboardScreen: React.FC = () => {
  return (
    <Screen scrollable>
      <Header title="Dashboard" />
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.cardLabel}>This Month's Spending</Text>
          <AmountDisplay amount={0} currency="BDT" size="xl" />
        </Card>

        <View style={styles.row}>
          <Card style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardLabel}>You are owed</Text>
            <AmountDisplay amount={0} currency="BDT" type="income" size="md" />
          </Card>
          <Card style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardLabel}>You owe</Text>
            <AmountDisplay amount={0} currency="BDT" type="expense" size="md" />
          </Card>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfCard: {
    flex: 1,
  },
});
