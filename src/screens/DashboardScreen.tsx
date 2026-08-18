import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../constants/spacing';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { demoBalanceSummary, demoTransactions } from '../data/demoData';
import { useAuth } from '../store/hooks';

export interface DashboardScreenProps {
  onNavigateToTransactions?: () => void;
  onNavigateToAddExpense?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToTransactions,
  onNavigateToAddExpense,
}) => {
  const { user } = useAuth();
  
  const displayName = user?.name || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

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
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Feather name="bell" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <BalanceCard balanceSummary={demoBalanceSummary} />
        </View>

        <View style={styles.section}>
          <SummaryCard balanceSummary={demoBalanceSummary} />
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
            transactions={demoTransactions.slice(0, 5)} 
            onSeeAll={onNavigateToTransactions} 
          />
        </View>
      </ScrollView>
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
    marginBottom: spacing.xl,
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
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarInitial: {
    color: colors.primary,
    fontSize: typography.lg,
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
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
