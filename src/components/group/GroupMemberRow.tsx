import React from 'react';
import { View, Text } from '../ui/core';

interface GroupMemberRowProps {
  name: string;
  username: string;
  role: 'ADMIN' | 'MEMBER' | 'OWNER';
  isYou: boolean;
  totalDeposited?: number;
  totalShare?: number;
  netBalance?: number;
}

export const GroupMemberRow: React.FC<GroupMemberRowProps> = ({
  name,
  username,
  role,
  isYou,
  totalDeposited,
  totalShare,
  netBalance,
}) => {
  const initial = name.charAt(0).toUpperCase();
  const hasBalance = netBalance !== undefined;
  const isPositive = hasBalance && netBalance > 0;
  const isNegative = hasBalance && netBalance < 0;
  const isZero = hasBalance && netBalance === 0;

  return (
    <View className="flex-row items-center py-3 border-b border-border">
      <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center border border-indigo-100 shadow-xs">
        <Text className="text-sm font-bold text-primary">{initial}</Text>
      </View>

      <View className="flex-1 ml-3 pr-2">
        <View className="flex-row items-center">
          <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
            {name}
            {isYou && ' (You)'}
          </Text>
          {role === 'ADMIN' || role === 'OWNER' ? (
            <View className="bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md ml-1.5">
              <Text className="text-[10px] font-bold text-primary">
                {role === 'OWNER' ? 'Owner' : 'Admin'}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text className="text-xs text-muted-foreground">{username}</Text>
          {totalDeposited !== undefined && (
            <>
              <Text className="text-xs text-muted-foreground">•</Text>
              <Text className="text-xs font-semibold text-emerald-600">
                +৳{totalDeposited.toLocaleString()} dep.
              </Text>
            </>
          )}
        </View>
      </View>

      {hasBalance && (
        <View className="items-end gap-0.5">
          <Text
            className={`text-xs font-extrabold ${
              isZero
                ? 'text-slate-500'
                : isPositive
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {isZero ? '৳0' : `${isPositive ? '+' : '-'}৳${Math.abs(Math.round(netBalance)).toLocaleString()}`}
          </Text>
          <View
            className={`px-2 py-0.5 rounded-full ${
              isZero
                ? 'bg-slate-100'
                : isPositive
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-rose-50 border border-rose-200'
            }`}
          >
            <Text
              className={`text-[9px] font-bold ${
                isZero
                  ? 'text-slate-600'
                  : isPositive
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {isZero ? 'Settled' : isPositive ? 'gets back' : 'owes'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
