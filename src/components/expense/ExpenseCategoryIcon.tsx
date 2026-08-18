import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const CATEGORY_EMOJIS: Record<string, string> = {
  FOOD_AND_DINING: '🍔',
  GROCERIES: '🛒',
  TRANSPORTATION: '🚗',
  RENT_AND_UTILITIES: '🏠',
  ENTERTAINMENT: '🎬',
  HEALTHCARE: '💊',
  SHOPPING: '🛍️',
  TRAVEL: '✈️',
  EDUCATION: '📚',
  OTHERS: '📦',
};

export interface ExpenseCategoryIconProps {
  category: string;
  size?: number;
}

export const ExpenseCategoryIcon: React.FC<ExpenseCategoryIconProps> = ({
  category,
  size = 36,
}) => {
  const emoji = CATEGORY_EMOJIS[category] || '💰';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
