import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text } from '../ui/core';

export interface AdvantageCardProps {
  advantage: {
    id?: string;
    title: string;
    icon: string;
  };
}

export const AdvantageCard: React.FC<AdvantageCardProps> = ({ advantage }) => {
  return (
    <View className="flex-row items-center bg-card py-2 px-3.5 rounded-full border border-border gap-2">
      <View className="w-7 h-7 rounded-full bg-emerald-50 items-center justify-center">
        <Feather name={advantage.icon as any} size={14} color="#10B981" />
      </View>
      <Text className="text-xs font-semibold text-foreground">{advantage.title}</Text>
    </View>
  );
};
