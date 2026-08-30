import React from 'react';
import { View, Text, TouchableOpacity } from '../ui/core';

interface GroupExpenseCardProps {
  title: string;
  amount: number;
  category: string;
  paidByName: string;
  isYou: boolean;
  paymentSource?: 'GROUP_FUND' | 'PERSONAL';
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
  paymentSource,
  date,
  participantCount,
  splitAmount,
  onPress,
}) => {
  const displayName = isYou ? 'You' : paidByName;
  const perPerson = splitAmount ?? Math.round(amount / participantCount);
  const isFromGroupFund = paymentSource !== 'PERSONAL';

  return (
    <TouchableOpacity
      className="flex-row items-center bg-card rounded-xl p-3 border border-border shadow-xs"
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View className="w-11 h-11 rounded-full bg-primary-light items-center justify-center">
        <Text className="text-lg">{getCategoryEmoji(category)}</Text>
      </View>

      <View className="flex-1 mx-3">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-bold text-foreground flex-1" numberOfLines={1}>
            {title}
          </Text>
          <View
            className={`px-2 py-0.5 rounded-full border ${
              isFromGroupFund
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <Text
              className={`text-[9px] font-bold ${
                isFromGroupFund ? 'text-emerald-700' : 'text-blue-700'
              }`}
            >
              {isFromGroupFund ? 'Group Fund' : 'Personal Pocket'}
            </Text>
          </View>
        </View>

        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          {isFromGroupFund ? (
            <Text className="font-semibold text-emerald-700">Group Fund</Text>
          ) : (
            <>
              Paid by{' '}
              <Text className={isYou ? 'font-bold text-primary' : 'font-medium text-foreground'}>
                {isYou ? 'You' : paidByName?.startsWith('@') ? paidByName : `@${paidByName}`}
              </Text>
            </>
          )}
        </Text>
        <Text className="text-[11px] text-muted-foreground mt-0.5">
          {date} • {participantCount === 1 ? '1 member' : `${participantCount} members`}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-sm font-extrabold text-primary">-৳{amount.toLocaleString()}</Text>
        <Text className="text-[11px] text-muted-foreground mt-0.5">
          {participantCount === 1 ? 'Only you' : `৳${perPerson.toLocaleString()}/person`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
