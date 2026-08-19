import React from 'react';
import { TextStyle } from 'react-native';
import { Text } from '../ui/core';
import { formatCurrency } from '../../utils/currency';

export interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  style?: TextStyle;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = 'BDT',
  style,
  className,
}) => {
  return (
    <Text className={`font-bold text-foreground ${className || ''}`} style={style}>
      {formatCurrency(amount, currency)}
    </Text>
  );
};
