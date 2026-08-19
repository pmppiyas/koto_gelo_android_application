import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text } from '../ui/core';
import { BalanceSummary } from '../../types/transaction';

export interface SummaryCardProps {
  balanceSummary: BalanceSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ balanceSummary }) => {
  return (
    <View className="flex-row gap-2.5">
      <View className="flex-1 bg-card border border-border rounded-2xl p-3.5 shadow-sm">
        <View className="w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center mb-2">
          <Feather name="arrow-down-left" size={15} color="#059669" />
        </View>
        <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Income</Text>
        <Text className="text-sm font-black text-foreground">
          ৳{balanceSummary.totalIncome.toLocaleString('en-US')}
        </Text>
      </View>

      <View className="flex-1 bg-card border border-border rounded-2xl p-3.5 shadow-sm">
        <View className="w-8 h-8 rounded-xl bg-rose-50 items-center justify-center mb-2">
          <Feather name="arrow-up-right" size={15} color="#E11D48" />
        </View>
        <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Expense</Text>
        <Text className="text-sm font-black text-foreground">
          ৳{balanceSummary.totalExpense.toLocaleString('en-US')}
        </Text>
      </View>

      <View className="flex-1 bg-card border border-border rounded-2xl p-3.5 shadow-sm">
        <View className="w-8 h-8 rounded-xl bg-amber-50 items-center justify-center mb-2">
          <Feather name="shield" size={15} color="#D97706" />
        </View>
        <Text className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Savings</Text>
        <Text className="text-sm font-black text-foreground">
          ৳{balanceSummary.savings.toLocaleString('en-US')}
        </Text>
      </View>
    </View>
  );
};
