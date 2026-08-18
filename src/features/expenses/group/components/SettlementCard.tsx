import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SettlementSuggestion } from '../types/settlement.types';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { AmountDisplay } from '../../../../components/expense/AmountDisplay';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';
import { colors } from '../../../../theme/colors';

export interface SettlementCardProps {
  settlement: SettlementSuggestion;
  onSettle?: () => void;
}

export const SettlementCard: React.FC<SettlementCardProps> = ({
  settlement,
  onSettle,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.text}>
          <Text style={styles.name}>{settlement.fromUserName}</Text> owes{' '}
          <Text style={styles.name}>{settlement.toUserName}</Text>
        </Text>
        <AmountDisplay
          amount={settlement.amount}
          currency={settlement.currency}
          size="md"
        />
      </View>
      {onSettle ? (
        <Button
          title="Settle Up"
          size="sm"
          onPress={onSettle}
          style={styles.button}
        />
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
  name: {
    fontWeight: typography.fontWeights.bold,
  },
  button: {
    marginTop: spacing.sm,
  },
});
