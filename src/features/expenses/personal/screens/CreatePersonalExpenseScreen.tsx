import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { TextArea } from '../../../../components/ui/TextArea';
import { Button } from '../../../../components/ui/Button';
import { EXPENSE_CATEGORIES } from '../../../../constants/expense';
import { usePersonalExpenses } from '../hooks/usePersonalExpenses';
import { validateCreatePersonalExpense } from '../schemas/createPersonalExpense.schema';
import { spacing } from '../../../../theme/spacing';

export const CreatePersonalExpenseScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addExpense, loading } = usePersonalExpenses();

  const handleSave = async () => {
    const validation = validateCreatePersonalExpense({ title, amount, category });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    try {
      await addExpense({
        title,
        amount: parseFloat(amount),
        currency: 'BDT',
        category: category as any,
        date: new Date().toISOString(),
        notes,
      });
    } catch (e) {}
  };

  const categoryOptions = EXPENSE_CATEGORIES.map(c => ({
    label: c.replace(/_/g, ' '),
    value: c,
  }));

  return (
    <Screen scrollable>
      <Header title="Add Expense" />
      <Input
        label="Title"
        placeholder="e.g. Grocery shopping"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        containerStyle={styles.field}
      />
      <Input
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        error={errors.amount}
        containerStyle={styles.field}
      />
      <Select
        label="Category"
        options={categoryOptions}
        selectedValue={category}
        onSelect={setCategory}
        containerStyle={styles.field}
      />
      <TextArea
        label="Notes (Optional)"
        placeholder="Add details..."
        value={notes}
        onChangeText={setNotes}
        containerStyle={styles.field}
      />
      <Button
        title="Save Expense"
        onPress={handleSave}
        loading={loading}
        style={styles.button}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  field: {
    paddingHorizontal: spacing.md,
  },
  button: {
    margin: spacing.md,
  },
});
