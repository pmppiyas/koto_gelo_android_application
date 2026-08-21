import React from 'react';
import { View, Text, TouchableOpacity } from '../ui/core';

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
      className="flex-row items-center bg-card rounded-xl p-3 border border-border shadow-sm"
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View className="w-11 h-11 rounded-full bg-primary-light items-center justify-center">
        <Text className="text-lg">{getCategoryEmoji(category)}</Text>
      </View>

      <View className="flex-1 mx-3">
        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
          Handled by <Text className={isYou ? 'font-bold text-primary' : ''}>{displayName}</Text>
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {date} • {participantCount === 1 ? 'Only 1 person' : `${participantCount} people`}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-sm font-extrabold text-primary">-৳{amount.toLocaleString()}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {participantCount === 1 ? 'Only you' : `৳${perPerson.toLocaleString()}/person`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
