import React from 'react';
import { View, Text } from '../ui/core';

interface GroupMemberRowProps {
  name: string;
  username: string;
  role: 'ADMIN' | 'MEMBER';
  isYou: boolean;
  netBalance?: number;
}

export const GroupMemberRow: React.FC<GroupMemberRowProps> = ({
  name,
  username,
  role,
  isYou,
  netBalance,
}) => {
  const initial = name.charAt(0).toUpperCase();
  const isPositive = netBalance !== undefined && netBalance > 0;
  const isNegative = netBalance !== undefined && netBalance < 0;

  return (
    <View className="flex-row items-center py-2.5 border-b border-border">
      <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center border border-blue-200">
        <Text className="text-sm font-bold text-primary">{initial}</Text>
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-sm font-bold text-foreground">
            {name}
            {isYou && ' (You)'}
          </Text>
          {role === 'ADMIN' && (
            <View className="bg-primary-light px-1.5 py-0.5 rounded ml-1.5">
              <Text className="text-[10px] font-semibold text-primary">Admin</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-muted-foreground mt-0.5">@{username}</Text>
      </View>

      {netBalance !== undefined && netBalance !== 0 && (
        <View className="items-end">
          <Text className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-destructive'}`}>
            ৳{Math.abs(netBalance)}
          </Text>
          <Text className="text-[10px] text-muted-foreground mt-0.5">
            {isNegative ? 'owes' : 'gets back'}
          </Text>
        </View>
      )}
    </View>
  );
};
