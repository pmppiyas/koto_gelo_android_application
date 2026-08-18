import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

export const SettingsScreen: React.FC = () => {
  return (
    <Screen scrollable>
      <Header title="Settings" />
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>App Settings</Text>
          <Text style={styles.item}>App Version: 1.0.0</Text>
          <Text style={styles.item}>Sync Status: Enabled</Text>
        </Card>

        <Button title="Log Out" variant="danger" onPress={() => {}} style={styles.button} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  item: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  button: {
    marginTop: spacing.md,
  },
});
