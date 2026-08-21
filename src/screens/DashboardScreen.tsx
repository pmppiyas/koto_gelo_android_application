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
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { useAuth, useExpenses } from '../store/hooks';
import { groupService } from '../services/groupService';
import { Transaction } from '../types/transaction';
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
      const summaryData = await groupService.getOverallGroupSummary();
      const myShare = Number(summaryData?.totalMyShare) || 0;
      setGroupShareAmount(myShare);
    } catch {
      // Gracefully ignored
    }
  }, []);

  useEffect(() => {
    refreshExpenses();
    fetchGroupSummary();
  }, [fetchGroupSummary]);

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
      .filter((e) => e.type === 'GROUP')
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

  const unifiedRecentTransactions: Transaction[] = useMemo(() => {
    return (expenses || []).slice(0, 5).map(e => {
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
          }
        }
      } catch {}

      return {
        id: e.serverId || e.localId || String(Math.random()),
        title: e.title || e.subcategory || e.category,
        amount: Number(e.amount) || 0,
        type: 'expense' as const,
        category: e.category,
        groupName: (e as any).groupName || null,
        date: formattedDate,
        icon: catInfo.icon,
      };
    });
  }, [expenses, categoryMap]);

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
    const currentMonth = today.slice(0, 7); // e.g. "2026-08"

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
  const [animProgress, setAnimProgress] = useState(0);
  const chartYRef = useRef<number>(0);
  const hasAnimatedRef = useRef<boolean>(false);

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

  const activeCategoryInfo = useMemo(() => {
    if (!selectedCategoryName) return null;
    return (
      categoryBreakdown.list.find(c => c.name === selectedCategoryName) || null
    );
  }, [selectedCategoryName, categoryBreakdown.list]);

  const conicGradient = useMemo(() => {
    if (
      !categoryBreakdown.list ||
      categoryBreakdown.list.length === 0 ||
      categoryBreakdown.total === 0
    ) {
      return '#E2E8F0';
    }

    const currentTotalDeg = 360 * animProgress;

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
      const deg = (item.amount / categoryBreakdown.total) * currentTotalDeg;
      const start = currentDeg;
      const end = currentDeg + deg;
      currentDeg = end;

      const isSelected =
        !selectedCategoryName || selectedCategoryName === item.name;
      const sliceColor = isSelected ? item.color : `${item.color}35`;

      return `${sliceColor} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
    });

    if (currentDeg < 360) {
      slices.push(`#F1F5F9 ${currentDeg.toFixed(1)}deg 360deg`);
    }

    return `conic-gradient(${slices.join(', ')})`;
  }, [categoryBreakdown, animProgress, selectedCategoryName]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerClassName="p-4 gap-4"
        contentContainerStyle={{
          paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm,
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
        {/* Header Greeting */}
        <View className="flex-row justify-between items-center py-1">
          <View className="flex-1 pr-2">
            <Text className="text-xs text-muted-foreground font-medium">
              Welcome back,
            </Text>
            <Text
              className="text-xl font-extrabold text-foreground"
              numberOfLines={1}
            >
              {displayName}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center shadow-xs"
              activeOpacity={0.7}
            >
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

        {/* 100% Real Personal Spend Hero Card */}
        <View className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-indigo-400" />
              <Text className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                This Month Spend
              </Text>
            </View>
            <View className="bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              <Text className="text-[11px] font-bold text-indigo-300">BDT</Text>
            </View>
          </View>

          <Text className="text-3xl text-white font-black tracking-tight mt-1 mb-5">
            ৳ {personalStats.thisMonthTotal.toLocaleString('en-US')}
          </Text>

          {/* Divider inside Hero Card */}
          <View className="h-[1px] bg-slate-800/90 mb-3" />

          {/* Bottom 3 Metrics Row */}
          <View className="flex-row justify-between items-center">
            {/* 1. Today (Left) */}
            <View className="flex-1 items-start justify-center">
              <Text className="text-[10px] font-semibold text-slate-400 mb-0.5 text-left">
                📅 Today
              </Text>
              <Text className="text-sm font-black text-emerald-400 text-left">
                ৳{personalStats.todayTotal.toLocaleString()}
              </Text>
            </View>

            <View className="w-[1px] h-7 bg-slate-800 mx-2" />

            {/* 2. Group Expense (Middle) - Tappable to navigate to Groups */}
            <TouchableOpacity
              onPress={onNavigateToGroups}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center"
            >
              <Text className="text-[10px] font-semibold text-slate-400 mb-0.5 text-center">
                👥 Group Expense
              </Text>
              <Text className="text-sm font-black text-amber-400 text-center">
                ৳{displayedGroupExpense.toLocaleString()}
              </Text>
            </TouchableOpacity>

            <View className="w-[1px] h-7 bg-slate-800 mx-2" />

            {/* 3. All Time (Right) */}
            <View className="flex-1 items-end justify-center">
              <Text className="text-[10px] font-semibold text-slate-400 mb-0.5 text-right">
                💰 All Time
              </Text>
              <Text className="text-sm font-black text-sky-400 text-right">
                ৳{personalStats.totalAllTime.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* 4 Quick Action Buttons */}
        <View className="flex-row justify-between gap-2 bg-card p-3.5 rounded-2xl border border-border shadow-sm">
          <TouchableOpacity
            className="flex-1 items-center gap-1.5"
            onPress={onNavigateToAddExpense}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-primary items-center justify-center shadow-md">
              <Feather name="plus" size={22} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">
              Add Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center gap-1.5"
            onPress={onNavigateToPersonalExpenses || onNavigateToTransactions}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-emerald-600 items-center justify-center shadow-md">
              <Feather name="credit-card" size={20} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">
              My Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center gap-1.5"
            onPress={onNavigateToGroups || onNavigateToTransactions}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-indigo-600 items-center justify-center shadow-md">
              <Feather name="users" size={20} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">
              Groups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center gap-1.5"
            onPress={onNavigateToAnalytics || onNavigateToTransactions}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-2xl bg-slate-800 items-center justify-center shadow-md">
              <Feather name="pie-chart" size={20} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold text-foreground">
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

        {/* Colorful Category Spending Pie Chart Card (Running Month Only) */}
        {categoryBreakdown.list.length > 0 && (
          <View
            onLayout={handleChartLayout}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm gap-4 mb-2"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center">
                  <Feather name="pie-chart" size={17} color="#4F46E5" />
                </View>
                <View>
                  <Text className="text-base font-bold text-foreground">
                    This Month's Spending
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {currentMonthLabel} category breakdown
                  </Text>
                </View>
              </View>
              {onNavigateToAnalytics && (
                <TouchableOpacity
                  onPress={onNavigateToAnalytics}
                  activeOpacity={0.7}
                  className="bg-primary-light px-3 py-1 rounded-full border border-indigo-200"
                >
                  <Text className="text-xs font-bold text-primary">
                    Details →
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Interactive & Animated Donut / Pie Chart Centerpiece */}
            <View className="items-center justify-center py-4">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedCategoryName(null)}
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
                        {activeCategoryInfo.name}
                      </Text>
                      <Text
                        className="text-base font-bold text-slate-800 text-center my-0.5"
                        numberOfLines={1}
                      >
                        ৳
                        {Math.round(
                          activeCategoryInfo.amount * animProgress,
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
                            activeCategoryInfo.percentage * animProgress,
                          )}
                          % of month
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
                          categoryBreakdown.total * animProgress,
                        ).toLocaleString()}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Interactive Category Legends List */}
            <View className="gap-2 pt-3 border-t border-border">
              {categoryBreakdown.list.map(cat => {
                const isSelected = selectedCategoryName === cat.name;
                const animatedAmount = Math.round(cat.amount * animProgress);
                const animatedPercentage = Math.round(
                  cat.percentage * animProgress,
                );
                const animatedProgressWidth = Math.max(
                  4,
                  cat.percentage * animProgress,
                );

                return (
                  <TouchableOpacity
                    key={cat.name}
                    activeOpacity={0.7}
                    onPress={() =>
                      setSelectedCategoryName(isSelected ? null : cat.name)
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
                            {cat.name}
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

                    {/* Micro Progress Bar with 0 to 100% Animated Reveal */}
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
