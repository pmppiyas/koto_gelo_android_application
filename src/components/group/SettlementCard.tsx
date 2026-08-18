import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/spacing';

interface SettlementCardProps {
  fromName: string;
  toName: string;
  amount: number;
  isYouFrom: boolean;
  isYouTo: boolean;
  onSettle?: () => void;
}

const getInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

export const SettlementCard: React.FC<SettlementCardProps> = ({
  fromName,
  toName,
  amount,
  isYouFrom,
  isYouTo,
  onSettle,
}) => {
  const displayFrom = isYouFrom ? 'You' : fromName;
  const displayTo = isYouTo ? 'You' : toName;
  const showSettleButton = (isYouFrom || isYouTo) && onSettle;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.leftSide}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitial(fromName)}</Text>
            </View>
            <Feather name="arrow-right" size={16} color="#94A3B8" />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitial(toName)}</Text>
            </View>
          </View>
          <Text style={styles.namesText}>
            {displayFrom} → {displayTo}
          </Text>
        </View>
        <View style={styles.rightSide}>
          <Text style={styles.amountText}>৳{amount}</Text>
          {showSettleButton && (
            <TouchableOpacity style={styles.settleButton} onPress={onSettle}>
              <Text style={styles.settleButtonText}>Settle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: spacing.md - 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSide: {
    flex: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  namesText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.primary,
  },
  settleButton: {
    backgroundColor: '#1E3A5F',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: spacing.xs,
  },
  settleButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
