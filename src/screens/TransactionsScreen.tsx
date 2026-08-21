import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import {
  groupService,
  Group,
  GroupExpense,
  GroupDeposit,
} from '../services/groupService';
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
  const { expenses, isSyncing, syncExpenses, refreshExpenses, newlyAddedId } =
    useExpenses();

  const [transactionType, setTransactionType] = useState<'PERSONAL' | 'GROUP'>(
    initialTab,
  );
  const [selectedTimeFilter, setSelectedTimeFilter] =
    useState<TimeFilterType>(initialTimeFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshExpenses();
  }, []);

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
  const [groupDeposits, setGroupDeposits] = useState<GroupDeposit[]>([]);
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

      const [expenseResults, depositResults] = await Promise.all([
        Promise.all(
          targetGroups.map(async grp => {
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
          }),
        ),
        Promise.all(
          targetGroups.map(async grp => {
            try {
              const res = await groupService.getGroupDeposits(grp.id, {
                limit: 50,
              });
              const list: GroupDeposit[] =
                res?.deposits ||
                res?.data?.deposits ||
                (Array.isArray(res?.data)
                  ? res.data
                  : Array.isArray(res)
                  ? res
                  : []);
              return list;
            } catch {
              return [];
            }
          }),
        ),
      ]);

      const combinedServer = expenseResults.flat();
      const combinedDeposits = depositResults.flat();
      setGroupDeposits(combinedDeposits);

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
            participants: (e as any).participants || [],
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
    try {
      await Promise.all([syncExpenses(), refreshExpenses(), fetchGroupData()]);
    } catch {
    } finally {
      setIsRefreshing(false);
    }
  };

  const matchesTimeFilter = (dateStr?: string): boolean => {
    if (selectedTimeFilter === 'ALL') return true;
    if (!dateStr) return false;
    let d = dateStr.slice(0, 10);
    try {
      if (dateStr.includes('T') || dateStr.length > 10) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          d = getLocalDateString(parsed);
        }
      }
    } catch {}
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

        return {
          id: e.serverId || e.localId || (e as any).id || String(Math.random()),
          localId: e.localId,
          title: e.title || e.subcategory || e.category,
          category: e.category,
          amount: Number(e.amount) || 0,
          type: 'expense' as const,
          date: formattedDate,
          icon: catInfo.icon,
          emoji: catInfo.emoji,
          syncStatus: e.syncStatus,
        };
      });
    }
    if (!isAuthenticated) {
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
    }
    return [];
  }, [expenses, categoryMap, isAuthenticated]);

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

  const personalStats = useMemo(() => {
    const today = getLocalDateString();
    const currentMonth = today.slice(0, 7);

    let thisMonthTotal = 0;
    let todayTotal = 0;

    personalTransactions.forEach(t => {
      if (t.type === 'expense') {
        const dateStr = t.date ? t.date.slice(0, 10) : '';
        if (dateStr.startsWith(currentMonth)) {
          thisMonthTotal += t.amount;
        }
        if (dateStr === today) {
          todayTotal += t.amount;
        }
      }
    });

    return { thisMonthTotal, todayTotal };
  }, [personalTransactions]);

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

  const groupStats = useMemo(() => {
    const today = getLocalDateString();
    const currentMonth = today.slice(0, 7);

    let thisMonthTotal = 0;
    let todayTotal = 0;

    const targetGroups =
      selectedGroupId === 'ALL'
        ? groups
        : groups.filter(g => g.id === selectedGroupId);

    let totalAllTimeDeposits = 0;
    let totalAllTimeExpenses = 0;
    let totalMyDeposits = 0;
    let totalMyShare = 0;

    targetGroups.forEach(grp => {
      const grpExpenses = groupExpenses.filter(
        e => (e as any).groupId === grp.id || (e as any).group?.id === grp.id,
      );
      const grpDeposits = groupDeposits.filter(
        d => (d as any).groupId === grp.id || (d as any).group?.id === grp.id,
      );

      const grpTotalExp = grpExpenses.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0,
      );
      const grpTotalDep = grpDeposits
        .filter(d => d.status !== 'CANCELLED')
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

      totalAllTimeExpenses += grpTotalExp;
      totalAllTimeDeposits += grpTotalDep;

      // Strictly the user's deposits into the group fund
      const myDep = grpDeposits
        .filter(
          d =>
            (d.userId === userId || d.user?.id === userId) &&
            d.status !== 'CANCELLED',
        )
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      totalMyDeposits += myDep;

      // User's fair share from this group's expenses
      let grpMyShare = 0;
      grpExpenses.forEach(e => {
        if (e.participants && e.participants.length > 0) {
          const p = e.participants.find(
            (part: any) => part.userId === userId || part.user?.id === userId,
          );
          if (p) {
            grpMyShare +=
              Number(p.shareAmount) ||
              (Number(e.amount) || 0) / e.participants.length;
          }
        } else {
          const memberCount = Math.max(
            grp.members?.length || 0,
            grp._count?.members || 0,
            1,
          );
          grpMyShare += (Number(e.amount) || 0) / memberCount;
        }
      });
      totalMyShare += grpMyShare;
    });

    groupExpenses.forEach(g => {
      const amt = Number(g.amount) || 0;
      const expDate = (g.expenseDate || (g as any).createdAt || '').slice(
        0,
        10,
      );
      if (expDate.startsWith(currentMonth)) {
        thisMonthTotal += amt;
      }
      if (expDate === today) {
        todayTotal += amt;
      }
    });

    const groupFundBalance = Math.round(
      totalAllTimeDeposits - totalAllTimeExpenses,
    );
    const netBalance = Math.round(totalMyDeposits - totalMyShare);

    return {
      thisMonthTotal,
      todayTotal,
      groupFundBalance,
      youPaid: totalMyDeposits,
      totalMyShare: Math.round(totalMyShare),
      netBalance,
    };
  }, [groupExpenses, groupDeposits, groups, selectedGroupId, userId]);

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

  const chartTitleLabel = useMemo(() => {
    const timeLabel =
      selectedTimeFilter === 'TODAY'
        ? "Today's"
        : selectedTimeFilter === 'WEEK'
        ? "This Week's"
        : selectedTimeFilter === 'MONTH'
        ? "This Month's"
        : 'All-Time';
    const typeLabel = transactionType === 'PERSONAL' ? 'Personal' : 'Group';
    return `${timeLabel} ${typeLabel} Spending`;
  }, [selectedTimeFilter, transactionType]);

  const chartSubtitleLabel = useMemo(() => {
    const timeLabel =
      selectedTimeFilter === 'TODAY'
        ? 'today'
        : selectedTimeFilter === 'WEEK'
        ? 'this week'
        : selectedTimeFilter === 'MONTH'
        ? 'this month'
        : 'all-time';
    const typeLabel =
      transactionType === 'PERSONAL' ? 'personal' : 'group';
    return `${typeLabel} category breakdown (${timeLabel})`;
  }, [selectedTimeFilter, transactionType]);

  const dynamicCategoryBreakdown = useMemo(() => {
    const activeItems =
      transactionType === 'PERSONAL'
        ? filteredPersonalTransactions.filter((t) => t.type === 'expense')
        : filteredGroupExpenses;

    const total = activeItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
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

    activeItems.forEach((item) => {
      const cat = item.category || 'Others';
      const catDef = EXPENSE_CATEGORIES.find(
        (c) =>
          c.name.toLowerCase() === cat.toLowerCase() ||
          c.slug.toLowerCase() === cat.toLowerCase(),
      ) || {
        name: cat,
        emoji: (item as any).emoji || '📦',
      };

      if (!map[catDef.name]) {
        map[catDef.name] = {
          name: catDef.name,
          emoji: catDef.emoji,
          amount: 0,
          count: 0,
        };
      }
      map[catDef.name].amount += Number(item.amount) || 0;
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
  }, [transactionType, filteredPersonalTransactions, filteredGroupExpenses]);

  const [selectedChartCategory, setSelectedChartCategory] = useState<
    string | null
  >(null);
  const [chartAnimProgress, setChartAnimProgress] = useState(0);

  const chartYRef = useRef<number>(0);

  const triggerChartAnimation = useCallback(() => {
    setChartAnimProgress(0);
    let start: number | null = null;
    const duration = 850;

    let animFrame: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setChartAnimProgress(ease);
      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      }
    };
    animFrame = requestAnimationFrame(step);
  }, []);

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const windowHeight = event.nativeEvent.layoutMeasurement.height;
    if (
      chartYRef.current > 0 &&
      scrollY + windowHeight >= chartYRef.current + 50
    ) {
      if (chartAnimProgress === 0) {
        triggerChartAnimation();
      }
    }
  };

  useEffect(() => {
    triggerChartAnimation();
  }, [
    selectedTimeFilter,
    transactionType,
    selectedCategory,
    searchQuery,
    selectedGroupId,
    dynamicCategoryBreakdown.total,
    triggerChartAnimation,
  ]);

  const activeChartCategoryInfo = useMemo(() => {
    if (!selectedChartCategory) return null;
    return (
      dynamicCategoryBreakdown.list.find(
        (c) => c.name === selectedChartCategory,
      ) || null
    );
  }, [selectedChartCategory, dynamicCategoryBreakdown.list]);

  const dynamicConicGradient = useMemo(() => {
    if (
      !dynamicCategoryBreakdown.list ||
      dynamicCategoryBreakdown.list.length === 0 ||
      dynamicCategoryBreakdown.total === 0
    ) {
      return '#E2E8F0';
    }

    const currentTotalDeg = 360 * chartAnimProgress;

    if (dynamicCategoryBreakdown.list.length === 1) {
      const single = dynamicCategoryBreakdown.list[0];
      if (currentTotalDeg >= 360) {
        return `conic-gradient(${single.color} 0deg 360deg)`;
      }
      return `conic-gradient(${single.color} 0deg ${currentTotalDeg.toFixed(
        1,
      )}deg, #F1F5F9 ${currentTotalDeg.toFixed(1)}deg 360deg)`;
    }

    let currentDeg = 0;
    const slices = dynamicCategoryBreakdown.list.map((item) => {
      const deg =
        (item.amount / dynamicCategoryBreakdown.total) * currentTotalDeg;
      const start = currentDeg;
      const end = currentDeg + deg;
      currentDeg = end;

      const isSelected =
        !selectedChartCategory || selectedChartCategory === item.name;
      const sliceColor = isSelected ? item.color : `${item.color}35`;

      return `${sliceColor} ${start.toFixed(1)}deg ${end.toFixed(1)}deg`;
    });

    if (currentDeg < 360) {
      slices.push(`#F1F5F9 ${currentDeg.toFixed(1)}deg 360deg`);
    }

    return `conic-gradient(${slices.join(', ')})`;
  }, [dynamicCategoryBreakdown, chartAnimProgress, selectedChartCategory]);

  const renderPersonalItem = ({ item }: { item: DisplayTransaction }) => {
    const isIncome = item.type === 'income';
    const isSettlement = item.type === 'settlement';
    const isNewlyAdded =
      !!newlyAddedId &&
      (item.id === newlyAddedId || (item as any).localId === newlyAddedId);

    return (
      <View
        key={item.id}
        className={`flex-row justify-between items-center p-3.5 rounded-2xl mb-2.5 shadow-sm border transition-all ${
          isNewlyAdded
            ? 'bg-primary-light/80 border-2 border-indigo-400 shadow-md'
            : 'bg-card border border-border'
        }`}
      >
        <View className="flex-row items-center flex-1 pr-2">
          <View
            className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${
              isNewlyAdded
                ? 'bg-primary shadow-xs'
                : isIncome
                ? 'bg-emerald-50'
                : isSettlement
                ? 'bg-amber-50'
                : 'bg-rose-50'
            }`}
          >
            {isNewlyAdded ? (
              <Feather name="zap" size={20} color="#FFFFFF" />
            ) : (
              <Text className="text-xl">{item.emoji || '📦'}</Text>
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text
                className={`text-sm font-bold ${
                  isNewlyAdded ? 'text-primary font-black' : 'text-foreground'
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {isNewlyAdded && (
                <View className="bg-primary px-2 py-0.5 rounded-full shadow-2xs">
                  <Text className="text-[9px] font-black text-white">
                    ✨ JUST ADDED
                  </Text>
                </View>
              )}
              {item.syncStatus === 'pending' && !isNewlyAdded && (
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
              isNewlyAdded
                ? 'text-primary font-black'
                : isIncome
                ? 'text-emerald-600'
                : isSettlement
                ? 'text-amber-600'
                : 'text-foreground'
            }`}
          >
            {isIncome ? '+' : '-'}৳{item.amount.toLocaleString('en-US')}
          </Text>
          <Text className="text-[10px] text-muted-foreground capitalize">
            {isNewlyAdded ? 'New Expense' : item.type}
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
    const isNewlyAdded =
      !!newlyAddedId &&
      (item.id === newlyAddedId || (item as any).localId === newlyAddedId);

    return (
      <View
        key={item.id}
        className={`mb-2.5 rounded-2xl ${
          isNewlyAdded
            ? 'bg-primary-light/70 p-1 border-2 border-indigo-400 shadow-md'
            : ''
        }`}
      >
        {isNewlyAdded && (
          <View className="flex-row items-center gap-1 mb-1 px-2 pt-1">
            <View className="bg-primary px-2 py-0.5 rounded-full shadow-2xs">
              <Text className="text-[9px] font-black text-white">
                ✨ JUST ADDED
              </Text>
            </View>
          </View>
        )}
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
              ? `${summary.count} personal item${
                  summary.count === 1 ? '' : 's'
                }`
              : `${groupSummary.count} group item${
                  groupSummary.count === 1 ? '' : 's'
                }`}
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
        {/* Unified Hero Summary Stat Card */}
        <View className="bg-slate-900 rounded-3xl p-5 shadow-lg border border-slate-800 gap-4">
          {/* Top Section: Main Highlight (This Month's Total Expense / Group Spend) */}
          <View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`w-2 h-2 rounded-full ${
                    transactionType === 'PERSONAL'
                      ? 'bg-emerald-400'
                      : groupStats.groupFundBalance >= 0
                      ? 'bg-emerald-400'
                      : 'bg-rose-400'
                  }`}
                />
                <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {transactionType === 'PERSONAL'
                    ? selectedTimeFilter === 'MONTH' ||
                      selectedTimeFilter === 'ALL'
                      ? 'This Month Expense'
                      : `Total Spend (${
                          selectedTimeFilter === 'TODAY' ? 'Today' : 'This Week'
                        })`
                    : 'Group Balance'}
                </Text>
              </View>
              <View className="bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                <Text className="text-[10px] font-bold text-indigo-300">
                  {selectedTimeFilter === 'ALL'
                    ? 'All Time'
                    : selectedTimeFilter === 'TODAY'
                    ? 'Today'
                    : selectedTimeFilter === 'WEEK'
                    ? 'This Week'
                    : 'This Month'}
                </Text>
              </View>
            </View>

            {transactionType === 'PERSONAL' ? (
              <Text className="text-3xl font-black text-white mt-1.5">
                ৳
                {(selectedTimeFilter === 'MONTH' || selectedTimeFilter === 'ALL'
                  ? personalStats.thisMonthTotal
                  : summary.expense
                ).toLocaleString()}
              </Text>
            ) : (
              <Text
                className={`text-3xl font-black mt-1.5 ${
                  groupStats.groupFundBalance >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {groupStats.groupFundBalance >= 0 ? '+' : '-'} ৳
                {Math.abs(groupStats.groupFundBalance).toLocaleString()}
              </Text>
            )}

            <Text className="text-[11px] text-slate-400 mt-1">
              {transactionType === 'PERSONAL'
                ? `Total ${summary.count} transactions in ${
                    selectedTimeFilter === 'ALL'
                      ? 'All Time'
                      : selectedTimeFilter === 'TODAY'
                      ? 'Today'
                      : selectedTimeFilter === 'WEEK'
                      ? 'This Week'
                      : 'This Month'
                  }`
                : `Deposits - Expenses across ${filteredGroupExpenses.length} transaction${
                    filteredGroupExpenses.length === 1 ? '' : 's'
                  }`}
            </Text>
          </View>

          {/* Divider inside Hero Card */}
          <View className="h-[1px] bg-slate-800/90" />

          {/* Bottom Metrics Bar inside the Card */}
          {transactionType === 'PERSONAL' ? (
            <View className="flex-row justify-between items-center pt-0.5">
              {/* 1. Today's Expense (Left) */}
              <View className="flex-1 items-start justify-center">
                <Text className="text-[10px] font-semibold text-slate-400 mb-0.5 text-left">
                  📅 Today
                </Text>
                <Text className="text-sm font-black text-emerald-400 text-left">
                  ৳{personalStats.todayTotal.toLocaleString()}
                </Text>
              </View>

              <View className="w-[1px] h-7 bg-slate-800 mx-2" />

              {/* 2. Transactions Count (Middle) */}
              <View className="flex-1 items-center justify-center">
                <Text className="text-[10px] font-semibold text-slate-400 mb-0.5 text-center">
                  📋 Items
                </Text>
                <Text className="text-sm font-black text-slate-100 text-center">
                  {summary.count} items
                </Text>
              </View>

              <View className="w-[1px] h-7 bg-slate-800 mx-2" />

              {/* 3. Avg / Item (Right) */}
              <View className="flex-1 items-end justify-center">
                <Text className="text-[10px] font-semibold text-slate-400 mb-0.5 text-right">
                  📊 Avg/Item
                </Text>
                <Text className="text-sm font-black text-sky-400 text-right">
                  ৳
                  {summary.count > 0
                    ? Math.round(
                        summary.expense / summary.count,
                      ).toLocaleString()
                    : '0'}
                </Text>
              </View>
            </View>
          ) : (
            <View className="flex-row justify-between items-center pt-0.5">
              {/* 1. You Paid (Left) */}
              <View className="flex-1 items-start justify-center">
                <Text
                  className="text-[10px] font-semibold text-slate-400 mb-0.5 text-left"
                  numberOfLines={1}
                >
                  💳 You Paid
                </Text>
                <Text
                  className="text-sm font-bold text-emerald-400 text-left"
                  numberOfLines={1}
                >
                  +৳{groupStats.youPaid.toLocaleString()}
                </Text>
              </View>

              <View className="w-[1px] h-7 bg-slate-800 mx-4" />

              {/* 2. Your Net Balance (Right) */}
              <View className="flex-1 items-end justify-center">
                <Text
                  className="text-[10px] font-semibold text-slate-400 mb-0.5 text-right"
                  numberOfLines={1}
                >
                  ⚖️ Your Balance
                </Text>

                <Text
                  className={`text-sm font-bold text-right ${
                    groupStats.netBalance >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                  numberOfLines={1}
                >
                  {groupStats.netBalance >= 0 ? '+' : '-'}৳
                  {Math.abs(groupStats.netBalance).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>

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

        {/* Dynamic Category Spending Pie Chart Card (Placed at the very bottom, adapts to all active filters) */}
        {dynamicCategoryBreakdown.list.length > 0 && (
          <View
            onLayout={(event) => {
              chartYRef.current = event.nativeEvent.layout.y;
            }}
            className="bg-card rounded-2xl border border-border p-5 shadow-sm gap-4 mt-2"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center">
                  <Feather name="pie-chart" size={17} color="#4F46E5" />
                </View>
                <View>
                  <Text className="text-base font-bold text-foreground">
                    {chartTitleLabel}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {chartSubtitleLabel}
                  </Text>
                </View>
              </View>
              <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-indigo-200">
                <Text className="text-[10px] font-bold text-primary">
                  {dynamicCategoryBreakdown.list.length}{' '}
                  {dynamicCategoryBreakdown.list.length === 1
                    ? 'Category'
                    : 'Categories'}
                </Text>
              </View>
            </View>

            {/* Thick & Rich Donut / Pie Chart Centerpiece */}
            <View className="items-center justify-center py-3">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setSelectedChartCategory(null)}
                style={
                  {
                    width: 210,
                    height: 210,
                    borderRadius: 105,
                    background: dynamicConicGradient as any,
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
                  {activeChartCategoryInfo ? (
                    <>
                      <Text className="text-base mb-0.5">
                        {activeChartCategoryInfo.emoji}
                      </Text>
                      <Text
                        className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center"
                        numberOfLines={1}
                      >
                        {activeChartCategoryInfo.name}
                      </Text>
                      <Text
                        className="text-base font-bold text-slate-800 text-center my-0.5"
                        numberOfLines={1}
                      >
                        ৳
                        {Math.round(
                          activeChartCategoryInfo.amount * chartAnimProgress,
                        ).toLocaleString()}
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded-full mt-0.5"
                        style={{
                          backgroundColor: `${activeChartCategoryInfo.color}15`,
                        }}
                      >
                        <Text
                          className="text-[9px] font-medium"
                          style={{ color: activeChartCategoryInfo.color }}
                        >
                          {Math.round(
                            activeChartCategoryInfo.percentage *
                              chartAnimProgress,
                          )}
                          % of total
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
                          dynamicCategoryBreakdown.total * chartAnimProgress,
                        ).toLocaleString()}
                      </Text>
                      <View className="bg-indigo-50 border border-indigo-100/70 px-2 py-0.5 rounded-full mt-0.5">
                        <Text className="text-[9px] font-medium text-primary text-center">
                          {selectedTimeFilter === 'ALL'
                            ? 'All Time'
                            : selectedTimeFilter === 'TODAY'
                            ? 'Today'
                            : selectedTimeFilter === 'WEEK'
                            ? 'This Week'
                            : 'This Month'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Category Legends List with Progress Bars & Selection */}
            <View className="gap-2 pt-3 border-t border-border">
              {dynamicCategoryBreakdown.list.map((cat) => {
                const isSelected = selectedChartCategory === cat.name;
                const animatedAmount = Math.round(
                  cat.amount * chartAnimProgress,
                );
                const animatedPercentage = Math.round(
                  cat.percentage * chartAnimProgress,
                );
                const animatedProgressWidth = Math.max(
                  4,
                  cat.percentage * chartAnimProgress,
                );

                return (
                  <TouchableOpacity
                    key={cat.name}
                    activeOpacity={0.7}
                    onPress={() =>
                      setSelectedChartCategory(
                        isSelected ? null : cat.name,
                      )
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

                    {/* Micro Progress Bar */}
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
