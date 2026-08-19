import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text } from '../ui/core';

export interface OfflineBannerProps {
  message?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message = 'You are currently offline. Changes are saved locally.',
}) => {
  return (
    <View className="bg-amber-50 px-4 py-2.5 flex-row items-center justify-center gap-2 border-b border-amber-200">
      <Feather name="wifi-off" size={14} color="#D97706" />
      <Text className="text-xs font-semibold text-amber-800 text-center flex-1">{message}</Text>
    </View>
  );
};
