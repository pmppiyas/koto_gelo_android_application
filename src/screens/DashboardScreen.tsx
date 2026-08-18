import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { EXPENSE_CATEGORIES } from '../constants/expense';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { DashboardDrawer } from '../components/dashboard/DashboardDrawer';
import { demoBalanceSummary, demoTransactions } from '../data/demoData';
import { useAuth, useExpenses } from '../store/hooks';
import { Transaction, BalanceSummary } from '../types/transaction';

export interface DashboardScreenProps {
  onNavigateToTransactions?: () => void;
  onNavigateToAddExpense?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHome?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToTransactions,
  onNavigateToAddExpense,
  onNavigateToProfile,
  onNavigateToHome,
}) => {
  const { user, logout } = useAuth();
  const { expenses, pendingExpenses, totalExpenseAmount, syncExpenses, isSyncing } = useExpenses();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const displayName = user?.name || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const categoryMap = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; icon: keyof typeof Feather.glyphMap }> = {};
    EXPENSE_CATEGORIES.forEach((c) => {
      map[c.name] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.slug] = { name: c.name, emoji: c.emoji, icon: c.icon };
      map[c.id] = { name: c.name, emoji: c.emoji, icon: c.icon };
    });
    return map;
  }, []);

  const dynamicSummary: BalanceSummary = useMemo(() => {
    const baseExpense = demoBalanceSummary.totalExpense;
    const combinedExpense = baseExpense + totalExpenseAmount;
    const baseBalance = demoBalanceSummary.totalBalance;
    const combinedBalance = Math.max(0, baseBalance - totalExpenseAmount);
    const combinedSavings = Math.max(0, demoBalanceSummary.savings - totalExpenseAmount);

    return {
      totalBalance: combinedBalance,
      totalIncome: demoBalanceSummary.totalIncome,
      totalExpense: combinedExpense,
      savings: combinedSavings,
      youOwe: demoBalanceSummary.youOwe,
      youAreOwed: demoBalanceSummary.youAreOwed,
      currency: 'BDT',
    };
  }, [totalExpenseAmount]);

  const unifiedRecentTransactions: Transaction[] = useMemo(() => {
    const localConverted: Transaction[] = expenses.map((e) => {
      const catInfo = categoryMap[e.category] || categoryMap[e.category.toLowerCase()];
      return {
        id: e.localId,
        title: e.title || catInfo?.name || e.category,
        category: catInfo?.name || e.category,
        amount: Number(e.amount),
        type: 'expense',
        date: e.date === new Date().toISOString().split('T')[0] ? 'Today' : e.date,
        icon: catInfo?.icon || 'coffee',
      };
    });

    return [...localConverted, ...demoTransactions].slice(0, 5);
  }, [expenses, categoryMap]);

  const handleDrawerSelectRoute = (route: string) => {
    switch (route) {
      case 'DASHBOARD':
        break;
      case 'PERSONAL_EXPENSES':
      case 'TODAY_EXPENSES':
      case 'EXPENSE_SUMMARY':
      case 'GROUP_EXPENSES':
      case 'GROUP_HISTORY':
        onNavigateToTransactions?.();
        break;
      case 'PROFILE':
      case 'SETTINGS':
        onNavigateToProfile?.();
        break;
      default:
        break;
    }
  };

  const handleDrawerLogout = async () => {
    await logout();
    onNavigateToHome?.();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BOTTOM_TAB_HEIGHT + spacing.lg }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Good morning,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.avatarCircle}
              onPress={onNavigateToProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarInitial}>{initial}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Feather name="bell" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => setIsDrawerOpen(true)}
              activeOpacity={0.7}
            >
              <Feather name="menu" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {pendingExpenses.length > 0 && (
          <TouchableOpacity 
            style={styles.offlineBanner}
            onPress={syncExpenses}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            <View style={styles.offlineBannerLeft}>
              <Feather name="cloud-off" size={16} color="#B45309" />
              <Text style={styles.offlineBannerText}>
                {pendingExpenses.length} expense{pendingExpenses.length > 1 ? 's' : ''} waiting to sync
              </Text>
            </View>
            <View style={styles.syncNowBtn}>
              <Text style={styles.syncNowText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <BalanceCard balanceSummary={dynamicSummary} />
        </View>

        <View style={styles.section}>
          <SummaryCard balanceSummary={dynamicSummary} />
        </View>

        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionItem} onPress={onNavigateToAddExpense}>
            <View style={[styles.actionIconCircle, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>Add Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIconCircle, { backgroundColor: colors.secondary }]}>
              <Feather name="send" size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>Transfer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIconCircle, { backgroundColor: colors.accent }]}>
              <Feather name="users" size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>Groups</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIconCircle, { backgroundColor: colors.primaryDark }]}>
              <Feather name="bar-chart-2" size={24} color={colors.surface} />
            </View>
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <RecentTransactions 
            transactions={unifiedRecentTransactions} 
            onSeeAll={onNavigateToTransactions} 
          />
        </View>
      </ScrollView>

      <DashboardDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectRoute={handleDrawerSelectRoute}
        onLogout={handleDrawerLogout}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greetingText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: colors.primary,
    fontSize: typography.md,
    fontWeight: 'bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  offlineBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
  },
  offlineBannerText: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: '#92400E',
  },
  syncNowBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  syncNowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: spacing.lg,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: {
    fontSize: typography.xs,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
