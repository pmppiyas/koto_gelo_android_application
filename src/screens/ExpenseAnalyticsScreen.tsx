import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from '../components/ui/core';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { expenseService } from '../services/expenseService';
import { groupService, Group } from '../services/groupService';
import { useExpenses, useAuth } from '../store/hooks';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';

export interface ExpenseAnalyticsScreenProps {
  mode?: 'PERSONAL' | 'GROUP';
  initialGroupId?: string;
  onNavigateBack?: () => void;
  onNavigateToAddExpense?: () => void;
}

type PeriodType = 'WEEK' | 'MONTH' | 'YEAR';

interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  subcategory?: string | null;
  title?: string | null;
  expenseDate: string;
  type: 'PERSONAL' | 'GROUP';
  groupId?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  MESS: '🍲',
  FRIENDS: '👥',
  TOUR: '🎒',
  TRIP: '✈️',
  FAMILY: '👨‍👩‍👧',
  OFFICE: '💼',
  ROOMMATES: '🏠',
  STUDENTS: '🎓',
  OTHER: '📁',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const parseExpenseDate = (dateVal?: any): Date | null => {
  if (!dateVal) return null;
  if (typeof dateVal === 'string' && dateVal.includes('-')) {
    const parts = dateVal.slice(0, 10).split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
  }
  const parsed = new Date(dateVal);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export const ExpenseAnalyticsScreen: React.FC<ExpenseAnalyticsScreenProps> = ({
  mode = 'PERSONAL',
  initialGroupId,
  onNavigateBack,
  onNavigateToAddExpense,
}) => {
  const { expenses: localExpenses, syncExpenses } = useExpenses();
  const { isAuthenticated } = useAuth();

  const [periodType, setPeriodType] = useState<PeriodType>('MONTH');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId || 'ALL');
  const [serverPersonalExpenses, setServerPersonalExpenses] = useState<ExpenseRecord[]>([]);
  const [serverGroupExpenses, setServerGroupExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
    }
  }, [initialGroupId]);

  const fetchServerData = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (mode === 'PERSONAL') {
        const personalRes = await expenseService.getPersonalExpenses({ limit: 500 });
        const list =
          personalRes?.expenses ||
          personalRes?.data?.expenses ||
          (Array.isArray(personalRes?.data) ? personalRes.data : Array.isArray(personalRes) ? personalRes : []);
        setServerPersonalExpenses(
          Array.isArray(list)
            ? list.map((e) => ({
                id: e.id,
                amount: Number(e.amount) || 0,
                category: e.category || 'Other',
                subcategory: e.subcategory,
                title: e.title,
                expenseDate: e.expenseDate || e.createdAt || e.date || new Date().toISOString(),
                type: 'PERSONAL' as const,
              }))
            : []
        );
      } else {
        const groupsRes = await groupService.getGroups({ limit: 50 });
        const groupList: Group[] =
          groupsRes?.groups || groupsRes?.data?.groups || (Array.isArray(groupsRes) ? groupsRes : []);
        setGroups(groupList);

        const targetGroups =
          selectedGroupId && selectedGroupId !== 'ALL'
            ? groupList.filter((g) => g.id === selectedGroupId)
            : groupList;

        const groupPromises = targetGroups.map(async (grp) => {
          try {
            const historyRes = await groupService.getGroupExpenses(grp.id, { limit: 100 });
            const list =
              historyRes?.history ||
              historyRes?.data?.history ||
              historyRes?.expenses ||
              historyRes?.data?.expenses ||
              (Array.isArray(historyRes?.data) ? historyRes.data : Array.isArray(historyRes) ? historyRes : []);
            return (Array.isArray(list) ? list : []).map((e) => ({
              id: e.id,
              amount: Number(e.amount) || 0,
              category: e.category || 'Other',
              subcategory: e.subcategory,
              title: e.title,
              expenseDate: e.expenseDate || e.createdAt || e.date || new Date().toISOString(),
              type: 'GROUP' as const,
              groupId: grp.id,
            }));
          } catch {
            return [];
          }
        });

        const allGroupExp = await Promise.all(groupPromises);
        setServerGroupExpenses(allGroupExp.flat());
      }
    } catch {
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, mode, selectedGroupId]);

  useEffect(() => {
    fetchServerData();
  }, [fetchServerData]);

  const handleRefresh = async () => {
    if (mode === 'PERSONAL') {
      await syncExpenses();
    }
    await fetchServerData(true);
  };

  const allExpenses: ExpenseRecord[] = useMemo(() => {
    const map = new Map<string, ExpenseRecord>();

    (localExpenses || []).forEach((e) => {
      const isGroup = e.type === 'GROUP';
      if ((mode === 'PERSONAL' && isGroup) || (mode === 'GROUP' && !isGroup)) {
        return;
      }
      if (mode === 'GROUP' && selectedGroupId !== 'ALL' && e.groupId && e.groupId !== selectedGroupId) {
        return;
      }

      const key = e.serverId || e.localId || (e as any).id || String(Math.random());
      const rawDate = e.date || (e as any).expenseDate || e.createdAt || new Date().toISOString();
      map.set(key, {
        id: key,
        amount: Number(e.amount) || 0,
        category: e.category || 'Other',
        subcategory: e.subcategory,
        title: e.title,
        expenseDate: rawDate,
        type: (isGroup ? 'GROUP' : 'PERSONAL') as const,
        groupId: e.groupId,
      });
    });

    if (mode === 'PERSONAL') {
      (serverPersonalExpenses || []).forEach((e) => {
        if (e.id && !map.has(e.id)) {
          map.set(e.id, e);
        }
      });
    } else {
      (serverGroupExpenses || []).forEach((e) => {
        if (e.id && !map.has(e.id)) {
          if (selectedGroupId === 'ALL' || e.groupId === selectedGroupId) {
            map.set(e.id, e);
          }
        }
      });
    }

    return Array.from(map.values());
  }, [localExpenses, serverPersonalExpenses, serverGroupExpenses, mode, selectedGroupId]);

  const filteredExpenses = useMemo(() => {
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();

    return allExpenses.filter((e) => {
      const d = parseExpenseDate(e.expenseDate);
      if (!d) return false;

      if (periodType === 'MONTH') {
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      } else if (periodType === 'YEAR') {
        return d.getFullYear() === targetYear;
      } else if (periodType === 'WEEK') {
        const start = new Date(selectedDate);
        start.setDate(selectedDate.getDate() - selectedDate.getDay());
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return d >= start && d <= end;
      }
      return true;
    });
  }, [allExpenses, periodType, selectedDate]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { amount: number; count: number; emoji: string }> = {};
    let total = 0;

    for (const exp of filteredExpenses) {
      const cat = exp.category || 'Other';
      const amt = Number(exp.amount) || 0;
      total += amt;

      const found = EXPENSE_CATEGORIES.find((c) => c.name.toLowerCase() === cat.toLowerCase());
      const emoji = found ? found.emoji : '📦';

      if (!map[cat]) {
        map[cat] = { amount: 0, count: 0, emoji };
      }
      map[cat].amount += amt;
      map[cat].count += 1;
    }

    const list = Object.entries(map).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      emoji: data.emoji,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    }));

    list.sort((a, b) => b.amount - a.amount);
    return { list, total };
  }, [filteredExpenses]);

  const changePeriod = (dir: -1 | 1) => {
    const next = new Date(selectedDate);
    if (periodType === 'MONTH') {
      next.setMonth(next.getMonth() + dir);
    } else if (periodType === 'YEAR') {
      next.setFullYear(next.getFullYear() + dir);
    } else if (periodType === 'WEEK') {
      next.setDate(next.getDate() + dir * 7);
    }
    setSelectedDate(next);
  };

  const periodLabel = useMemo(() => {
    if (periodType === 'MONTH') {
      return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    } else if (periodType === 'YEAR') {
      return `${selectedDate.getFullYear()}`;
    } else {
      return `Week of ${selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }
  }, [periodType, selectedDate]);

  const currentGroupName = useMemo(() => {
    if (selectedGroupId === 'ALL') return 'All Groups';
    const grp = groups.find((g) => g.id === selectedGroupId);
    return grp ? grp.name : 'Group';
  }, [selectedGroupId, groups]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
        {onNavigateBack && (
          <TouchableOpacity
            onPress={onNavigateBack}
            className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-2"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color="#0F172A" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">
            {mode === 'GROUP' ? 'Group Analytics' : 'Personal Analytics'}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {mode === 'GROUP'
              ? `Spending breakdown for ${currentGroupName}`
              : 'Your personal spending breakdowns & trends'}
          </Text>
        </View>

        {onNavigateToAddExpense && (
          <TouchableOpacity
            className="flex-row items-center gap-1.5 bg-primary px-3.5 py-2 rounded-full shadow-sm"
            onPress={onNavigateToAddExpense}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* Period Selector (Weekly, Monthly, Yearly) */}
        <View className="flex-row bg-muted p-1 rounded-xl">
          {(['WEEK', 'MONTH', 'YEAR'] as PeriodType[]).map((p) => {
            const isActive = periodType === p;
            return (
              <TouchableOpacity
                key={p}
                className={`flex-1 py-2 items-center rounded-lg ${
                  isActive ? 'bg-primary-light border border-indigo-200 shadow-xs' : ''
                }`}
                onPress={() => setPeriodType(p)}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {p === 'WEEK' ? 'Weekly' : p === 'MONTH' ? 'Monthly' : 'Yearly'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date / Month Navigator */}
        <View className="flex-row items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-xs">
          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-muted items-center justify-center"
            onPress={() => changePeriod(-1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={18} color="#0F172A" />
          </TouchableOpacity>

          <Text className="text-sm font-extrabold text-foreground">{periodLabel}</Text>

          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-muted items-center justify-center"
            onPress={() => changePeriod(1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Total Spend Hero Card */}
        <View className="bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-800">
          <Text className="text-xs text-slate-400 font-medium mb-1">
            Total {mode === 'GROUP' ? 'Group ' : ''}Spend in {periodLabel}
          </Text>
          <Text className="text-3xl font-black text-white">
            ৳{categoryBreakdown.total.toLocaleString()}
          </Text>
          <Text className="text-xs text-slate-400 mt-1">
            Across {filteredExpenses.length} transaction{filteredExpenses.length === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Category Breakdown List */}
        <View className="gap-2.5">
          <Text className="text-sm font-bold text-foreground px-1">Category Breakdown</Text>

          {isLoading && filteredExpenses.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : categoryBreakdown.list.length > 0 ? (
            <View className="gap-2">
              {categoryBreakdown.list.map((item, idx) => (
                <View
                  key={idx}
                  className="bg-card p-3.5 rounded-2xl border border-border shadow-sm gap-2"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2.5">
                      <Text className="text-xl">{item.emoji}</Text>
                      <View>
                        <Text className="text-sm font-bold text-foreground">{item.category}</Text>
                        <Text className="text-xs text-muted-foreground">{item.count} items</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-extrabold text-foreground">
                        ৳{item.amount.toLocaleString()}
                      </Text>
                      <Text className="text-xs font-bold text-primary">
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-card rounded-2xl p-8 items-center justify-center border border-dashed border-border">
              <Feather name="pie-chart" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text className="text-base font-bold text-foreground mb-1">No Expense Records</Text>
              <Text className="text-xs text-muted-foreground text-center">
                No {mode === 'GROUP' ? 'group ' : 'personal '}spending logged for this period. Try changing date or period filter.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
