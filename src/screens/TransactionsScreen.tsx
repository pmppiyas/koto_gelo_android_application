import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
} from '../components/ui/core';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { demoTransactions } from '../data/demoData';
import { useExpenses, useAuth } from '../store/hooks';
import { groupService, Group, GroupExpense } from '../services/groupService';
import { GroupExpenseCard } from '../components/group/GroupExpenseCard';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';
import { getLocalDateString } from '../utils/date';

export type TimeFilterType = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

export interface TransactionsScreenProps {
  initialTab?: 'PERSONAL' | 'GROUP';
  initialTimeFilter?: TimeFilterType;
  onNavigateToPersonalExpenses?: () => void;
  onNavigateToGroupExpenses?: () => void;
  onNavigateToGroups?: () => void;
  onNavigateToGroupDetails?: (groupId: string) => void;
  onNavigateToDashboard?: () => void;
  onNavigateBack?: () => void;
  onNavigateToAddExpense?: () => void;
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

const TIME_FILTERS: { id: TimeFilterType; label: string }[] = [
  { id: 'ALL', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'WEEK', label: 'This Week' },
  { id: 'MONTH', label: 'This Month' },
];

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  initialTab = 'PERSONAL',
  initialTimeFilter = 'ALL',
  onNavigateToGroups,
  onNavigateToGroupDetails,
  onNavigateBack,
  onNavigateToAddExpense,
}) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || '';
  const { expenses, isSyncing, syncExpenses } = useExpenses();

  const [transactionType, setTransactionType] = useState<'PERSONAL' | 'GROUP'>(
    initialTab,
  );
  const [selectedTimeFilter, setSelectedTimeFilter] =
    useState<TimeFilterType>(initialTimeFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setTransactionType(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialTimeFilter) {
      setSelectedTimeFilter(initialTimeFilter);
    }
  }, [initialTimeFilter]);

  const [groups, setGroups] = useState<Group[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');

  const categoryMap = useMemo(() => {
    const map: Record<
      string,
      { emoji: string; icon: keyof typeof Feather.glyphMap }
    > = {};
    EXPENSE_CATEGORIES.forEach(c => {
      map[c.name] = { emoji: c.emoji, icon: c.icon };
      map[c.slug] = { emoji: c.emoji, icon: c.icon };
      map[c.id] = { emoji: c.emoji, icon: c.icon };
    });
    return map;
  }, []);

  const fetchGroupData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingGroups(true);
    try {
      const response = await groupService.getGroups({ limit: 50 });
      const groupList: Group[] =
        response?.groups ||
        response?.data?.groups ||
        (Array.isArray(response) ? response : []);
      setGroups(groupList);

      const targetGroups =
        selectedGroupId === 'ALL'
          ? groupList
          : groupList.filter(g => g.id === selectedGroupId);

      const expensePromises = targetGroups.map(async grp => {
        try {
          const res = await groupService.getGroupExpenses(grp.id, {
            limit: 50,
          });
          const list: GroupExpense[] =
            res?.history ||
            res?.data?.history ||
            res?.expenses ||
            res?.data?.expenses ||
            (Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
              ? res
              : []);
          return list.map(e => ({
            ...e,
            groupName: grp.name,
            groupType: grp.type,
          }));
        } catch {
          return [];
        }
      });

      const serverResults = await Promise.all(expensePromises);
      const combinedServer = serverResults.flat();

      const localGroupExpenses: any[] = (expenses || [])
        .filter(
          e =>
            e.type === 'GROUP' &&
            (selectedGroupId === 'ALL' || e.groupId === selectedGroupId),
        )
        .map(e => {
          const grp = groupList.find(g => g.id === e.groupId);
          return {
            id: e.serverId || e.localId,
            title: e.title || e.category,
            category: e.category,
            subcategory: e.subcategory,
            amount: e.amount,
            note: e.note,
            expenseDate: e.date,
            createdAt: e.createdAt,
            groupId: e.groupId,
            groupName: grp?.name || 'Group Expense',
            groupType: grp?.type || 'OTHER',
            user: {
              id: userId,
              username: user?.username || 'You',
              name: user?.name || user?.username || 'You',
            },
            participants: [],
            syncStatus: e.syncStatus,
          };
        });

      const map = new Map<string, any>();
      localGroupExpenses.forEach(item => {
        map.set(item.id, item);
      });
      combinedServer.forEach(item => {
        map.set(item.id, item);
      });

      const combined = Array.from(map.values());
      combined.sort((a, b) => {
        const dateA = new Date(a.expenseDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.expenseDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setGroupExpenses(combined);
    } catch {
    } finally {
      setIsLoadingGroups(false);
    }
  }, [isAuthenticated, selectedGroupId, expenses, userId, user]);

  useEffect(() => {
    if (transactionType === 'GROUP') {
      fetchGroupData();
    }
  }, [transactionType, fetchGroupData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (transactionType === 'PERSONAL') {
      await syncExpenses();
    } else {
      await fetchGroupData();
    }
    setIsRefreshing(false);
  };

  const matchesTimeFilter = (dateStr?: string): boolean => {
    if (selectedTimeFilter === 'ALL') return true;
    if (!dateStr) return false;
    const d = dateStr.slice(0, 10);
    const today = getLocalDateString();
    if (selectedTimeFilter === 'TODAY') {
      return d === today;
    }
    if (selectedTimeFilter === 'WEEK') {
      const itemDate = new Date(d).getTime();
      const sevenDaysAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      return itemDate >= sevenDaysAgo;
    }
    if (selectedTimeFilter === 'MONTH') {
      const currentMonth = today.slice(0, 7);
      return d.startsWith(currentMonth);
    }
    return true;
  };

  const personalTransactions: DisplayTransaction[] = useMemo(() => {
    const personalList = (expenses || []).filter(e => e.type !== 'GROUP');
    if (personalList.length > 0) {
      return personalList.map(e => {
        const catInfo = categoryMap[e.category] || {
          emoji: '📦',
          icon: 'credit-card' as const,
        };
        return {
          id: e.id || e.localId || String(Math.random()),
          title: e.title || e.category,
          category: e.category,
          amount: e.amount,
          type: 'expense' as const,
          date: e.date
            ? e.date.slice(0, 10)
            : (e as any).expenseDate
            ? (e as any).expenseDate.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          icon: catInfo.icon,
          emoji: catInfo.emoji,
          syncStatus: e.syncStatus,
        };
      });
    }
    return demoTransactions.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      amount: t.amount,
      type: t.type,
      date: t.date,
      icon: t.icon,
      emoji: categoryMap[t.category]?.emoji || '📦',
      syncStatus: 'synced',
    }));
  }, [expenses, categoryMap]);

  const filteredPersonalTransactions = useMemo(() => {
    return personalTransactions.filter(item => {
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesTime = matchesTimeFilter(item.date);

      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [personalTransactions, searchQuery, selectedCategory, selectedTimeFilter]);

  const filteredGroupExpenses = useMemo(() => {
    return groupExpenses.filter(item => {
      const title = (
        item.title ||
        item.subcategory ||
        item.category ||
        ''
      ).toLowerCase();
      const groupName = ((item as any).groupName || '').toLowerCase();
      const payer = (
        item.user?.name ||
        item.user?.username ||
        ''
      ).toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === '' ||
        title.includes(query) ||
        groupName.includes(query) ||
        payer.includes(query);

      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const expDate = item.expenseDate
        ? item.expenseDate.slice(0, 10)
        : item.createdAt
        ? item.createdAt.slice(0, 10)
        : '';
      const matchesTime = matchesTimeFilter(expDate);

      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [groupExpenses, searchQuery, selectedCategory, selectedTimeFilter]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredPersonalTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, count: filteredPersonalTransactions.length };
  }, [filteredPersonalTransactions]);

  const groupSummary = useMemo(() => {
    let totalSpend = 0;
    let youPaid = 0;
    filteredGroupExpenses.forEach(g => {
      const amt = Number(g.amount) || 0;
      totalSpend += amt;
      if (g.user?.id === userId) {
        youPaid += amt;
      }
    });
    return { totalSpend, youPaid, count: filteredGroupExpenses.length };
  }, [filteredGroupExpenses, userId]);

  const renderPersonalItem = ({ item }: { item: DisplayTransaction }) => {
    const isIncome = item.type === 'income';
    const isSettlement = item.type === 'settlement';

    return (
      <View
        key={item.id}
        className="flex-row justify-between items-center bg-card p-3.5 rounded-2xl border border-border mb-2.5 shadow-sm"
      >
        <View className="flex-row items-center flex-1 pr-2">
          <View
            className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${
              isIncome
                ? 'bg-emerald-50'
                : isSettlement
                ? 'bg-amber-50'
                : 'bg-rose-50'
            }`}
          >
            <Text className="text-xl">{item.emoji || '📦'}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text
                className="text-sm font-bold text-foreground"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {item.syncStatus === 'pending' && (
                <Feather name="clock" size={12} color="#D97706" />
              )}
            </View>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {item.date} • {item.category}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text
            className={`text-sm font-extrabold ${
              isIncome
                ? 'text-emerald-600'
                : isSettlement
                ? 'text-amber-600'
                : 'text-foreground'
            }`}
          >
            {isIncome ? '+' : '-'}৳{item.amount.toLocaleString('en-US')}
          </Text>
          <Text className="text-[10px] text-muted-foreground capitalize">
            {item.type}
          </Text>
        </View>
      </View>
    );
  };

  const renderGroupItem = ({ item }: { item: GroupExpense }) => {
    const isYou = item.user?.id === userId;
    const count = item.participants?.length || 1;
    const groupName = (item as any).groupName;
    const groupType = (item as any).groupType;
    const grpEmoji = groupType ? TYPE_EMOJI[groupType] || '👥' : '👥';

    return (
      <View key={item.id} className="mb-2.5">
        <GroupExpenseCard
          title={item.title || item.subcategory || item.category}
          amount={item.amount}
          category={item.category}
          paidByName={item.user.name || item.user.username}
          isYou={isYou}
          date={
            item.expenseDate
              ? item.expenseDate.slice(0, 10)
              : item.createdAt.slice(0, 10)
          }
          participantCount={count}
          onPress={() =>
            item.groupId && onNavigateToGroupDetails?.(item.groupId)
          }
        />
        {groupName && (
          <View className="flex-row items-center gap-1 mt-1 ml-2">
            <Text className="text-[10px]">{grpEmoji}</Text>
            <Text className="text-[11px] font-semibold text-primary">
              {groupName}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Sticky Top Header Bar (Fixed outside ScrollView) */}
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
            {selectedTimeFilter === 'TODAY'
              ? "Today's Expenses"
              : selectedTimeFilter === 'WEEK'
              ? "This Week's Expenses"
              : selectedTimeFilter === 'MONTH'
              ? "This Month's Expenses"
              : 'All Expenses'}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {transactionType === 'PERSONAL'
              ? `${summary.count} personal item${summary.count === 1 ? '' : 's'}`
              : `${groupSummary.count} group item${groupSummary.count === 1 ? '' : 's'}`}
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

        {/* Hero Summary Stat Cards at the top */}
        {transactionType === 'PERSONAL' ? (
          <View className="flex-row gap-2.5">
            <View className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm border-t-4 border-t-emerald-500">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                Total Income
              </Text>
              <Text className="text-sm font-extrabold text-emerald-600 mt-0.5">
                +৳{summary.income.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm border-t-4 border-t-destructive">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                Total Expense
              </Text>
              <Text className="text-sm font-extrabold text-destructive mt-0.5">
                -৳{summary.expense.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm border-t-4 border-t-primary">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                Expenses
              </Text>
              <Text className="text-sm font-extrabold text-foreground mt-0.5">
                {summary.count} items
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row gap-2.5">
            <View className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm border-t-4 border-t-destructive">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                Total Spent
              </Text>
              <Text className="text-sm font-extrabold text-destructive mt-0.5">
                -৳{groupSummary.totalSpend.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm border-t-4 border-t-emerald-500">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                You Paid
              </Text>
              <Text className="text-sm font-extrabold text-emerald-600 mt-0.5">
                ৳{groupSummary.youPaid.toLocaleString()}
              </Text>
            </View>

            <View className="flex-1 bg-card p-3.5 rounded-2xl border border-border shadow-sm border-t-4 border-t-primary">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                Expenses
              </Text>
              <Text className="text-sm font-extrabold text-foreground mt-0.5">
                {groupSummary.count} items
              </Text>
            </View>
          </View>
        )}

        {/* Filter Section: Appears smoothly below summary cards as you scroll */}
        <View className="gap-3">
          {/* Tab Switcher: Personal vs Group */}
          <View className="flex-row bg-muted p-1 rounded-xl">
            <TouchableOpacity
              className={`flex-1 py-2 items-center rounded-lg ${
                transactionType === 'PERSONAL'
                  ? 'bg-primary-light border border-indigo-200 shadow-xs'
                  : ''
              }`}
              onPress={() => setTransactionType('PERSONAL')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  transactionType === 'PERSONAL'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Personal Expenses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2 items-center rounded-lg ${
                transactionType === 'GROUP'
                  ? 'bg-primary-light border border-indigo-200 shadow-xs'
                  : ''
              }`}
              onPress={() => setTransactionType('GROUP')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs font-bold ${
                  transactionType === 'GROUP'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                Group Expenses
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Filter Pills: All Time, Today, This Week, This Month */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-1.5 py-0.5"
          >
            {TIME_FILTERS.map(tf => {
              const isSelected = selectedTimeFilter === tf.id;
              return (
                <TouchableOpacity
                  key={tf.id}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    isSelected
                      ? 'bg-primary-light border-indigo-300'
                      : 'bg-card border-border'
                  }`}
                  onPress={() => setSelectedTimeFilter(tf.id)}
                  activeOpacity={0.7}
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

          {/* Group Selector Pills (if Group Tab) */}
          {transactionType === 'GROUP' && groups.length > 0 && (
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
                    selectedGroupId === 'ALL'
                      ? 'text-primary'
                      : 'text-muted-foreground'
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

          {/* Search Input Bar */}
          <View className="flex-row items-center bg-card border border-border rounded-xl px-3.5 h-11 shadow-xs">
            <Feather
              name="search"
              size={16}
              color="#94A3B8"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-sm text-foreground"
              placeholder="Search expenses..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Expenses List */}
        {transactionType === 'GROUP' && isLoadingGroups ? (
          <View className="items-center justify-center py-16 gap-3">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-xs text-muted-foreground">
              Loading group expenses...
            </Text>
          </View>
        ) : (
          <View className="gap-1">
            {(transactionType === 'PERSONAL'
              ? filteredPersonalTransactions
              : filteredGroupExpenses
            ).map(item => (
              <View key={item.id}>
                {transactionType === 'PERSONAL'
                  ? renderPersonalItem({ item: item as DisplayTransaction })
                  : renderGroupItem({ item: item as GroupExpense })}
              </View>
            ))}

            {(transactionType === 'PERSONAL'
              ? filteredPersonalTransactions.length === 0
              : filteredGroupExpenses.length === 0) && (
              <View className="items-center justify-center py-16 px-4 bg-card rounded-2xl border border-dashed border-border mt-2">
                <View className="w-16 h-16 rounded-full bg-primary-light items-center justify-center mb-3">
                  <Feather name="credit-card" size={30} color="#4F46E5" />
                </View>
                <Text className="text-base font-bold text-foreground mb-1">
                  {selectedTimeFilter === 'TODAY'
                    ? 'No Expenses Logged Today'
                    : 'No Expenses Found'}
                </Text>
                <Text className="text-xs text-muted-foreground text-center leading-relaxed">
                  {searchQuery
                    ? 'Try different keywords or filters.'
                    : selectedTimeFilter === 'TODAY'
                    ? 'You have not added any expenses for today yet.'
                    : 'Start adding personal or group expenses to see them here.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
