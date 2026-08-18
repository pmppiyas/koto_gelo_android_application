import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { demoTransactions } from '../data/demoData';
import { useExpenses } from '../store/hooks';

export interface TransactionsScreenProps {}

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

export const TransactionsScreen: React.FC<TransactionsScreenProps> = () => {
  const { expenses, isSyncing, syncExpenses } = useExpenses();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Income' | 'Expense'>('All');

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; icon: keyof typeof Feather.glyphMap }> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      map[c.name] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.slug] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.id] = { name: c.name, emoji: c.emoji, icon: c.icon };
    });
    return map;
  }, []);

  const unifiedList = useMemo(() => {
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

  const filteredTransactions = useMemo(() => {
    return unifiedList.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category.toLowerCase().includes(searchText.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === 'Income') {
        matchesFilter = item.type === 'income';
      } else if (activeFilter === 'Expense') {
        matchesFilter = item.type === 'expense';
      }

      return matchesSearch && matchesFilter;
    });
  }, [unifiedList, searchText, activeFilter]);

  const renderFilterTab = (title: 'All' | 'Income' | 'Expense') => {
    const isActive = activeFilter === title;
    return (
      <TouchableOpacity
        style={[
          styles.filterTab,
          isActive ? styles.filterTabActive : styles.filterTabInactive,
        ]}
        onPress={() => setActiveFilter(title)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterTabText,
            isActive ? styles.filterTabTextActive : styles.filterTabTextInactive,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTransactionItem: ListRenderItem<DisplayTransaction> = ({ item }) => {
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
                  : colors.surfaceCard,
              },
            ]}
          >
            {item.emoji ? (
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
            ) : (
              <Feather
                name={(item.icon as any) || 'more-horizontal'}
                size={18}
                color={isIncome ? colors.secondary : colors.danger}
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

          {item.syncStatus === 'pending' ? (
            <View style={styles.pendingBadge}>
              <Feather name="cloud-off" size={10} color="#D97706" />
              <Text style={styles.pendingBadgeText}>Offline</Text>
            </View>
          ) : item.syncStatus === 'failed' ? (
            <View style={styles.failedBadge}>
              <Feather name="alert-circle" size={10} color={colors.danger} />
              <Text style={styles.failedBadgeText}>Retry sync</Text>
            </View>
          ) : (
            <View style={styles.syncedBadge}>
              <Feather name="check" size={12} color={colors.secondary} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={syncExpenses}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            <Feather
              name="refresh-cw"
              size={16}
              color={isSyncing ? colors.primaryLight : colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
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

        <View style={styles.filterContainer}>
          {renderFilterTab('All')}
          {renderFilterTab('Income')}
          {renderFilterTab('Expense')}
        </View>

        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.xxl,
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
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sm + 1,
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.xs + 2,
  },
  filterTab: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabInactive: {
    backgroundColor: colors.borderLight,
  },
  filterTabText: {
    fontSize: typography.xs,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterTabTextInactive: {
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: BOTTOM_TAB_HEIGHT + spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
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
    fontWeight: '600',
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
    fontWeight: '700',
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
    color: '#B45309',
  },
  failedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
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
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sm + 1,
    color: colors.textMuted,
  },
});
