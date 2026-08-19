import React, { useMemo } from 'react';
import { StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from '../components/ui/core';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { demoBalanceSummary, demoTransactions } from '../data/demoData';
import { useAuth, useExpenses } from '../store/hooks';
import { Transaction, BalanceSummary } from '../types/transaction';
import { getLocalDateString } from '../utils/date';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';

export interface DashboardScreenProps {
  onNavigateToTransactions?: () => void;
  onNavigateToPersonalExpenses?: () => void;
  onNavigateToTodayExpenses?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToGroups?: () => void;
  onNavigateToGroupExpenses?: () => void;
  onNavigateToAddExpense?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHome?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToTransactions,
  onNavigateToPersonalExpenses,
  onNavigateToTodayExpenses,
  onNavigateToAnalytics,
  onNavigateToGroups,
  onNavigateToGroupExpenses,
  onNavigateToAddExpense,
  onNavigateToProfile,
}) => {
  const { user } = useAuth();
  const { expenses, pendingExpenses, totalExpenseAmount, syncExpenses, isSyncing } = useExpenses();
  
  const displayName = user?.name || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; icon: keyof typeof Feather.glyphMap }> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      map[c.name] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.slug] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.id] = { name: c.name, emoji: c.emoji, icon: c.icon };
    });
    return map;
  }, []);

  const dynamicSummary: BalanceSummary = useMemo(() => {
    const totalExp = totalExpenseAmount > 0 ? totalExpenseAmount : demoBalanceSummary.totalExpense;
    return {
      totalBalance: Math.max(0, demoBalanceSummary.totalIncome - totalExp),
      totalIncome: demoBalanceSummary.totalIncome,
      totalExpense: totalExp,
      savings: Math.max(0, demoBalanceSummary.totalIncome - totalExp),
      youAreOwed: demoBalanceSummary.youAreOwed,
      youOwe: demoBalanceSummary.youOwe,
    };
  }, [totalExpenseAmount]);

  const unifiedRecentTransactions: Transaction[] = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return demoTransactions.slice(0, 5);
    }
    const realTransactions: Transaction[] = expenses.slice(0, 5).map((e) => {
      const catInfo = categoryMap[e.category] || { name: e.category, emoji: '📦', icon: 'credit-card' as const };
      return {
        id: e.id || e.localId || String(Math.random()),
        title: e.title || e.category,
        amount: e.amount,
        type: 'expense' as const,
        category: e.category,
        date: e.date ? e.date.slice(0, 10) : (e as any).expenseDate ? (e as any).expenseDate.slice(0, 10) : getLocalDateString(),
        icon: catInfo.icon,
      };
    });
    return realTransactions;
  }, [expenses, categoryMap]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView 
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between items-center py-1">
          <View className="flex-1 pr-2">
            <Text className="text-xs text-muted-foreground font-medium">Good morning,</Text>
            <Text className="text-xl font-extrabold text-foreground" numberOfLines={1}>{displayName}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center shadow-xs" activeOpacity={0.7}>
              <Feather name="bell" size={18} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-primary-light border border-indigo-200 items-center justify-center shadow-xs"
              onPress={onNavigateToProfile}
              activeOpacity={0.7}
            >
              <Feather name="user" size={18} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>

        {pendingExpenses.length > 0 && (
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-amber-50 p-3 rounded-2xl border border-amber-200"
            onPress={syncExpenses}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Feather name="cloud-off" size={16} color="#B45309" />
              <Text className="text-xs text-amber-900 font-semibold flex-1">
                {pendingExpenses.length} expense{pendingExpenses.length > 1 ? 's' : ''} waiting to sync
              </Text>
            </View>
            <View className="bg-amber-600 px-3 py-1 rounded-full">
              <Text className="text-xs text-white font-bold">{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
            </View>
          </TouchableOpacity>
        )}

        <BalanceCard balanceSummary={dynamicSummary} />
        <SummaryCard balanceSummary={dynamicSummary} />

        <View className="flex-row justify-between gap-2 bg-card p-3.5 rounded-2xl border border-border shadow-sm">
          <TouchableOpacity className="flex-1 items-center gap-1.5" onPress={onNavigateToAddExpense}>
            <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center shadow-md">
              <Feather name="plus" size={22} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">Add Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 items-center gap-1.5"
            onPress={onNavigateToPersonalExpenses}
          >
            <View className="w-12 h-12 rounded-2xl bg-emerald-600 items-center justify-center shadow-md">
              <Feather name="credit-card" size={20} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">My Expenses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 items-center gap-1.5"
            onPress={onNavigateToGroups || onNavigateToTransactions}
          >
            <View className="w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center shadow-md">
              <Feather name="users" size={20} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">Groups</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 items-center gap-1.5"
            onPress={onNavigateToAnalytics || onNavigateToTransactions}
          >
            <View className="w-12 h-12 rounded-2xl bg-slate-800 items-center justify-center shadow-md">
              <Feather name="pie-chart" size={20} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">Analytics</Text>
          </TouchableOpacity>
        </View>

        <RecentTransactions 
          transactions={unifiedRecentTransactions} 
          onSeeAll={onNavigateToPersonalExpenses || onNavigateToTransactions} 
        />
      </ScrollView>
    </SafeAreaView>
  );
};
