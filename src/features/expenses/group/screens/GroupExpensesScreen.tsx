import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { GroupExpenseCard } from '../components/GroupExpenseCard';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { Loader } from '../../../../components/ui/Loader';
import { useGroupExpenses } from '../hooks/useGroupExpenses';
import { spacing } from '../../../../theme/spacing';

export interface GroupExpensesScreenProps {
  groupId?: string;
}

export const GroupExpensesScreen: React.FC<GroupExpensesScreenProps> = ({
  groupId = 'default_group',
}) => {
  const { expenses, loading, refresh } = useGroupExpenses(groupId);

  return (
    <Screen>
      <Header title="Group Expenses" />
      <View style={styles.container}>
        {loading && !expenses.length ? (
          <Loader />
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <GroupExpenseCard expense={item} />}
            ListEmptyComponent={
              <EmptyState
                title="No Group Expenses"
                description="Expenses shared in this group will appear here"
              />
            }
            onRefresh={refresh}
            refreshing={loading}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});
