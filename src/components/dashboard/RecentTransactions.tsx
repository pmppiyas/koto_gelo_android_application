import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Transaction } from '../../types/transaction';
import { categoryIconMap } from '../../data/demoData';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';

export interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeAll?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onSeeAll,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Activity</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {transactions.map((item, index) => {
        const isLast = index === transactions.length - 1;
        
        const iconName = item.icon || categoryIconMap[item.category] || 'more-horizontal';
        let bgStyle = {};
        let iconColor = colors.textPrimary;
        let amountStyle = {};
        let amountPrefix = '';

        if (item.type === 'income') {
          bgStyle = styles.bgIncome;
          iconColor = colors.secondary;
          amountStyle = styles.amountIncome;
          amountPrefix = '+';
        } else if (item.type === 'settlement') {
          bgStyle = styles.bgSettlement;
          iconColor = colors.accent;
          amountStyle = styles.amountSettlement;
          amountPrefix = '+';
        } else {
          bgStyle = styles.bgExpense;
          iconColor = colors.danger;
          amountStyle = styles.amountExpense;
          amountPrefix = '-';
        }

        return (
          <View key={item.id} style={[styles.transactionItem, !isLast && styles.borderBottom]}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconBadge, bgStyle]}>
                <Feather name={iconName as any} size={20} color={iconColor} />
              </View>
              <View style={styles.itemCenter}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.groupName ? `${item.groupName} • ` : ''}
                  {item.date}
                </Text>
              </View>
            </View>

            <View style={styles.itemRight}>
              <Text style={[styles.itemAmount, amountStyle]}>
                {amountPrefix}৳{item.amount.toLocaleString('en-US')}
              </Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  bgIncome: {
    backgroundColor: colors.secondaryLight,
  },
  bgExpense: {
    backgroundColor: colors.dangerLight,
  },
  bgSettlement: {
    backgroundColor: colors.accentLight,
  },
  itemCenter: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.sm + 1,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: typography.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  amountIncome: {
    color: colors.secondary,
  },
  amountExpense: {
    color: colors.textPrimary,
  },
  amountSettlement: {
    color: colors.accent,
  },
  itemCategory: {
    fontSize: typography.xs,
    color: colors.textMuted,
  },
});
