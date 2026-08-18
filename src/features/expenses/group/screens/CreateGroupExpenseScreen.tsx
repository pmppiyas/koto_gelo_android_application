import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../../components/layout/Screen';
import { Header } from '../../../../components/layout/Header';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { SplitSelector } from '../components/SplitSelector';
import { ParticipantSelector } from '../components/ParticipantSelector';
import { SplitType } from '../../../../constants/expense';
import { useGroupExpenses } from '../hooks/useGroupExpenses';
import { calculateSplits } from '../calculator/splitCalculator';
import { spacing } from '../../../../theme/spacing';

export const CreateGroupExpenseScreen: React.FC<{ groupId?: string }> = ({
  groupId = 'default_group',
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(['u1', 'u2']);
  const { addExpense, loading } = useGroupExpenses(groupId);

  const mockParticipants = [
    { id: 'u1', name: 'You' },
    { id: 'u2', name: 'Rahim' },
    { id: 'u3', name: 'Karim' },
  ];

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const total = parseFloat(amount) || 0;
    const splits = calculateSplits({
      totalAmount: total,
      splitType,
      participants: selectedParticipants.map(id => ({ userId: id })),
    });

    try {
      await addExpense({
        groupId,
        title,
        amount: total,
        currency: 'BDT',
        category: 'OTHERS',
        paidById: 'u1',
        splitType,
        splits,
        date: new Date().toISOString(),
      });
    } catch (e) {}
  };

  return (
    <Screen scrollable>
      <Header title="Add Group Expense" />
      <View style={styles.container}>
        <Input
          label="Title"
          placeholder="e.g. Dinner with friends"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <ParticipantSelector
          participants={mockParticipants}
          selectedIds={selectedParticipants}
          onToggle={toggleParticipant}
        />
        <SplitSelector
          selectedType={splitType}
          onSelectType={setSplitType}
        />
        <Button
          title="Save Group Expense"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
        />
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
