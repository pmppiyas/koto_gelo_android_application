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
import { HeroStatCard } from '../components/common/HeroStatCard';
import { DonutChart } from '../components/common/DonutChart';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { expenseService } from '../services/expenseService';
import { groupService, Group } from '../services/groupService';
import { localGroupService } from '../services/localGroupService';
import { useExpenses, useAuth } from '../store/hooks';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';

export interface ExpenseAnalyticsScreenProps {
  mode?: 'PERSONAL' | 'GROUP';
  initialGroupId?: string;
  onNavigateBack?: () => void;
  onNavigateToAddExpense?: () => void;
}

type PeriodType = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';

interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  subcategory?: string | null;
  title?: string | null;
  expenseDate: string;
  type: 'PERSONAL' | 'GROUP';
  groupId?: string;
  paidById?: string;
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

const TIME_FILTERS: { id: PeriodType; label: string }[] = [
  { id: 'MONTH', label: 'This Month' },
  { id: 'TODAY', label: 'Today' },
  { id: 'WEEK', label: 'This Week' },
  { id: 'YEAR', label: 'This Year' },
  { id: 'ALL', label: 'All Time' },
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
  if (typeof dateVal === 'string') {
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
  const {
    expenses: localExpenses,
    personalExpenses,
    syncExpenses,
    refreshExpenses,
  } = useExpenses();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || '';

  const [activeMode, setActiveMode] = useState<'PERSONAL' | 'GROUP'>(
    mode || 'PERSONAL'
  );
  const [periodType, setPeriodType] = useState<PeriodType>('MONTH');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    initialGroupId || 'ALL'
  );
  const [serverGroupExpenses, setServerGroupExpenses] = useState<
    ExpenseRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive Chart States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBarMonthIndex, setSelectedBarMonthIndex] = useState<
    number | null
  >(null);
  const [chartAnimProgress, setChartAnimProgress] = useState(0);

  const triggerChartAnimation = useCallback(() => {
    setChartAnimProgress(0);
    let start: number | null = null;
    const duration = 850;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setChartAnimProgress(ease);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    triggerChartAnimation();
    setSelectedCategory(null);
    setSelectedBarMonthIndex(null);
  }, [periodType, activeMode, selectedGroupId, selectedDate, triggerChartAnimation]);

  // Instant 0ms offline load for groups & group expenses
  useEffect(() => {
    let isMounted = true;
    const loadOfflineGroupCache = async () => {
      try {
        const [cachedGroups, cachedExpenses] = await Promise.all([
          localGroupService.getStoredGroups(),
          localGroupService.getStoredGroupExpenses(),
        ]);
        if (isMounted) {
          if (cachedGroups && cachedGroups.length > 0) setGroups(cachedGroups);
          if (cachedExpenses && cachedExpenses.length > 0) {
            setServerGroupExpenses(
              cachedExpenses.map((e: any) => ({
                id: e.id || e.localId,
                amount: Number(e.amount) || 0,
                category: e.category || 'Other',
                subcategory: e.subcategory,
                title: e.title,
                expenseDate: e.expenseDate || e.date || e.createdAt,
                type: 'GROUP' as const,
                groupId: e.groupId,
                paidById: e.paidById || e.payerId || e.userId,
              }))
            );
          }
        }
      } catch {}
    };
    loadOfflineGroupCache();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchServerData = useCallback(
    async (isBackground = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }
      if (!isBackground) setIsLoading(true);
      try {
        if (activeMode === 'PERSONAL') {
          await refreshExpenses();
        } else {
          const groupsRes = await groupService.getGroups({ limit: 50 });
          const groupList: Group[] =
            groupsRes?.groups ||
            groupsRes?.data?.groups ||
            groupsRes?.data ||
            (Array.isArray(groupsRes) ? groupsRes : []);
          setGroups(groupList);
          if (groupList.length > 0) {
            localGroupService.setStoredGroups(groupList).catch(() => {});
          }

          const groupPromises = groupList.map(async grp => {
            try {
              const historyRes = await groupService.getGroupExpenses(grp.id, {
                limit: 200,
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
                expenseDate: e.expenseDate || e.date || e.createdAt,
                type: 'GROUP' as const,
                groupId: e.groupId || grp.id,
                paidById: e.paidById || e.payerId || e.userId,
              }));
            } catch {
              return [];
            }
          });

          const allGroupExp = await Promise.all(groupPromises);
          const flatGroupExp = allGroupExp.flat();
          setServerGroupExpenses(flatGroupExp);
          if (flatGroupExp.length > 0) {
            localGroupService.setStoredGroupExpenses(flatGroupExp as any).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Analytics fetch error:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, activeMode, refreshExpenses]
  );

  useEffect(() => {
    fetchServerData();
  }, [fetchServerData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncExpenses();
    await fetchServerData(true);
  };

  const allExpenses: ExpenseRecord[] = useMemo(() => {
    if (activeMode === 'PERSONAL') {
      const seenKeys = new Set<string>();
      const result: ExpenseRecord[] = [];

      personalExpenses.forEach((e, idx) => {
        const primaryKey = e.serverId || e.localId || `p_${idx}`;
        const rawDate = e.date || e.createdAt;
        const normalizedDate = rawDate ? String(rawDate).slice(0, 10) : '';
        const sig = `${Number(e.amount)}_${(e.category || '').toLowerCase()}_${normalizedDate}_${(e.title || '').trim().toLowerCase()}`;

        if (
          !seenKeys.has(primaryKey) &&
          !seenKeys.has(e.localId) &&
          (!e.serverId || !seenKeys.has(e.serverId)) &&
          !seenKeys.has(sig)
        ) {
          seenKeys.add(primaryKey);
          seenKeys.add(e.localId);
          if (e.serverId) seenKeys.add(e.serverId);
          seenKeys.add(sig);

          result.push({
            id: primaryKey,
            amount: Number(e.amount) || 0,
            category: e.category || 'Other',
            subcategory: e.subcategory,
            title: e.title,
            expenseDate: rawDate,
            type: 'PERSONAL',
          });
        }
      });

      return result;
    }

    // GROUP MODE
    const map = new Map<string, ExpenseRecord>();
    const seenGroupSigs = new Set<string>();

    localExpenses
      .filter(e => e.type === 'GROUP')
      .forEach((e, idx) => {
        if (selectedGroupId !== 'ALL' && e.groupId !== selectedGroupId) return;
        const primaryKey = e.serverId || e.localId || `g_${idx}`;
        const rawDate = e.date || e.createdAt;
        const normalizedDate = rawDate ? String(rawDate).slice(0, 10) : '';
        const sig = `${Number(e.amount)}_${(e.category || '').toLowerCase()}_${normalizedDate}_${(e.title || '').trim().toLowerCase()}_${e.groupId || ''}`;

        seenGroupSigs.add(sig);
        seenGroupSigs.add(primaryKey);
        if (e.serverId) seenGroupSigs.add(e.serverId);
        if (e.localId) seenGroupSigs.add(e.localId);

        map.set(primaryKey, {
          id: primaryKey,
          amount: Number(e.amount) || 0,
          category: e.category || 'Other',
          subcategory: e.subcategory,
          title: e.title,
          expenseDate: rawDate,
          type: 'GROUP',
          groupId: e.groupId || undefined,
        });
      });

    serverGroupExpenses.forEach((e, idx) => {
      if (selectedGroupId !== 'ALL' && e.groupId !== selectedGroupId) return;
      const primaryKey = e.id || `srv_g_${idx}`;
      const rawDate = e.expenseDate;
      const normalizedDate = rawDate ? String(rawDate).slice(0, 10) : '';
      const sig = `${Number(e.amount)}_${(e.category || '').toLowerCase()}_${normalizedDate}_${(e.title || '').trim().toLowerCase()}_${e.groupId || ''}`;

      if (
        !seenGroupSigs.has(primaryKey) &&
        !seenGroupSigs.has(e.id) &&
        !seenGroupSigs.has(sig) &&
        !map.has(primaryKey)
      ) {
        seenGroupSigs.add(primaryKey);
        seenGroupSigs.add(e.id);
        seenGroupSigs.add(sig);

        map.set(primaryKey, {
          id: e.id,
          amount: Number(e.amount) || 0,
          category: e.category || 'Other',
          subcategory: e.subcategory,
          title: e.title,
          expenseDate: rawDate,
          type: 'GROUP',
          groupId: e.groupId,
          paidById: e.paidById,
        });
      }
    });

    return Array.from(map.values());
  }, [
    personalExpenses,
    localExpenses,
    serverGroupExpenses,
    activeMode,
    selectedGroupId,
  ]);

  const filteredExpenses = useMemo(() => {
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return allExpenses.filter(e => {
      const d = parseExpenseDate(e.expenseDate);
      if (!d) return false;

      if (periodType === 'TODAY') {
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(d.getDate()).padStart(2, '0')}`;
        return dStr === todayStr;
      }
      if (periodType === 'MONTH') {
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      }
      if (periodType === 'YEAR') {
        return d.getFullYear() === targetYear;
      }
      if (periodType === 'WEEK') {
        const start = new Date(selectedDate);
        start.setDate(selectedDate.getDate() - selectedDate.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      return true; // ALL
    });
  }, [allExpenses, periodType, selectedDate]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<
      string,
      { amount: number; count: number; emoji: string; category: string }
    > = {};

    let total = 0;
    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      const amt = Number(exp.amount) || 0;
      total += amt;

      const found = EXPENSE_CATEGORIES.find(
        c => c.name.toLowerCase() === cat.toLowerCase()
      );
      const emoji = found ? found.emoji : '📦';

      if (!map[cat]) {
        map[cat] = { amount: 0, count: 0, emoji, category: cat };
      }
      map[cat].amount += amt;
      map[cat].count += 1;
    });

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
        lightColor: palette.light,
      };
    });

    return { list, total };
  }, [filteredExpenses]);

  const heroStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      '0'
    )}-${String(now.getDate()).padStart(2, '0')}`;

    let todayTotal = 0;
    let thisMonthTotal = 0;

    allExpenses.forEach(e => {
      const d = parseExpenseDate(e.expenseDate);
      if (!d) return;
      const amt = Number(e.amount) || 0;

      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')}`;
      if (dStr === todayStr) {
        todayTotal += amt;
      }
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        thisMonthTotal += amt;
      }
    });

    const itemsCount = filteredExpenses.length;
    const averagePerItem =
      itemsCount > 0 ? Math.round(categoryBreakdown.total / itemsCount) : 0;

    return {
      todayTotal,
      thisMonthTotal,
      averagePerItem,
      itemsCount,
    };
  }, [allExpenses, filteredExpenses, categoryBreakdown.total, userId]);

  const monthlyBarData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const now = new Date();
    const currentMonthIndex =
      year === now.getFullYear() ? now.getMonth() : -1;

    const monthTotals = new Array(12).fill(0);
    const monthCounts = new Array(12).fill(0);

    allExpenses.forEach(e => {
      const d = parseExpenseDate(e.expenseDate);
      if (!d) return;
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        const amt = Number(e.amount) || 0;
        if (m >= 0 && m < 12) {
          monthTotals[m] += amt;
          monthCounts[m] += 1;
        }
      }
    });

    let maxMonthAmount = 0;
    let yearTotal = 0;
    let activeMonthsCount = 0;

    const months = MONTH_NAMES.map((name, idx) => {
      const amt = monthTotals[idx];
      const count = monthCounts[idx];
      if (amt > maxMonthAmount) maxMonthAmount = amt;
      if (amt > 0) {
        yearTotal += amt;
        activeMonthsCount += 1;
      }
      return {
        index: idx,
        name: name.slice(0, 3),
        fullName: name,
        amount: amt,
        count,
      };
    });

    const highestMonth = [...months].sort((a, b) => b.amount - a.amount)[0];
    if (activeMonthsCount === 0) activeMonthsCount = 1;
    const monthlyAverage = Math.round(yearTotal / activeMonthsCount);

    return {
      year,
      months,
      maxMonthAmount: maxMonthAmount || 1,
      yearTotal,
      currentMonthIndex,
      highestMonth,
      monthlyAverage,
      activeMonthsCount,
    };
  }, [allExpenses, selectedDate]);

  const changeMonth = (delta: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const periodLabel = useMemo(() => {
    if (periodType === 'TODAY') return 'Today';
    if (periodType === 'MONTH') {
      return `${
        MONTH_NAMES[selectedDate.getMonth()]
      } ${selectedDate.getFullYear()}`;
    }
    if (periodType === 'YEAR') return `${selectedDate.getFullYear()}`;
    if (periodType === 'WEEK') {
      return `Week of ${selectedDate.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric',
      })}`;
    }
    return 'All Time';
  }, [periodType, selectedDate]);

  const currentGroupName = useMemo(() => {
    if (selectedGroupId === 'ALL') return 'All Groups';
    const grp = groups.find(g => g.id === selectedGroupId);
    return grp ? grp.name : 'Group';
  }, [selectedGroupId, groups]);

  const selectedMonthInfo = useMemo(() => {
    const monthIdx =
      selectedBarMonthIndex !== null
        ? selectedBarMonthIndex
        : periodType === 'MONTH'
        ? selectedDate.getMonth()
        : null;
    if (monthIdx === null) return null;
    return monthlyBarData.months[monthIdx] || null;
  }, [selectedBarMonthIndex, periodType, selectedDate, monthlyBarData.months]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Sticky Top Header Bar (Fixed outside ScrollView) */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border shadow-2xs">
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
            Analytics & Insights
          </Text>
          <Text className="text-xs text-muted-foreground">
            {activeMode === 'GROUP'
              ? `Spending breakdown for ${currentGroupName}`
              : 'Personal expense trends & category breakdown'}
          </Text>
        </View>
        {onNavigateToAddExpense && (
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-primary-light border border-indigo-200 items-center justify-center"
            onPress={onNavigateToAddExpense}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={18} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 py-1.5 gap-2.5"
        contentContainerStyle={{
          paddingBottom: 2,
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
        {/* 1. HERO STATS CARD */}
        <HeroStatCard
          title={
            activeMode === 'GROUP'
              ? `${currentGroupName} Spend`
              : periodType === 'ALL'
              ? 'Total Spend'
              : `Total Spend (${periodLabel})`
          }
          badge={
            periodType === 'ALL'
              ? 'All Time'
              : periodType === 'TODAY'
              ? 'Today'
              : periodType === 'WEEK'
              ? 'This Week'
              : periodType === 'YEAR'
              ? 'This Year'
              : 'This Month'
          }
          dotColor={activeMode === 'GROUP' ? 'bg-indigo-400' : 'bg-emerald-400'}
          mainAmount={categoryBreakdown.total}
          subtitle={
            activeMode === 'PERSONAL'
              ? `Total ${filteredExpenses.length} transactions in ${periodLabel}`
              : `Total group expenses across ${
                  selectedGroupId === 'ALL'
                    ? `${groups.length} groups`
                    : currentGroupName
                }`
          }
          metrics={
            activeMode === 'PERSONAL'
              ? [
                  {
                    label: '📅 Today',
                    value: `৳${heroStats.todayTotal.toLocaleString('en-US')}`,
                    valueColor: 'text-emerald-400',
                  },
                  {
                    label: '🗓️ This Month',
                    value: `৳${heroStats.thisMonthTotal.toLocaleString('en-US')}`,
                    valueColor: 'text-indigo-300',
                  },
                  {
                    label: '📊 Avg/Item',
                    value: `৳${heroStats.averagePerItem.toLocaleString('en-US')}`,
                    valueColor: 'text-sky-400',
                  },
                ]
              : [
                  {
                    label: '👥 Groups',
                    value: `${groups.length} active`,
                    valueColor: 'text-emerald-400',
                  },
                  {
                    label: '📋 Items',
                    value: `${heroStats.itemsCount} total`,
                    valueColor: 'text-indigo-300',
                  },
                  {
                    label: '📊 Avg/Item',
                    value: `৳${heroStats.averagePerItem.toLocaleString('en-US')}`,
                    valueColor: 'text-sky-400',
                  },
                ]
          }
        />

        {/* 2. MODE & TIME FILTERS */}
        <View className="gap-3">
          {/* Mode Switcher */}
          <View className="flex-row bg-muted p-1 rounded-xl">
            <TouchableOpacity
              className={`flex-1 py-2 items-center rounded-lg ${
                activeMode === 'PERSONAL'
                  ? 'bg-primary-light border border-indigo-200 shadow-xs'
                  : ''
              }`}
              onPress={() => {
                setActiveMode('PERSONAL');
                setSelectedCategory(null);
                setSelectedBarMonthIndex(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  activeMode === 'PERSONAL'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Personal Analytics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 items-center rounded-lg ${
                activeMode === 'GROUP'
                  ? 'bg-primary-light border border-indigo-200 shadow-xs'
                  : ''
              }`}
              onPress={() => {
                setActiveMode('GROUP');
                setSelectedCategory(null);
                setSelectedBarMonthIndex(null);
              }}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  activeMode === 'GROUP'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Group Analytics
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Filter Pills */}
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
            directionalLockEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5 py-0.5"
            keyboardShouldPersistTaps="always"
          >
            {TIME_FILTERS.map(tf => {
              const isSelected = periodType === tf.id;
              return (
                <TouchableOpacity
                  key={tf.id}
                  onPress={() => {
                    setPeriodType(tf.id);
                    setSelectedBarMonthIndex(null);
                  }}
                  className={`px-3 py-1.5 rounded-full border ${
                    isSelected
                      ? 'bg-primary-light border-indigo-200 shadow-xs'
                      : 'bg-card border-border'
                  }`}
                  activeOpacity={0.6}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Group Filter Chips (When in GROUP mode) */}
          {activeMode === 'GROUP' && groups.length > 0 && (
            <ScrollView
              horizontal
              nestedScrollEnabled={true}
              directionalLockEnabled={true}
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-1.5 py-0.5"
              keyboardShouldPersistTaps="always"
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedGroupId('ALL');
                  setSelectedBarMonthIndex(null);
                }}
                className={`px-3 py-1.5 rounded-full border ${
                  selectedGroupId === 'ALL'
                    ? 'bg-primary-light border-indigo-200 shadow-xs'
                    : 'bg-card border-border'
                }`}
                activeOpacity={0.6}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedGroupId === 'ALL'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  All Groups ({groups.length})
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
                        ? 'bg-primary-light border-indigo-200 shadow-xs'
                        : 'bg-card border-border'
                    }`}
                    onPress={() => {
                      setSelectedGroupId(grp.id);
                      setSelectedBarMonthIndex(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-xs">{emoji}</Text>
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {grp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Month Selector Controls */}
          {periodType === 'MONTH' && (
            <View className="flex-row items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-xs">
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-muted items-center justify-center"
                onPress={() => changeMonth(-1)}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={18} color="#0F172A" />
              </TouchableOpacity>
              <View className="items-center">
                <Text className="text-sm font-bold text-foreground">
                  {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>
                <Text className="text-[11px] text-muted-foreground">
                  {filteredExpenses.length} transaction
                  {filteredExpenses.length === 1 ? '' : 's'} recorded
                </Text>
              </View>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-muted items-center justify-center"
                onPress={() => changeMonth(1)}
                activeOpacity={0.7}
              >
                <Feather name="chevron-right" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. 12-MONTH BAR CHART CARD */}
        <View className="bg-card rounded-2xl border border-border p-5 shadow-sm gap-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center">
                <Feather name="bar-chart-2" size={17} color="#4F46E5" />
              </View>
              <View>
                <Text className="text-sm font-bold text-foreground">
                  Monthly Comparison
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Year {monthlyBarData.year} month-by-month analysis
                </Text>
              </View>
            </View>
            <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
              <Text className="text-xs font-bold text-primary">
                {monthlyBarData.year}
              </Text>
            </View>
          </View>

          {/* Interactive Month Inspector Badge */}
          {selectedMonthInfo ? (
            <View className="bg-primary-light/60 border border-indigo-200 p-3 rounded-xl flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-primary" numberOfLines={1}>
                  📅 {selectedMonthInfo.fullName} {monthlyBarData.year}
                </Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5" numberOfLines={1}>
                  {selectedMonthInfo.count} transaction
                  {selectedMonthInfo.count === 1 ? '' : 's'} logged
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-black text-primary" numberOfLines={1}>
                  ৳{selectedMonthInfo.amount.toLocaleString()}
                </Text>
                <Text className="text-[10px] font-semibold text-indigo-500" numberOfLines={1}>
                  {monthlyBarData.yearTotal > 0
                    ? Math.round(
                        (selectedMonthInfo.amount / monthlyBarData.yearTotal) *
                          100
                      )
                    : 0}
                  % of annual
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-muted/40 px-3 py-2 rounded-xl flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                Tap bar to inspect
              </Text>
              <Text className="text-xs font-bold text-slate-700" numberOfLines={1}>
                Avg: ৳{monthlyBarData.monthlyAverage.toLocaleString()}/mo
              </Text>
            </View>
          )}

          {/* Bar Chart Columns */}
          <View className="pt-2 pb-2 border-b border-border">
            <View className="flex-row items-end justify-between h-40 px-1">
              {monthlyBarData.months.map((m, idx) => {
                const isSelected =
                  selectedBarMonthIndex === idx ||
                  (selectedBarMonthIndex === null &&
                    periodType === 'MONTH' &&
                    selectedDate.getMonth() === idx);
                const isCurrentCalendarMonth =
                  monthlyBarData.year === new Date().getFullYear() &&
                  idx === monthlyBarData.currentMonthIndex;

                const hasSpend = m.amount > 0;
                const heightPercent =
                  monthlyBarData.maxMonthAmount > 0
                    ? Math.max(
                        4,
                        Math.min(
                          100,
                          (m.amount / monthlyBarData.maxMonthAmount) *
                            100 *
                            chartAnimProgress
                        )
                      )
                    : 4;

                const isPeak = m.amount === monthlyBarData.maxMonthAmount && hasSpend;
                const showTooltip = isSelected || isPeak;

                return (
                  <TouchableOpacity
                    key={m.name}
                    className="flex-1 items-center justify-end"
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedBarMonthIndex(idx);
                      setSelectedDate(new Date(monthlyBarData.year, idx, 1));
                      setPeriodType('MONTH');
                    }}
                  >
                    {/* Fixed Height Tooltip Slot: Prevents baseline jumping or shifting */}
                    <View className="h-6 items-center justify-center mb-1 w-full overflow-visible">
                      {showTooltip ? (
                        <View
                          style={{ minWidth: 32, paddingHorizontal: 5, paddingVertical: 2 }}
                          className="bg-slate-900 rounded shadow-xs items-center justify-center"
                        >
                          <Text
                            style={{ fontSize: 9, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' }}
                            numberOfLines={1}
                          >
                            {m.amount >= 1000000
                              ? `${(m.amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`
                              : m.amount >= 1000
                              ? `${(m.amount / 1000).toFixed(1).replace(/\.0$/, '')}k`
                              : `${m.amount}`}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Bar Pillar with visible outline track for empty months */}
                    <View
                      className={`w-full max-w-[19px] h-28 rounded-t-md overflow-hidden justify-end border ${
                        isSelected
                          ? 'bg-indigo-50 border-primary shadow-xs'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <View
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          isSelected
                            ? 'bg-primary shadow-sm'
                            : isCurrentCalendarMonth
                            ? 'bg-indigo-500'
                            : hasSpend
                            ? 'bg-indigo-400'
                            : 'bg-slate-300/80'
                        }`}
                      />
                    </View>

                    {/* Month Label: Strictly 1-line, no text breaking */}
                    <View className="h-5 items-center justify-center mt-1 w-full">
                      <Text
                        style={{ fontSize: 9, textAlign: 'center' }}
                        className={`font-semibold ${
                          isSelected || isCurrentCalendarMonth
                            ? 'font-bold text-primary'
                            : 'text-muted-foreground'
                        }`}
                        numberOfLines={1}
                      >
                        {m.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chart Summary Footer (Peak, Average, Total) */}
          <View className="flex-row items-center justify-between pt-2 gap-2">
            <View className="flex-1 bg-muted/40 p-2.5 rounded-xl items-center justify-center">
              <Text
                className="text-[10px] font-semibold text-muted-foreground text-center"
                numberOfLines={1}
              >
                Peak ({monthlyBarData.highestMonth.name})
              </Text>
              <Text
                className="text-xs font-black text-rose-500 mt-0.5"
                numberOfLines={1}
              >
                ৳{monthlyBarData.highestMonth.amount.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-muted/40 p-2.5 rounded-xl items-center justify-center">
              <Text
                className="text-[10px] font-semibold text-muted-foreground text-center"
                numberOfLines={1}
              >
                Avg/Month
              </Text>
              <Text
                className="text-xs font-black text-primary mt-0.5"
                numberOfLines={1}
              >
                ৳{monthlyBarData.monthlyAverage.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-muted/40 p-2.5 rounded-xl items-center justify-center">
              <Text
                className="text-[10px] font-semibold text-muted-foreground text-center"
                numberOfLines={1}
              >
                Year Total
              </Text>
              <Text
                className="text-xs font-black text-foreground mt-0.5"
                numberOfLines={1}
              >
                ৳{monthlyBarData.yearTotal.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Category Spending Breakdown Card */}
        {categoryBreakdown.list.length > 0 ? (
          <View className="bg-card rounded-2xl border border-border p-4 mb-2 shadow-sm">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-bold text-foreground">
                Category Spending Breakdown
              </Text>
              <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
                <Text className="text-xs font-bold text-primary">
                  {categoryBreakdown.list.length}{' '}
                  {categoryBreakdown.list.length === 1
                    ? 'category'
                    : 'categories'}
                </Text>
              </View>
            </View>

            <DonutChart
              data={categoryBreakdown.list.map(c => ({
                name: c.category,
                amount: c.amount,
                color: c.color,
                emoji: c.emoji,
                percentage: c.percentage,
              }))}
              total={categoryBreakdown.total}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <View className="mt-1">
              {categoryBreakdown.list.map((cat, index) => {
                const isLast = index === categoryBreakdown.list.length - 1;
                const isSelected = selectedCategory === cat.category;
                return (
                  <React.Fragment key={`${cat.category}_${index}`}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setSelectedCategory(isSelected ? null : cat.category)
                      }
                      className={`flex-row justify-between items-center py-2.5 px-2 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-primary-light border-primary shadow-xs'
                          : 'bg-transparent border-transparent'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3 shadow-2xs"
                          style={{ backgroundColor: cat.bgColor }}
                        >
                          <Text className="text-base">{cat.emoji}</Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-sm ${
                              isSelected
                                ? 'font-bold text-primary'
                                : 'font-bold text-card-foreground'
                            }`}
                            numberOfLines={1}
                          >
                            {cat.category}
                          </Text>
                          <Text className="text-xs text-muted-foreground mt-0.5">
                            {cat.count}{' '}
                            {cat.count === 1 ? 'transaction' : 'transactions'}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-sm font-extrabold text-foreground mb-0.5">
                          ৳
                          {Math.round(
                            cat.amount * chartAnimProgress
                          ).toLocaleString('en-US')}
                        </Text>
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: cat.color }}
                        >
                          {Math.round(cat.percentage * chartAnimProgress)}% of
                          total
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {!isLast && !isSelected && (
                      <View className="h-[1px] bg-[#E2E8F0] mx-2" />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ) : (
          <View className="bg-card rounded-2xl p-8 items-center justify-center border border-dashed border-border mb-2">
            <Feather name="pie-chart" size={40} color="#94A3B8" />
            <Text className="text-sm font-bold text-foreground mt-3 mb-1">
              No Expense Data Available
            </Text>
            <Text className="text-xs text-muted-foreground text-center">
              There are no expenses recorded for this period.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
