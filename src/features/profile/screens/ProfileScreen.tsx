import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Avatar } from '../../../components/ui/Avatar';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

import { useAuth } from '../../auth/hooks/useAuth';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const displayName = user?.name || user?.username || 'User';
  const displayEmail = user?.email || (user?.username ? `@${user.username}` : 'No email');

  return (
    <Screen scrollable>
      <Header title="My Profile" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Avatar name={displayName} size={80} />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          <Text style={styles.settingItem}>Username: {user?.username || '-'}</Text>
          <Text style={styles.settingItem}>Email: {user?.email || '-'}</Text>
          <Text style={styles.settingItem}>Default Currency: BDT</Text>
        </Card>

        <Button
          title="Sign Out"
          variant="outline"
          onPress={() => logout()}
          style={styles.button}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  name: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    marginTop: spacing.sm,
    color: colors.text,
  },
  email: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semiBold,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  settingItem: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  button: {
    marginTop: spacing.sm,
  },
});
