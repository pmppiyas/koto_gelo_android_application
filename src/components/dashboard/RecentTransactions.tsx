import React from 'react';
import { Feather } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from '../ui/core';
import { Transaction } from '../../types/transaction';
import { categoryIconMap } from '../../data/demoData';

export interface RecentTransactionsProps {
  transactions: Transaction[];
  newlyAddedId?: string | null;
  onSeeAll?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  newlyAddedId,
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

      {transactions.length === 0 ? (
        <View className="py-8 items-center justify-center">
          <View className="w-12 h-12 rounded-full bg-primary-light items-center justify-center mb-2">
            <Feather name="credit-card" size={22} color="#4F46E5" />
          </View>
          <Text className="text-sm font-bold text-foreground mb-0.5">
            No Expenses Recorded Yet
          </Text>
          <Text className="text-xs text-muted-foreground text-center">
            Tap "+ Add Expense" above to log your first spend.
          </Text>
        </View>
      ) : (
        transactions.map((item, index) => {
          const isLast = index === transactions.length - 1;
          const isNewlyAdded =
            !!newlyAddedId &&
            (item.id === newlyAddedId || (item as any).localId === newlyAddedId);
          const iconName =
            item.icon || categoryIconMap[item.category] || 'more-horizontal';

          let bgClass = isNewlyAdded
            ? 'bg-primary-light border border-indigo-200'
            : 'bg-rose-50';
          let iconColor = isNewlyAdded ? '#4F46E5' : '#EF4444';
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
              className={`flex-row justify-between items-center py-3 px-2 rounded-xl transition-all ${
                isNewlyAdded
                  ? 'bg-primary-light/70 border border-indigo-300 my-1 shadow-xs'
                  : !isLast
                  ? 'border-b border-border'
                  : ''
              }`}
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View
                  className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${bgClass}`}
                >
                  <Feather
                    name={iconName as any}
                    size={18}
                    color={iconColor}
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      className="text-sm font-bold text-card-foreground"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {isNewlyAdded && (
                      <View className="bg-primary px-1.5 py-0.5 rounded-full shadow-2xs">
                        <Text className="text-[9px] font-black text-white">
                          ✨ NEW
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {item.groupName ? `${item.groupName} • ` : ''}
                    {item.date}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text className={`text-sm font-extrabold mb-0.5 ${amountColor}`}>
                  {amountPrefix}৳{item.amount.toLocaleString('en-US')}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.category}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};
