import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SplitType, SPLIT_TYPES } from '../../../../constants/expense';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

export interface SplitSelectorProps {
  selectedType: SplitType;
  onSelectType: (type: SplitType) => void;
}

export const SplitSelector: React.FC<SplitSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  const types: { label: string; value: SplitType }[] = [
    { label: 'Equal', value: 'EQUAL' },
    { label: 'Exact', value: 'EXACT' },
    { label: 'Percentage', value: 'PERCENTAGE' },
    { label: 'Shares', value: 'SHARES' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Split Type</Text>
      <View style={styles.tabs}>
        {types.map(t => {
          const isSelected = t.value === selectedType;
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.tab, isSelected && styles.tabSelected]}
              onPress={() => onSelectType(t.value)}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabSelected: {
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
});
