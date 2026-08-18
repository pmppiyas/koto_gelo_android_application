import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { formatCurrency } from '../../utils/currency';

export interface AmountDisplayProps {
  amount: number;
  currency?: string;
  type?: 'income' | 'expense' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: TextStyle;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'BDT',
  type = 'neutral',
  size = 'md',
  style,
}) => {
  const formatted = formatCurrency(amount, currency);

  return (
    <Text style={[styles.text, styles[type], styles[`size_${size}`], style]}>
      {type === 'income' ? `+${formatted}` : type === 'expense' ? `-${formatted}` : formatted}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: typography.fontWeights.bold,
  },
  income: {
    color: colors.success,
  },
  expense: {
    color: colors.error,
  },
  neutral: {
    color: colors.text,
  },
  size_sm: {
    fontSize: typography.fontSizes.sm,
  },
  size_md: {
    fontSize: typography.fontSizes.md,
  },
  size_lg: {
    fontSize: typography.fontSizes.lg,
  },
  size_xl: {
    fontSize: typography.fontSizes.xxl,
  },
});
