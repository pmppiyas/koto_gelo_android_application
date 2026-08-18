import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '../../../../components/ui/Input';
import { Participant } from './ParticipantSelector';
import { spacing } from '../../../../theme/spacing';

export interface SharesSplitInputProps {
  participants: Participant[];
  values: Record<string, number>;
  onChange: (userId: string, value: number) => void;
}

export const SharesSplitInput: React.FC<SharesSplitInputProps> = ({
  participants,
  values,
  onChange,
}) => {
  return (
    <View style={styles.container}>
      {participants.map(p => (
        <Input
          key={p.id}
          label={`${p.name} (Shares)`}
          placeholder="1"
          keyboardType="numeric"
          value={values[p.id]?.toString() || '1'}
          onChangeText={val => onChange(p.id, parseInt(val, 10) || 1)}
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
