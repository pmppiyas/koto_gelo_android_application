import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

export const GroupDetailsScreen: React.FC<{ groupId?: string }> = () => {
  return (
    <Screen scrollable>
      <Header title="Group Details" />
      <View style={styles.container}>
        <Card>
          <Text style={styles.name}>Goa Trip 2026</Text>
          <Text style={styles.description}>Annual summer vacation trip group</Text>
          <Text style={styles.meta}>Currency: BDT • 4 members</Text>
        </Card>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  name: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  description: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  meta: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
