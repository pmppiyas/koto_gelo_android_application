import React from 'react';
import { TextStyle } from 'react-native';
import { Text } from '../ui/core';
import { formatCurrency } from '../../utils/currency';

export interface AmountDisplayProps {
  amount: number;
  currency?: string;
  type?: 'income' | 'expense' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: TextStyle;
  className?: string;
}

const typeStyles: Record<string, string> = {
  income: 'text-emerald-600 font-extrabold',
  expense: 'text-destructive font-extrabold',
  neutral: 'text-foreground font-bold',
};

const sizeStyles: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
};

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'BDT',
  type = 'neutral',
  size = 'md',
  style,
  className,
}) => {
  const formatted = formatCurrency(amount, currency);

  return (
    <Text
      className={`${typeStyles[type]} ${sizeStyles[size]} ${className || ''}`}
      style={style}
    >
      {type === 'income' ? `+${formatted}` : type === 'expense' ? `-${formatted}` : formatted}
    </Text>
  );
};
