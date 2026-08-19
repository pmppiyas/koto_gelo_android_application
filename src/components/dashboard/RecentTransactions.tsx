import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../ui/core';
import { Transaction } from '../../types/transaction';
import { categoryIconMap } from '../../data/demoData';

export interface RecentTransactionsProps {
  transactions: Transaction[];
  onSeeAll?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  onSeeAll,
}) => {
  return (
    <View className="bg-card rounded-2xl border border-border p-4 mb-6 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-foreground">Recent Expenses</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
            <Text className="text-sm text-primary font-semibold">See All</Text>
          </TouchableOpacity>
        )}
      </View>

      {transactions.map((item, index) => {
        const isLast = index === transactions.length - 1;
        const iconName = item.icon || categoryIconMap[item.category] || 'more-horizontal';

        let bgClass = 'bg-rose-50';
        let iconColor = '#EF4444';
        let amountColor = 'text-foreground';
        let amountPrefix = '-';

        if (item.type === 'income') {
          bgClass = 'bg-emerald-50';
          iconColor = '#10B981';
          amountColor = 'text-emerald-600';
          amountPrefix = '+';
        } else if (item.type === 'settlement') {
          bgClass = 'bg-amber-50';
          iconColor = '#F59E0B';
          amountColor = 'text-amber-600';
          amountPrefix = '+';
        }

        return (
          <View
            key={item.id}
            className={`flex-row justify-between items-center py-3 ${
              !isLast ? 'border-b border-border' : ''
            }`}
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${bgClass}`}>
                <Feather name={iconName as any} size={18} color={iconColor} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-card-foreground mb-0.5" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.groupName ? `${item.groupName} • ` : ''}
                  {item.date}
                </Text>
              </View>
            </View>

            <View className="items-end">
              <Text className={`text-sm font-bold mb-0.5 ${amountColor}`}>
                {amountPrefix}৳{item.amount.toLocaleString('en-US')}
              </Text>
              <Text className="text-xs text-muted-foreground">{item.category}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
