import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { EXPENSE_CATEGORIES } from '../../../../constants/expense';
import { Select } from '../../../../components/ui/Select';
import { spacing } from '../../../../theme/spacing';

export interface ExpenseFilterProps {
  selectedCategory?: string;
  onSelectCategory: (category: string) => void;
}

export const ExpenseFilter: React.FC<ExpenseFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const options = [
    { label: 'All', value: '' },
    ...EXPENSE_CATEGORIES.map(c => ({ label: c.replace(/_/g, ' '), value: c })),
  ];

  return (
    <View style={styles.container}>
      <Select
        options={options}
        selectedValue={selectedCategory}
        onSelect={onSelectCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
});
