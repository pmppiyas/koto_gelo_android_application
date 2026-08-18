import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { expenseService } from '../services/expenseService';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useExpenses, useAuth } from '../store/hooks';

export interface MyExpensesScreenProps {
  initialFilter?: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';
  onNavigateBack?: () => void;
  onNavigateToAddExpense?: () => void;
}

interface ExpenseItem {
  id: string;
  localId?: string;
  serverId?: string | null;
  amount: number;
  category: string;
  subcategory?: string | null;
  title?: string | null;
  note?: string | null;
  expenseDate: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt?: string;
}

export const MyExpensesScreen: React.FC<MyExpensesScreenProps> = ({
  initialFilter = 'ALL',
  onNavigateBack,
  onNavigateToAddExpense,
}) => {
  const { expenses: localExpenses, syncExpenses, deleteExpense: deleteLocalExpense } = useExpenses();
  const { isAuthenticated } = useAuth();

  const [serverExpenses, setServerExpenses] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>(
    initialFilter
  );

  useEffect(() => {
    if (initialFilter) {
      setSelectedTimeFilter(initialFilter);
    }
  }, [initialFilter]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoryLookup = useMemo(() => {
    const map: Record<string, { emoji: string; color: string; bgColor: string }> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      map[c.name] = { emoji: c.emoji, color: c.color, bgColor: c.bgColor };
      map[c.slug] = { emoji: c.emoji, color: c.color, bgColor: c.bgColor };
      map[c.id] = { emoji: c.emoji, color: c.color, bgColor: c.bgColor };
    });
    return map;
  }, []);

  const fetchServerExpenses = useCallback(
    async (pageToFetch = 1, isRefresh = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else if (pageToFetch === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setErrorMessage(null);

      try {
        const query: Record<string, any> = {
          page: pageToFetch,
          limit: 20,
        };

        if (selectedCategory !== 'ALL') {
          query.category = selectedCategory;
        }
        if (searchQuery.trim()) {
          query.search = searchQuery.trim();
        }

        const res = await expenseService.getPersonalExpenses(query);
        const fetchedList = res?.expenses || res?.data?.expenses || [];
        const pagination = res?.pagination || res?.data?.pagination || {};

        const formattedList: ExpenseItem[] = fetchedList.map((item: any) => ({
          id: item.id,
          serverId: item.id,
          amount: parseFloat(item.amount) || 0,
          category: item.category,
          subcategory: item.subcategory,
          title: item.title,
          note: item.note,
          expenseDate: item.expenseDate,
          syncStatus: 'synced' as const,
          createdAt: item.createdAt,
        }));

        if (pageToFetch === 1) {
          setServerExpenses(formattedList);
        } else {
          setServerExpenses((prev) => [...prev, ...formattedList]);
        }

        setPage(pagination.page || pageToFetch);
        setTotalPages(pagination.totalPages || 1);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Could not fetch from server');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [isAuthenticated, selectedCategory, searchQuery]
  );

  useEffect(() => {
    fetchServerExpenses(1);
  }, [fetchServerExpenses]);

  const handleRefresh = async () => {
    await syncExpenses();
    await fetchServerExpenses(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && page < totalPages) {
      fetchServerExpenses(page + 1);
    }
  };

  const unifiedExpenses: ExpenseItem[] = useMemo(() => {
    const localConverted: ExpenseItem[] = localExpenses
      .filter((e) => e.type !== 'GROUP')
      .map((e) => ({
        id: e.localId,
        localId: e.localId,
        serverId: e.serverId,
        amount: Number(e.amount),
        category: e.category,
        subcategory: e.subcategory,
        title: e.title,
        note: e.note,
        expenseDate: e.date,
        syncStatus: e.syncStatus,
        createdAt: e.createdAt,
      }));

    const serverIds = new Set(serverExpenses.map((s) => s.id));
    const pendingOnly = localConverted.filter(
      (loc) => !loc.serverId || !serverIds.has(loc.serverId)
    );

    const merged = [...pendingOnly, ...serverExpenses];

    return merged.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q));

      const matchCategory =
        selectedCategory === 'ALL' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      let matchTime = true;
      const expenseDate = new Date(item.expenseDate);
      const now = new Date();

      if (selectedTimeFilter === 'TODAY') {
        matchTime =
          expenseDate.getDate() === now.getDate() &&
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear();
      } else if (selectedTimeFilter === 'WEEK') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchTime = expenseDate >= oneWeekAgo;
      } else if (selectedTimeFilter === 'MONTH') {
        matchTime =
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear();
      }

      return matchSearch && matchCategory && matchTime;
    });
  }, [localExpenses, serverExpenses, searchQuery, selectedCategory, selectedTimeFilter]);

  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  const totalSpent = useMemo(() => {
    return unifiedExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [unifiedExpenses]);

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    setIsDeletingExpense(true);
    try {
      if (expenseToDelete.localId) {
        await deleteLocalExpense(expenseToDelete.localId);
      }
      if (expenseToDelete.serverId && isAuthenticated) {
        try {
          await expenseService.deletePersonalExpense(expenseToDelete.serverId);
          setServerExpenses((prev) => prev.filter((s) => s.id !== expenseToDelete.serverId));
        } catch {}
      }
      setExpenseToDelete(null);
    } finally {
      setIsDeletingExpense(false);
    }
  };

  const handleDeleteExpense = (item: ExpenseItem) => {
    setExpenseToDelete(item);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const today = new Date();
      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        return 'Today';
      }
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const renderExpenseCard = ({ item }: { item: ExpenseItem }) => {
    const catData = categoryLookup[item.category] || {
      emoji: '📦',
      color: colors.primary,
      bgColor: colors.primaryLight,
    };

    return (
      <View style={styles.expenseCard}>
        <View style={styles.cardLeft}>
          <View style={[styles.categoryIconCircle, { backgroundColor: catData.bgColor }]}>
            <Text style={styles.categoryEmoji}>{catData.emoji}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.expenseTitle} numberOfLines={1}>
              {item.title || item.subcategory || item.category}
            </Text>
            <View style={styles.cardMetaRow}>
              <Text style={styles.expenseCategoryText}>{item.category}</Text>
              {item.subcategory && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.expenseSubcategoryText}>{item.subcategory}</Text>
                </>
              )}
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.expenseDateText}>{formatDate(item.expenseDate)}</Text>
            </View>
            {item.note ? (
              <Text style={styles.expenseNoteText} numberOfLines={1}>
                {item.note}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.amountText}>-৳{item.amount.toLocaleString()}</Text>

          <View style={styles.badgeAndActions}>
            {item.syncStatus === 'pending' ? (
              <View style={styles.pendingBadge}>
                <Feather name="cloud-off" size={10} color="#B45309" />
                <Text style={styles.pendingBadgeText}>Offline</Text>
              </View>
            ) : item.syncStatus === 'failed' ? (
              <View style={styles.failedBadge}>
                <Feather name="alert-circle" size={10} color={colors.danger} />
                <Text style={styles.failedBadgeText}>Failed</Text>
              </View>
            ) : (
              <View style={styles.syncedBadge}>
                <Feather name="check" size={12} color={colors.secondary} />
              </View>
            )}

            <TouchableOpacity
              onPress={() => handleDeleteExpense(item)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="trash-2" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>My Expenses</Text>
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

        <View style={styles.summaryBanner}>
          <View>
            <Text style={styles.summaryLabel}>TOTAL EXPENSES</Text>
            <Text style={styles.summaryAmount}>৳{totalSpent.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Feather name="trending-down" size={16} color={colors.danger} />
            <Text style={styles.summaryCount}>
              {unifiedExpenses.length} transaction{unifiedExpenses.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search expenses by title, category, note..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.timeFiltersRow}>
          {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((filter) => {
            const isActive = selectedTimeFilter === filter;
            const labels = {
              ALL: 'All Time',
              TODAY: 'Today',
              WEEK: 'This Week',
              MONTH: 'This Month',
            };
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.timeFilterChip, isActive && styles.timeFilterChipActive]}
                onPress={() => setSelectedTimeFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeFilterText,
                    isActive && styles.timeFilterTextActive,
                  ]}
                >
                  {labels[filter]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.categoryFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFiltersScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterChip,
                selectedCategory === 'ALL' && styles.categoryFilterChipActive,
              ]}
              onPress={() => setSelectedCategory('ALL')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === 'ALL' && styles.categoryFilterTextActive,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>

            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryFilterChip,
                    isSelected && [
                      styles.categoryFilterChipActive,
                      { backgroundColor: cat.color, borderColor: cat.color },
                    ],
                  ]}
                  onPress={() => setSelectedCategory(isSelected ? 'ALL' : cat.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.catFilterEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryFilterText,
                      isSelected && styles.categoryFilterTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Feather name="info" size={14} color={colors.accent} />
            <Text style={styles.errorBannerText}>{errorMessage} (showing offline/local data)</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your expenses...</Text>
          </View>
        ) : (
          <FlatList
            data={unifiedExpenses}
            keyExtractor={(item) => item.id}
            renderItem={renderExpenseCard}
            contentContainerStyle={[
              styles.listContainer,
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
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="credit-card" size={36} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No expenses found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || selectedCategory !== 'ALL' || selectedTimeFilter !== 'ALL'
                    ? 'Try adjusting your search or filters'
                    : 'Tap the + button to add your first expense'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={onNavigateToAddExpense}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.emptyAddBtnText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        <ConfirmModal
          visible={expenseToDelete !== null}
          title="Delete Expense?"
          message={`Are you sure you want to delete this ৳${expenseToDelete?.amount?.toLocaleString()} ${expenseToDelete?.title || expenseToDelete?.category || 'expense'}?`}
          confirmText="Delete Expense"
          confirmVariant="danger"
          isLoading={isDeletingExpense}
          onConfirm={handleConfirmDeleteExpense}
          onClose={() => setExpenseToDelete(null)}
        />
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
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryLight,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  summaryCount: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs + 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  timeFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs + 2,
    gap: spacing.xs + 2,
  },
  timeFilterChip: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  timeFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryFiltersContainer: {
    marginBottom: spacing.sm,
  },
  categoryFiltersScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  categoryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  categoryFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catFilterEmoji: {
    fontSize: 13,
  },
  categoryFilterText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: colors.accentLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorBannerText: {
    fontSize: typography.xs,
    color: '#92400E',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: typography.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  expenseCategoryText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  expenseSubcategoryText: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  expenseDateText: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  expenseNoteText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: typography.md + 1,
    fontWeight: '800',
    color: colors.danger,
  },
  badgeAndActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  failedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  failedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  syncedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 2,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sm,
    fontWeight: '700',
  },
});
