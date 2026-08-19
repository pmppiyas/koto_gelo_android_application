import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text } from '../ui/core';
import { BalanceSummary } from '../../types/transaction';

export interface BalanceCardProps {
  balanceSummary: BalanceSummary;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balanceSummary }) => {
  return (
    <View className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-emerald-400" />
          <Text className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            Total Net Balance
          </Text>
        </View>
        <View className="bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
          <Text className="text-[11px] font-bold text-indigo-300">BDT</Text>
        </View>
      </View>

      <Text className="text-3xl text-white font-black tracking-tight mt-1 mb-5">
        ৳ {balanceSummary.totalBalance.toLocaleString('en-US')}
      </Text>

      <View className="flex-row items-center gap-3">
        <View className="flex-1 bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Feather name="arrow-down-left" size={13} color="#34D399" />
            <Text className="text-[11px] text-slate-400 font-medium">You are owed</Text>
          </View>
          <Text className="text-sm font-extrabold text-emerald-400">
            +৳{balanceSummary.youAreOwed.toLocaleString('en-US')}
          </Text>
        </View>

        <View className="flex-1 bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Feather name="arrow-up-right" size={13} color="#FB7185" />
            <Text className="text-[11px] text-slate-400 font-medium">You owe</Text>
          </View>
          <Text className="text-sm font-extrabold text-rose-400">
            -৳{balanceSummary.youOwe.toLocaleString('en-US')}
          </Text>
        </View>
      </View>
    </View>
  );
};
