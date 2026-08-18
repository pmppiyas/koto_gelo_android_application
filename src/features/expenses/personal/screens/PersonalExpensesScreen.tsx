import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { PersonalExpenseCard } from '../components/PersonalExpenseCard';
import { ExpenseFilter } from '../components/ExpenseFilter';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { Loader } from '../../../../components/ui/Loader';
import { usePersonalExpenses } from '../hooks/usePersonalExpenses';
import { spacing } from '../../../../theme/spacing';

export const PersonalExpensesScreen: React.FC = () => {
  const { expenses, loading, refresh } = usePersonalExpenses();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const filteredExpenses = selectedCategory
    ? expenses.filter(e => e.category === selectedCategory)
    : expenses;

  return (
    <Screen>
      <Header title="Personal Expenses" />
      <View style={styles.container}>
        <ExpenseFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        {loading && !expenses.length ? (
          <Loader />
        ) : (
          <FlatList
            data={filteredExpenses}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <PersonalExpenseCard expense={item} />}
            ListEmptyComponent={
              <EmptyState
                title="No Expenses"
                description="Start tracking by adding your first expense"
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
