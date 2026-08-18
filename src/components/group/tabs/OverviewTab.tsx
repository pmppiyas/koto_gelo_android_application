import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { spacing, borderRadius, typography, BOTTOM_TAB_HEIGHT } from '../../../constants/spacing';
import { GroupBalanceSummary } from '../GroupBalanceSummary';
import { SettlementCard } from '../SettlementCard';
import { GroupBalance, Settlement, GroupMember } from '../../../services/groupService';

export interface OverviewTabProps {
  balance: GroupBalance | null;
  settlements: Settlement[];
  members: GroupMember[];
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  userId: string;
  onAddExpense: () => void;
  onSettleUp: (settlement: Settlement) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  balance,
  settlements,
  members,
  isLoading,
  isRefreshing = false,
  onRefresh,
  userId,
  onAddExpense,
  onSettleUp,
}) => {
  if (isLoading && !balance) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    >
      <GroupBalanceSummary
        totalExpenses={balance?.totalExpenses ?? 0}
        yourSpending={balance?.yourSpending ?? 0}
        yourShare={balance?.yourShare ?? 0}
        netBalance={balance?.netBalance ?? 0}
        totalMembers={members.length || balance?.totalMembers || 1}
      />

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.addExpenseButton}
          onPress={onAddExpense}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settleUpButton}
          onPress={() => {
            if (settlements.length > 0) {
              onSettleUp(settlements[0]);
            }
          }}
          activeOpacity={0.8}
        >
          <Feather name="check-circle" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Settle Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suggested Settlements</Text>
        <Text style={styles.sectionBadge}>{settlements.length}</Text>
      </View>

      {settlements.length > 0 ? (
        <View style={styles.settlementsList}>
          {settlements.map((settlement, index) => (
            <SettlementCard
              key={`${settlement.from.id}-${settlement.to.id}-${index}`}
              fromName={settlement.from.name ?? settlement.from.username}
              toName={settlement.to.name ?? settlement.to.username}
              amount={settlement.amount}
              isYouFrom={settlement.from.id === userId}
              isYouTo={settlement.to.id === userId}
              onSettle={() => onSettleUp(settlement)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Feather name="check-circle" size={24} color={colors.secondary} style={{ marginBottom: 6 }} />
          <Text style={styles.emptyTitle}>All Settled Up! 🎉</Text>
          <Text style={styles.emptySubtitle}>No pending balance transfers needed</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: BOTTOM_TAB_HEIGHT + spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  addExpenseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md - 2,
    gap: spacing.xs + 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  settleUpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md - 2,
    gap: spacing.xs + 2,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.sm,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionBadge: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  settlementsList: {
    gap: spacing.sm,
  },
  emptyCard: {
    backgroundColor: colors.secondaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  emptyTitle: {
    fontSize: typography.sm + 1,
    color: colors.secondary,
    fontWeight: '800',
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
});
