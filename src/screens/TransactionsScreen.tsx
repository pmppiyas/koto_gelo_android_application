import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { demoTransactions } from '../data/demoData';
import { useExpenses, useAuth } from '../store/hooks';
import { groupService, Group, GroupExpense } from '../services/groupService';
import { GroupExpenseCard } from '../components/group/GroupExpenseCard';

export interface TransactionsScreenProps {
  onNavigateToGroups?: () => void;
  onNavigateToGroupDetails?: (groupId: string) => void;
}

interface DisplayTransaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense' | 'settlement';
  date: string;
  icon?: string;
  emoji?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
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

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  onNavigateToGroups,
  onNavigateToGroupDetails,
}) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || '';
  const { expenses, isSyncing, syncExpenses } = useExpenses();

  const [transactionType, setTransactionType] = useState<'PERSONAL' | 'GROUP'>('PERSONAL');
  const [searchText, setSearchText] = useState('');
  const [personalFilter, setPersonalFilter] = useState<'All' | 'Income' | 'Expense'>('All');

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [isLoadingGroupExpenses, setIsLoadingGroupExpenses] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; icon: keyof typeof Feather.glyphMap }> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      map[c.name] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.slug] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.id] = { name: c.name, emoji: c.emoji, icon: c.icon };
    });
    return map;
  }, []);

  const fetchGroupData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingGroupExpenses(true);
    try {
      const groupsRes = await groupService.getGroups({ limit: 50 });
      const groupList =
        groupsRes?.groups ||
        groupsRes?.data?.groups ||
        (Array.isArray(groupsRes) ? groupsRes : []);
      if (Array.isArray(groupList)) {
        setGroups(groupList);
      }

      let allExp: any[] = [];
      try {
        const expensesRes = await groupService.getAllGroupExpenses({ limit: 100 });
        const expList =
          expensesRes?.expenses ||
          expensesRes?.history ||
          expensesRes?.data?.expenses ||
          expensesRes?.data?.history ||
          (Array.isArray(expensesRes) ? expensesRes : []);
        if (Array.isArray(expList) && expList.length > 0) {
          allExp = expList;
        }
      } catch {}

      if (allExp.length === 0 && Array.isArray(groupList) && groupList.length > 0) {
        const groupHistoryPromises = groupList.map(async (grp) => {
          try {
            const hRes = await groupService.getGroupExpenses(grp.id, { limit: 50 });
            const list =
              hRes?.history ||
              hRes?.expenses ||
              hRes?.data?.history ||
              hRes?.data?.expenses ||
              (Array.isArray(hRes) ? hRes : []);
            return (Array.isArray(list) ? list : []).map((item: any) => ({
              ...item,
              group: item.group || { id: grp.id, name: grp.name, type: grp.type },
            }));
          } catch {
            return [];
          }
        });
        const nested = await Promise.all(groupHistoryPromises);
        allExp = nested.flat();
      }

      allExp.sort((a, b) => new Date(b.expenseDate || b.createdAt).getTime() - new Date(a.expenseDate || a.createdAt).getTime());
      setGroupExpenses(allExp);
    } catch {} finally {
      setIsLoadingGroupExpenses(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (transactionType === 'GROUP') {
      fetchGroupData();
    }
  }, [transactionType, fetchGroupData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (transactionType === 'PERSONAL') {
      await syncExpenses();
      setIsRefreshing(false);
    } else {
      await fetchGroupData();
    }
  };

  const unifiedPersonalList = useMemo(() => {
    const localConverted: DisplayTransaction[] = expenses.map((e) => {
      const catInfo = categoryMap[e.category] || categoryMap[e.category.toLowerCase()];
      return {
        id: e.localId,
        title: e.title || catInfo?.name || e.category,
        category: catInfo?.name || e.category,
        amount: Number(e.amount),
        type: 'expense',
        date: e.date,
        icon: catInfo?.icon || 'dollar-sign',
        emoji: catInfo?.emoji,
        syncStatus: e.syncStatus,
      };
    });

    const demoFiltered = demoTransactions.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      amount: t.amount,
      type: t.type,
      date: t.date,
      icon: t.icon,
      syncStatus: 'synced' as const,
    }));

    return [...localConverted, ...demoFiltered];
  }, [expenses, categoryMap]);

  const filteredPersonalTransactions = useMemo(() => {
    return unifiedPersonalList.filter((item) => {
      const q = searchText.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      let matchesFilter = true;
      if (personalFilter === 'Income') {
        matchesFilter = item.type === 'income';
      } else if (personalFilter === 'Expense') {
        matchesFilter = item.type === 'expense';
      }

      return matchesSearch && matchesFilter;
    });
  }, [unifiedPersonalList, searchText, personalFilter]);

  const filteredGroupTransactions = useMemo(() => {
    return groupExpenses.filter((item: any) => {
      const q = searchText.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.group?.name && item.group.name.toLowerCase().includes(q)) ||
        (item.user?.name && item.user.name.toLowerCase().includes(q)) ||
        (item.user?.username && item.user.username.toLowerCase().includes(q));

      const matchesGroup =
        selectedGroupId === 'ALL' || item.groupId === selectedGroupId;

      return matchesSearch && matchesGroup;
    });
  }, [groupExpenses, searchText, selectedGroupId]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  const renderPersonalItem = ({ item }: { item: DisplayTransaction }) => {
    const isIncome = item.type === 'income';

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionItemLeft}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: isIncome
                  ? colors.secondaryLight
                  : colors.primaryLight,
              },
            ]}
          >
            {item.emoji ? (
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
            ) : (
              <Feather
                name={(item.icon as any) || 'credit-card'}
                size={18}
                color={isIncome ? colors.secondary : colors.primary}
              />
            )}
          </View>
          <View style={styles.transactionItemCenter}>
            <Text style={styles.transactionTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.transactionDate}>{item.date}</Text>
            </View>
          </View>
        </View>

        <View style={styles.transactionItemRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: isIncome ? colors.secondary : colors.textPrimary },
            ]}
          >
            {isIncome ? '+' : '-'}৳{Math.abs(item.amount).toLocaleString()}
          </Text>

          {item.syncStatus === 'synced' ? (
            <View style={styles.syncedBadge}>
              <Feather name="check" size={12} color={colors.secondary} />
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Feather name="cloud-off" size={10} color="#D97706" />
              <Text style={styles.pendingBadgeText}>Offline</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGroupItem = ({ item }: { item: any }) => {
    const groupName = item.group?.name || 'Group';
    const groupTypeEmoji = TYPE_EMOJI[item.group?.type] || '📁';
    const participantCount = item.participants?.length || 1;

    return (
      <TouchableOpacity
        style={styles.groupExpenseCardWrapper}
        onPress={() => item.groupId && onNavigateToGroupDetails?.(item.groupId)}
        activeOpacity={onNavigateToGroupDetails ? 0.8 : 1}
        disabled={!onNavigateToGroupDetails}
      >
        <View style={styles.groupCardHeader}>
          <View style={styles.groupTagBadge}>
            <Text style={styles.groupTagEmoji}>{groupTypeEmoji}</Text>
            <Text style={styles.groupTagName} numberOfLines={1}>{groupName}</Text>
          </View>
          <Text style={styles.groupExpenseDateText}>{formatDate(item.expenseDate)}</Text>
        </View>

        <GroupExpenseCard
          title={item.title || item.subcategory || item.category}
          amount={item.amount}
          category={item.category}
          paidByName={item.user?.name || item.user?.username || 'Member'}
          isYou={item.user?.id === userId}
          date={formatDate(item.expenseDate)}
          participantCount={participantCount}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Activity</Text>
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={handleRefresh}
            disabled={isSyncing || isRefreshing}
            activeOpacity={0.7}
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={isSyncing || isRefreshing ? colors.primaryLight : colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.mainSwitcherContainer}>
          <View style={styles.mainSwitcher}>
            <TouchableOpacity
              style={[
                styles.switcherTab,
                transactionType === 'PERSONAL' && styles.switcherTabActive,
              ]}
              onPress={() => setTransactionType('PERSONAL')}
              activeOpacity={0.8}
            >
              <Feather
                name="user"
                size={15}
                color={transactionType === 'PERSONAL' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.switcherTabText,
                  transactionType === 'PERSONAL' && styles.switcherTabTextActive,
                ]}
              >
                Personal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherTab,
                transactionType === 'GROUP' && styles.switcherTabActive,
              ]}
              onPress={() => setTransactionType('GROUP')}
              activeOpacity={0.8}
            >
              <Feather
                name="users"
                size={15}
                color={transactionType === 'GROUP' ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.switcherTabText,
                  transactionType === 'GROUP' && styles.switcherTabTextActive,
                ]}
              >
                Group
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={16}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={
              transactionType === 'PERSONAL'
                ? 'Search personal expenses...'
                : 'Search group expenses, members...'
            }
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {transactionType === 'PERSONAL' ? (
          <View style={styles.filterContainer}>
            {(['All', 'Income', 'Expense'] as const).map((filter) => {
              const isActive = personalFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setPersonalFilter(filter)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          groups.length > 0 && (
            <View style={styles.groupFilterSection}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ id: 'ALL', name: 'All Groups', type: 'OTHER' }, ...groups]}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.groupFilterList}
                renderItem={({ item }) => {
                  const isActive = selectedGroupId === item.id;
                  const emoji = item.id === 'ALL' ? '🌐' : TYPE_EMOJI[item.type] || '📁';
                  return (
                    <TouchableOpacity
                      style={[
                        styles.groupFilterChip,
                        isActive && styles.groupFilterChipActive,
                      ]}
                      onPress={() => setSelectedGroupId(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.groupFilterEmoji}>{emoji}</Text>
                      <Text
                        style={[
                          styles.groupFilterChipText,
                          isActive && styles.groupFilterChipTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )
        )}

        {transactionType === 'PERSONAL' ? (
          <FlatList
            data={filteredPersonalTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderPersonalItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="inbox" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No personal transactions found</Text>
              </View>
            }
          />
        ) : isLoadingGroupExpenses && groupExpenses.length === 0 ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading group activity...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredGroupTransactions}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.groupSeparator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="users" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No group transactions found</Text>
                {groups.length === 0 && (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={onNavigateToGroups}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.emptyActionBtnText}>Go to Groups</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainSwitcherContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  mainSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.sm,
  },
  switcherTabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  switcherTabText: {
    fontSize: typography.xs + 1,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  switcherTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.xs + 2,
  },
  filterChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  groupFilterSection: {
    marginBottom: spacing.sm,
  },
  groupFilterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs + 2,
  },
  groupFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  groupFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  groupFilterEmoji: {
    fontSize: 12,
  },
  groupFilterChipText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  groupFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  transactionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2,
  },
  itemEmoji: {
    fontSize: 20,
  },
  transactionItemCenter: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: typography.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginHorizontal: 4,
  },
  transactionDate: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
  transactionItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  transactionAmount: {
    fontSize: typography.md,
    fontWeight: '800',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  syncedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupExpenseCardWrapper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xs + 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  groupTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  groupTagEmoji: {
    fontSize: 12,
  },
  groupTagName: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    maxWidth: 160,
  },
  groupExpenseDateText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  groupSeparator: {
    height: spacing.sm,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: typography.xs,
    fontWeight: '700',
  },
});
