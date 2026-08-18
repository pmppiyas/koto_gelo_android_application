import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface SelectProps<T = string> {
  label?: string;
  options: SelectOption<T>[];
  selectedValue?: T;
  onSelect?: (value: T) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Select<T = string>({
  label,
  options,
  selectedValue,
  onSelect,
  error,
  containerStyle,
}: SelectProps<T>) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.optionsContainer}>
        {options.map(option => {
          const isSelected = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={String(option.value)}
              style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}
              onPress={() => onSelect && onSelect(option.value)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  optionBadge: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionBadgeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.semiBold,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.xs,
    color: colors.error,
  },
});
