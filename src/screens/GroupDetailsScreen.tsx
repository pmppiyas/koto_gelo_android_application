import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography } from '../constants/spacing';
import {
  groupService,
  Group,
  GroupExpense,
  GroupBalance,
  Settlement,
} from '../services/groupService';
import { useAuth } from '../store/hooks';
import { OverviewTab } from '../components/group/tabs/OverviewTab';
import { ExpensesTab } from '../components/group/tabs/ExpensesTab';
import { SettlementsTab } from '../components/group/tabs/SettlementsTab';
import { MembersTab } from '../components/group/tabs/MembersTab';
import { AddGroupExpenseModal } from '../components/group/AddGroupExpenseModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

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

const TABS = ['Overview', 'Expenses', 'Settlements', 'Members'] as const;
type TabName = typeof TABS[number];

export interface GroupDetailsScreenProps {
  groupId: string;
  onNavigateBack: () => void;
}

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = ({
  groupId,
  onNavigateBack,
}) => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [activeTab, setActiveTab] = useState<TabName>('Overview');
  const [group, setGroup] = useState<Group | null>(null);
  const [balance, setBalance] = useState<GroupBalance | null>(null);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [settlingItem, setSettlingItem] = useState<Settlement | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const fetchGroupData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [groupRes, balanceRes, expensesRes, settlementsRes] = await Promise.allSettled([
        groupService.getGroupById(groupId),
        groupService.getGroupBalance(groupId),
        groupService.getGroupExpenses(groupId, { limit: 50 }),
        groupService.getGroupSettlements(groupId),
      ]);

      if (groupRes.status === 'fulfilled') setGroup(groupRes.value);
      if (balanceRes.status === 'fulfilled') setBalance(balanceRes.value);
      if (expensesRes.status === 'fulfilled') {
        const val = expensesRes.value;
        const list =
          val?.history ||
          val?.expenses ||
          val?.data?.history ||
          val?.data?.expenses ||
          (Array.isArray(val) ? val : []);
        setExpenses(Array.isArray(list) ? list : []);
      }
      if (settlementsRes.status === 'fulfilled') {
        setSettlements(Array.isArray(settlementsRes.value) ? settlementsRes.value : []);
      }
    } catch {} finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleExpenseAdded = () => {
    fetchGroupData(true);
  };

  const handleSettleUp = async () => {
    if (!settlingItem) return;
    setIsSettling(true);
    try {
      await groupService.settlePayment({
        groupId,
        toUserId: settlingItem.to.id,
        amount: settlingItem.amount,
      });
      setSettlingItem(null);
      fetchGroupData(true);
    } catch {} finally {
      setIsSettling(false);
    }
  };

  const members = group?.members || [];
  const emoji = TYPE_EMOJI[group?.type || 'OTHER'] || '📁';

  const renderTab = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <OverviewTab
            balance={balance}
            settlements={settlements}
            members={members}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={() => fetchGroupData(true)}
            userId={userId}
            onAddExpense={() => setIsAddExpenseOpen(true)}
            onSettleUp={(s) => setSettlingItem(s)}
          />
        );
      case 'Expenses':
        return (
          <ExpensesTab
            expenses={expenses}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={() => fetchGroupData(true)}
            userId={userId}
            onAddExpense={() => setIsAddExpenseOpen(true)}
          />
        );
      case 'Settlements':
        return (
          <SettlementsTab
            settlements={settlements}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={() => fetchGroupData(true)}
            userId={userId}
            onSettle={(s) => setSettlingItem(s)}
          />
        );
      case 'Members':
        return (
          <MembersTab
            members={members}
            balance={balance}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            onRefresh={() => fetchGroupData(true)}
            userId={userId}
          />
        );
    }
  };

  if (isLoading && !group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{emoji}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {group?.name || 'Group'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddExpenseOpen(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
              {isActive && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tabContent}>
        {renderTab()}
      </View>

      <AddGroupExpenseModal
        visible={isAddExpenseOpen}
        groupId={groupId}
        members={members}
        onClose={() => setIsAddExpenseOpen(false)}
        onExpenseAdded={handleExpenseAdded}
      />

      <ConfirmModal
        visible={settlingItem !== null}
        title="Settle Payment"
        message={
          settlingItem
            ? `Pay ৳${settlingItem.amount.toLocaleString()} to ${settlingItem.to.name || settlingItem.to.username}?`
            : ''
        }
        confirmText="Pay Now"
        confirmVariant="primary"
        iconName="check-circle"
        isLoading={isSettling}
        onConfirm={handleSettleUp}
        onClose={() => setSettlingItem(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontSize: typography.xs + 1,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabContent: {
    flex: 1,
  },
});
