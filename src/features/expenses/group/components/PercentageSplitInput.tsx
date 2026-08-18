import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../../../../components/ui/Input';
import { Participant } from './ParticipantSelector';
import { spacing } from '../../../../theme/spacing';

export interface PercentageSplitInputProps {
  participants: Participant[];
  values: Record<string, number>;
  onChange: (userId: string, value: number) => void;
}

export const PercentageSplitInput: React.FC<PercentageSplitInputProps> = ({
  participants,
  values,
  onChange,
}) => {
  return (
    <View style={styles.container}>
      {participants.map(p => (
        <Input
          key={p.id}
          label={`${p.name} (%)`}
          placeholder="0%"
          keyboardType="numeric"
          value={values[p.id]?.toString() || ''}
          onChangeText={val => onChange(p.id, parseFloat(val) || 0)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
});
