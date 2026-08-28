import React from 'react';
import {
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../../ui/core';
import { GroupExpenseCard } from '../GroupExpenseCard';
import { GroupExpense } from '../../../services/groupService';
import { BOTTOM_TAB_HEIGHT, spacing } from '../../../constants/spacing';

export interface ExpensesTabProps {
  expenses: GroupExpense[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  userId: string;
  onAddExpense: () => void;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  isLoading,
  isRefreshing = false,
  onRefresh,
  userId,
  onAddExpense,
}) => {
  if (isLoading && expenses.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-16">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={(item, index) => `${item.id || (item as any).localId || 'exp'}_${index}`}
      contentContainerClassName="px-4 pt-3"
      contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        ) : undefined
      }
      ItemSeparatorComponent={() => <View className="h-2.5" />}
      renderItem={({ item }) => {
        const isYou = item.user.id === userId;
        const count = item.participants?.length || 1;

        return (
          <GroupExpenseCard
            title={item.title || item.subcategory || item.category}
            amount={item.amount}
            category={item.category}
            paidByName={item.user.name || item.user.username}
            isYou={isYou}
            date={formatDate(item.expenseDate || item.createdAt)}
            participantCount={count}
          />
        );
      }}
      ListEmptyComponent={
        <View className="bg-card rounded-2xl p-6 items-center justify-center border border-dashed border-border mt-4">
          <Feather name="file-text" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
          <Text className="text-base font-bold text-foreground mb-1">No Group Expenses Yet</Text>
          <Text className="text-xs text-muted-foreground text-center leading-relaxed mb-4">
            Add meals, bills, or shared grocery costs to split with your group members.
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-1.5 bg-primary px-4 py-2.5 rounded-full shadow-sm"
            onPress={onAddExpense}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={15} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Add First Expense</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};
