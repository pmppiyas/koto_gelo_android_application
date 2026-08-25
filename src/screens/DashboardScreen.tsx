import React, {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  StatusBar,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from '../components/ui/core';
import { HeroStatCard } from '../components/common/HeroStatCard';
import { DonutChart } from '../components/common/DonutChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { useAuth, useExpenses, useAppDispatch } from '../store/hooks';
import { groupService } from '../services/groupService';
import { localGroupService } from '../services/localGroupService';
import { localExpenseService } from '../services/localExpenseService';
import { Transaction } from '../types/transaction';
import { demoTransactions } from '../data/demoData';
import { getLocalDateString } from '../utils/date';
import { EXPENSE_CATEGORIES } from '../constants/expense';

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
  onNavigateToAnalytics,
  onNavigateToGroups,
  onNavigateToAddExpense,
  onNavigateToProfile,
}) => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const {
    expenses,
    pendingExpenses,
    syncExpenses,
    refreshExpenses,
    isSyncing,
    newlyAddedId,
  } = useExpenses();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groupShareAmount, setGroupShareAmount] = useState<number>(0);

  const fetchGroupSummary = useCallback(async () => {
    try {
      // 1. Calculate from local SQLite database in 0ms (instant)
      const localSummary = await localGroupService.calculateOverallGroupSummary(user?.id);
      if (localSummary && typeof localSummary.totalMyShare === 'number') {
        setGroupShareAmount(localSummary.totalMyShare);
      }

      // 2. Fetch remote update in background if online
      const summaryData = await groupService.getOverallGroupSummary();
      const myShare = Number(summaryData?.totalMyShare) || 0;
      setGroupShareAmount(myShare);
    } catch {}
  }, [user?.id]);

  // One-time SQLite hydration (instant 0ms) — only if Redux is empty
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    if (hasHydratedRef.current || expenses.length > 0) return;
    hasHydratedRef.current = true;
    (async () => {
      try {
        const stored = await localExpenseService.getLocalExpenses();
        if (stored && stored.length > 0) {
          dispatch({ type: 'expenses/setExpenses', payload: stored });
        }
      } catch {}
    })();
  }, [dispatch, expenses.length]);

  // Auto-refresh from server whenever user/auth changes (e.g. after login)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    refreshExpenses();
    fetchGroupSummary();
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hasAnimatedRef.current = false;
    setAnimProgress(0);
    try {
      await Promise.all([
        syncExpenses(),
        refreshExpenses(),
        fetchGroupSummary(),
      ]);
    } catch {
    } finally {
      setIsRefreshing(false);
    }
  };

  const displayName = user?.name || user?.username || 'User';

  const categoryMap = useMemo(() => {
    const map: Record<
      string,
      { name: string; emoji: string; icon: keyof typeof Feather.glyphMap }
    > = {};
    EXPENSE_CATEGORIES.forEach(c => {
      map[c.name] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.slug] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.id] = { name: c.name, emoji: c.emoji, icon: c.icon };
    });
    return map;
  }, []);

  const personalStats = useMemo(() => {
    const today = getLocalDateString();
    const currentMonth = today.slice(0, 7);

    const personalList = (expenses || []).filter(e => e.type !== 'GROUP');

    let thisMonthTotal = 0;
    let todayTotal = 0;
    let totalAllTime = 0;

    personalList.forEach(e => {
      const amt = Number(e.amount) || 0;
      totalAllTime += amt;

      const dateStr = (
        e.date ||
        (e as any).expenseDate ||
        e.createdAt ||
        ''
      ).slice(0, 10);
      let localDate = dateStr;
      try {
        if (dateStr.includes('T') || dateStr.length > 10) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            localDate = getLocalDateString(parsed);
          }
        }
      } catch {}

      if (localDate.startsWith(currentMonth)) {
        thisMonthTotal += amt;
      }
      if (localDate === today) {
        todayTotal += amt;
      }
    });

    return {
      thisMonthTotal,
      todayTotal,
      totalAllTime,
      itemCount: personalList.length,
    };
  }, [expenses]);

  const displayedGroupExpense = useMemo(() => {
    const localGroupShare = (expenses || [])
      .filter(e => e.type === 'GROUP')
      .reduce((sum, e) => {
        const parts = (e as any).participants || [];
        if (parts.length > 0) {
          const userPart = parts.find(
            (p: any) => p.userId === user?.id || p.user?.id === user?.id,
          );
          if (userPart) {
            return sum + (Number(userPart.shareAmount) || 0);
          }
        }
        return sum;
      }, 0);

    return Math.max(groupShareAmount, localGroupShare);
  }, [expenses, user?.id, groupShareAmount]);

  const unifiedRecentTransactions: any[] = useMemo(() => {
    const list = [...(expenses || [])];
    if (list.length === 0 && !isAuthenticated) {
      return (demoTransactions || []).slice(0, 5).map(t => ({
        id: t.id,
        localId: t.id,
        title: t.title,
        category: t.category,
        amount: t.amount,
        type: t.type,
        date: t.date,
        icon: t.icon,
        emoji: categoryMap[t.category]?.emoji || '📦',
      }));
    }

    // Sort descending so the most recently added expenses ALWAYS appear at the top!
    list.sort((a, b) => {
      const dateA = new Date(
        a.date || (a as any).expenseDate || a.createdAt || 0
      ).getTime();
      const dateB = new Date(
        b.date || (b as any).expenseDate || b.createdAt || 0
      ).getTime();
      return dateB - dateA;
    });

    const map = new Map<string, any>();
    list.forEach((e, idx) => {
      const key = e.serverId || e.localId || `rec_${idx}`;
      if (!map.has(key)) {
        const catInfo = categoryMap[e.category] || {
          name: e.category,
          emoji: '📦',
          icon: 'credit-card' as const,
        };

        let formattedDate = getLocalDateString();
        try {
          const rawDate = e.date || (e as any).expenseDate || e.createdAt;
          if (rawDate) {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              formattedDate = getLocalDateString(parsed);
            } else {
              formattedDate = String(rawDate).slice(0, 10);
            }
          }
        } catch {}

        map.set(key, {
          id: key,
          localId: e.localId,
          title: e.title || e.subcategory || e.category,
          amount: Number(e.amount) || 0,
          type: 'expense' as const,
          category: e.category,
          groupName: (e as any).groupName || null,
          date: formattedDate,
          icon: catInfo.icon,
          emoji: catInfo.emoji,
          syncStatus: e.syncStatus,
        });
      }
    });

    return Array.from(map.values()).slice(0, 5);
  }, [expenses, categoryMap, isAuthenticated]);

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

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const categoryBreakdown = useMemo(() => {
    const today = getLocalDateString();
    const currentMonth = today.slice(0, 7);

    const personalList = (expenses || []).filter(e => {
      if (e.type === 'GROUP') return false;
      const dateStr = (
        e.date ||
        (e as any).expenseDate ||
        e.createdAt ||
        ''
      ).slice(0, 10);
      let localDate = dateStr;
      try {
        if (dateStr.includes('T') || dateStr.length > 10) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            localDate = getLocalDateString(parsed);
          }
        }
      } catch {}
      return localDate.startsWith(currentMonth);
    });

    const total = personalList.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0,
    );

    const map: Record<
      string,
      {
        name: string;
        emoji: string;
        amount: number;
        count: number;
      }
    > = {};

    personalList.forEach(e => {
      const cat = e.category || 'Others';
      const catDef = EXPENSE_CATEGORIES.find(
        c =>
          c.name.toLowerCase() === cat.toLowerCase() ||
          c.slug.toLowerCase() === cat.toLowerCase(),
      ) || {
        name: cat,
        emoji: '📦',
      };

      if (!map[catDef.name]) {
        map[catDef.name] = {
          name: catDef.name,
          emoji: catDef.emoji,
          amount: 0,
          count: 0,
        };
      }
      map[catDef.name].amount += Number(e.amount) || 0;
      map[catDef.name].count += 1;
    });

    const rawList = Object.values(map).sort((a, b) => b.amount - a.amount);

    const list = rawList.map((item, index) => {
      const palette = CHART_PALETTE[index % CHART_PALETTE.length];
      const percentage =
        total > 0 ? Math.round((item.amount / total) * 100) : 0;
      return {
        ...item,
        color: palette.color,
        bgColor: palette.bgColor,
        percentage,
      };
    });

    return { list, total };
  }, [expenses]);

  const [selectedCategoryName, setSelectedCategoryName] = useState<
    string | null
  >(null);
  const [animProgress, setAnimProgress] = useState(1);
  const chartYRef = useRef<number>(0);
  const hasAnimatedRef = useRef<boolean>(true);

  const triggerRevealAnimation = useCallback(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    setAnimProgress(0);
    let start: number | null = null;
    const duration = 900;

    let animFrame: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(ease);
      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };
    animFrame = requestAnimationFrame(step);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (hasAnimatedRef.current) return;
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const scrollBottom = contentOffset.y + layoutMeasurement.height;

    if (chartYRef.current > 0 && scrollBottom >= chartYRef.current + 40) {
      triggerRevealAnimation();
    }
  };

  const handleChartLayout = (e: any) => {
    const y = e.nativeEvent.layout.y;
    chartYRef.current = y;
    if (!hasAnimatedRef.current && y > 0 && y < 650) {
      setTimeout(() => {
        triggerRevealAnimation();
      }, 350);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Sticky Top Header Bar (Fixed outside ScrollView) */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border shadow-2xs">
        <View className="flex-1 pr-2">
          <Text className="text-xs text-muted-foreground font-medium">
            Welcome back,
          </Text>
          <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-muted items-center justify-center"
            activeOpacity={0.7}
          >
            <Feather name="bell" size={17} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-primary-light border border-indigo-200 items-center justify-center"
            onPress={onNavigateToProfile}
            activeOpacity={0.7}
          >
            <Feather name="user" size={17} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-3 py-1.5 gap-2.5"
        contentContainerStyle={{
          paddingBottom: 2,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
      >
        {/* Sync Banner if pending */}
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
                {pendingExpenses.length} expense
                {pendingExpenses.length > 1 ? 's' : ''} waiting to sync
              </Text>
            </View>
            <View className="bg-amber-600 px-3 py-1 rounded-full">
              <Text className="text-xs text-white font-bold">
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Shared Hero Stat Card */}
        <HeroStatCard
          title="This Month Spend"
          badge="BDT"
          badgeColor="bg-slate-800 border-slate-700"
          badgeTextColor="text-indigo-300"
          dotColor="bg-indigo-400"
          mainAmount={personalStats.thisMonthTotal}
          subtitle={`Personal expenses recorded in ${currentMonthLabel}`}
          metrics={[
            {
              label: '📅 Today',
              value: `৳${personalStats.todayTotal.toLocaleString('en-US')}`,
              valueColor: 'text-emerald-400',
            },
            {
              label: '👥 Group Expense',
              value: `৳${displayedGroupExpense.toLocaleString('en-US')}`,
              valueColor: 'text-amber-400',
              onPress: onNavigateToGroups,
            },
            {
              label: '💰 All Time',
              value: `৳${personalStats.totalAllTime.toLocaleString('en-US')}`,
              valueColor: 'text-sky-400',
            },
          ]}
        />

        {/* 4 Quick Action Buttons */}
        <View className="flex-row justify-between gap-2 bg-card p-3.5 rounded-2xl border border-border shadow-sm">
          <TouchableOpacity
            className="flex-1 items-center justify-center gap-1.5"
            onPress={onNavigateToAddExpense}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center shadow-md">
              <Feather name="plus" size={22} color="#FFFFFF" />
            </View>
            <Text
              className="text-[11px] font-bold text-foreground text-center"
              numberOfLines={1}
            >
              Add Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center gap-1.5"
            onPress={onNavigateToPersonalExpenses || onNavigateToTransactions}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-emerald-600 items-center justify-center shadow-md">
              <Feather name="credit-card" size={20} color="#FFFFFF" />
            </View>
            <Text
              className="text-[11px] font-bold text-foreground text-center"
              numberOfLines={1}
            >
              My Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center gap-1.5"
            onPress={onNavigateToGroups || onNavigateToTransactions}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center shadow-md">
              <Feather name="users" size={20} color="#FFFFFF" />
            </View>
            <Text
              className="text-[11px] font-bold text-foreground text-center"
              numberOfLines={1}
            >
              Groups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center gap-1.5"
            onPress={onNavigateToAnalytics || onNavigateToTransactions}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-slate-800 items-center justify-center shadow-md">
              <Feather name="pie-chart" size={20} color="#FFFFFF" />
            </View>
            <Text
              className="text-[11px] font-bold text-foreground text-center"
              numberOfLines={1}
            >
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Real Expenses */}
        <RecentTransactions
          transactions={unifiedRecentTransactions}
          newlyAddedId={newlyAddedId}
          onSeeAll={onNavigateToPersonalExpenses || onNavigateToTransactions}
        />

        {/* Category Spending Breakdown Card (Matches Recent Expenses Style Exactly) */}
        {categoryBreakdown.list.length > 0 && (
          <View
            onLayout={handleChartLayout}
            className="bg-card rounded-2xl border border-border p-4 mb-2 shadow-sm"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base font-bold text-foreground">
                This Month's Spending
              </Text>
              {onNavigateToAnalytics && (
                <TouchableOpacity
                  onPress={onNavigateToAnalytics}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm text-primary font-semibold">
                    See Details
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Clean, Borderless Proportional Color Spectrum Bar */}
            <DonutChart
              data={categoryBreakdown.list}
              total={categoryBreakdown.total}
              selectedCategory={selectedCategoryName}
              onSelectCategory={setSelectedCategoryName}
              animProgress={animProgress}
              size={210}
            />

            {/* Category Rows (Matching Recent Expenses List Style) */}
            <View className="mt-1">
              {categoryBreakdown.list.map((cat, index) => {
                const isLast = index === categoryBreakdown.list.length - 1;
                const isSelected = selectedCategoryName === cat.name;

                return (
                  <React.Fragment key={cat.name}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setSelectedCategoryName(
                          isSelected ? null : cat.name,
                        )
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
                            className={`text-sm font-bold ${
                              isSelected
                                ? 'text-primary'
                                : 'text-card-foreground'
                            }`}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                          <Text className="text-xs text-muted-foreground mt-0.5">
                            {cat.count}{' '}
                            {cat.count === 1 ? 'transaction' : 'transactions'}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-sm font-extrabold text-foreground mb-0.5">
                          ৳{Math.round(cat.amount * animProgress).toLocaleString('en-US')}
                        </Text>
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: cat.color }}
                        >
                          {Math.round(cat.percentage * animProgress)}% of month
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
