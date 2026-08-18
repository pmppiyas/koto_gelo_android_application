import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/spacing';

export interface AdvantageCardProps {
  advantage: {
    id?: string;
    title: string;
    icon: string;
  };
}

export const AdvantageCard: React.FC<AdvantageCardProps> = ({ advantage }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Feather name={advantage.icon as any} size={14} color={colors.secondary} />
      </View>
      <Text style={styles.title}>{advantage.title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
