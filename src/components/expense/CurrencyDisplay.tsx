import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export interface CurrencyDisplayProps {
  currency?: string;
  style?: TextStyle;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  currency = 'BDT',
  style,
}) => {
  return <Text style={[styles.currency, style]}>{currency}</Text>;
};

const styles = StyleSheet.create({
  currency: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
});
