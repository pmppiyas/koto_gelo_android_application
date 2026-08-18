import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';

export interface Participant {
  id: string;
  name: string;
}

export interface ParticipantSelectorProps {
  participants: Participant[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  participants,
  selectedIds,
  onToggle,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Participants</Text>
      <View style={styles.list}>
        {participants.map(p => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(p.id)}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

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
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.semiBold,
  },
});
