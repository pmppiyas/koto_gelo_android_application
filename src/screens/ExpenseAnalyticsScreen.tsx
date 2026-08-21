import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from '../components/ui/core';
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
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CHART_PALETTE = [
  { color: '#4F46E5', bgColor: '#EEF2FF', light: '#818CF8' }, // 1. Primary Indigo
  { color: '#059669', bgColor: '#ECFDF5', light: '#34D399' }, // 2. Emerald Green
  { color: '#0284C7', bgColor: '#F0F9FF', light: '#38BDF8' }, // 3. Sky Blue
  { color: '#E11D48', bgColor: '#FFF1F2', light: '#FB7185' }, // 4. Rose / Crimson
  { color: '#D97706', bgColor: '#FFFBEB', light: '#FBBF24' }, // 5. Amber Gold
  { color: '#7C3AED', bgColor: '#F5F3FF', light: '#A78BFA' }, // 6. Violet
  { color: '#0D9488', bgColor: '#F0FDFA', light: '#2DD4BF' }, // 7. Teal
  { color: '#DB2777', bgColor: '#FDF2F8', light: '#F472B6' }, // 8. Pink
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
  mode: initialMode = 'PERSONAL',
  initialGroupId,
  onNavigateBack,
  onNavigateToAddExpense,
}) => {
  const { expenses: localExpenses, syncExpenses } = useExpenses();
  const { isAuthenticated } = useAuth();

  const [activeMode, setActiveMode] = useState<'PERSONAL' | 'GROUP'>(initialMode);
  const [periodType, setPeriodType] = useState<PeriodType>('MONTH');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || 'ALL',
  );
  const [serverPersonalExpenses, setServerPersonalExpenses] = useState<
    ExpenseRecord[]
  >([]);
  const [serverGroupExpenses, setServerGroupExpenses] = useState<
    ExpenseRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive Chart States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBarMonthIndex, setSelectedBarMonthIndex] = useState<number | null>(
    null,
  );
  const [chartAnimProgress, setChartAnimProgress] = useState(0);

  useEffect(() => {
    if (initialGroupId) {
      setSelectedGroupId(initialGroupId);
    }
  }, [initialGroupId]);

  const triggerChartAnimation = useCallback(() => {
    setChartAnimProgress(0);
    let start: number | null = null;
    const duration = 850;

    let animFrame: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setChartAnimProgress(ease);
      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };
    animFrame = requestAnimationFrame(step);
  }, []);

  const fetchServerData = useCallback(
    async (isRefresh = false) => {
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
        if (activeMode === 'PERSONAL') {
          const personalRes = await expenseService.getPersonalExpenses({
            limit: 500,
          });
          const list =
            personalRes?.expenses ||
            personalRes?.data?.expenses ||
            (Array.isArray(personalRes?.data)
              ? personalRes.data
              : Array.isArray(personalRes)
              ? personalRes
              : []);
          setServerPersonalExpenses(
            Array.isArray(list)
              ? list.map(e => ({
                  id: e.id,
                  amount: Number(e.amount) || 0,
                  category: e.category || 'Other',
                  subcategory: e.subcategory,
                  title: e.title,
                  expenseDate:
                    e.expenseDate ||
                    e.createdAt ||
                    e.date ||
                    new Date().toISOString(),
                  type: 'PERSONAL' as const,
                }))
              : [],
          );
        } else {
          const groupsRes = await groupService.getGroups({ limit: 50 });
          const groupList: Group[] =
            groupsRes?.groups ||
            groupsRes?.data?.groups ||
            (Array.isArray(groupsRes) ? groupsRes : []);
          setGroups(groupList);

          const targetGroups =
            selectedGroupId && selectedGroupId !== 'ALL'
              ? groupList.filter(g => g.id === selectedGroupId)
              : groupList;

          const groupPromises = targetGroups.map(async grp => {
            try {
              const historyRes = await groupService.getGroupExpenses(grp.id, {
                limit: 100,
              });
              const list =
                historyRes?.history ||
                historyRes?.data?.history ||
                historyRes?.expenses ||
                historyRes?.data?.expenses ||
                (Array.isArray(historyRes?.data)
                  ? historyRes.data
                  : Array.isArray(historyRes)
                  ? historyRes
                  : []);
              return (Array.isArray(list) ? list : []).map(e => ({
                id: e.id,
                amount: Number(e.amount) || 0,
                category: e.category || 'Other',
                subcategory: e.subcategory,
                title: e.title,
                expenseDate:
                  e.expenseDate ||
                  e.createdAt ||
                  e.date ||
                  new Date().toISOString(),
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
    },
    [isAuthenticated, activeMode, selectedGroupId],
  );

  useEffect(() => {
    fetchServerData();
  }, [fetchServerData]);

  const handleRefresh = async () => {
    if (activeMode === 'PERSONAL') {
      await syncExpenses();
    }
    await fetchServerData(true);
  };

  const allExpenses: ExpenseRecord[] = useMemo(() => {
    const map = new Map<string, ExpenseRecord>();

    (localExpenses || []).forEach(e => {
      const isGroup = e.type === 'GROUP';
      if ((activeMode === 'PERSONAL' && isGroup) || (activeMode === 'GROUP' && !isGroup)) {
        return;
      }
      if (
        activeMode === 'GROUP' &&
        selectedGroupId !== 'ALL' &&
        e.groupId &&
        e.groupId !== selectedGroupId
      ) {
        return;
      }

      const key =
        e.serverId || e.localId || (e as any).id || String(Math.random());
      const rawDate =
        e.date ||
        (e as any).expenseDate ||
        e.createdAt ||
        new Date().toISOString();
      map.set(key, {
        id: key,
        amount: Number(e.amount) || 0,
        category: e.category || 'Other',
        subcategory: e.subcategory,
        title: e.title,
        expenseDate: rawDate,
        type: (isGroup ? 'GROUP' : 'PERSONAL') as 'GROUP' | 'PERSONAL',
        groupId: e.groupId ?? undefined,
      });
    });

    if (activeMode === 'PERSONAL') {
      (serverPersonalExpenses || []).forEach(e => {
        if (e.id && !map.has(e.id)) {
          map.set(e.id, e);
        }
      });
    } else {
      (serverGroupExpenses || []).forEach(e => {
        if (e.id && !map.has(e.id)) {
          if (selectedGroupId === 'ALL' || e.groupId === selectedGroupId) {
            map.set(e.id, e);
          }
        }
      });
    }

    return Array.from(map.values());
  }, [
    localExpenses,
    serverPersonalExpenses,
    serverGroupExpenses,
    activeMode,
    selectedGroupId,
  ]);

  const filteredExpenses = useMemo(() => {
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();

    return allExpenses.filter(e => {
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
    const map: Record<
      string,
      { amount: number; count: number; emoji: string }
    > = {};
    let total = 0;

    for (const exp of filteredExpenses) {
      const cat = exp.category || 'Other';
      const amt = Number(exp.amount) || 0;
      total += amt;

      const found = EXPENSE_CATEGORIES.find(
        c => c.name.toLowerCase() === cat.toLowerCase(),
      );
      const emoji = found ? found.emoji : '📦';

      if (!map[cat]) {
        map[cat] = { amount: 0, count: 0, emoji };
      }
      map[cat].amount += amt;
      map[cat].count += 1;
    }

    const rawList = Object.entries(map).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      emoji: data.emoji,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
    }));

    rawList.sort((a, b) => b.amount - a.amount);

    const list = rawList.map((item, index) => {
      const palette = CHART_PALETTE[index % CHART_PALETTE.length];
      return {
        ...item,
        color: palette.color,
        bgColor: palette.bgColor,
      };
    });

    return { list, total };
  }, [filteredExpenses]);

  // Monthly Spending Bar Chart Data (Jan - Dec)
  const monthlyBarData = useMemo(() => {
    const targetYear = selectedDate.getFullYear();
    const currentMonthIndex = new Date().getMonth();

    const months = [
      { name: 'Jan', fullName: 'January', month: 0, amount: 0, count: 0 },
      { name: 'Feb', fullName: 'February', month: 1, amount: 0, count: 0 },
      { name: 'Mar', fullName: 'March', month: 2, amount: 0, count: 0 },
      { name: 'Apr', fullName: 'April', month: 3, amount: 0, count: 0 },
      { name: 'May', fullName: 'May', month: 4, amount: 0, count: 0 },
      { name: 'Jun', fullName: 'June', month: 5, amount: 0, count: 0 },
      { name: 'Jul', fullName: 'July', month: 6, amount: 0, count: 0 },
      { name: 'Aug', fullName: 'August', month: 7, amount: 0, count: 0 },
      { name: 'Sep', fullName: 'September', month: 8, amount: 0, count: 0 },
      { name: 'Oct', fullName: 'October', month: 9, amount: 0, count: 0 },
      { name: 'Nov', fullName: 'November', month: 10, amount: 0, count: 0 },
      { name: 'Dec', fullName: 'December', month: 11, amount: 0, count: 0 },
    ];

    let yearTotal = 0;

    allExpenses.forEach(e => {
      const d = parseExpenseDate(e.expenseDate);
      if (!d) return;
      if (d.getFullYear() === targetYear) {
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          const amt = Number(e.amount) || 0;
          months[m].amount += amt;
          months[m].count += 1;
          yearTotal += amt;
        }
      }
    });

    const maxMonthAmount = Math.max(...months.map(m => m.amount), 1);
    const highestMonth = [...months].sort((a, b) => b.amount - a.amount)[0];
    const activeMonthsCount = months.filter(m => m.amount > 0).length || 1;
    const monthlyAverage = Math.round(yearTotal / activeMonthsCount);

    return {
      year: targetYear,
      months,
      yearTotal,
      maxMonthAmount,
      highestMonth,
      monthlyAverage,
      currentMonthIndex,
    };
  }, [allExpenses, selectedDate]);

  useEffect(() => {
    triggerChartAnimation();
  }, [
    periodType,
    selectedDate,
    selectedGroupId,
    activeMode,
    categoryBreakdown.total,
    triggerChartAnimation,
  ]);

  const activeCategoryInfo = useMemo(() => {
    if (!selectedCategory) return null;
    return (
      categoryBreakdown.list.find(c => c.category === selectedCategory) || null
    );
  }, [selectedCategory, categoryBreakdown.list]);

  const conicGradient = useMemo(() => {
    if (
      !categoryBreakdown.list ||
      categoryBreakdown.list.length === 0 ||
      categoryBreakdown.total === 0
    ) {
      return '#E2E8F0';
    }

    const currentTotalDeg = 360 * chartAnimProgress;

    if (categoryBreakdown.list.length === 1) {
      const single = categoryBreakdown.list[0];
      if (currentTotalDeg >= 360) {
        return `conic-gradient(${single.color} 0deg 360deg)`;
      }
      return `conic-gradient(${single.color} 0deg ${currentTotalDeg.toFixed(
        1,
      )}deg, #F1F5F9 ${currentTotalDeg.toFixed(1)}deg 360deg)`;
    }

    let currentDeg = 0;
    const slices = categoryBreakdown.list.map(item => {
      const deg =
        (item.amount / categoryBreakdown.total) * currentTotalDeg;
      const start = currentDeg;
      const end = currentDeg + deg;
      currentDeg = end;

      const isSelected =
        !selectedCategory || selectedCategory === item.category;
      const sliceColor = isSelected ? item.color : `${item.color}35`;

      return `${sliceColor} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
    });

    if (currentDeg < 360) {
      slices.push(`#F1F5F9 ${currentDeg.toFixed(1)}deg 360deg`);
    }

    return `conic-gradient(${slices.join(', ')})`;
  }, [categoryBreakdown, chartAnimProgress, selectedCategory]);

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
      return `${
        MONTH_NAMES[selectedDate.getMonth()]
      } ${selectedDate.getFullYear()}`;
    } else if (periodType === 'YEAR') {
      return `${selectedDate.getFullYear()}`;
    } else {
      return `Week of ${selectedDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })}`;
    }
  }, [periodType, selectedDate]);

  const currentGroupName = useMemo(() => {
    if (selectedGroupId === 'ALL') return 'All Groups';
    const grp = groups.find(g => g.id === selectedGroupId);
    return grp ? grp.name : 'Group';
  }, [selectedGroupId, groups]);

  const selectedMonthInfo = useMemo(() => {
    if (selectedBarMonthIndex === null) return null;
    return monthlyBarData.months[selectedBarMonthIndex] || null;
  }, [selectedBarMonthIndex, monthlyBarData.months]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border shadow-2xs">
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
            {activeMode === 'GROUP' ? 'Group Analytics' : 'Personal Analytics'}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {activeMode === 'GROUP'
              ? `Spending breakdown for ${currentGroupName}`
              : 'Your personal spending trends & category charts'}
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
        contentContainerStyle={{
          paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xl,
        }}
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
        {/* Mode Switcher: Personal vs Group */}
        <View className="flex-row bg-muted p-1 rounded-xl">
          <TouchableOpacity
            className={`flex-1 py-2 items-center rounded-lg ${
              activeMode === 'PERSONAL'
                ? 'bg-primary-light border border-indigo-200 shadow-xs'
                : ''
            }`}
            onPress={() => setActiveMode('PERSONAL')}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-bold ${
                activeMode === 'PERSONAL' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Personal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-2 items-center rounded-lg ${
              activeMode === 'GROUP'
                ? 'bg-primary-light border border-indigo-200 shadow-xs'
                : ''
            }`}
            onPress={() => setActiveMode('GROUP')}
            activeOpacity={0.7}
          >
            <Text
              className={`text-xs font-bold ${
                activeMode === 'GROUP' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Groups
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Selector Pills (if Group Mode) */}
        {activeMode === 'GROUP' && groups.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5 py-0.5"
          >
            <TouchableOpacity
              className={`px-3.5 py-1.5 rounded-full border ${
                selectedGroupId === 'ALL'
                  ? 'bg-primary-light border-indigo-300'
                  : 'bg-card border-border'
              }`}
              onPress={() => setSelectedGroupId('ALL')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedGroupId === 'ALL' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                All Groups
              </Text>
            </TouchableOpacity>

            {groups.map(grp => {
              const isSelected = selectedGroupId === grp.id;
              const emoji = TYPE_EMOJI[grp.type] || '👥';
              return (
                <TouchableOpacity
                  key={grp.id}
                  className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
                    isSelected
                      ? 'bg-primary-light border-indigo-300'
                      : 'bg-card border-border'
                  }`}
                  onPress={() => setSelectedGroupId(grp.id)}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs">{emoji}</Text>
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    numberOfLines={1}
                  >
                    {grp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Total Spend Hero Summary Card */}
        <View className="bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-800 gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Total {activeMode === 'GROUP' ? 'Group ' : ''}Spend
              </Text>
            </View>
            <View className="bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
              <Text className="text-[10px] font-bold text-indigo-300">
                {periodLabel}
              </Text>
            </View>
          </View>

          <Text className="text-3xl font-black text-white mt-1">
            ৳{categoryBreakdown.total.toLocaleString()}
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-slate-800">
            <Text className="text-[11px] text-slate-400">
              Across {filteredExpenses.length} transaction
              {filteredExpenses.length === 1 ? '' : 's'}
            </Text>
            {categoryBreakdown.list.length > 0 && (
              <Text className="text-[11px] font-semibold text-emerald-400">
                Top: {categoryBreakdown.list[0].emoji} {categoryBreakdown.list[0].category}
              </Text>
            )}
          </View>
        </View>

        {/* Period Selector (Weekly, Monthly, Yearly) */}
        <View className="flex-row bg-muted p-1 rounded-xl">
          {(['WEEK', 'MONTH', 'YEAR'] as PeriodType[]).map(p => {
            const isActive = periodType === p;
            return (
              <TouchableOpacity
                key={p}
                className={`flex-1 py-2 items-center rounded-lg ${
                  isActive
                    ? 'bg-primary-light border border-indigo-200 shadow-xs'
                    : ''
                }`}
                onPress={() => setPeriodType(p)}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {p === 'WEEK'
                    ? 'Weekly'
                    : p === 'MONTH'
                    ? 'Monthly'
                    : 'Yearly'}
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

          <Text className="text-sm font-extrabold text-foreground">
            {periodLabel}
          </Text>

          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-muted items-center justify-center"
            onPress={() => changePeriod(1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 1. MONTHLY SPENDING BAR CHART (কোন মাসে কত খরচ হয়েছে)                      */}
        {/* ========================================================================= */}
        <View className="bg-card rounded-2xl border border-border p-5 shadow-sm gap-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center">
                <Feather name="bar-chart-2" size={17} color="#4F46E5" />
              </View>
              <View>
                <Text className="text-base font-bold text-foreground">
                  Monthly Spending Overview
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Year {monthlyBarData.year} month-by-month analysis
                </Text>
              </View>
            </View>
            <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
              <Text className="text-[10px] font-bold text-primary">
                {monthlyBarData.year}
              </Text>
            </View>
          </View>

          {/* Selected Month Spotlight Banner */}
          {selectedMonthInfo ? (
            <View className="bg-primary-light/60 border border-indigo-200 p-3 rounded-xl flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-bold text-primary">
                  📅 {selectedMonthInfo.fullName} {monthlyBarData.year}
                </Text>
                <Text className="text-[11px] text-muted-foreground">
                  {selectedMonthInfo.count} transaction{selectedMonthInfo.count === 1 ? '' : 's'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-extrabold text-foreground">
                  ৳{selectedMonthInfo.amount.toLocaleString()}
                </Text>
                <Text className="text-[10px] font-semibold text-primary">
                  {monthlyBarData.yearTotal > 0
                    ? Math.round(
                        (selectedMonthInfo.amount / monthlyBarData.yearTotal) * 100,
                      )
                    : 0}
                  % of year
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-muted/40 p-2.5 rounded-xl flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">
                💡 Tap on any month bar to see that month's details
              </Text>
              <Text className="text-xs font-bold text-primary">
                Avg: ৳{monthlyBarData.monthlyAverage.toLocaleString()}/mo
              </Text>
            </View>
          )}

          {/* 12-Month Vertical Bars Graphic */}
          <View className="pt-4 pb-2 border-b border-border">
            <View className="flex-row items-end justify-between h-36 px-1 gap-1">
              {monthlyBarData.months.map((m, idx) => {
                const isSelected = selectedBarMonthIndex === idx;
                const isCurrentCalendarMonth =
                  monthlyBarData.year === new Date().getFullYear() &&
                  idx === monthlyBarData.currentMonthIndex;

                const heightPercent =
                  monthlyBarData.maxMonthAmount > 0
                    ? Math.min(
                        100,
                        Math.max(
                          6,
                          Math.round(
                            (m.amount / monthlyBarData.maxMonthAmount) * 100 * chartAnimProgress,
                          ),
                        ),
                      )
                    : 6;

                const hasSpend = m.amount > 0;

                return (
                  <TouchableOpacity
                    key={m.name}
                    activeOpacity={0.7}
                    onPress={() =>
                      setSelectedBarMonthIndex(isSelected ? null : idx)
                    }
                    className="flex-1 items-center h-full justify-end group"
                  >
                    {/* Amount Label on top if active or selected */}
                    {hasSpend && (isSelected || m.amount === monthlyBarData.maxMonthAmount) && (
                      <View className="mb-1 bg-slate-900 px-1 py-0.5 rounded shadow-2xs">
                        <Text className="text-[8px] font-bold text-white">
                          ৳{m.amount >= 1000 ? `${Math.round(m.amount / 1000)}k` : m.amount}
                        </Text>
                      </View>
                    )}

                    {/* Bar Pillar */}
                    <View className="w-full max-w-[22px] h-28 bg-slate-100/90 rounded-t-lg overflow-hidden justify-end border border-slate-200/50">
                      <View
                        style={{
                          height: `${heightPercent}%`,
                        }}
                        className={`w-full rounded-t-lg transition-all ${
                          isSelected
                            ? 'bg-primary shadow-xs'
                            : isCurrentCalendarMonth
                            ? 'bg-indigo-600'
                            : hasSpend
                            ? 'bg-indigo-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    </View>

                    {/* Month Label */}
                    <Text
                      className={`text-[10px] mt-1.5 ${
                        isSelected || isCurrentCalendarMonth
                          ? 'font-bold text-primary'
                          : hasSpend
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3 Key Stats Row */}
          <View className="flex-row justify-between items-center pt-1">
            <View className="flex-1 items-start">
              <Text className="text-[10px] text-muted-foreground font-medium mb-0.5">
                🌟 Highest Month
              </Text>
              <Text className="text-xs font-bold text-foreground">
                {monthlyBarData.highestMonth.name} (৳
                {monthlyBarData.highestMonth.amount.toLocaleString()})
              </Text>
            </View>

            <View className="w-[1px] h-6 bg-border mx-2" />

            <View className="flex-1 items-center">
              <Text className="text-[10px] text-muted-foreground font-medium mb-0.5">
                📊 Monthly Avg
              </Text>
              <Text className="text-xs font-bold text-primary">
                ৳{monthlyBarData.monthlyAverage.toLocaleString()}
              </Text>
            </View>

            <View className="w-[1px] h-6 bg-border mx-2" />

            <View className="flex-1 items-end">
              <Text className="text-[10px] text-muted-foreground font-medium mb-0.5">
                💰 Annual Spend
              </Text>
              <Text className="text-xs font-bold text-emerald-600">
                ৳{monthlyBarData.yearTotal.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. CATEGORY SPENDING PIE / DONUT CHART (ক্যাটাগরি ভিত্তিক ডোনাট চার্ট)      */}
        {/* ========================================================================= */}
        {categoryBreakdown.list.length > 0 ? (
          <View className="bg-card rounded-2xl border border-border p-5 shadow-sm gap-4">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center">
                  <Feather name="pie-chart" size={17} color="#4F46E5" />
                </View>
                <View>
                  <Text className="text-base font-bold text-foreground">
                    Category Spending Breakdown
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Expense distribution in {periodLabel}
                  </Text>
                </View>
              </View>
              <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
                <Text className="text-[10px] font-bold text-primary">
                  {categoryBreakdown.list.length}{' '}
                  {categoryBreakdown.list.length === 1
                    ? 'Category'
                    : 'Categories'}
                </Text>
              </View>
            </View>

            {/* Thick & Rich Donut / Pie Chart Centerpiece */}
            <View className="items-center justify-center py-3">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedCategory(null)}
                style={
                  {
                    width: 210,
                    height: 210,
                    borderRadius: 105,
                    background: conicGradient as any,
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.12)',
                  } as any
                }
                className="items-center justify-center shadow-lg"
              >
                <View
                  style={{
                    width: 124,
                    height: 124,
                    borderRadius: 62,
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
                  }}
                  className="bg-white items-center justify-center p-2 border border-slate-100"
                >
                  {activeCategoryInfo ? (
                    <>
                      <Text className="text-base mb-0.5">
                        {activeCategoryInfo.emoji}
                      </Text>
                      <Text
                        className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center"
                        numberOfLines={1}
                      >
                        {activeCategoryInfo.category}
                      </Text>
                      <Text
                        className="text-base font-bold text-slate-800 text-center my-0.5"
                        numberOfLines={1}
                      >
                        ৳
                        {Math.round(
                          activeCategoryInfo.amount * chartAnimProgress,
                        ).toLocaleString()}
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded-full mt-0.5"
                        style={{
                          backgroundColor: `${activeCategoryInfo.color}15`,
                        }}
                      >
                        <Text
                          className="text-[9px] font-medium"
                          style={{ color: activeCategoryInfo.color }}
                        >
                          {Math.round(
                            activeCategoryInfo.percentage * chartAnimProgress,
                          )}
                          % of total
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text className="text-[9px] font-medium text-slate-400 uppercase tracking-wider text-center">
                        Total Spent
                      </Text>
                      <Text
                        className="text-base font-bold text-slate-800 text-center my-0.5"
                        numberOfLines={1}
                      >
                        ৳
                        {Math.round(
                          categoryBreakdown.total * chartAnimProgress,
                        ).toLocaleString()}
                      </Text>
                      <View className="bg-indigo-50 border border-indigo-100/70 px-2 py-0.5 rounded-full mt-0.5">
                        <Text className="text-[9px] font-medium text-primary text-center">
                          {periodLabel}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Category Legends List with Progress Bars & Selection */}
            <View className="gap-2 pt-3 border-t border-border">
              {categoryBreakdown.list.map(cat => {
                const isSelected = selectedCategory === cat.category;
                const animatedAmount = Math.round(
                  cat.amount * chartAnimProgress,
                );
                const animatedPercentage = Math.round(
                  cat.percentage * chartAnimProgress,
                );
                const animatedProgressWidth = Math.max(
                  4,
                  cat.percentage * chartAnimProgress,
                );

                return (
                  <TouchableOpacity
                    key={cat.category}
                    activeOpacity={0.7}
                    onPress={() =>
                      setSelectedCategory(
                        isSelected ? null : cat.category,
                      )
                    }
                    className={`p-2.5 rounded-xl border transition-all gap-2 ${
                      isSelected
                        ? 'bg-primary-light/40 border-primary shadow-xs'
                        : 'bg-muted/30 border-border/50'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <View
                          className="w-8 h-8 rounded-lg items-center justify-center shadow-2xs"
                          style={{ backgroundColor: cat.bgColor }}
                        >
                          <Text className="text-sm">{cat.emoji}</Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-xs ${
                              isSelected
                                ? 'font-bold text-primary'
                                : 'font-semibold text-foreground'
                            }`}
                            numberOfLines={1}
                          >
                            {cat.category}
                          </Text>
                          <Text className="text-[10px] font-normal text-muted-foreground">
                            {cat.count}{' '}
                            {cat.count === 1 ? 'transaction' : 'transactions'}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-xs font-semibold text-foreground">
                          ৳{animatedAmount.toLocaleString()}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-full mt-0.5"
                          style={{ backgroundColor: `${cat.color}15` }}
                        >
                          <Text
                            className="text-[10px] font-medium"
                            style={{ color: cat.color }}
                          >
                            {animatedPercentage}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Micro Progress Bar */}
                    <View className="h-1 w-full bg-slate-200/60 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${animatedProgressWidth}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="bg-card rounded-2xl p-8 items-center justify-center border border-dashed border-border">
            <Feather
              name="pie-chart"
              size={32}
              color="#94A3B8"
              style={{ marginBottom: 8 }}
            />
            <Text className="text-base font-bold text-foreground mb-1">
              No Expense Records
            </Text>
            <Text className="text-xs text-muted-foreground text-center">
              No {activeMode === 'GROUP' ? 'group ' : 'personal '}spending logged
              for this period. Try changing date or period filter.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

