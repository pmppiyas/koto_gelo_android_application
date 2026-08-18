import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Screen } from '../../../components/layout/Screen';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

export const NotificationsScreen: React.FC = () => {
  const notifications = [
    {
      id: '1',
      title: 'New Expense Added',
      body: 'Rahim added Dinner in Goa Trip',
      date: '5m ago',
    },
  ];

  return (
    <Screen>
      <Header title="Notifications" />
      <View style={styles.container}>
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Notifications"
              description="You are all caught up!"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  body: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
