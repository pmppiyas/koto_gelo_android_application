import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';

export interface GroupBalanceSummaryProps {
  totalExpenses: number;
  yourSpending: number;
  yourShare: number;
  netBalance: number;
  totalMembers: number;
}

export const GroupBalanceSummary: React.FC<GroupBalanceSummaryProps> = ({
  totalExpenses,
  yourSpending,
  yourShare,
  netBalance,
  totalMembers,
}) => {
  const isPositive = netBalance >= 0;
  const isZero = netBalance === 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.topLabel}>Total Group Spending</Text>
          <Text style={styles.topAmount}>৳{totalExpenses.toLocaleString()}</Text>
        </View>
        <View style={styles.memberBadge}>
          <Feather name="users" size={12} color={colors.primary} />
          <Text style={styles.memberBadgeText}>{totalMembers} member{totalMembers === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={styles.statIconCircle}>
            <Feather name="arrow-up-right" size={14} color={colors.secondary} />
          </View>
          <View style={styles.statTextGroup}>
            <Text style={styles.statLabel}>You Paid</Text>
            <Text style={styles.statValue}>৳{yourSpending.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.statIconCircle, { backgroundColor: colors.accentLight }]}>
            <Feather name="pie-chart" size={14} color={colors.accent} />
          </View>
          <View style={styles.statTextGroup}>
            <Text style={styles.statLabel}>Your Share</Text>
            <Text style={styles.statValue}>৳{yourShare.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.netBanner,
          isZero
            ? styles.netBannerNeutral
            : isPositive
            ? styles.netBannerPositive
            : styles.netBannerNegative,
        ]}
      >
        <Feather
          name={isZero ? 'check-circle' : isPositive ? 'trending-up' : 'trending-down'}
          size={18}
          color={isZero ? colors.secondary : isPositive ? colors.secondary : colors.danger}
        />
        <View style={styles.netTextContainer}>
          <Text
            style={[
              styles.netStatusText,
              { color: isZero ? colors.secondary : isPositive ? colors.secondary : colors.danger },
            ]}
          >
            {isZero
              ? 'You are all settled up'
              : isPositive
              ? 'You are owed'
              : 'You owe'}
          </Text>
          {!isZero && (
            <Text
              style={[
                styles.netAmountText,
                { color: isPositive ? colors.secondary : colors.danger },
              ]}
            >
              ৳{Math.abs(netBalance).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  topLabel: {
    fontSize: typography.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  topAmount: {
    fontSize: typography.xxl,
    fontWeight: '800',
    color: colors.primary,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  memberBadgeText: {
    fontSize: typography.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextGroup: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 1,
  },
  statValue: {
    fontSize: typography.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  netBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  netBannerPositive: {
    backgroundColor: colors.secondaryLight,
  },
  netBannerNegative: {
    backgroundColor: colors.dangerLight,
  },
  netBannerNeutral: {
    backgroundColor: colors.secondaryLight,
  },
  netTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netStatusText: {
    fontSize: typography.xs + 1,
    fontWeight: '700',
  },
  netAmountText: {
    fontSize: typography.md,
    fontWeight: '800',
  },
});
