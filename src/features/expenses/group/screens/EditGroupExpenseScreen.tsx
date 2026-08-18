import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { spacing } from '../../../../theme/spacing';

export const EditGroupExpenseScreen: React.FC = () => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <Screen scrollable>
      <Header title="Edit Group Expense" />
      <View style={styles.container}>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Button title="Update Expense" onPress={() => {}} style={styles.button} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
});
