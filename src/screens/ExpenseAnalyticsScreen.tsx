import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { expenseService } from '../services/expenseService';
import { useExpenses, useAuth } from '../store/hooks';
import { getLocalDateString } from '../utils/date';

export interface ExpenseAnalyticsScreenProps {
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
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ExpenseAnalyticsScreen: React.FC<ExpenseAnalyticsScreenProps> = ({
  onNavigateBack,
  onNavigateToAddExpense,
}) => {
  const { width } = useWindowDimensions();
  const { expenses: localExpenses, syncExpenses } = useExpenses();
  const { isAuthenticated } = useAuth();

  const [periodType, setPeriodType] = useState<PeriodType>('MONTH');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [serverExpenses, setServerExpenses] = useState<ExpenseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  const categoryLookup = useMemo(() => {
    const map: Record<string, { emoji: string; color: string; bgColor: string }> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      map[c.name] = { emoji: c.emoji, color: c.color, bgColor: c.bgColor };
      map[c.slug] = { emoji: c.emoji, color: c.color, bgColor: c.bgColor };
      map[c.id] = { emoji: c.emoji, color: c.color, bgColor: c.bgColor };
    });
    return map;
  }, []);

  const fetchServerExpenses = useCallback(async (isRefresh = false) => {
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
      const res = await expenseService.getPersonalExpenses({ limit: 100 });
      const fetchedList = res?.expenses || res?.data?.expenses || [];

      const formatted: ExpenseRecord[] = fetchedList.map((item: any) => ({
        id: item.id,
        amount: parseFloat(item.amount) || 0,
        category: item.category,
        subcategory: item.subcategory,
        title: item.title,
        expenseDate: item.expenseDate,
      }));

      setServerExpenses(formatted);
    } catch {} finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchServerExpenses();
  }, [fetchServerExpenses]);

  const handleRefresh = async () => {
    await syncExpenses();
    await fetchServerExpenses(true);
  };

  const handlePrevPeriod = () => {
    setSelectedBarIndex(null);
    const d = new Date(selectedDate);
    if (periodType === 'WEEK') {
      d.setDate(d.getDate() - 7);
    } else if (periodType === 'MONTH') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setFullYear(d.getFullYear() - 1);
    }
    setSelectedDate(d);
  };

  const handleNextPeriod = () => {
    setSelectedBarIndex(null);
    const d = new Date(selectedDate);
    if (periodType === 'WEEK') {
      d.setDate(d.getDate() + 7);
    } else if (periodType === 'MONTH') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setFullYear(d.getFullYear() + 1);
    }
    setSelectedDate(d);
  };

  const handleCurrentPeriod = () => {
    setSelectedBarIndex(null);
    setSelectedDate(new Date());
  };

  const isCurrentPeriod = useMemo(() => {
    const now = new Date();
    if (periodType === 'YEAR') {
      return selectedDate.getFullYear() === now.getFullYear();
    }
    if (periodType === 'MONTH') {
      return (
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth()
      );
    }
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const nowStartOfWeek = new Date(now);
    nowStartOfWeek.setDate(now.getDate() - now.getDay());
    return startOfWeek.toDateString() === nowStartOfWeek.toDateString();
  }, [selectedDate, periodType]);

  const periodLabel = useMemo(() => {
    if (periodType === 'YEAR') {
      return `${selectedDate.getFullYear()}`;
    }
    if (periodType === 'MONTH') {
      return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getDate()} ${MONTH_SHORT[start.getMonth()]} - ${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  }, [selectedDate, periodType]);

  const unifiedExpenses: ExpenseRecord[] = useMemo(() => {
    const localConverted: ExpenseRecord[] = localExpenses
      .filter((e) => e.type !== 'GROUP')
      .map((e) => ({
        id: e.localId,
        amount: Number(e.amount),
        category: e.category,
        subcategory: e.subcategory,
        title: e.title,
        expenseDate: e.date,
      }));

    const serverIds = new Set(serverExpenses.map((s) => s.id));
    const pendingOnly = localConverted.filter(
      (loc) => !serverIds.has(loc.id)
    );

    return [...pendingOnly, ...serverExpenses];
  }, [localExpenses, serverExpenses]);

  const filteredExpenses = useMemo(() => {
    return unifiedExpenses.filter((e) => {
      const expDate = new Date(e.expenseDate);
      if (isNaN(expDate.getTime())) return false;

      if (periodType === 'YEAR') {
        return expDate.getFullYear() === selectedDate.getFullYear();
      }
      if (periodType === 'MONTH') {
        return (
          expDate.getFullYear() === selectedDate.getFullYear() &&
          expDate.getMonth() === selectedDate.getMonth()
        );
      }
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return expDate >= startOfWeek && expDate <= endOfWeek;
    });
  }, [unifiedExpenses, selectedDate, periodType]);

  const totalPeriodSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  const averageSpending = useMemo(() => {
    if (totalPeriodSpent === 0) return 0;
    if (periodType === 'WEEK') return Math.round(totalPeriodSpent / 7);
    if (periodType === 'MONTH') {
      const daysInMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0
      ).getDate();
      return Math.round(totalPeriodSpent / daysInMonth);
    }
    return Math.round(totalPeriodSpent / 12);
  }, [totalPeriodSpent, periodType, selectedDate]);

  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, { amount: number; count: number }> = {};
    filteredExpenses.forEach((item) => {
      if (!totals[item.category]) {
        totals[item.category] = { amount: 0, count: 0 };
      }
      totals[item.category].amount += item.amount;
      totals[item.category].count += 1;
    });

    const list = Object.entries(totals).map(([category, data]) => {
      const catData = categoryLookup[category] || {
        emoji: '📦',
        color: colors.primary,
        bgColor: colors.primaryLight,
      };
      const percentage = totalPeriodSpent > 0 ? (data.amount / totalPeriodSpent) * 100 : 0;
      return {
        category,
        amount: data.amount,
        count: data.count,
        percentage,
        emoji: catData.emoji,
        color: catData.color,
        bgColor: catData.bgColor,
      };
    });

    return list.sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalPeriodSpent, categoryLookup]);

  const subcategoryBreakdown = useMemo(() => {
    const totals: Record<string, { amount: number; count: number; category: string }> = {};
    filteredExpenses.forEach((item) => {
      const key = item.subcategory || item.title || item.category;
      if (!totals[key]) {
        totals[key] = { amount: 0, count: 0, category: item.category };
      }
      totals[key].amount += item.amount;
      totals[key].count += 1;
    });

    return Object.entries(totals)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        category: data.category,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [filteredExpenses]);

  const barChartData = useMemo(() => {
    if (periodType === 'WEEK') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      const bars = DAY_NAMES.map((dayName, idx) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + idx);
        const dayExpenses = filteredExpenses.filter((e) => {
          const expDate = new Date(e.expenseDate);
          return expDate.toDateString() === d.toDateString();
        });
        const amount = dayExpenses.reduce((s, e) => s + e.amount, 0);
        const isToday = d.toDateString() === new Date().toDateString();
        return {
          label: dayName,
          subLabel: `${d.getDate()}`,
          fullLabel: `${dayName}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`,
          amount,
          isCurrent: isToday,
        };
      });
      const max = Math.max(...bars.map((b) => b.amount), 100);
      return { bars, max };
    }

    if (periodType === 'MONTH') {
      const daysInMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0
      ).getDate();
      const numBuckets = 5;
      const bucketSize = Math.ceil(daysInMonth / numBuckets);
      const bars = Array.from({ length: numBuckets }).map((_, idx) => {
        const startDay = idx * bucketSize + 1;
        const endDay = Math.min((idx + 1) * bucketSize, daysInMonth);
        const bucketExpenses = filteredExpenses.filter((e) => {
          const expDate = new Date(e.expenseDate);
          const dayNum = expDate.getDate();
          return dayNum >= startDay && dayNum <= endDay;
        });
        const amount = bucketExpenses.reduce((s, e) => s + e.amount, 0);
        const today = new Date();
        const isCurrent =
          today.getFullYear() === selectedDate.getFullYear() &&
          today.getMonth() === selectedDate.getMonth() &&
          today.getDate() >= startDay &&
          today.getDate() <= endDay;

        return {
          label: `${startDay}-${endDay}`,
          subLabel: MONTH_SHORT[selectedDate.getMonth()],
          fullLabel: `${startDay}-${endDay} ${MONTH_NAMES[selectedDate.getMonth()]}`,
          amount,
          isCurrent,
        };
      });
      const max = Math.max(...bars.map((b) => b.amount), 100);
      return { bars, max };
    }

    const bars = MONTH_SHORT.map((mShort, idx) => {
      const mExpenses = filteredExpenses.filter((e) => {
        const expDate = new Date(e.expenseDate);
        return expDate.getMonth() === idx;
      });
      const amount = mExpenses.reduce((s, e) => s + e.amount, 0);
      const isCurrent =
        new Date().getFullYear() === selectedDate.getFullYear() &&
        new Date().getMonth() === idx;

      return {
        label: mShort,
        subLabel: `${selectedDate.getFullYear().toString().slice(2)}`,
        fullLabel: `${MONTH_NAMES[idx]} ${selectedDate.getFullYear()}`,
        amount,
        isCurrent,
      };
    });
    const max = Math.max(...bars.map((b) => b.amount), 100);
    return { bars, max };
  }, [periodType, selectedDate, filteredExpenses]);

  const peakSpending = useMemo(() => {
    if (barChartData.bars.length === 0) return null;
    const sorted = [...barChartData.bars].sort((a, b) => b.amount - a.amount);
    if (sorted[0].amount === 0) return null;
    return sorted[0];
  }, [barChartData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onNavigateBack ? (
              <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Expense Analytics</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={18} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateToAddExpense}
              style={styles.headerAddBtn}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.periodSwitcherContainer}>
            {(['WEEK', 'MONTH', 'YEAR'] as const).map((mode) => {
              const isActive = periodType === mode;
              const labels = { WEEK: 'Weekly', MONTH: 'Monthly', YEAR: 'Yearly' };
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.periodTabBtn,
                    isActive && styles.periodTabBtnActive,
                  ]}
                  onPress={() => {
                    setPeriodType(mode);
                    setSelectedBarIndex(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      isActive && styles.periodTabTextActive,
                    ]}
                  >
                    {labels[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.dateNavigatorCard}>
            <TouchableOpacity
              onPress={handlePrevPeriod}
              style={styles.navArrowBtn}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.dateLabelWrapper}>
              <Feather name="calendar" size={15} color={colors.primary} style={styles.calIcon} />
              <Text style={styles.dateLabelText}>{periodLabel}</Text>
            </View>

            <View style={styles.navRightRow}>
              {!isCurrentPeriod && (
                <TouchableOpacity
                  onPress={handleCurrentPeriod}
                  style={styles.currentBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.currentBtnText}>Current</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleNextPeriod}
                style={styles.navArrowBtn}
                activeOpacity={0.7}
              >
                <Feather name="chevron-right" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.primaryDark }]}>
              <Text style={styles.statCardLabel}>TOTAL SPENT</Text>
              <Text style={styles.statCardValue}>৳{totalPeriodSpent.toLocaleString()}</Text>
              <View style={styles.statCardMeta}>
                <Feather name="activity" size={12} color={colors.primaryLight} />
                <Text style={styles.statCardMetaText}>
                  {filteredExpenses.length} transaction{filteredExpenses.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <View style={styles.statCardSecondary}>
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatLabel}>
                  {periodType === 'YEAR' ? 'MONTHLY AVG' : 'DAILY AVG'}
                </Text>
                <Text style={styles.miniStatValue}>৳{averageSpending.toLocaleString()}</Text>
              </View>

              <View style={styles.miniDivider} />

              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatLabel}>TOP CATEGORY</Text>
                <Text style={styles.miniStatValue} numberOfLines={1}>
                  {categoryBreakdown[0] ? `${categoryBreakdown[0].emoji} ${categoryBreakdown[0].category}` : 'None'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Feather name="bar-chart-2" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Spending Trend</Text>
              </View>
              {peakSpending ? (
                <View style={styles.peakBadge}>
                  <Text style={styles.peakBadgeText}>
                    Peak: ৳{peakSpending.amount.toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </View>

            {selectedBarIndex !== null && barChartData.bars[selectedBarIndex] ? (
              <View style={styles.tooltipBanner}>
                <Text style={styles.tooltipLabel}>
                  {barChartData.bars[selectedBarIndex].fullLabel}
                </Text>
                <Text style={styles.tooltipAmount}>
                  ৳{barChartData.bars[selectedBarIndex].amount.toLocaleString()}
                </Text>
              </View>
            ) : null}

            <View style={styles.barChartContainer}>
              {barChartData.bars.map((bar, idx) => {
                const heightPercent = barChartData.max > 0 ? (bar.amount / barChartData.max) * 100 : 0;
                const isSelected = selectedBarIndex === idx;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.barColumn}
                    onPress={() => setSelectedBarIndex(isSelected ? null : idx)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${Math.max(6, heightPercent)}%`,
                            backgroundColor: isSelected
                              ? colors.accent
                              : bar.isCurrent
                              ? colors.primary
                              : bar.amount > 0
                              ? colors.primaryMedium || '#3B82F6'
                              : colors.border,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabel,
                        (isSelected || bar.isCurrent) && styles.barLabelActive,
                      ]}
                    >
                      {bar.label}
                    </Text>
                    {bar.subLabel ? (
                      <Text style={styles.barSubLabel}>{bar.subLabel}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Feather name="pie-chart" size={18} color={colors.secondary} />
                <Text style={styles.sectionTitle}>Category Breakdown</Text>
              </View>
              <Text style={styles.categoryCountBadge}>
                {categoryBreakdown.length} {categoryBreakdown.length === 1 ? 'Category' : 'Categories'}
              </Text>
            </View>

            {totalPeriodSpent > 0 ? (
              <View style={styles.multiBarDonutContainer}>
                <View style={styles.multiBarTrack}>
                  {categoryBreakdown.map((cat, idx) => (
                    <View
                      key={idx}
                      style={{
                        flex: Math.max(1, cat.percentage),
                        backgroundColor: cat.color,
                        height: 12,
                        marginRight: idx < categoryBreakdown.length - 1 ? 2 : 0,
                        borderTopLeftRadius: idx === 0 ? 6 : 0,
                        borderBottomLeftRadius: idx === 0 ? 6 : 0,
                        borderTopRightRadius: idx === categoryBreakdown.length - 1 ? 6 : 0,
                        borderBottomRightRadius: idx === categoryBreakdown.length - 1 ? 6 : 0,
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {categoryBreakdown.length === 0 ? (
              <View style={styles.emptyCardContent}>
                <Feather name="inbox" size={32} color={colors.textMuted} />
                <Text style={styles.emptyCardText}>No expenses recorded for this period</Text>
              </View>
            ) : (
              <View style={styles.categoryList}>
                {categoryBreakdown.map((cat, idx) => (
                  <View key={idx} style={styles.categoryRowItem}>
                    <View style={styles.catLeftRow}>
                      <View style={[styles.catEmojiCircle, { backgroundColor: cat.bgColor }]}>
                        <Text style={styles.catEmojiText}>{cat.emoji}</Text>
                      </View>
                      <View style={styles.catInfoBlock}>
                        <View style={styles.catTitleRow}>
                          <Text style={styles.catNameText}>{cat.category}</Text>
                          <Text style={styles.catAmountText}>
                            ৳{cat.amount.toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.catProgressTrack}>
                          <View
                            style={[
                              styles.catProgressFill,
                              {
                                width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                                backgroundColor: cat.color,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.catMetaRow}>
                          <Text style={styles.catCountText}>
                            {cat.count} transaction{cat.count === 1 ? '' : 's'}
                          </Text>
                          <Text style={styles.catPercentText}>
                            {cat.percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {subcategoryBreakdown.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleGroup}>
                  <Feather name="list" size={18} color={colors.accent} />
                  <Text style={styles.sectionTitle}>Top Subcategories</Text>
                </View>
              </View>

              <View style={styles.subcategoryGrid}>
                {subcategoryBreakdown.map((sub, idx) => {
                  const catData = categoryLookup[sub.category] || {
                    emoji: '🏷️',
                    color: colors.primary,
                    bgColor: colors.primaryLight,
                  };
                  return (
                    <View key={idx} style={styles.subcatCard}>
                      <View style={styles.subcatTopRow}>
                        <Text style={styles.subcatEmoji}>{catData.emoji}</Text>
                        <Text style={styles.subcatRankText}>#{idx + 1}</Text>
                      </View>
                      <Text style={styles.subcatNameText} numberOfLines={1}>
                        {sub.name}
                      </Text>
                      <Text style={styles.subcatAmountText}>
                        ৳{sub.amount.toLocaleString()}
                      </Text>
                      <Text style={styles.subcatCountText}>
                        {sub.count} {sub.count === 1 ? 'time' : 'times'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  periodSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  periodTabBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  periodTabText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dateNavigatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dateLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calIcon: {
    marginRight: 2,
  },
  dateLabelText: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  currentBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1.1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    justifyContent: 'space-between',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: typography.xxl - 2,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  statCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statCardMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  statCardSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'space-between',
  },
  miniStatItem: {
    gap: 2,
  },
  miniStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  miniStatValue: {
    fontSize: typography.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  miniDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  peakBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  peakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  categoryCountBadge: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tooltipBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  tooltipLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  tooltipAmount: {
    fontSize: typography.xs + 1,
    fontWeight: '800',
    color: colors.primary,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    width: '100%',
    borderRadius: borderRadius.sm,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  barLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  barSubLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 1,
  },
  multiBarDonutContainer: {
    marginBottom: spacing.md,
  },
  multiBarTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  categoryList: {
    gap: spacing.sm,
  },
  categoryRowItem: {
    paddingVertical: 4,
  },
  catLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catEmojiCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmojiText: {
    fontSize: 18,
  },
  catInfoBlock: {
    flex: 1,
  },
  catTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catNameText: {
    fontSize: typography.xs + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  catAmountText: {
    fontSize: typography.xs + 1,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  catProgressTrack: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  catMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catCountText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  catPercentText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  subcatCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  subcatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subcatEmoji: {
    fontSize: 16,
  },
  subcatRankText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  subcatNameText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subcatAmountText: {
    fontSize: typography.sm,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 2,
  },
  subcatCountText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  emptyCardContent: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyCardText: {
    fontSize: typography.sm,
    color: colors.textMuted,
  },
});
