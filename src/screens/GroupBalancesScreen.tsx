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
import { HeroStatCard } from '../components/common/HeroStatCard';
import {
  groupService,
  Group,
  GroupBalance,
  GroupExpense,
  GroupDeposit,
} from '../services/groupService';
import { localGroupService } from '../services/localGroupService';
import { AddGroupDepositModal } from '../components/group/AddGroupDepositModal';
import { AddGroupExpenseModal } from '../components/group/AddGroupExpenseModal';
import { InviteMemberModal } from '../components/group/InviteMemberModal';
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GroupTabType>('EXPENSES');
  const [periodType, setPeriodType] = useState<PeriodType>('MONTH');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (propGroupId && propGroupId !== selectedGroupId) {
      setSelectedGroupId(propGroupId);
    }
  }, [propGroupId]);

  // Instant 0ms offline cache load
  useEffect(() => {
    let isMounted = true;
    const loadOfflineData = async () => {
      try {
        const cachedGroups = await localGroupService.getStoredGroups();
        if (!isMounted) return;
        if (cachedGroups && cachedGroups.length > 0) {
          setGroups(cachedGroups);
          const targetId = selectedGroupId || cachedGroups[0].id;
          if (targetId) {
            setSelectedGroupId(targetId);
            const [cachedGrp, cachedExp, cachedDep] = await Promise.all([
              localGroupService.getStoredGroupById(targetId),
              localGroupService.getStoredGroupExpenses(targetId),
              localGroupService.getStoredGroupDeposits(targetId),
            ]);
            if (isMounted) {
              if (cachedGrp) setGroupDetails(cachedGrp);
              if (cachedExp && cachedExp.length > 0)
                setGroupExpenses(cachedExp as any);
              if (cachedDep && cachedDep.length > 0)
                setGroupDeposits(cachedDep as any);
              setIsLoading(false);
            }
          }
        }
      } catch {}
    };
    loadOfflineData();
    return () => {
      isMounted = false;
    };
  }, [selectedGroupId]);

  const categoryMap = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        emoji: string;
        icon: keyof typeof Feather.glyphMap;
        color: string;
        bgColor: string;
      }
    > = {};
    EXPENSE_CATEGORIES.forEach(c => {
      map[c.name] = {
        name: c.name,
        emoji: c.emoji,
        icon: c.icon,
        color: c.color,
        bgColor: c.bgColor,
      };
      map[c.slug] = {
        name: c.name,
        emoji: c.emoji,
        icon: c.icon,
        color: c.color,
        bgColor: c.bgColor,
      };
      map[c.id] = {
        name: c.name,
        emoji: c.emoji,
        icon: c.icon,
        color: c.color,
        bgColor: c.bgColor,
      };
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

      if (!isRefresh && groups.length === 0) setIsLoading(true);
      else if (isRefresh) setIsRefreshing(true);

      try {
        const response = await groupService.getGroups({ limit: 50 });
        const list: Group[] = response?.groups || response?.data?.groups || [];
        if (list.length > 0) {
          setGroups(list);
          localGroupService.setStoredGroups(list).catch(() => {});
        }

        const targetId = selectedGroupId || (list.length > 0 ? list[0].id : '');
        if (targetId) {
          setSelectedGroupId(targetId);
          const [balRes, grpRes, expRes, depRes] = await Promise.allSettled([
            groupService.getGroupBalance(targetId, user?.id),
            groupService.getGroupById(targetId),
            groupService.getGroupExpenses(targetId, { limit: 100 }),
            groupService.getGroupDeposits(targetId, { limit: 100 }),
          ]);

          if (grpRes.status === 'fulfilled') {
            const grpData = (grpRes.value as any)?.data || grpRes.value;
            setGroupDetails(grpData);
            if (grpData)
              localGroupService
                .saveGroupLocally(grpData, 'synced')
                .catch(() => {});
          }
          if (expRes.status === 'fulfilled') {
            const expVal = expRes.value as any;
            const expList =
              expVal?.data?.history ||
              expVal?.data?.expenses ||
              expVal?.history ||
              expVal?.expenses ||
              (Array.isArray(expVal?.data)
                ? expVal.data
                : Array.isArray(expVal)
                ? expVal
                : []);
            if (Array.isArray(expList) && expList.length > 0) {
              setGroupExpenses(expList);
              localGroupService.setStoredGroupExpenses(expList).catch(() => {});
            }
          }
          if (depRes.status === 'fulfilled') {
            const depVal = depRes.value as any;
            const depList =
              depVal?.data?.deposits ||
              depVal?.deposits ||
              (Array.isArray(depVal?.data)
                ? depVal.data
                : Array.isArray(depVal)
                ? depVal
                : []);
            if (Array.isArray(depList)) {
              setGroupDeposits(depList);
              if (depList.length > 0) {
                localGroupService.setStoredGroupDeposits(depList).catch(() => {});
              }
            }
          }
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
    [isAuthenticated, selectedGroupId, groups.length],
  );

  useEffect(() => {
    fetchGroupsAndData();
  }, [fetchGroupsAndData]);

  const handleRefresh = async () => {
    await fetchGroupsAndData(true);
  };

  const refreshFromLocalDb = useCallback(async (targetGroupId: string) => {
    if (!targetGroupId) return;
    try {
      const [cachedExp, cachedDep] = await Promise.all([
        localGroupService.getStoredGroupExpenses(targetGroupId),
        localGroupService.getStoredGroupDeposits(targetGroupId),
      ]);
      if (cachedExp && cachedExp.length > 0) setGroupExpenses(cachedExp as any);
      if (cachedDep && cachedDep.length > 0) setGroupDeposits(cachedDep as any);
    } catch {}
  }, []);

  const selectedGroup = useMemo(() => {
    if (groupDetails) return groupDetails;
    return groups.find(g => g.id === selectedGroupId) || null;
  }, [groupDetails, groups, selectedGroupId]);

  const groupMembers = useMemo(() => {
    return selectedGroup?.members || [];
  }, [selectedGroup]);

  const computedMetrics = useMemo(() => {
    const rawLocalGroupExpenses = (localExpenses || []).filter(
      e =>
        e.type === 'GROUP' &&
        (!selectedGroupId || !e.groupId || e.groupId === selectedGroupId),
    );

    const expenseMap = new Map<string, GroupExpense>();
    rawLocalGroupExpenses.forEach(e => {
      const key =
        e.serverId || e.localId || (e as any).id || String(Math.random());
      expenseMap.set(key, {
        id: key,
        groupId: e.groupId || selectedGroupId,
        userId: e.userId || userId,
        amount: Number(e.amount) || 0,
        category: e.category || 'Other',
        subcategory: e.subcategory,
        title: e.title,
        expenseDate:
          e.date ||
          (e as any).expenseDate ||
          e.createdAt ||
          new Date().toISOString(),
        createdAt: e.createdAt || new Date().toISOString(),
        user: {
          id: e.userId || userId,
          name: user?.name,
          username: user?.username || 'You',
          avatarUrl: user?.avatarUrl,
        },
        participants: (e as any).participants || [],
      } as any);
    });

    groupExpenses.forEach(e => {
      if (e.id) expenseMap.set(e.id, e);
    });
    const allExpensesList = Array.from(expenseMap.values()).sort(
      (a, b) =>
        new Date(b.expenseDate || b.createdAt || 0).getTime() -
        new Date(a.expenseDate || a.createdAt || 0).getTime(),
    );

    const totalExpenses = Math.max(
      balance?.totalExpenses ?? 0,
      allExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    );
    const totalDeposits = Math.max(
      balance?.totalDeposits ?? 0,
      groupDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    );

    const members = selectedGroup?.members || [];
    const memberMap = new Map<string, MemberBalanceItem>();

    // 1. Initialize members using canonical userId
    members.forEach(m => {
      const u = m.user || (m as any);
      const uId = m.userId || m.user?.id || (m as any).id;
      if (!uId) return;
      memberMap.set(uId, {
        userId: uId,
        username: u.username || (m as any).username || 'Member',
        name: u.name || (m as any).name || u.username || 'Member',
        user: u,
        totalDeposited: 0,
        totalPaid: 0,
        totalShare: 0,
        netBalance: 0,
      });
    });

    // 2. If server balance has member details, hydrate memberMap directly from server ground truth
    if (balance?.balances && Array.isArray(balance.balances) && balance.balances.length > 0) {
      balance.balances.forEach((b: any) => {
        const bUserId = b.userId || b.user?.id || b.id;
        if (!bUserId) return;
        const existing = memberMap.get(bUserId);
        const depAmt = Number(b.totalDeposited ?? b.paid ?? 0);
        const shareAmt = Number(b.totalShare ?? b.owes ?? 0);
        const netAmt = Number(b.netBalance ?? b.net ?? (depAmt - shareAmt));

        if (existing) {
          existing.totalDeposited = depAmt;
          existing.totalShare = shareAmt;
          existing.netBalance = netAmt;
          if (b.user) existing.user = b.user;
          if (b.username) existing.username = b.username;
          if (b.name) existing.name = b.name;
        } else {
          memberMap.set(bUserId, {
            userId: bUserId,
            username: b.username || b.user?.username || 'Member',
            name: b.name || b.user?.name || b.username || 'Member',
            user: b.user || { id: bUserId, username: b.username },
            totalDeposited: depAmt,
            totalPaid: Number(b.totalPaid || 0),
            totalShare: shareAmt,
            netBalance: netAmt,
          });
        }
      });
    } else {
      // Offline fallback: Sum deposits per member from groupDeposits
      groupDeposits.forEach(dep => {
        const uId = dep.userId || dep.user?.id;
        if (!uId) return;
        let item = memberMap.get(uId);
        if (!item) {
          for (const [, val] of memberMap) {
            if (val.userId === uId || (val.username && dep.user?.username && val.username === dep.user.username)) {
              item = val;
              break;
            }
          }
        }
        if (item) {
          item.totalDeposited = (item.totalDeposited || 0) + (Number(dep.amount) || 0);
        }
      });

      const totalMembersCount = Math.max(
        1,
        memberMap.size || (members.length > 0 ? members.length : 1),
      );

      // Offline fallback: Calculate actual share per member from expenses
      allExpensesList.forEach(exp => {
        const expAmt = Number(exp.amount) || 0;
        if (exp.participants && exp.participants.length > 0) {
          exp.participants.forEach((p: any) => {
            const pId = p.userId || p.user?.id;
            if (pId && memberMap.has(pId)) {
              const memberItem = memberMap.get(pId)!;
              const share =
                Number(p.shareAmount) || expAmt / exp.participants.length;
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

      // Calculate net balance for each member: totalDeposited - totalShare
      memberMap.forEach(item => {
        const roundedDeposited = Math.round(item.totalDeposited || 0);
        const roundedShare = Math.round(item.totalShare || 0);
        item.totalDeposited = roundedDeposited;
        item.totalShare = roundedShare;
        item.netBalance = roundedDeposited - roundedShare;
      });
    }

    const memberBalancesList = Array.from(memberMap.values());

    // 5. Current User's numbers
    let currentUserItem = memberMap.get(userId);
    if (!currentUserItem && user?.username) {
      for (const [, val] of memberMap) {
        if (val.username === user.username) {
          currentUserItem = val;
          break;
        }
      }
    }

    const yourDeposited =
      currentUserItem?.totalDeposited !== undefined
        ? currentUserItem.totalDeposited
        : Math.round(balance?.yourDeposited ?? 0);

    const yourShare =
      currentUserItem?.totalShare !== undefined
        ? currentUserItem.totalShare
        : Math.round(balance?.yourShare ?? 0);

    const netBalance =
      balance?.netBalance !== undefined
        ? balance.netBalance
        : yourDeposited - yourShare;
    const isPositiveBalance = netBalance >= 0;

    return {
      totalExpenses,
      totalDeposits,
      remainingFund: totalDeposits - totalExpenses,
      totalMembers: memberBalancesList.length || 1,
      yourDeposited,
      yourShare,
      netBalance,
      isPositiveBalance,
      balances: memberBalancesList,
      allExpensesList,
    };
  }, [
    balance,
    groupExpenses,
    groupDeposits,
    localExpenses,
    selectedGroup,
    selectedGroupId,
    userId,
    user,
  ]);

  const analyticsData = useMemo(() => {
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();
    const filtered = computedMetrics.allExpensesList.filter(e => {
      const d = parseExpenseDate(e.expenseDate || e.createdAt);
      if (!d) return false;
      if (periodType === 'MONTH')
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      if (periodType === 'YEAR') return d.getFullYear() === targetYear;
      if (periodType === 'WEEK') {
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

    const HARMONIOUS_BLUE_GREEN_PALETTE = [
      { color: '#2563EB', bgColor: '#EFF6FF', barColor: '#3B82F6' }, // Royal Blue
      { color: '#059669', bgColor: '#ECFDF5', barColor: '#10B981' }, // Emerald Green
      { color: '#0284C7', bgColor: '#F0F9FF', barColor: '#0EA5E9' }, // Ocean Sky
      { color: '#0D9488', bgColor: '#F0FDFA', barColor: '#14B8A6' }, // Teal
      { color: '#4F46E5', bgColor: '#EEF2FF', barColor: '#6366F1' }, // Indigo
      { color: '#0891B2', bgColor: '#ECFEFF', barColor: '#06B6D4' }, // Cyan
      { color: '#16A34A', bgColor: '#F0FDF4', barColor: '#22C55E' }, // Forest Green
      { color: '#3B82F6', bgColor: '#EFF6FF', barColor: '#60A5FA' }, // Soft Blue
    ];

    const catMap: Record<
      string,
      {
        amount: number;
        count: number;
        emoji: string;
      }
    > = {};
    let total = 0;
    for (const exp of filtered) {
      const cat = exp.category || 'Other';
      const amt = Number(exp.amount) || 0;
      total += amt;
      const info = categoryMap[cat];
      if (!catMap[cat])
        catMap[cat] = {
          amount: 0,
          count: 0,
          emoji: info?.emoji || '📦',
        };
      catMap[cat].amount += amt;
      catMap[cat].count += 1;
    }
    const list = Object.entries(catMap).map(([category, data]) => ({
      category,
      ...data,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
    }));
    list.sort((a, b) => b.amount - a.amount);

    // Apply soothing, eye-friendly Blue and Emerald Green tones
    const styledList = list.map((item, idx) => {
      const palette =
        HARMONIOUS_BLUE_GREEN_PALETTE[
          idx % HARMONIOUS_BLUE_GREEN_PALETTE.length
        ];
      return {
        ...item,
        color: palette.color,
        bgColor: palette.bgColor,
        barColor: palette.barColor,
      };
    });

    return { list: styledList, total, filteredCount: filtered.length };
  }, [computedMetrics.allExpensesList, periodType, selectedDate, categoryMap]);

  const changePeriod = (dir: -1 | 1) => {
    const next = new Date(selectedDate);
    if (periodType === 'MONTH') next.setMonth(next.getMonth() + dir);
    else if (periodType === 'YEAR') next.setFullYear(next.getFullYear() + dir);
    else if (periodType === 'WEEK') next.setDate(next.getDate() + dir * 7);
    setSelectedDate(next);
  };

  const periodLabel = useMemo(() => {
    if (periodType === 'MONTH')
      return `${
        MONTH_NAMES[selectedDate.getMonth()]
      } ${selectedDate.getFullYear()}`;
    if (periodType === 'YEAR') return `${selectedDate.getFullYear()}`;
    return `Week of ${selectedDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })}`;
  }, [periodType, selectedDate]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-background"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Sticky Top Header Bar (Fixed outside ScrollView) */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border shadow-2xs">
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          {onNavigateBack && (
            <TouchableOpacity
              onPress={onNavigateBack}
              className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-1"
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#0F172A" />
            </TouchableOpacity>
          )}
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground font-medium">
              Welcome to
            </Text>
            <Text
              className="text-lg font-bold text-foreground"
              numberOfLines={1}
            >
              {selectedGroup
                ? `${TYPE_EMOJI[selectedGroup.type || 'OTHER'] || '👥'} ${
                    selectedGroup.name
                  }`
                : 'Group Dashboard'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className={`w-9 h-9 rounded-full border items-center justify-center shadow-xs ${
              activeTab === 'MEMBERS'
                ? 'bg-primary-light border-indigo-200'
                : 'bg-card border-border'
            }`}
            activeOpacity={0.7}
            onPress={() => setActiveTab('MEMBERS')}
          >
            <Feather
              name="users"
              size={17}
              color={activeTab === 'MEMBERS' ? '#4F46E5' : '#0F172A'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 py-1.5 gap-2.5"
        contentContainerStyle={{ paddingBottom: 2 }}
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
        {isLoading && groups.length === 0 ? (
          <View className="py-20 items-center justify-center gap-3">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-xs text-muted-foreground">
              Loading group data...
            </Text>
          </View>
        ) : selectedGroup ? (
          <View className="gap-4">
            {/* 1. Shared Hero Stat Card */}
            <HeroStatCard
              title="Group Balance"
              badge="BDT"
              badgeColor="bg-slate-800 border-slate-700"
              badgeTextColor="text-indigo-300"
              dotColor={
                computedMetrics.remainingFund >= 0
                  ? 'bg-emerald-400'
                  : 'bg-rose-400'
              }
              mainAmount={`${
                computedMetrics.remainingFund >= 0 ? '+' : '-'
              } ৳${Math.abs(computedMetrics.remainingFund).toLocaleString(
                'en-US',
              )}`}
              mainAmountPrefix=""
              mainAmountColor={
                computedMetrics.remainingFund >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }
              subtitle={`Total group fund across ${groupMembers.length} member${
                groupMembers.length === 1 ? '' : 's'
              }`}
              metrics={[
                {
                  label: '📥 You Deposited',
                  value: `+৳${computedMetrics.yourDeposited.toLocaleString(
                    'en-US',
                  )}`,
                  valueColor: 'text-emerald-400',
                },
                {
                  label: '👥 Members',
                  value: `${groupMembers.length} members`,
                  valueColor: 'text-slate-100',
                  onPress: () => setActiveTab('MEMBERS'),
                },
                {
                  label: computedMetrics.isPositiveBalance
                    ? '⚖️ Your Balance'
                    : '⚠️ Need to Pay',
                  value: `${
                    computedMetrics.isPositiveBalance ? '+' : '-'
                  }৳${Math.abs(computedMetrics.netBalance).toLocaleString(
                    'en-US',
                  )}`,
                  valueColor: computedMetrics.isPositiveBalance
                    ? 'text-emerald-400'
                    : 'text-rose-400',
                },
              ]}
            />

            {/* 4 Interactive Action Tabs Bar */}
            <View className="flex-row justify-between gap-2 bg-card p-3 rounded-2xl border border-border shadow-sm">
              <TouchableOpacity
                className={`flex-1 items-center justify-center gap-1.5 py-1 rounded-xl ${
                  activeTab === 'DEPOSITS'
                    ? 'bg-emerald-50 border border-emerald-200'
                    : ''
                }`}
                onPress={() => setActiveTab('DEPOSITS')}
                activeOpacity={0.8}
              >
                <View
                  className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${
                    activeTab === 'DEPOSITS'
                      ? 'bg-emerald-600 ring-2 ring-emerald-300'
                      : 'bg-emerald-500'
                  }`}
                >
                  <Feather name="download" size={19} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-[11px] font-bold text-center ${
                    activeTab === 'DEPOSITS'
                      ? 'text-emerald-700'
                      : 'text-foreground'
                  }`}
                  numberOfLines={1}
                >
                  Deposit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 items-center justify-center gap-1.5 py-1 rounded-xl ${
                  activeTab === 'EXPENSES'
                    ? 'bg-primary-light border border-indigo-200'
                    : ''
                }`}
                onPress={() => setActiveTab('EXPENSES')}
                activeOpacity={0.8}
              >
                <View
                  className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${
                    activeTab === 'EXPENSES'
                      ? 'bg-primary ring-2 ring-indigo-300'
                      : 'bg-primary'
                  }`}
                >
                  <Feather name="plus" size={21} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-[11px] font-bold text-center ${
                    activeTab === 'EXPENSES'
                      ? 'text-primary'
                      : 'text-foreground'
                  }`}
                  numberOfLines={1}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 items-center justify-center gap-1.5 py-1 rounded-xl ${
                  activeTab === 'ANALYTICS'
                    ? 'bg-slate-100 border border-slate-300'
                    : ''
                }`}
                onPress={() => setActiveTab('ANALYTICS')}
                activeOpacity={0.8}
              >
                <View
                  className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${
                    activeTab === 'ANALYTICS'
                      ? 'bg-slate-900 ring-2 ring-slate-400'
                      : 'bg-slate-800'
                  }`}
                >
                  <Feather name="pie-chart" size={19} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-[11px] font-bold text-center ${
                    activeTab === 'ANALYTICS'
                      ? 'text-slate-900'
                      : 'text-foreground'
                  }`}
                  numberOfLines={1}
                >
                  Analytics
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 items-center justify-center gap-1.5 py-1 rounded-xl ${
                  activeTab === 'MEMBERS'
                    ? 'bg-primary-light border border-indigo-200'
                    : ''
                }`}
                onPress={() => setActiveTab('MEMBERS')}
                activeOpacity={0.8}
              >
                <View
                  className={`w-11 h-11 rounded-2xl items-center justify-center shadow-xs ${
                    activeTab === 'MEMBERS'
                      ? 'bg-indigo-600 ring-2 ring-indigo-300'
                      : 'bg-indigo-500'
                  }`}
                >
                  <Feather name="users" size={19} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-[11px] font-bold text-center ${
                    activeTab === 'MEMBERS' ? 'text-primary' : 'text-foreground'
                  }`}
                  numberOfLines={1}
                >
                  Members
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'EXPENSES' && (
              <View className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-2">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-foreground">
                      Group Expenses
                    </Text>
                    <View className="bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      <Text className="text-[11px] font-bold text-rose-700">
                        {computedMetrics.allExpensesList.length}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full shadow-xs"
                    onPress={() => setIsExpenseModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={13} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      Add Expense
                    </Text>
                  </TouchableOpacity>
                </View>
                {computedMetrics.allExpensesList.map((item, index) => {
                  const isNewlyAdded =
                    !!newlyAddedId &&
                    (item.id === newlyAddedId ||
                      (item as any).localId === newlyAddedId);
                  return (
                    <View
                      key={`${
                        item.id || (item as any).localId || 'exp'
                      }_${index}`}
                      className={`flex-row justify-between items-center py-3 px-2 rounded-xl transition-all ${
                        index !== computedMetrics.allExpensesList.length - 1
                          ? 'border-b border-border'
                          : ''
                      }`}
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        <View className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 items-center justify-center mr-3">
                          <Feather
                            name={
                              (categoryMap[item.category]?.icon ||
                                'credit-card') as any
                            }
                            size={18}
                            color="#EF4444"
                          />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className="text-sm font-bold text-card-foreground mb-0.5"
                              numberOfLines={1}
                            >
                              {item.title || item.subcategory || item.category}
                            </Text>
                            {isNewlyAdded && (
                              <View className="flex-row items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Text className="text-[9px] font-bold text-amber-700">
                                  NEW
                                </Text>
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
                        <Text className="text-xs text-muted-foreground">
                          {item.category}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'DEPOSITS' && (
              <View className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-2">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-foreground">
                      Group Deposits
                    </Text>
                    <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Text className="text-[11px] font-bold text-emerald-700">
                        {groupDeposits.length}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="flex-row items-center gap-1 bg-emerald-600 px-3 py-1.5 rounded-full shadow-xs active:bg-emerald-700"
                    onPress={() => setIsDepositModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={13} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      Add Deposit
                    </Text>
                  </TouchableOpacity>
                </View>

                {groupDeposits.length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <View className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 items-center justify-center mb-2 shadow-xs">
                      <Feather name="download" size={20} color="#059669" />
                    </View>
                    <Text className="text-sm font-bold text-foreground text-center">
                      No Deposits Recorded
                    </Text>
                    <Text className="text-xs text-muted-foreground text-center mt-0.5 mb-3 max-w-[240px]">
                      Collect advances from members to track group funds.
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsDepositModalOpen(true)}
                      className="flex-row items-center gap-1.5 bg-emerald-600 px-3.5 py-1.5 rounded-full shadow-xs"
                      activeOpacity={0.8}
                    >
                      <Feather name="plus" size={13} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        Record First Deposit
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  groupDeposits.map((dep, index) => {
                    const isYou =
                      dep.userId === userId || dep.user?.id === userId;
                    let memberObj = groupMembers.find(
                      m =>
                        m.userId === dep.userId ||
                        m.id === dep.userId ||
                        (m.user as any)?.id === dep.userId ||
                        (m as any).id === dep.userId,
                    );

                    if (!memberObj && groups && groups.length > 0) {
                      for (const g of groups) {
                        const found = (g.members || []).find(
                          (m: any) =>
                            m.userId === dep.userId ||
                            m.user?.id === dep.userId ||
                            m.id === dep.userId,
                        );
                        if (found) {
                          memberObj = found;
                          break;
                        }
                      }
                    }

                    const memberUser = memberObj?.user || (memberObj as any);

                    // Extract first valid username (ignoring generic 'Member')
                    const candidateUsernames = [
                      dep.user?.username,
                      memberUser?.username,
                      (memberObj as any)?.username,
                    ].filter(
                      u =>
                        u &&
                        typeof u === 'string' &&
                        u.trim() !== '' &&
                        u.toLowerCase() !== 'member',
                    );
                    const resolvedUsername =
                      candidateUsernames.length > 0
                        ? candidateUsernames[0]
                        : '';

                    // Extract first valid name (ignoring generic 'Member')
                    const candidateNames = [
                      dep.user?.name,
                      memberUser?.name,
                      (memberObj as any)?.name,
                    ].filter(
                      n =>
                        n &&
                        typeof n === 'string' &&
                        n.trim() !== '' &&
                        n.toLowerCase() !== 'member',
                    );
                    const resolvedName =
                      candidateNames.length > 0 ? candidateNames[0] : '';

                    let depositorName = 'Member';
                    if (isYou) {
                      depositorName = user?.username
                        ? `@${user.username} (You)`
                        : 'You';
                    } else if (resolvedUsername) {
                      depositorName = `@${resolvedUsername}`;
                    } else if (resolvedName) {
                      depositorName = resolvedName;
                    }

                    const initial = (
                      resolvedUsername ||
                      resolvedName ||
                      (isYou ? user?.username || user?.name || '' : '') ||
                      'M'
                    )
                      .charAt(0)
                      .toUpperCase();
                    const method = dep.method || 'CASH';

                    return (
                      <View
                        key={`${
                          dep.id || (dep as any).localId || 'dep'
                        }_${index}`}
                        className="flex-row justify-between items-center py-2.5"
                      >
                        <View className="flex-row items-center flex-1 pr-3">
                          <View className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center mr-3 shadow-2xs">
                            <Text className="text-xs font-black text-emerald-700">
                              {initial}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1.5 mb-0.5 flex-wrap">
                              <Text
                                className="text-sm font-bold text-foreground"
                                numberOfLines={1}
                              >
                                {depositorName}
                              </Text>
                              <View className="bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                <Text className="text-[9px] font-bold text-emerald-700">
                                  {method}
                                </Text>
                              </View>
                            </View>
                            <Text
                              className="text-xs text-muted-foreground"
                              numberOfLines={1}
                            >
                              {dep.depositDate?.slice(0, 10) ||
                                dep.createdAt?.slice(0, 10)}
                              {dep.note ? ` • ${dep.note}` : ''}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-sm font-black text-emerald-600 mb-0.5">
                            +৳{Number(dep.amount).toLocaleString('en-US')}
                          </Text>
                          <Text className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            Deposit
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {activeTab === 'ANALYTICS' && (
              <View className="gap-3 mb-2">
                <View className="flex-row bg-muted p-1 rounded-xl">
                  {(['WEEK', 'MONTH', 'YEAR'] as PeriodType[]).map(p => (
                    <TouchableOpacity
                      key={p}
                      className={`flex-1 py-2 items-center rounded-lg ${
                        periodType === p
                          ? 'bg-primary-light border border-indigo-200 shadow-xs'
                          : ''
                      }`}
                      onPress={() => setPeriodType(p)}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          periodType === p
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {p === 'WEEK'
                          ? 'Weekly'
                          : p === 'MONTH'
                          ? 'Monthly'
                          : 'Yearly'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-xs">
                  <TouchableOpacity
                    className="w-8 h-8 rounded-full bg-muted items-center justify-center"
                    onPress={() => changePeriod(-1)}
                  >
                    <Feather name="chevron-left" size={18} color="#0F172A" />
                  </TouchableOpacity>
                  <Text className="text-sm font-extrabold text-foreground">
                    {periodLabel}
                  </Text>
                  <TouchableOpacity
                    className="w-8 h-8 rounded-full bg-muted items-center justify-center"
                    onPress={() => changePeriod(1)}
                  >
                    <Feather name="chevron-right" size={18} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <View className="bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-800">
                  <Text className="text-xs text-slate-400 font-medium mb-1">
                    Total Spend in {periodLabel}
                  </Text>
                  <Text className="text-3xl font-black text-white">
                    ৳{analyticsData.total.toLocaleString()}
                  </Text>
                </View>
                <View className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-2">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-base font-bold text-foreground">
                      Category Breakdown
                    </Text>
                    <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
                      <Text className="text-[11px] font-bold text-primary">
                        {analyticsData.list.length}{' '}
                        {analyticsData.list.length === 1
                          ? 'category'
                          : 'categories'}
                      </Text>
                    </View>
                  </View>

                  {analyticsData.list.length === 0 ? (
                    <View className="py-8 items-center justify-center">
                      <View className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center mb-2 shadow-xs">
                        <Feather name="pie-chart" size={20} color="#4F46E5" />
                      </View>
                      <Text className="text-sm font-bold text-foreground text-center">
                        No Expenses in this Period
                      </Text>
                      <Text className="text-xs text-muted-foreground text-center mt-0.5 max-w-[240px]">
                        No group expenses recorded for {periodLabel}.
                      </Text>
                    </View>
                  ) : (
                    analyticsData.list.map((cat, idx) => {
                      const isLast = idx === analyticsData.list.length - 1;
                      return (
                        <View
                          key={`${cat.category}_${idx}`}
                          className={`py-3 px-1 transition-all ${
                            !isLast ? 'border-b border-border' : ''
                          }`}
                        >
                          <View className="flex-row items-center justify-between mb-2">
                            {/* Left: Category Icon/Emoji + Name & Count */}
                            <View className="flex-row items-center flex-1 pr-3">
                              <View
                                className="w-10 h-10 rounded-xl items-center justify-center mr-3 shadow-2xs"
                                style={{
                                  backgroundColor: cat.bgColor || '#F1F5F9',
                                }}
                              >
                                <Text className="text-base">{cat.emoji}</Text>
                              </View>
                              <View className="flex-1">
                                <Text
                                  className="text-sm font-bold text-card-foreground mb-0.5"
                                  numberOfLines={1}
                                >
                                  {cat.category}
                                </Text>
                                <Text className="text-xs text-muted-foreground">
                                  {cat.count}{' '}
                                  {cat.count === 1 ? 'expense' : 'expenses'}{' '}
                                  logged
                                </Text>
                              </View>
                            </View>

                            {/* Right: Amount + Percentage */}
                            <View className="items-end">
                              <Text className="text-sm font-extrabold text-foreground mb-0.5">
                                ৳{cat.amount.toLocaleString('en-US')}
                              </Text>
                              <Text
                                className="text-xs font-semibold"
                                style={{ color: cat.color || '#4F46E5' }}
                              >
                                {cat.percentage.toFixed(1)}% of total
                              </Text>
                            </View>
                          </View>

                          {/* Smooth Progress Bar */}
                          <View className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <View
                              className="h-full rounded-full"
                              style={{
                                backgroundColor:
                                  cat.barColor || cat.color || '#4F46E5',
                                width: `${Math.min(
                                  100,
                                  Math.max(4, cat.percentage),
                                )}%`,
                              }}
                            />
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}

            {activeTab === 'MEMBERS' && (
              <View className="bg-card rounded-2xl border border-border p-4 shadow-sm mb-2">
                {/* Header */}
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-bold text-foreground">
                      Member Balances
                    </Text>
                    <View className="bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      <Text className="text-[11px] font-bold text-indigo-700">
                        {computedMetrics.balances.length}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="flex-row items-center gap-1.5 bg-primary px-3 py-1.5 rounded-full shadow-xs active:opacity-80"
                    onPress={() => setIsInviteModalOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Feather name="user-plus" size={13} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">
                      Invite Member
                    </Text>
                  </TouchableOpacity>
                </View>

                {computedMetrics.balances.length === 0 ? (
                  <View className="py-8 items-center justify-center">
                    <View className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center mb-2 shadow-xs">
                      <Feather name="users" size={20} color="#4F46E5" />
                    </View>
                    <Text className="text-sm font-bold text-foreground text-center">
                      No Members Found
                    </Text>
                    <Text className="text-xs text-muted-foreground text-center mt-0.5 max-w-[240px]">
                      Invite roommates or friends to join this group by username.
                    </Text>
                    <TouchableOpacity
                      className="flex-row items-center gap-1.5 bg-primary px-3.5 py-1.5 rounded-full shadow-xs mt-3"
                      onPress={() => setIsInviteModalOpen(true)}
                      activeOpacity={0.8}
                    >
                      <Feather name="user-plus" size={13} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        Invite Member
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  computedMetrics.balances.map((item, index) => {
                    const isYou =
                      item.userId === userId || (item.user as any)?.id === userId;
                    const net = item.netBalance ?? 0;
                    const isPositive = net > 0;
                    const isSettled = net === 0;

                    // Resolve clean name & username
                    const candidateUsername =
                      item.username || (item.user as any)?.username;
                    const candidateName =
                      item.name || (item.user as any)?.name;
                    const resolvedName = isYou
                      ? user?.username
                        ? `@${user.username} (You)`
                        : user?.name
                        ? `${user.name} (You)`
                        : 'You'
                      : candidateUsername &&
                        candidateUsername.toLowerCase() !== 'member'
                      ? `@${candidateUsername}`
                      : candidateName || 'Member';

                    const initial = (
                      (isYou
                        ? user?.username || user?.name
                        : candidateUsername || candidateName) || 'M'
                    )
                      .charAt(0)
                      .toUpperCase();

                    return (
                      <View
                        key={`${item.userId || 'mem'}_${index}`}
                        className={`flex-row justify-between items-center py-3 px-2 rounded-xl transition-all ${
                          index !== computedMetrics.balances.length - 1
                            ? 'border-b border-border'
                            : ''
                        }`}
                      >
                        {/* Left Side: Avatar + Details */}
                        <View className="flex-row items-center flex-1 pr-3">
                          <View
                            className={`w-10 h-10 rounded-xl items-center justify-center mr-3 shadow-2xs ${
                              isYou
                                ? 'bg-primary-light border border-indigo-200'
                                : isPositive
                                ? 'bg-emerald-50 border border-emerald-100'
                                : 'bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <Text
                              className={`text-sm font-black ${
                                isYou
                                  ? 'text-primary'
                                  : isPositive
                                  ? 'text-emerald-700'
                                  : 'text-slate-700'
                              }`}
                            >
                              {initial}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1.5 mb-0.5">
                              <Text
                                className="text-sm font-bold text-foreground"
                                numberOfLines={1}
                              >
                                {resolvedName}
                              </Text>
                              {isYou && (
                                <View className="bg-primary-light px-1.5 py-0.2 rounded border border-indigo-200">
                                  <Text className="text-[9px] font-bold text-primary">
                                    YOU
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text
                              className="text-xs text-muted-foreground"
                              numberOfLines={1}
                            >
                              Dep: ৳{(item.totalDeposited || 0).toLocaleString()}{' '}
                              • Share: ৳
                              {Math.round(item.totalShare || 0).toLocaleString()}
                            </Text>
                          </View>
                        </View>

                        {/* Right Side: Net Balance Amount + Status */}
                        <View className="items-end">
                          <Text
                            className={`text-sm font-extrabold mb-0.5 ${
                              isSettled
                                ? 'text-muted-foreground'
                                : isPositive
                                ? 'text-emerald-600'
                                : 'text-rose-500'
                            }`}
                          >
                            {isSettled
                              ? '৳0'
                              : `${isPositive ? '+' : '-'}৳${Math.abs(
                                  Math.round(net),
                                ).toLocaleString('en-US')}`}
                          </Text>
                          <Text
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isSettled
                                ? 'text-muted-foreground'
                                : isPositive
                                ? 'text-emerald-600'
                                : 'text-rose-500'
                            }`}
                          >
                            {isSettled
                              ? 'Settled'
                              : isPositive
                              ? 'Gets Back'
                              : 'Needs to Pay'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        ) : (
          <View className="bg-card rounded-2xl p-8 items-center justify-center border border-dashed border-border mt-4 mb-2">
            <Text className="text-base font-bold text-foreground">
              No Groups Found
            </Text>
          </View>
        )}
      </ScrollView>
      {selectedGroupId && (
        <AddGroupDepositModal
          visible={isDepositModalOpen}
          groupId={selectedGroupId}
          members={selectedGroup?.members || []}
          currentUserId={userId}
          onClose={() => setIsDepositModalOpen(false)}
          onSuccess={() => {
            setIsDepositModalOpen(false);
            refreshFromLocalDb(selectedGroupId);
            fetchGroupsAndData(true);
          }}
        />
      )}
      {selectedGroupId && (
        <AddGroupExpenseModal
          visible={isExpenseModalOpen}
          groupId={selectedGroupId}
          members={selectedGroup?.members || []}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            refreshFromLocalDb(selectedGroupId);
            fetchGroupsAndData(true);
          }}
        />
      )}
      {selectedGroupId && (
        <InviteMemberModal
          visible={isInviteModalOpen}
          groupId={selectedGroupId}
          groupName={selectedGroup?.name}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={() => {
            setIsInviteModalOpen(false);
            refreshFromLocalDb(selectedGroupId);
            fetchGroupsAndData(true);
          }}
        />
      )}
    </SafeAreaView>
  );
};
