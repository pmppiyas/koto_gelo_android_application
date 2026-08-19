import React from 'react';
import { View, Text } from '../ui/core';

export interface ExpenseCategoryIconProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍲',
  Transport: '🚗',
  Shopping: '🛍️',
  Rent: '🏠',
  Entertainment: '🎬',
  Bills: '📱',
  Health: '💊',
  Education: '📚',
  Travel: '✈️',
  Groceries: '🛒',
  Personal: '👤',
  Other: '📦',
};

const sizeStyles: Record<string, { container: string; emoji: string }> = {
  sm: { container: 'w-7 h-7 rounded-lg', emoji: 'text-xs' },
  md: { container: 'w-10 h-10 rounded-xl', emoji: 'text-base' },
  lg: { container: 'w-12 h-12 rounded-2xl', emoji: 'text-xl' },
};

export const ExpenseCategoryIcon: React.FC<ExpenseCategoryIconProps> = ({
  category,
  size = 'md',
  className,
}) => {
  const emoji = CATEGORY_EMOJIS[category] || '📦';
  const s = sizeStyles[size] || sizeStyles.md;

  return (
    <View
      className={`items-center justify-center bg-primary-light border border-indigo-100 ${s.container} ${
        className || ''
      }`}
    >
      <Text className={s.emoji}>{emoji}</Text>
    </View>
  );
};
