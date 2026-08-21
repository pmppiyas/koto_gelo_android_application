import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from '../components/ui/core';
import {
  groupService,
  Group,
  GroupBalance,
  GroupExpense,
  GroupDeposit,
} from '../services/groupService';
import { AddGroupDepositModal } from '../components/group/AddGroupDepositModal';
import { AddGroupExpenseModal } from '../components/group/AddGroupExpenseModal';
import { useAuth, useExpenses } from '../store/hooks';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { BOTTOM_TAB_HEIGHT, spacing } from '../constants/spacing';
import { getLocalDateString } from '../utils/date';

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

export interface MemberBalanceItem {
  userId: string;
  username?: string;
  name?: string | null;
  user?: {
    id: string;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
  totalDeposited?: number;
  totalPaid?: number;
  totalShare?: number;
  netBalance?: number;
}

export interface GroupBalancesScreenProps {
  groupId?: string;
  onNavigateBack?: () => void;
  onSelectGroup?: (groupId: string) => void;
  onNavigateToCreateGroup?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToPersonalExpenses?: () => void;
  onNavigateToTransactions?: () => void;
  onNavigateToGroups?: () => void;
}

type PeriodType = 'WEEK' | 'MONTH' | 'YEAR';
type GroupTabType = 'EXPENSES' | 'DEPOSITS' | 'ANALYTICS' | 'MEMBERS';

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

export const GroupBalancesScreen: React.FC<GroupBalancesScreenProps> = ({
  groupId: propGroupId,
  onNavigateBack,
  onSelectGroup,
  onNavigateToCreateGroup,
  onNavigateToAnalytics,
  onNavigateToPersonalExpenses,
  onNavigateToTransactions,
  onNavigateToGroups,
}) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || '';
  const { expenses: localExpenses, newlyAddedId } = useExpenses();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    propGroupId || '',
  );
  const [balance, setBalance] = useState<GroupBalance | null>(null);
  const [groupDetails, setGroupDetails] = useState<Group | null>(null);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [groupDeposits, setGroupDeposits] = useState<GroupDeposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GroupTabType>('EXPENSES');
  const [periodType, setPeriodType] = useState<PeriodType>('MONTH');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (propGroupId && propGroupId !== selectedGroupId) {
      setSelectedGroupId(propGroupId);
    }
  }, [propGroupId]);

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

  const fetchGroupsAndData = useCallback(
    async (isRefresh = false) => {
      if (!isAuthenticated) {
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (!isRefresh) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const response = await groupService.getGroups({ limit: 50 });
        const list: Group[] = response?.groups || response?.data?.groups || [];
        setGroups(list);

        const targetId = selectedGroupId || (list.length > 0 ? list[0].id : '');
        if (targetId) {
          setSelectedGroupId(targetId);
          const [balRes, grpRes, expRes, depRes] = await Promise.allSettled([
            groupService.getGroupBalance(targetId),
            groupService.getGroupById(targetId),
            groupService.getGroupExpenses(targetId, { limit: 100 }),
            groupService.getGroupDeposits(targetId, { limit: 100 }),
          ]);

          if (grpRes.status === 'fulfilled') setGroupDetails((grpRes.value as any)?.data || grpRes.value);
          if (expRes.status === 'fulfilled') setGroupExpenses((expRes.value as any)?.history || (expRes.value as any)?.expenses || expRes.value || []);
          if (depRes.status === 'fulfilled') setGroupDeposits((depRes.value as any)?.deposits || depRes.value || []);
          if (balRes.status === 'fulfilled') {
            const val = balRes.value;
            const balanceData: GroupBalance = (val as any)?.data || val;
            setBalance(balanceData);
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [isAuthenticated, selectedGroupId],
  );

  useEffect(() => {
    fetchGroupsAndData();
  }, [fetchGroupsAndData]);

  const handleRefresh = async () => {
    await fetchGroupsAndData(true);
  };

  const selectedGroup = useMemo(() => {
    if (groupDetails) return groupDetails;
    return groups.find(g => g.id === selectedGroupId) || null;
  }, [groupDetails, groups, selectedGroupId]);

  const computedMetrics = useMemo(() => {
    const rawLocalGroupExpenses = (localExpenses || []).filter(
      e => e.type === 'GROUP' && (!selectedGroupId || !e.groupId || e.groupId === selectedGroupId),
    );

    const expenseMap = new Map<string, GroupExpense>();
    rawLocalGroupExpenses.forEach(e => {
      const key = e.serverId || e.localId || (e as any).id || String(Math.random());
      expenseMap.set(key, {
        id: key,
        groupId: e.groupId || selectedGroupId,
        userId: e.userId || userId,
        amount: Number(e.amount) || 0,
        category: e.category || 'Other',
        subcategory: e.subcategory,
        title: e.title,
        expenseDate: e.date || (e as any).expenseDate || e.createdAt || new Date().toISOString(),
        createdAt: e.createdAt || new Date().toISOString(),
        user: { id: e.userId || userId, name: user?.name, username: user?.username || 'You', avatarUrl: user?.avatarUrl },
        participants: (e as any).participants || [],
      } as any);
    });

    groupExpenses.forEach(e => { if (e.id) expenseMap.set(e.id, e); });
    const allExpensesList = Array.from(expenseMap.values()).sort((a, b) => new Date(b.expenseDate || b.createdAt || 0).getTime() - new Date(a.expenseDate || a.createdAt || 0).getTime());

    const totalExpenses = Math.max(
      balance?.totalExpenses ?? 0,
      allExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    );
    const totalDeposits = Math.max(
      balance?.totalDeposits ?? 0,
      groupDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    );

    const members = selectedGroup?.members || [];
    const memberMap = new Map<string, MemberBalanceItem>();

    // 1. Initialize members
    members.forEach(m => {
      const u = m.user || (m as any);
      const mId = u.id || m.userId;
      memberMap.set(mId, {
        userId: mId,
        username: u.username,
        name: u.name || u.username,
        user: u,
        totalDeposited: 0,
        totalPaid: 0,
        totalShare: 0,
        netBalance: 0,
      });
    });

    // 2. Sum deposits per member from groupDeposits
    groupDeposits.forEach(dep => {
      const uId = dep.userId || dep.user?.id;
      if (uId && memberMap.has(uId)) {
        const item = memberMap.get(uId)!;
        item.totalDeposited = (item.totalDeposited || 0) + (Number(dep.amount) || 0);
      }
    });

    const totalMembersCount = Math.max(
      1,
      memberMap.size || (members.length > 0 ? members.length : 1),
    );

    // 3. Calculate actual share per member from expenses (respecting participants)
    allExpensesList.forEach(exp => {
      const expAmt = Number(exp.amount) || 0;
      if (exp.participants && exp.participants.length > 0) {
        exp.participants.forEach((p: any) => {
          const pId = p.userId || p.user?.id;
          if (pId && memberMap.has(pId)) {
            const memberItem = memberMap.get(pId)!;
            const share = Number(p.shareAmount) || expAmt / exp.participants.length;
            memberItem.totalShare = (memberItem.totalShare || 0) + share;
          }
        });
      } else {
        const equalPart = expAmt / totalMembersCount;
        memberMap.forEach(item => {
          item.totalShare = (item.totalShare || 0) + equalPart;
        });
      }
    });

    // 4. Calculate net balance for each member: totalDeposited - totalShare
    memberMap.forEach(item => {
      item.netBalance = Math.round((item.totalDeposited || 0) - (item.totalShare || 0));
    });

    const memberBalancesList = Array.from(memberMap.values());

    // 5. Current User's numbers
    const userDepositsFromList = groupDeposits
      .filter(d => d.userId === userId || d.user?.id === userId)
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

    const yourDeposited = Math.max(
      userDepositsFromList,
      memberMap.get(userId)?.totalDeposited || 0,
      balance?.yourDeposited || 0
    );

    const yourShare = Math.round(memberMap.get(userId)?.totalShare || 0);
    const netBalance = Math.round(yourDeposited - yourShare);
    const isPositiveBalance = netBalance >= 0;

    return {
      totalExpenses,
      totalDeposits,
      remainingFund: totalDeposits - totalExpenses,
      totalMembers: totalMembersCount,
      yourDeposited,
      yourShare,
      netBalance,
      isPositiveBalance,
      balances: memberBalancesList,
      allExpensesList,
    };
  }, [balance, groupExpenses, groupDeposits, localExpenses, selectedGroup, selectedGroupId, userId, user]);

  const analyticsData = useMemo(() => {
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();
    const filtered = computedMetrics.allExpensesList.filter(e => {
      const d = parseExpenseDate(e.expenseDate || e.createdAt);
      if (!d) return false;
      if (periodType === 'MONTH') return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      if (periodType === 'YEAR') return d.getFullYear() === targetYear;
      if (periodType === 'WEEK') {
        const start = new Date(selectedDate); start.setDate(selectedDate.getDate() - selectedDate.getDay()); start.setHours(0, 0, 0, 0);
        const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      return true;
    });

    const catMap: Record<string, { amount: number; count: number; emoji: string }> = {};
    let total = 0;
    for (const exp of filtered) {
      const cat = exp.category || 'Other';
      const amt = Number(exp.amount) || 0;
      total += amt;
      if (!catMap[cat]) catMap[cat] = { amount: 0, count: 0, emoji: categoryMap[cat]?.emoji || '📦' };
      catMap[cat].amount += amt;
      catMap[cat].count += 1;
    }
    const list = Object.entries(catMap).map(([category, data]) => ({ category, ...data, percentage: total > 0 ? (data.amount / total) * 100 : 0 }));
    list.sort((a, b) => b.amount - a.amount);
    return { list, total, filteredCount: filtered.length };
  }, [computedMetrics.allExpensesList, periodType, selectedDate, categoryMap]);

  const changePeriod = (dir: -1 | 1) => {
    const next = new Date(selectedDate);
    if (periodType === 'MONTH') next.setMonth(next.getMonth() + dir);
    else if (periodType === 'YEAR') next.setFullYear(next.getFullYear() + dir);
    else if (periodType === 'WEEK') next.setDate(next.getDate() + dir * 7);
    setSelectedDate(next);
  };

  const periodLabel = useMemo(() => {
    if (periodType === 'MONTH') return `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    if (periodType === 'YEAR') return `${selectedDate.getFullYear()}`;
    return `Week of ${selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  }, [periodType, selectedDate]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4" contentContainerStyle={{ paddingBottom: BOTTOM_TAB_HEIGHT + spacing.xl }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#4F46E5']} tintColor="#4F46E5" />}>
        <View className="flex-row justify-between items-center py-1">
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            {onNavigateBack && (
              <TouchableOpacity onPress={onNavigateBack} className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center shadow-xs" activeOpacity={0.7}>
                <Feather name="arrow-left" size={18} color="#0F172A" />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground font-medium">Welcome to</Text>
              <Text className="text-xl font-extrabold text-foreground" numberOfLines={1}>{selectedGroup ? `${TYPE_EMOJI[selectedGroup.type || 'OTHER'] || '👥'} ${selectedGroup.name}` : 'Group Dashboard'}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity className={`w-10 h-10 rounded-full border items-center justify-center shadow-xs ${activeTab === 'MEMBERS' ? 'bg-primary-light border-indigo-200' : 'bg-card border-border'}`} activeOpacity={0.7} onPress={() => setActiveTab('MEMBERS')}>
              <Feather name="users" size={18} color={activeTab === 'MEMBERS' ? '#4F46E5' : '#0F172A'} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && groups.length === 0 ? (
          <View className="py-20 items-center justify-center gap-3"><ActivityIndicator size="large" color="#4F46E5" /><Text className="text-xs text-muted-foreground">Loading group data...</Text></View>
        ) : selectedGroup ? (
          <View className="gap-4">
            {/* 1. Main Luxury Dark Hero Card */}
            <View className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      computedMetrics.remainingFund >= 0
                        ? 'bg-emerald-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <Text className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                    Group Balance
                  </Text>
                </View>
                <View className="bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                  <Text className="text-[11px] font-bold text-indigo-300">
                    BDT
                  </Text>
                </View>
              </View>

              <Text
                className={`text-3xl font-black tracking-tight mt-1 mb-5 ${
                  computedMetrics.remainingFund >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {computedMetrics.remainingFund >= 0 ? '+' : '-'} ৳
                {Math.abs(computedMetrics.remainingFund).toLocaleString('en-US')}
              </Text>

              {/* Bottom 2 sub-boxes inside Main Card */}
              <View className="flex-row items-center gap-3">
                {/* Sub-box 1: You Deposited */}
                <View className="flex-1 bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Feather name="arrow-down-left" size={13} color="#34D399" />
                    <Text className="text-[11px] text-slate-400 font-medium">
                      You Deposited
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-emerald-400">
                    +৳{computedMetrics.yourDeposited.toLocaleString('en-US')}
                  </Text>
                </View>

                {/* Sub-box 2: Your Balance / You need to pay */}
                <View className="flex-1 bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <Feather
                      name={
                        computedMetrics.isPositiveBalance
                          ? 'arrow-down-left'
                          : 'arrow-up-right'
                      }
                      size={13}
                      color={
                        computedMetrics.isPositiveBalance
                          ? '#34D399'
                          : '#FB7185'
                      }
                    />
                    <Text className="text-[11px] text-slate-400 font-medium">
                      {computedMetrics.isPositiveBalance
                        ? 'Your Balance'
                        : 'You need to pay'}
                    </Text>
                  </View>
                  <Text
                    className={`text-sm font-bold ${
                      computedMetrics.isPositiveBalance
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {computedMetrics.isPositiveBalance ? '+' : '-'}৳
                    {Math.abs(computedMetrics.netBalance).toLocaleString(
                      'en-US',
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4 Interactive Action Tabs Bar */}
            <View className="flex-row justify-between gap-2 bg-card p-3 rounded-2xl border border-border shadow-sm">
              <TouchableOpacity className={`flex-1 items-center gap-1.5 py-1 rounded-xl ${activeTab === 'DEPOSITS' ? 'bg-emerald-50 border border-emerald-200' : ''}`} onPress={() => setActiveTab('DEPOSITS')} activeOpacity={0.8}>
                <View className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${activeTab === 'DEPOSITS' ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-500'}`}><Feather name="download" size={19} color="#FFFFFF" /></View>
                <Text className={`text-[11px] font-bold ${activeTab === 'DEPOSITS' ? 'text-emerald-700' : 'text-foreground'}`}>Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity className={`flex-1 items-center gap-1.5 py-1 rounded-xl ${activeTab === 'EXPENSES' ? 'bg-primary-light border border-indigo-200' : ''}`} onPress={() => setActiveTab('EXPENSES')} activeOpacity={0.8}>
                <View className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${activeTab === 'EXPENSES' ? 'bg-primary ring-2 ring-indigo-300' : 'bg-primary'}`}><Feather name="plus" size={21} color="#FFFFFF" /></View>
                <Text className={`text-[11px] font-bold ${activeTab === 'EXPENSES' ? 'text-primary' : 'text-foreground'}`}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity className={`flex-1 items-center gap-1.5 py-1 rounded-xl ${activeTab === 'ANALYTICS' ? 'bg-slate-100 border border-slate-300' : ''}`} onPress={() => setActiveTab('ANALYTICS')} activeOpacity={0.8}>
                <View className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${activeTab === 'ANALYTICS' ? 'bg-slate-900 ring-2 ring-slate-400' : 'bg-slate-800'}`}><Feather name="pie-chart" size={19} color="#FFFFFF" /></View>
                <Text className={`text-[11px] font-bold ${activeTab === 'ANALYTICS' ? 'text-slate-900' : 'text-foreground'}`}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity className={`flex-1 items-center gap-1.5 py-1 rounded-xl ${activeTab === 'MEMBERS' ? 'bg-primary-light border border-indigo-200' : ''}`} onPress={() => setActiveTab('MEMBERS')} activeOpacity={0.8}>
                <View className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${activeTab === 'MEMBERS' ? 'bg-indigo-600 ring-2 ring-indigo-300' : 'bg-indigo-500'}`}><Feather name="users" size={19} color="#FFFFFF" /></View>
                <Text className={`text-[11px] font-bold ${activeTab === 'MEMBERS' ? 'text-primary' : 'text-foreground'}`}>Members</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'EXPENSES' && (
              <View className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2"><Text className="text-base font-bold text-foreground">Group Expenses</Text><View className="bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"><Text className="text-[11px] font-bold text-rose-700">{computedMetrics.allExpensesList.length}</Text></View></View>
                  <TouchableOpacity className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full shadow-xs" onPress={() => setIsExpenseModalOpen(true)} activeOpacity={0.8}><Feather name="plus" size={13} color="#FFFFFF" /><Text className="text-xs font-bold text-white">Add Expense</Text></TouchableOpacity>
                </View>
                {computedMetrics.allExpensesList.map((item, index) => {
                  const isNewlyAdded =
                    !!newlyAddedId &&
                    (item.id === newlyAddedId || (item as any).localId === newlyAddedId);
                  return (
                    <View
                      key={item.id || index}
                      className={`flex-row justify-between items-center py-3 px-2 rounded-xl transition-all ${
                        isNewlyAdded
                          ? 'bg-primary-light/70 border border-indigo-300 my-1 shadow-xs'
                          : index !== computedMetrics.allExpensesList.length - 1
                          ? 'border-b border-border'
                          : ''
                      }`}
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        <View
                          className={`w-10 h-10 rounded-xl ${
                            isNewlyAdded
                              ? 'bg-primary border border-indigo-500'
                              : 'bg-rose-50 border border-rose-100'
                          } items-center justify-center mr-3`}
                        >
                          <Feather
                            name={(categoryMap[item.category]?.icon || 'credit-card') as any}
                            size={18}
                            color={isNewlyAdded ? '#FFFFFF' : '#EF4444'}
                          />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className={`text-sm font-bold ${
                                isNewlyAdded ? 'text-primary' : 'text-card-foreground'
                              } mb-0.5`}
                              numberOfLines={1}
                            >
                              {item.title || item.subcategory || item.category}
                            </Text>
                            {isNewlyAdded && (
                              <View className="bg-primary px-1.5 py-0.5 rounded-full shadow-2xs">
                                <Text className="text-[9px] font-black text-white">✨ NEW</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-xs text-muted-foreground">
                            {item.user?.id === userId
                              ? 'Paid by You'
                              : `Paid by ${item.user?.name || 'Member'}`}{' '}
                            • {item.expenseDate?.slice(0, 10)}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text
                          className={`text-sm font-extrabold ${
                            isNewlyAdded ? 'text-primary' : 'text-foreground'
                          } mb-0.5`}
                        >
                          -৳{Number(item.amount).toLocaleString('en-US')}
                        </Text>
                        <Text className="text-xs text-muted-foreground">{item.category}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'DEPOSITS' && (
              <View className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2"><Text className="text-base font-bold text-foreground">Group Deposits</Text><View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"><Text className="text-[11px] font-bold text-emerald-700">{groupDeposits.length}</Text></View></View>
                  <TouchableOpacity className="flex-row items-center gap-1 bg-emerald-600 px-3 py-1.5 rounded-full shadow-xs" onPress={() => setIsDepositModalOpen(true)} activeOpacity={0.8}><Feather name="plus" size={13} color="#FFFFFF" /><Text className="text-xs font-bold text-white">Add Deposit</Text></TouchableOpacity>
                </View>
                {groupDeposits.map((dep, index) => (
                  <View key={dep.id || index} className={`flex-row justify-between items-center py-3 ${index !== groupDeposits.length - 1 ? 'border-b border-border' : ''}`}>
                    <View className="flex-row items-center flex-1 pr-3"><View className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center mr-3"><Feather name="download" size={18} color="#059669" /></View><View className="flex-1"><Text className="text-sm font-semibold text-card-foreground mb-0.5" numberOfLines={1}>{(dep.userId === userId || dep.user?.id === userId) ? 'Deposited by You' : `Deposited by ${dep.user?.name || 'Member'}`}</Text><Text className="text-xs text-muted-foreground">{dep.createdAt?.slice(0, 10)}</Text></View></View>
                    <View className="items-end"><Text className="text-sm font-bold text-emerald-600 mb-0.5">+৳{Number(dep.amount).toLocaleString('en-US')}</Text><Text className="text-[10px] text-muted-foreground uppercase font-bold">Deposit</Text></View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'ANALYTICS' && (
              <View className="gap-3">
                <View className="flex-row bg-muted p-1 rounded-xl">{(['WEEK', 'MONTH', 'YEAR'] as PeriodType[]).map(p => (<TouchableOpacity key={p} className={`flex-1 py-2 items-center rounded-lg ${periodType === p ? 'bg-primary-light border border-indigo-200 shadow-xs' : ''}`} onPress={() => setPeriodType(p)} activeOpacity={0.7}><Text className={`text-xs font-bold ${periodType === p ? 'text-primary' : 'text-muted-foreground'}`}>{p === 'WEEK' ? 'Weekly' : p === 'MONTH' ? 'Monthly' : 'Yearly'}</Text></TouchableOpacity>))}</View>
                <View className="flex-row items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-xs">
                  <TouchableOpacity className="w-8 h-8 rounded-full bg-muted items-center justify-center" onPress={() => changePeriod(-1)}><Feather name="chevron-left" size={18} color="#0F172A" /></TouchableOpacity>
                  <Text className="text-sm font-extrabold text-foreground">{periodLabel}</Text>
                  <TouchableOpacity className="w-8 h-8 rounded-full bg-muted items-center justify-center" onPress={() => changePeriod(1)}><Feather name="chevron-right" size={18} color="#0F172A" /></TouchableOpacity>
                </View>
                <View className="bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-800"><Text className="text-xs text-slate-400 font-medium mb-1">Total Spend in {periodLabel}</Text><Text className="text-3xl font-black text-white">৳{analyticsData.total.toLocaleString()}</Text></View>
                <View className="bg-card rounded-2xl border border-border p-4 shadow-sm gap-3">
                  <Text className="text-sm font-bold text-foreground">Category Breakdown</Text>
                  {analyticsData.list.map((cat, idx) => (
                    <View key={idx} className="bg-muted/40 p-3 rounded-xl border border-border/60 gap-1.5">
                      <View className="flex-row justify-between items-center"><View className="flex-row items-center gap-2"><Text className="text-base">{cat.emoji}</Text><Text className="text-xs font-bold text-foreground">{cat.category}</Text></View><Text className="text-xs font-black text-foreground">৳{cat.amount.toLocaleString()} ({cat.percentage.toFixed(1)}%)</Text></View>
                      <View className="h-2 w-full bg-muted rounded-full overflow-hidden"><View className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }} /></View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'MEMBERS' && (
              <View className="bg-card rounded-2xl border border-border p-4 shadow-sm gap-3">
                <Text className="text-base font-bold text-foreground">Member Balances</Text>
                {computedMetrics.balances.map((item, idx) => {
                  const net = item.netBalance ?? 0;
                  const isPositive = net > 0;
                  return (
                    <View key={item.userId || idx} className="flex-row items-center justify-between bg-muted/40 p-3.5 rounded-2xl border border-border/60">
                      <View className="flex-row items-center gap-3 flex-1"><View className="w-10 h-10 rounded-full bg-primary-light border border-indigo-100 items-center justify-center"><Text className="text-sm font-bold text-primary">{item.name?.charAt(0).toUpperCase()}</Text></View><View><Text className="text-xs font-bold text-foreground">{item.name} {item.userId === userId ? '(You)' : ''}</Text><Text className="text-[11px] text-muted-foreground">Dep: ৳{(item.totalDeposited || 0).toLocaleString()} • Share: ৳{Math.round(item.totalShare || 0).toLocaleString()}</Text></View></View>
                      <View className={`px-2.5 py-1 rounded-full border ${net === 0 ? 'bg-slate-100 border-slate-200' : isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}><Text className={`text-[10px] font-bold ${net === 0 ? 'text-slate-600' : isPositive ? 'text-emerald-700' : 'text-destructive'}`}>{net === 0 ? 'Settled' : isPositive ? `+৳${Math.abs(Math.round(net)).toLocaleString()} rec` : `-৳${Math.abs(Math.round(net)).toLocaleString()} pay`}</Text></View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View className="bg-card rounded-2xl p-8 items-center justify-center border border-dashed border-border mt-4"><Text className="text-base font-bold text-foreground">No Groups Found</Text></View>
        )}
      </ScrollView>
      {selectedGroupId && <AddGroupDepositModal visible={isDepositModalOpen} groupId={selectedGroupId} members={selectedGroup?.members || []} onClose={() => setIsDepositModalOpen(false)} onSuccess={() => { setIsDepositModalOpen(false); fetchGroupsAndData(true); }} />}
      {selectedGroupId && <AddGroupExpenseModal visible={isExpenseModalOpen} groupId={selectedGroupId} members={selectedGroup?.members || []} onClose={() => setIsExpenseModalOpen(false)} onSuccess={() => { setIsExpenseModalOpen(false); fetchGroupsAndData(true); }} />}
    </SafeAreaView>
  );
};
