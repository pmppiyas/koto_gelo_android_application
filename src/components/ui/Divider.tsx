import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export interface DividerProps {
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
}

export const Divider: React.FC<DividerProps> = ({
  style,
  orientation = 'horizontal',
}) => {
  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: spacing.sm,
  },
  vertical: {
    width: 1,
    backgroundColor: colors.border,
    height: '100%',
    marginHorizontal: spacing.sm,
  },
});
