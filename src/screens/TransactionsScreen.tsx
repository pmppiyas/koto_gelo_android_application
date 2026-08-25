import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
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
import { HeroStatCard } from '../components/common/HeroStatCard';
import { ExpenseTableCard } from '../components/common/ExpenseTableCard';
import { DonutChart } from '../components/common/DonutChart';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { demoTransactions } from '../data/demoData';
import { useExpenses, useAuth } from '../store/hooks';
import {
  groupService,
  Group,
  GroupExpense,
  GroupDeposit,
} from '../services/groupService';
import { localGroupService } from '../services/localGroupService';
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
  localId?: string;
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

  // Instant 0ms offline load for group data from local storage
  useEffect(() => {
    let isMounted = true;
    const loadOfflineGroupCache = async () => {
      try {
        const [cachedGroups, cachedExpenses, cachedDeposits] =
          await Promise.all([
            localGroupService.getStoredGroups(),
            localGroupService.getStoredGroupExpenses(),
            localGroupService.getStoredGroupDeposits(),
          ]);
        if (isMounted) {
          if (cachedGroups && cachedGroups.length > 0) setGroups(cachedGroups);
          if (cachedExpenses && cachedExpenses.length > 0)
            setGroupExpenses(cachedExpenses);
          if (cachedDeposits && cachedDeposits.length > 0)
            setGroupDeposits(cachedDeposits);
        }
      } catch {}
    };
    loadOfflineGroupCache();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchGroupData = useCallback(async () => {
    if (!isAuthenticated) return;
    if (groups.length === 0 && groupExpenses.length === 0) {
      setIsLoadingGroups(true);
    }
    try {
      const response = await groupService.getGroups({ limit: 50 });
      const groupList: Group[] =
        response?.groups ||
        response?.data?.groups ||
        (Array.isArray(response) ? response : []);
      if (groupList.length > 0) {
        setGroups(groupList);
        localGroupService.setStoredGroups(groupList).catch(() => {});
      }

      const [expenseResults, depositResults] = await Promise.all([
        Promise.all(
          groupList.map(async grp => {
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
                groupId: e.groupId || grp.id,
                groupName: grp.name,
                groupType: grp.type,
              }));
            } catch {
              return [];
            }
          }),
        ),
        Promise.all(
          groupList.map(async grp => {
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
              return list.map(d => ({
                ...d,
                groupId: d.groupId || grp.id,
              }));
            } catch {
              return [];
            }
          }),
        ),
      ]);

      const combinedServer = expenseResults.flat();
      const combinedDeposits = depositResults.flat();
      setGroupDeposits(combinedDeposits);
      localGroupService
        .setStoredGroupDeposits(combinedDeposits)
        .catch(() => {});

      const localGroupExpenses: any[] = (expenses || [])
        .filter(e => e.type === 'GROUP')
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
        if (item.id) map.set(item.id, item);
      });
      combinedServer.forEach(item => {
        if (item.id) map.set(item.id, item);
      });

      const combined = Array.from(map.values());
      combined.sort((a, b) => {
        const dateA = new Date(a.expenseDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.expenseDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setGroupExpenses(combined);
      localGroupService.setStoredGroupExpenses(combined).catch(() => {});
    } catch {
    } finally {
      setIsLoadingGroups(false);
    }
  }, [
    isAuthenticated,
    expenses,
    userId,
    user,
    groups.length,
    groupExpenses.length,
  ]);

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
    let d = String(dateStr).trim();
    if (d.includes('T')) {
      d = d.split('T')[0];
    } else if (d.length > 10) {
      d = d.slice(0, 10);
    }
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
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
      const todayDate = new Date(today + 'T00:00:00');
      const itemDate = new Date(d + 'T00:00:00');
      const diffTime = todayDate.getTime() - itemDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
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
      const map = new Map<string, DisplayTransaction>();
      personalList.forEach((e, idx) => {
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

        const itemKey = e.serverId || e.localId || `p_${idx}`;
        if (!map.has(itemKey)) {
          map.set(itemKey, {
            id: itemKey,
            localId: e.localId,
            title: e.title || e.subcategory || e.category,
            category: e.category,
            amount: Number(e.amount) || 0,
            type: 'expense' as const,
            date: formattedDate,
            icon: catInfo.icon,
            emoji: catInfo.emoji,
            syncStatus: e.syncStatus,
          });
        }
      });
      return Array.from(map.values());
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
    const query = searchQuery.trim().toLowerCase();
    return personalTransactions.filter(item => {
      const matchesSearch =
        query === '' ||
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        ((item as any).note &&
          (item as any).note.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesTime = matchesTimeFilter(item.date);

      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [personalTransactions, searchQuery, selectedCategory, selectedTimeFilter]);

  const filteredGroupExpenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groupExpenses.filter(item => {
      const matchesGroup =
        selectedGroupId === 'ALL' ||
        item.groupId === selectedGroupId ||
        (item as any).groupId === selectedGroupId ||
        (item as any).group?.id === selectedGroupId;
      if (!matchesGroup) return false;

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
      const note = ((item as any).note || '').toLowerCase();

      const matchesSearch =
        query === '' ||
        title.includes(query) ||
        groupName.includes(query) ||
        payer.includes(query) ||
        note.includes(query);

      const matchesCategory =
        selectedCategory === 'All' ||
        (item.category &&
          item.category.toLowerCase() === selectedCategory.toLowerCase());

      let expDate = '';
      try {
        const rawDate = item.expenseDate || item.createdAt;
        if (rawDate) {
          if (String(rawDate).includes('T')) {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              expDate = getLocalDateString(parsed);
            } else {
              expDate = String(rawDate).slice(0, 10);
            }
          } else {
            expDate = String(rawDate).slice(0, 10);
          }
        }
      } catch {}

      const matchesTime = matchesTimeFilter(expDate);

      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [
    groupExpenses,
    selectedGroupId,
    searchQuery,
    selectedCategory,
    selectedTimeFilter,
  ]);

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

  const currentGroupName = useMemo(() => {
    if (selectedGroupId === 'ALL') return 'All Groups';
    const grp = groups.find(g => g.id === selectedGroupId);
    return grp ? grp.name : 'Group';
  }, [selectedGroupId, groups]);

  const formattedDisplayTransactions = useMemo(() => {
    const map = new Map<string, any>();
    if (transactionType === 'PERSONAL') {
      filteredPersonalTransactions.forEach((item, idx) => {
        const key = item.id || (item as any).localId || `pt_${idx}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            title: item.title,
            amount: item.amount,
            category: item.category,
            date: item.date,
            type: item.type,
            emoji: item.emoji,
            icon: item.icon,
            syncStatus: item.syncStatus,
            localId: (item as any).localId,
          });
        }
      });
    } else {
      filteredGroupExpenses.forEach((item, idx) => {
        const isYou = item.user?.id === userId;
        const groupName = (item as any).groupName;
        const groupType = (item as any).groupType;
        const grpEmoji = groupType ? TYPE_EMOJI[groupType] || '👥' : '👥';
        const formattedDate = item.expenseDate
          ? item.expenseDate.slice(0, 10)
          : item.createdAt?.slice(0, 10) || '';

        const key = item.id || (item as any).localId || `gt_${idx}`;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            title: item.title || item.subcategory || item.category,
            amount: item.amount,
            category: item.category,
            date: formattedDate,
            type: 'expense' as const,
            emoji: grpEmoji,
            groupName: groupName || null,
            groupId: item.groupId,
            paidByName: isYou
              ? 'You'
              : item.user?.name || item.user?.username || 'Member',
            participantCount: item.participants?.length || 1,
            localId: (item as any).localId,
            isYou,
          });
        }
      });
    }
    return Array.from(map.values());
  }, [
    transactionType,
    filteredPersonalTransactions,
    filteredGroupExpenses,
    userId,
  ]);

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

  const selectedTimeFilterLabel = useMemo(() => {
    return selectedTimeFilter === 'TODAY'
      ? 'Today'
      : selectedTimeFilter === 'WEEK'
      ? 'This Week'
      : selectedTimeFilter === 'MONTH'
      ? 'This Month'
      : 'All Time';
  }, [selectedTimeFilter]);

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
    const typeLabel = transactionType === 'PERSONAL' ? 'personal' : 'group';
    return `${typeLabel} category breakdown (${timeLabel})`;
  }, [selectedTimeFilter, transactionType]);

  const dynamicCategoryBreakdown = useMemo(() => {
    const activeItems =
      transactionType === 'PERSONAL'
        ? filteredPersonalTransactions.filter(t => t.type === 'expense')
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

    activeItems.forEach(item => {
      const cat = item.category || 'Others';
      const catDef = EXPENSE_CATEGORIES.find(
        c =>
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

  const renderFilterControls = () => (
    <View className="gap-2">
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
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1.5 py-0.5"
        keyboardShouldPersistTaps="always"
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
              activeOpacity={0.6}
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

      {/* Category Filter Pills (All Categories, Food, Transport, Bills, Shopping, etc.) */}
      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1.5 py-0.5"
        keyboardShouldPersistTaps="always"
      >
        <TouchableOpacity
          className={`px-3.5 py-1.5 rounded-full border ${
            selectedCategory === 'All'
              ? 'bg-primary-light border-indigo-300'
              : 'bg-card border-border'
          }`}
          onPress={() => {
            setSelectedCategory('All');
            setSelectedChartCategory(null);
          }}
          activeOpacity={0.6}
        >
          <Text
            className={`text-xs font-bold ${
              selectedCategory === 'All'
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            All Categories
          </Text>
        </TouchableOpacity>

        {EXPENSE_CATEGORIES.map(cat => {
          const isSelected =
            selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
            selectedCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <TouchableOpacity
              key={cat.id}
              className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${
                isSelected
                  ? 'bg-primary-light border-indigo-300'
                  : 'bg-card border-border'
              }`}
              onPress={() => {
                const next = isSelected ? 'All' : cat.name;
                setSelectedCategory(next);
                setSelectedChartCategory(next === 'All' ? null : cat.name);
              }}
              activeOpacity={0.6}
            >
              <Text className="text-xs">{cat.emoji}</Text>
              <Text
                className={`text-xs font-bold ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Group Selector Pills (if Group Tab) */}
      {transactionType === 'GROUP' && groups.length > 0 && (
        <ScrollView
          horizontal
          nestedScrollEnabled={true}
          directionalLockEnabled={true}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-1.5 py-0.5"
          keyboardShouldPersistTaps="always"
        >
          <TouchableOpacity
            className={`px-3.5 py-1.5 rounded-full border ${
              selectedGroupId === 'ALL'
                ? 'bg-primary-light border-indigo-300'
                : 'bg-card border-border'
            }`}
            onPress={() => setSelectedGroupId('ALL')}
            activeOpacity={0.6}
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
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-background"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Sticky Top Header Bar (Fixed outside ScrollView) */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-card border-b border-border shadow-2xs">
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
            className="w-9 h-9 rounded-full bg-primary-light border border-indigo-200 items-center justify-center"
            onPress={onNavigateToAddExpense}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={18} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </View>

      {/* Main ScrollView */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-3 py-1.5 gap-2.5"
        contentContainerStyle={{
          paddingBottom: 2,
        }}
        keyboardShouldPersistTaps="handled"
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
        {/* HERO STAT CARD: Initially at the very top */}
        {transactionType === 'PERSONAL' ? (
          <HeroStatCard
            title={
              selectedCategory !== 'All'
                ? `${selectedCategory} (${selectedTimeFilterLabel})`
                : selectedTimeFilter === 'ALL'
                ? 'All-Time Spend'
                : selectedTimeFilter === 'MONTH'
                ? 'This Month Spend'
                : selectedTimeFilter === 'WEEK'
                ? 'This Week Spend'
                : "Today's Spend"
            }
            badge="BDT"
            badgeColor="bg-slate-800 border-slate-700"
            badgeTextColor="text-indigo-300"
            dotColor="bg-indigo-400"
            mainAmount={summary.expense}
            subtitle={`Total ${
              summary.count
            } transactions in ${selectedTimeFilterLabel}${
              selectedCategory !== 'All' ? ` • ${selectedCategory}` : ''
            }`}
            metrics={[
              {
                label: '📅 Today',
                value: `৳${personalStats.todayTotal.toLocaleString('en-US')}`,
                valueColor: 'text-emerald-400',
              },
              {
                label: '📋 Items',
                value: `${summary.count} items`,
                valueColor: 'text-slate-100',
              },
              {
                label: '📊 Avg/Item',
                value: `৳${
                  summary.count > 0
                    ? Math.round(
                        summary.expense / summary.count,
                      ).toLocaleString('en-US')
                    : '0'
                }`,
                valueColor: 'text-sky-400',
              },
            ]}
          />
        ) : (
          <HeroStatCard
            title={
              selectedCategory !== 'All'
                ? `${selectedCategory} (${currentGroupName})`
                : selectedGroupId === 'ALL'
                ? 'All Groups Spend'
                : `${currentGroupName} Spend`
            }
            badge="BDT"
            badgeColor="bg-slate-800 border-slate-700"
            badgeTextColor="text-indigo-300"
            dotColor={
              groupStats.groupFundBalance >= 0
                ? 'bg-emerald-400'
                : 'bg-rose-400'
            }
            mainAmount={groupSummary.totalSpend}
            subtitle={`Total ${
              groupSummary.count
            } group expenses in ${currentGroupName}${
              selectedCategory !== 'All' ? ` • ${selectedCategory}` : ''
            }`}
            metrics={[
              {
                label: '💳 You Paid',
                value: `+৳${groupSummary.youPaid.toLocaleString('en-US')}`,
                valueColor: 'text-emerald-400',
              },
              {
                label: '📋 Items',
                value: `${groupSummary.count} items`,
                valueColor: 'text-slate-100',
              },
              {
                label: '⚖️ Fund Balance',
                value: `${
                  groupStats.groupFundBalance >= 0 ? '+' : '-'
                }৳${Math.abs(groupStats.groupFundBalance).toLocaleString(
                  'en-US',
                )}`,
                valueColor:
                  groupStats.groupFundBalance >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400',
              },
            ]}
          />
        )}

        {/* Filter Controls (Inline below Hero Card) */}
        {renderFilterControls()}

        {/* Expenses List Card (Shared Component - Matches Home Page Recent Expenses Style Exactly) */}
        {transactionType === 'GROUP' && isLoadingGroups ? (
          <View className="items-center justify-center py-16 gap-3 bg-card rounded-2xl border border-border mb-2">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-xs text-muted-foreground">
              Loading group expenses...
            </Text>
          </View>
        ) : (
          <ExpenseTableCard
            title={
              transactionType === 'PERSONAL'
                ? 'Personal Expenses'
                : 'Group Expenses'
            }
            subtitle={
              transactionType === 'PERSONAL'
                ? `${filteredPersonalTransactions.length} transaction${
                    filteredPersonalTransactions.length === 1 ? '' : 's'
                  } (${
                    selectedTimeFilter === 'TODAY'
                      ? 'Today'
                      : selectedTimeFilter === 'WEEK'
                      ? 'This Week'
                      : selectedTimeFilter === 'MONTH'
                      ? 'This Month'
                      : 'All Time'
                  })`
                : `${filteredGroupExpenses.length} transaction${
                    filteredGroupExpenses.length === 1 ? '' : 's'
                  } in ${currentGroupName}`
            }
            badge={`${formattedDisplayTransactions.length} items`}
            transactions={formattedDisplayTransactions}
            newlyAddedId={newlyAddedId}
            onItemPress={item => {
              if (transactionType === 'GROUP' && item.groupId) {
                onNavigateToGroupDetails?.(item.groupId);
              }
            }}
            emptyTitle={
              selectedTimeFilter === 'TODAY'
                ? 'No Expenses Logged Today'
                : 'No Expenses Found'
            }
            emptySubtitle={
              searchQuery
                ? 'Try different keywords or filters.'
                : selectedTimeFilter === 'TODAY'
                ? 'You have not added any expenses for today yet.'
                : 'Start adding personal or group expenses to see them here.'
            }
            onAddExpense={onNavigateToAddExpense}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
