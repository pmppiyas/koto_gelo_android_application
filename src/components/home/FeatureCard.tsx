import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text } from '../ui/core';

export interface FeatureCardProps {
  feature: {
    id?: string;
    title: string;
    description: string;
    icon: string;
  };
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  return (
    <View className="bg-card rounded-2xl p-4 border border-border shadow-sm">
      <View className="w-12 h-12 rounded-2xl bg-primary-light items-center justify-center mb-3">
        <Feather name={feature.icon as any} size={22} color="#4F46E5" />
      </View>
      <Text className="text-base font-bold text-foreground mb-1">{feature.title}</Text>
      <Text className="text-xs text-muted-foreground leading-relaxed">{feature.description}</Text>
    </View>
  );
};
