import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

export const InvitationDetailsScreen: React.FC<{ invitationId?: string }> = () => {
  return (
    <Screen>
      <Header title="Invitation Details" />
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Trip to Cox's Bazar</Text>
          <Text style={styles.subtitle}>You have been invited by Rahim to join this group.</Text>
          <View style={styles.actions}>
            <Button title="Decline" variant="outline" onPress={() => {}} style={styles.button} />
            <Button title="Accept" onPress={() => {}} style={styles.button} />
          </View>
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
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
