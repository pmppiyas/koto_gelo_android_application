import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/spacing';

interface GroupExpenseCardProps {
  title: string;
  amount: number;
  category: string;
  paidByName: string;
  isYou: boolean;
  date: string;
  participantCount: number;
  splitAmount?: number;
  onPress?: () => void;
}

const categoryEmojis: Record<string, string> = {
  Food: '🍲',
  Transport: '🚗',
  Shopping: '🛍️',
  Rent: '🏠',
  Entertainment: '🎬',
  Bills: '📱',
  Health: '💊',
  Education: '📚',
};

const getCategoryEmoji = (category: string): string => {
  return categoryEmojis[category] ?? '📦';
};

export const GroupExpenseCard: React.FC<GroupExpenseCardProps> = ({
  title,
  amount,
  category,
  paidByName,
  isYou,
  date,
  participantCount,
  splitAmount,
  onPress,
}) => {
  const displayName = isYou ? 'You' : paidByName;
  const perPerson = splitAmount ?? Math.round(amount / participantCount);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.emojiCircle}>
        <Text style={styles.emoji}>{getCategoryEmoji(category)}</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.paidBy} numberOfLines={1}>
          Paid by {displayName}
        </Text>
        <Text style={styles.meta}>
          {date} • {participantCount} people
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>-৳{amount.toLocaleString()}</Text>
        <Text style={styles.split}>৳{perPerson.toLocaleString()}/person</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md - 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emojiCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  center: {
    flex: 1,
    marginHorizontal: spacing.sm + 4,
  },
  title: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paidBy: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  split: {
    fontSize: typography.xs - 1,
    color: colors.textMuted,
    marginTop: 2,
  },
});
