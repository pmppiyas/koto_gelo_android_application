import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { spacing } from '../../../../theme/spacing';

export const EditPersonalExpenseScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <Screen scrollable>
      <Header title="Edit Expense" />
      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        containerStyle={styles.field}
      />
      <Input
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        containerStyle={styles.field}
      />
      <Button
        title="Update Expense"
        onPress={() => {}}
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
