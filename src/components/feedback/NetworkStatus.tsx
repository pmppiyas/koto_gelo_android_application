import React from 'react';
import { View, Text } from '../ui/core';

export interface NetworkStatusProps {
  isConnected: boolean | null;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ isConnected }) => {
  if (isConnected === null || isConnected) return null;

  return (
    <View className="bg-destructive py-1.5 px-4 items-center justify-center">
      <Text className="text-[11px] font-bold text-destructive-foreground">
        No Internet Connection • Working in Offline Mode
      </Text>
    </View>
  );
};
