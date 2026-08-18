import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
}) => {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: `${colors.primary}20`,
  },
  secondary: {
    backgroundColor: `${colors.secondary}20`,
  },
  success: {
    backgroundColor: `${colors.success}20`,
  },
  warning: {
    backgroundColor: `${colors.warning}20`,
  },
  error: {
    backgroundColor: `${colors.error}20`,
  },
  text: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
  },
  text_default: {
    color: colors.textSecondary,
  },
  text_primary: {
    color: colors.primary,
  },
  text_secondary: {
    color: colors.secondary,
  },
  text_success: {
    color: colors.success,
  },
  text_warning: {
    color: colors.warning,
  },
  text_error: {
    color: colors.error,
  },
});
